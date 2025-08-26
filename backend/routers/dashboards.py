# backend/routers/dashboards.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import security, database, models, dashboard_service, schemas, crud

router = APIRouter(
    prefix="/api/dashboards",
    tags=["Dashboards"],
    dependencies=[Depends(security.get_current_active_user)]
)

@router.get("/clinic-admin")
def get_clinic_admin_dashboard(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_admin_user)
):
    """
    Retrieves all aggregated data for the main Clinic Admin dashboard.
    Requires Clinic Admin privileges.
    """
    clinic_id = current_user.clinic_id
    return dashboard_service.get_clinic_admin_dashboard_data(db, clinic_id=clinic_id)

@router.get("/receptionist", response_model=schemas.ReceptionistDashboardData)
def get_receptionist_dashboard(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user) # Any active user can see this for now
):
    """
    Retrieves all aggregated data for the main Receptionist dashboard.
    """
    if not current_user.clinic_id:
        raise HTTPException(status_code=400, detail="User not associated with a clinic.")
    return crud.get_receptionist_dashboard_data(db, clinic_id=current_user.clinic_id)