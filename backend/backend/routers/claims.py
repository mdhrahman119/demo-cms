# backend/routers/claims.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from .. import dhaman_service 

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/claims",
    tags=["Dhaman Claims"],
    dependencies=[Depends(security.get_current_active_user)] # Protect all endpoints
)

@router.post("/", response_model=schemas.Claim)
def create_claim(
    claim_data: schemas.ClaimCreate,
    db: Session = Depends(database.get_db),
    current_user_data: dict = Depends(security.get_current_active_user)
):
    """
    Creates an initial claim record from an invoice.
    This is the first step before preparing the data for submission.
    """
    clinic_id = current_user_data['clinic_id']
    user_id = current_user_data['user_id']
    
    claim = crud.create_claim_from_invoice(db, claim_data=claim_data, clinic_id=clinic_id, user_id=user_id)
    log_action(db, "CLAIM_CREATED", user_id=user_id, clinic_id=clinic_id, details={"claim_id": str(claim.id), "invoice_id": str(claim.invoice_id)})
    return claim

@router.post("/submit/{claim_id}", response_model=schemas.Claim)
def submit_claim_to_dhaman(
    claim_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user_data: dict = Depends(security.get_current_active_user)
):
    """
    Submits a prepared claim to Dhaman by calling the dedicated Dhaman service.
    """
    clinic_id = current_user_data['clinic_id']
    user_id = current_user_data['user_id']

    claim = db.query(models.Claim).filter(models.Claim.id == claim_id, models.Claim.clinic_id == clinic_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != 'PendingSubmission':
        raise HTTPException(status_code=400, detail=f"Claim is not in a submittable state. Current status: {claim.status}")

    # 1. Prepare the payload
    payload = crud.prepare_dhaman_submission_payload(db, invoice_id=str(claim.invoice_id), clinic_id=clinic_id)

    # 2. Call the separate Dhaman service
    dhaman_response = dhaman_service.submit_claim_to_dhaman_api(payload)

    # 3. Process the response
    if not dhaman_response.get("success"):
        # In a real system, you would log the error from dhaman_response.get("error")
        raise HTTPException(status_code=502, detail="Failed to submit claim to Dhaman.")

    # 4. Update our database with the official ID
    updated_claim = crud.update_claim_after_submission(
        db, 
        claim_id=str(claim_id), 
        dhaman_claim_id=dhaman_response.get("dhaman_claim_id"), 
        submission_payload=payload
    )
    
    log_action(db, "CLAIM_SUBMITTED", user_id=user_id, clinic_id=clinic_id, details={"claim_id": str(updated_claim.id), "dhaman_id": updated_claim.dhaman_claim_id})
    return updated_claim
