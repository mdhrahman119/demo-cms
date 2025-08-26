# backend/routers/laboratory.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/lab",
    tags=["Laboratory Workflow"],
    dependencies=[Depends(security.get_current_active_user)]
)


# === Lab Test Management (for Admins) ===

@router.get("/dashboard", response_model=schemas.LabDashboardData)
def get_lab_dashboard(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Retrieves all aggregated data for the main Laboratory Dashboard.
    """
    if not current_user.clinic_id:
        raise HTTPException(status_code=400, detail="User not associated with a clinic.")
    return crud.get_lab_dashboard_data(db, clinic_id=current_user.clinic_id)


@router.post("/tests", response_model=schemas.LabTest, dependencies=[Depends(security.get_current_admin_user)])
def create_new_lab_test(
    lab_test: schemas.LabTestCreate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """Creates a new lab test that can be ordered."""
    new_lab_test = crud.create_lab_test(db=db, lab_test=lab_test, clinic_id=current_admin.clinic_id)
    log_action(db, "LAB_TEST_CREATED", user_id=current_admin.id, clinic_id=current_admin.clinic_id, details={"test_id": new_lab_test.id, "test_name": new_lab_test.name})
    return new_lab_test

@router.get("/tests", response_model=List[schemas.LabTest])
def list_lab_tests(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves a list of all available lab tests for the clinic."""
    return crud.get_lab_tests_by_clinic(db, clinic_id=current_user.clinic_id)

# === Lab Technician Workflow ===

@router.get("/worklist", response_model=List[schemas.LabOrder])
def get_lab_worklist(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves pending lab orders for the lab technician's clinic."""
    clinic_id = current_user.clinic_id
    return crud.get_pending_lab_orders(db, clinic_id=clinic_id)

@router.post("/collect-sample", response_model=schemas.LabSample)
def collect_sample(
    sample_data: schemas.LabSampleCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Records the collection of a sample for a lab order."""
    sample = crud.collect_lab_sample(db, sample_data=sample_data, clinic_id=current_user.clinic_id, user_id=current_user.id)
    # You would also update the LabOrder status here in a real app
    log_action(db, "SAMPLE_COLLECTED", user_id=current_user.id, clinic_id=current_user.clinic_id, details={"sample_id": str(sample.id)})
    return sample

@router.post("/upload-result", response_model=schemas.OrderResult)
async def upload_lab_result(
    # We now accept data as form fields instead of a single JSON body
    result_data_json: str = Form(...),
    report_file: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Uploads the result for a completed lab order.
    Can include structured data and an optional PDF report file.
    """
    clinic_id = current_user.clinic_id
    user_id = current_user.id
    
    try:
        # Parse the JSON data from the form field
        result_data = schemas.OrderResultCreate.parse_raw(result_data_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid result data format.")

    if not result_data.lab_order_id:
        raise HTTPException(status_code=400, detail="A lab_order_id is required.")

    # --- File Upload Logic ---
    file_url = None
    if report_file:
        # In a real system, this would call a function to upload the file to Azure Blob Storage
        # and return the secure URL.
        # file_url = await file_storage_service.upload_file(report_file, clinic_id)
        # For now, we'll just use the filename as a placeholder.
        file_url = f"https://your-storage-account.blob.core.windows.net/reports/{report_file.filename}"
        result_data.report_file_url = file_url
    # --- End File Upload Logic ---

    result = crud.create_order_result(db, result_data=result_data, clinic_id=clinic_id, user_id=user_id)
    log_action(db, "LAB_RESULT_UPLOADED", user_id=user_id, clinic_id=clinic_id, details={"result_id": str(result.id)})
    return result

@router.get("/radiology-tests", response_model=List[schemas.RadiologyTest])
def list_radiology_tests(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves a list of all available radiology tests for the clinic."""
    clinic_id = current_user.clinic_id
    return crud.get_radiology_tests_by_clinic(db, clinic_id=clinic_id)

