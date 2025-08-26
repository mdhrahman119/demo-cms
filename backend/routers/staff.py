# backend/routers/staff.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/staff",
    tags=["Staff Management"],
    dependencies=[Depends(security.get_current_admin_user)] # Only Admins can manage staff
)

@router.post("/", response_model=schemas.Staff, status_code=201)
def create_new_staff_member(
    staff_data: schemas.StaffCreate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """Creates a new staff member record in the HR system."""
    new_staff = crud.create_staff_member(db, staff_data=staff_data, clinic_id=current_admin.clinic_id)
    log_action(db, "STAFF_MEMBER_CREATED", user_id=current_admin.id, clinic_id=current_admin.clinic_id, details={"staff_id": str(new_staff.id)})
    return new_staff

@router.get("/", response_model=List[schemas.Staff])
def read_staff_for_clinic(
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """Retrieves a list of all staff members for the admin's clinic."""
    return crud.get_staff_by_clinic(db, clinic_id=current_admin.clinic_id)

@router.get("/{staff_id}", response_model=schemas.Staff)
def read_staff_member(
    staff_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """Retrieves a single staff member's details."""
    db_staff = crud.get_staff_by_id(db, staff_id=str(staff_id), clinic_id=current_admin.clinic_id)
    if db_staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return db_staff

@router.put("/{staff_id}", response_model=schemas.Staff)
def update_staff_details(
    staff_id: uuid.UUID,
    staff_data: schemas.StaffUpdate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """Updates a staff member's details, including consultation fee."""
    updated_staff = crud.update_staff_member(
        db=db, 
        staff_id=str(staff_id), 
        clinic_id=current_admin.clinic_id, 
        staff_data=staff_data
    )
    if updated_staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    log_action(db, "STAFF_MEMBER_UPDATED", user_id=current_admin.id, clinic_id=current_admin.clinic_id, details={"staff_id": str(staff_id)})
    return updated_staff

@router.post("/create-user", response_model=schemas.User)
def create_user_account_for_staff(
    user_data: schemas.UserCreateFromStaff,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """Creates a login account for an existing staff member."""
    if crud.get_user_by_email(db, email=user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    try:
        new_user = crud.create_user_for_staff(db, user_data=user_data, clinic_id=current_admin.clinic_id)
        log_action(db, "USER_ACCOUNT_CREATED_FOR_STAFF", user_id=current_admin.id, clinic_id=current_admin.clinic_id, details={"staff_id": str(user_data.staff_id), "user_email": new_user.email})
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))