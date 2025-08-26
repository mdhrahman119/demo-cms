# backend/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database, security, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/admin",
    tags=["Platform Administration"],
)

# === Super Admin Endpoints ===

@router.get("/clinics", response_model=List[schemas.Clinic])
def list_all_clinics(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_superadmin: models.User = Depends(security.get_current_superadmin_user)
):
    """Retrieves a list of all clinics in the system."""
    return crud.get_clinics(db, skip=skip, limit=limit)

@router.patch("/approve/{clinic_id}", response_model=schemas.Clinic)
def approve_a_clinic(
    clinic_id: str, 
    db: Session = Depends(database.get_db),
    current_superadmin: models.User = Depends(security.get_current_superadmin_user)
):
    """Approves a pending clinic registration."""
    db_clinic = crud.approve_clinic(db, clinic_id=clinic_id)
    if db_clinic is None:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    log_action(
        db, 
        action="CLINIC_APPROVED", 
        user_id=current_superadmin.id, 
        clinic_id=db_clinic.id, 
        details={"approved_by": current_superadmin.email}
    )
    return db_clinic

@router.patch("/update-status/{clinic_id}", response_model=schemas.Clinic)
def update_a_clinic_status(
    clinic_id: str,
    status_update: schemas.UpdateClinicStatus,
    db: Session = Depends(database.get_db),
    current_superadmin: models.User = Depends(security.get_current_superadmin_user)
):
    """Updates a clinic's status (e.g., to 'Active' or 'Suspended')."""
    updated_clinic = crud.update_clinic_status(db, clinic_id=clinic_id, new_status=status_update.status)
    if updated_clinic is None:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    log_action(db, "CLINIC_STATUS_UPDATED", user_id=current_superadmin.id, clinic_id=updated_clinic.id, details={"new_status": updated_clinic.status})
    return updated_clinic

# === Clinic Admin Endpoint ===

@router.get("/audit-logs", response_model=List[schemas.AuditLog])
def get_clinic_audit_logs(
    db: Session = Depends(database.get_db),
    # This uses the clinic admin security check
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """
    Retrieves the audit log for the admin's own clinic.
    Requires Clinic Admin privileges.
    """
    if not current_admin.clinic_id:
        raise HTTPException(status_code=400, detail="Superadmin must view logs via a different endpoint.")
        
    return crud.get_audit_logs_by_clinic(db, clinic_id=current_admin.clinic_id)
