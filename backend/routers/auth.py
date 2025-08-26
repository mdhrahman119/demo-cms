# backend/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(tags=["Authentication"])

@router.post("/api/register-clinic", response_model=schemas.Clinic)
def register_clinic(
    clinic_data: schemas.ClinicCreate,
    admin_data: schemas.UserCreate,
    db: Session = Depends(database.get_db)
):
    db_user = crud.get_user_by_email(db, email=admin_data.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_clinic, new_admin = crud.create_clinic_and_admin(db=db, clinic=clinic_data, admin=admin_data)
    log_action(db, action="CLINIC_REGISTERED", clinic_id=new_clinic.id, details={"clinic_name": new_clinic.name, "admin_email": new_admin.email})
    return new_clinic

@router.post("/api/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        log_action(db, action="LOGIN_FAILURE", details={"email": form_data.username})
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.is_active:
        log_action(db, action="LOGIN_FAILURE", user_id=user.id, clinic_id=user.clinic_id, details={"reason": "User is not active"})
        raise HTTPException(status_code=403, detail="User account is inactive.")

    # Superadmins don't have a clinic, so we skip this check for them
    if not user.is_superadmin and user.clinic and user.clinic.status != "Active":
        log_action(db, action="LOGIN_FAILURE", user_id=user.id, clinic_id=user.clinic_id, details={"reason": f"Clinic status is {user.clinic.status}"})
        raise HTTPException(status_code=403, detail="Clinic is not approved or is suspended.")

    log_action(db, action="LOGIN_SUCCESS", user_id=user.id, clinic_id=user.clinic_id)
    
    scopes = ["user"]
    if user.is_superadmin or (user.role and user.role.name == "Admin"):
        scopes.append("admin")

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email, "scopes": scopes},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
