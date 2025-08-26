# backend/routers/doctor.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/doctor",
    tags=["Doctor Workflow"]
)

@router.get("/encounter/{appointment_id}", response_model=schemas.EncounterData)
def get_encounter_data(
    appointment_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Retrieves all data needed for a single patient encounter, including
    patient details and the SOAP note.
    """
    clinic_id = current_user.clinic_id
    encounter_data = crud.get_encounter_details(db, appointment_id=str(appointment_id), clinic_id=clinic_id)
    if not encounter_data:
        raise HTTPException(status_code=404, detail="Encounter not found.")
    return encounter_data

@router.patch("/soap-note/{note_id}", response_model=schemas.SOAPNote)
def save_soap_note(
    note_id: uuid.UUID,
    note_data: schemas.SOAPNoteBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Saves or updates a SOAP note for an encounter."""
    updated_note = crud.update_soap_note(db, note_id=str(note_id), note_data=note_data)
    if not updated_note:
        raise HTTPException(status_code=404, detail="SOAP note not found.")
    log_action(db, "SOAP_NOTE_UPDATED", user_id=current_user.id, clinic_id=current_user.clinic_id, details={"note_id": str(note_id)})
    return updated_note


@router.post("/propose-lab-order", response_model=schemas.LabOrder)
def propose_lab_order_for_patient(
    order_data: schemas.OrderPropose,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """A doctor proposes a lab test for a patient."""
    clinic_id = current_user.clinic_id
    doctor_id = current_user.id
    proposed_order = crud.propose_lab_order(db, order_data=order_data, clinic_id=clinic_id, doctor_id=doctor_id)
    log_action(db, action="LAB_ORDER_PROPOSED", user_id=doctor_id, clinic_id=clinic_id, details={"order_id": str(proposed_order.id)})
    return proposed_order

@router.post("/propose-radiology-order", response_model=schemas.RadiologyOrder)
def propose_radiology_order_for_patient(
    order_data: schemas.OrderPropose,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """A doctor proposes a radiology scan for a patient."""
    clinic_id = current_user.clinic_id
    doctor_id = current_user.id
    proposed_order = crud.propose_radiology_order(db, order_data=order_data, clinic_id=clinic_id, doctor_id=doctor_id)
    log_action(db, action="RADIOLOGY_ORDER_PROPOSED", user_id=doctor_id, clinic_id=clinic_id, details={"order_id": str(proposed_order.id)})
    return proposed_order

@router.post("/create-prescription", response_model=schemas.Prescription)
def create_prescription_for_patient(
    prescription_data: schemas.PrescriptionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """A doctor creates a new, detailed prescription for a patient."""
    clinic_id = current_user.clinic_id
    doctor_id = current_user.id
    prescription = crud.create_prescription(db, prescription_data=prescription_data, clinic_id=clinic_id, doctor_id=doctor_id)
    log_action(db, "PRESCRIPTION_CREATED", user_id=doctor_id, clinic_id=clinic_id, details={"prescription_id": str(prescription.id)})
    return prescription