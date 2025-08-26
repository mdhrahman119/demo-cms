# backend/routers/nursing.py

import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/nursing",
    tags=["Nursing Workflow"]
)

@router.get("/queue", response_model=List[schemas.Appointment])
def get_nursing_queue(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Retrieves the patient queue for the nursing station.
    """
    clinic_id = current_user.clinic_id
    return crud.get_scheduled_appointments(db, clinic_id=clinic_id)

@router.post("/triage", response_model=schemas.TriageRecord)
def record_triage(
    triage_data: schemas.TriageRecordCreate,
    db: Session = Depends(database.get_db),
    # Use the correct dependency that returns the full user object
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Records a patient's chief complaint and history."""
    # Use the correct object attributes to get the IDs
    clinic_id = current_user.clinic_id
    nurse_id = current_user.id
    
    triage_record = crud.create_triage_record(db, triage_data=triage_data, clinic_id=clinic_id, nurse_id=nurse_id)
    log_action(db, "TRIAGE_RECORDED", user_id=nurse_id, clinic_id=clinic_id, details={"triage_id": str(triage_record.id)})
    return triage_record

@router.post("/vitals", response_model=schemas.Vitals)
def record_vitals(
    vitals_data: schemas.VitalsCreate,
    db: Session = Depends(database.get_db),
    # Use the correct dependency that returns the full user object
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Records a patient's vital signs."""
    # Use the correct object attributes to get the IDs
    clinic_id = current_user.clinic_id
    nurse_id = current_user.id
    
    vitals_record = crud.create_vitals_record(db, vitals_data=vitals_data, clinic_id=clinic_id, nurse_id=nurse_id)
    log_action(db, "VITALS_RECORDED", user_id=nurse_id, clinic_id=clinic_id, details={"vitals_id": str(vitals_record.id)})
    return vitals_record

@router.post("/medication", response_model=schemas.MedicationAdministration)
def record_medication_administration(
    med_admin_data: schemas.MedicationAdministrationCreate,
    db: Session = Depends(database.get_db),
    # Use the correct dependency that returns the full user object
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Records a medication administered to a patient."""
    # Use the correct object attributes to get the IDs
    clinic_id = current_user.clinic_id
    nurse_id = current_user.id
    
    med_admin_record = crud.create_medication_administration_record(db, med_admin_data=med_admin_data, clinic_id=clinic_id, nurse_id=nurse_id)
    log_action(db, "MEDICATION_ADMINISTERED", user_id=nurse_id, clinic_id=clinic_id, details={"med_admin_id": str(med_admin_record.id)})
    return med_admin_record


@router.get("/vitals/{appointment_id}", response_model=schemas.Vitals)
def get_vitals_for_appointment(
    appointment_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves the vitals for a specific appointment."""
    clinic_id = current_user.clinic_id
    vitals = crud.get_vitals_by_appointment(db, appointment_id=str(appointment_id), clinic_id=clinic_id)
    if not vitals:
        raise HTTPException(status_code=404, detail="No vitals found for this appointment.")
    return vitals