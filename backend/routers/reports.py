# backend/routers/reports.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from .. import crud, schemas, security, database, models

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
    dependencies=[Depends(security.get_current_active_user)]
)

@router.get("/lab-order/{order_id}")
def get_printable_lab_report(
    order_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Fetches all necessary data for a printable lab report.
    """
    clinic_id = current_user.clinic_id
    # We would need a new CRUD function for this
    report_data = crud.get_lab_report_details(db, order_id=str(order_id), clinic_id=clinic_id)
    if not report_data:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report_data
