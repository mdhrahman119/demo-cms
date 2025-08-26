# backend/routers/patients.py
# backend/routers/patients.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas, security, database, models

router = APIRouter(
    prefix="/api/patients",
    tags=["Patients"],
    dependencies=[Depends(security.get_current_active_user)]
)

@router.get("/search", response_model=List[schemas.Patient])
def search_for_patients(
    q: str, # The search query from the frontend
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Searches for patients based on a query string (q).
    """
    if not current_user.clinic_id:
        raise HTTPException(status_code=400, detail="User is not associated with a clinic.")

    patients = crud.search_patients(db, clinic_id=current_user.clinic_id, search_term=q)
    return patients

@router.post("/", response_model=schemas.Patient)
def create_new_patient(
    patient: schemas.PatientCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Creates a new patient record for the logged-in user's clinic."""
    clinic_id = current_user.clinic_id
    return crud.create_patient(db=db, patient=patient, clinic_id=clinic_id)

@router.get("/", response_model=List[schemas.Patient])
def read_patients_for_clinic(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves a list of all patients for the logged-in user's clinic."""
    clinic_id = current_user.clinic_id
    return crud.get_patients_by_clinic(db, clinic_id=clinic_id, skip=skip, limit=limit)
