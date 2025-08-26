from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from pydantic import BaseModel
from decimal import Decimal
discount = 0

from .. import crud, schemas, security, database, models

router = APIRouter(
    prefix="/api/reception",
    tags=["Reception Workflow"],
    dependencies=[Depends(security.get_current_active_user)]
)

class ProcessPaymentPayload(BaseModel):
    patient_id: uuid.UUID
    proposed_order_ids: List[uuid.UUID]
    payment_mode: str
    discount: Decimal = 0.0 

class RejectOrderPayload(BaseModel):
    reason: str

@router.post("/process-payment", response_model=schemas.Invoice)
def process_payment_for_queue(
    payload: ProcessPaymentPayload,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Handles the entire workflow of creating a paid invoice for proposed orders
    and activating them in a single transaction.
    """
    try:
        invoice = crud.process_payment_for_proposed_orders(
            db=db,
            patient_id=str(payload.patient_id),
            proposed_order_ids=payload.proposed_order_ids,
            payment_mode=payload.payment_mode,
            discount=discount,
            clinic_id=current_user.clinic_id,
            user_id=str(current_user.id)
        )
        return invoice
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/orders/{order_id}/reject", response_model=schemas.LabOrder) # Response can be generic
def reject_an_order(
    order_id: uuid.UUID,
    payload: RejectOrderPayload,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Rejects a single proposed order from the queue."""
    try:
        order = crud.reject_proposed_order(
            db=db,
            order_id=order_id,
            reason=payload.reason,
            clinic_id=current_user.clinic_id,
            user_id=str(current_user.id)
        )
        return order
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/queue")
def get_reception_queue(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Gets all proposed orders for the reception payment queue."""
    return crud.get_all_proposed_orders(db, clinic_id=current_user.clinic_id)

@router.get("/queue")
def get_reception_queue(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    clinic_id = current_user.clinic_id
    return crud.get_all_proposed_orders(db, clinic_id=clinic_id)

@router.post("/link-orders-to-invoice")
def link_orders_to_invoice_endpoint(
    link_data: schemas.OrdersLinkToInvoice,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    clinic_id = current_user.clinic_id
    user_id = current_user.id
    result = crud.link_orders_to_invoice(db, link_data=link_data, clinic_id=clinic_id)
    # You might want to log this action
    return result

@router.post("/check-eligibility", response_model=schemas.EligibilityCheck)
def check_patient_eligibility(
    check_data: schemas.EligibilityCheckCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Checks a patient's insurance eligibility with Dhaman and records the result.
    """
    clinic_id = current_user.clinic_id
    user_id = current_user.id

    # Get patient details to find their national ID
    patient = crud.get_patient_by_id(db, patient_id=str(check_data.patient_id), clinic_id=clinic_id)
    if not patient or not patient.national_id:
        raise HTTPException(status_code=404, detail="Patient or patient's National ID not found.")

    # 1. Call the Dhaman service to get the eligibility response
    eligibility_response = dhaman_service.check_patient_eligibility_api(patient.national_id)

    # 2. Save the result of the check to our database
    db_check = crud.create_eligibility_check(
        db, 
        patient_id=str(check_data.patient_id), 
        eligibility_response=eligibility_response, 
        clinic_id=clinic_id, 
        user_id=user_id
    )

    log_action(db, "ELIGIBILITY_CHECKED", user_id=user_id, clinic_id=clinic_id, details={"patient_id": str(check_data.patient_id), "is_eligible": db_check.is_eligible})
    
    return db_check

@router.get("/proposed-orders/{patient_id}")
def get_single_patient_proposed_orders(
    patient_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Gets a specific patient's proposed (but not yet invoiced) lab and radiology orders.
    """
    clinic_id = current_user.clinic_id
    return crud.get_proposed_orders_by_patient(db, patient_id=str(patient_id), clinic_id=clinic_id)