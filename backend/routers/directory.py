# backend/routers/directory.py

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas, security, database, models

router = APIRouter(
    prefix="/api/directory",
    tags=["Directory"],
    dependencies=[Depends(security.get_current_active_user)]
)

@router.get("/doctors", response_model=List[schemas.User])
def get_clinic_doctors(
    db: Session = Depends(database.get_db),
    # Use the correct dependency that returns the full user object
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Retrieves a list of all doctors in the clinic.
    Safe for any authenticated user to call.
    """
    # Use the correct object attribute to get the clinic_id
    clinic_id = current_user.clinic_id
    return crud.get_doctors_by_clinic(db, clinic_id=clinic_id)

@router.get("/roles", response_model=List[schemas.Role])
def get_all_roles(db: Session = Depends(database.get_db)):
    """Retrieves a list of all roles available in the system."""
    return crud.get_roles(db)
