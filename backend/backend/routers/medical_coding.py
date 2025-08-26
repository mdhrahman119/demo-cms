# backend/routers/medical_coding.py

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/medical-coding",
    tags=["Medical Coding (Dhaman)"],
    dependencies=[Depends(security.get_current_active_user)]
)

# === ICD-10 Diagnosis Endpoints ===

@router.get("/search-icd10/{search_term}", response_model=List[schemas.ICD10Code])
def search_for_icd10_code(
    search_term: str,
    db: Session = Depends(database.get_db)
):
    """Searches for ICD-10 diagnosis codes."""
    return crud.search_icd10_codes(db, search_term=search_term)

@router.post("/diagnoses", response_model=schemas.AppointmentDiagnosis)
def add_diagnosis(
    diagnosis_data: schemas.AppointmentDiagnosisCreate,
    db: Session = Depends(database.get_db),
    current_user_data: dict = Depends(security.get_current_active_user)
):
    """Adds a diagnosis to a patient's appointment record."""
    clinic_id = current_user_data['clinic_id']
    doctor_id = current_user_data['user_id']
    diagnosis = crud.add_diagnosis_to_appointment(
        db, diagnosis_data=diagnosis_data, clinic_id=clinic_id, doctor_id=doctor_id
    )
    log_action(
        db, "DIAGNOSIS_ADDED", user_id=doctor_id, clinic_id=clinic_id, 
        details={"diagnosis_id": str(diagnosis.id), "appointment_id": str(diagnosis.appointment_id)}
    )
    return diagnosis

# === CPT Procedure Endpoints ===

@router.get("/search-cpt/{search_term}", response_model=List[schemas.CPTCode])
def search_for_cpt_code(
    search_term: str,
    db: Session = Depends(database.get_db)
):
    """Searches for CPT procedure codes."""
    return crud.search_cpt_codes(db, search_term=search_term)

@router.post("/procedures", response_model=schemas.AppointmentProcedure)
def add_procedure(
    procedure_data: schemas.AppointmentProcedureCreate,
    db: Session = Depends(database.get_db),
    current_user_data: dict = Depends(security.get_current_active_user)
):
    """Adds a procedure to a patient's appointment record for billing."""
    clinic_id = current_user_data['clinic_id']
    doctor_id = current_user_data['user_id']
    procedure = crud.add_procedure_to_appointment(
        db, procedure_data=procedure_data, clinic_id=clinic_id, doctor_id=doctor_id
    )
    log_action(
        db, "PROCEDURE_ADDED", user_id=doctor_id, clinic_id=clinic_id, 
        details={"procedure_id": str(procedure.id), "appointment_id": str(procedure.appointment_id)}
    )
    return procedure
