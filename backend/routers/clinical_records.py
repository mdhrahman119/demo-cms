# backend/routers/clinical_records.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from .. import crud, schemas, security, database, models

router = APIRouter(
    prefix="/api/clinical-records",
    tags=["Clinical Records"]
)

@router.get("/patient/{patient_id}", response_model=schemas.PatientHistory)
def get_patient_complete_history(
    patient_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    # Use the correct dependency that returns the full user object
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Retrieves a complete, consolidated clinical history for a single patient.
    """
    # Use the correct object attribute to get the clinic_id
    clinic_id = current_user.clinic_id
    
    patient_details = crud.get_patient_by_id(db, patient_id=str(patient_id), clinic_id=clinic_id)
    if not patient_details:
        raise HTTPException(status_code=404, detail="Patient not found in this clinic.")

    appointments = crud.get_patient_appointments(db, patient_id=str(patient_id), clinic_id=clinic_id)
    vitals = crud.get_patient_vitals(db, patient_id=str(patient_id), clinic_id=clinic_id)
    prescriptions = crud.get_patient_prescriptions(db, patient_id=str(patient_id), clinic_id=clinic_id)
    lab_orders = crud.get_patient_lab_orders(db, patient_id=str(patient_id), clinic_id=clinic_id)
    radiology_orders = crud.get_patient_radiology_orders(db, patient_id=str(patient_id), clinic_id=clinic_id)
    results = crud.get_patient_results(db, patient_id=str(patient_id), clinic_id=clinic_id)

    patient_history = schemas.PatientHistory(
        patient_details=patient_details,
        appointments=appointments,
        vitals=vitals,
        prescriptions=prescriptions,
        lab_orders=lab_orders,
        radiology_orders=radiology_orders,
        results=results
    )
    
    return patient_history
