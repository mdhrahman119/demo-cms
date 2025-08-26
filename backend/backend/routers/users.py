# backend/routers/users.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/users",
    tags=["User Management"],
)

@router.get("/me", response_model=schemas.User)
def read_users_me(
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Get the details of the currently logged-in user.
    Accessible by any authenticated user.
    """
    return current_user

@router.post("/", response_model=schemas.User, dependencies=[Depends(security.get_current_admin_user)])
def create_new_user_for_clinic(
    user_data: schemas.UserCreate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """
    Creates a new user (e.g., Doctor, Nurse) for the admin's clinic.
    Requires Clinic Admin privileges.
    """
    clinic_id = current_admin.clinic_id
    if not clinic_id:
        raise HTTPException(status_code=400, detail="Superadmin cannot create users for a specific clinic via this endpoint.")
    
    db_user = crud.get_user_by_email(db, email=user_data.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        # The create_user function in crud does not commit the session
        new_user = crud.create_user(db=db, user=user_data, clinic_id=clinic_id, is_active=True)
        db.commit()
        db.refresh(new_user)
        
        log_action(
            db, "USER_CREATED", user_id=current_admin.id, clinic_id=clinic_id,
            details={"new_user_email": new_user.email, "new_user_role": user_data.role}
        )
        return new_user
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[schemas.User], dependencies=[Depends(security.get_current_admin_user)])
def list_users_in_clinic(
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """
    Retrieves a list of all users in the admin's clinic.
    Requires Clinic Admin privileges.
    """
    clinic_id = current_admin.clinic_id
    if not clinic_id:
        raise HTTPException(status_code=400, detail="Superadmin must view users via a different endpoint.")
    return crud.get_users_by_clinic(db, clinic_id=clinic_id)
