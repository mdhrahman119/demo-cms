# backend/routers/radiology.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/radiology",
    tags=["Radiology Workflow"]
    # The router-level dependency has been removed for flexibility
)

# === Radiology Test Management (for Clinic Admins) ===
@router.post("/tests", response_model=schemas.RadiologyTest)
def create_new_radiology_test(
    radiology_test: schemas.RadiologyTestCreate,
    db: Session = Depends(database.get_db),
    # Security is handled here, ensuring only a clinic admin can create tests
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """Creates a new radiology test/scan that can be ordered."""
    clinic_id = current_admin.clinic_id
    new_radiology_test = crud.create_radiology_test(db=db, radiology_test=radiology_test, clinic_id=clinic_id)
    log_action(db, "RADIOLOGY_TEST_CREATED", user_id=current_admin.id, clinic_id=clinic_id, details={"test_id": new_radiology_test.id, "test_name": new_radiology_test.name})
    return new_radiology_test

@router.get("/tests", response_model=List[schemas.RadiologyTest])
def list_radiology_tests(
    db: Session = Depends(database.get_db),
    # Any active user (like a doctor) can get the list of tests
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves a list of all available radiology tests for the clinic."""
    clinic_id = current_user.clinic_id
    return crud.get_radiology_tests_by_clinic(db, clinic_id=clinic_id)

# === Radiologist Workflow ===
@router.get("/worklist", response_model=List[schemas.RadiologyOrder])
def get_radiology_worklist(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Retrieves the worklist of all 'Pending' radiology orders for the clinic.
    """
    clinic_id = current_user.clinic_id
    return crud.get_pending_radiology_orders(db, clinic_id=clinic_id)

@router.post("/upload-report", response_model=schemas.OrderResult)
def upload_radiology_report(
    result_data: schemas.OrderResultCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Uploads the result/report for a completed radiology order.
    """
    clinic_id = current_user.clinic_id
    user_id = current_user.id
    
    if not result_data.radiology_order_id:
        raise HTTPException(status_code=400, detail="A radiology_order_id is required.")

    result = crud.create_order_result(db, result_data=result_data, clinic_id=clinic_id, user_id=user_id)
    log_action(db, "RADIOLOGY_REPORT_UPLOADED", user_id=user_id, clinic_id=clinic_id, details={"result_id": str(result.id), "order_id": str(result.radiology_order_id)})
    return result
