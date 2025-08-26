# backend/routers/appointments.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/appointments",
    tags=["Appointments"]
)

class BookingPayload(schemas.BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    appointment_time: datetime

@router.post("/book", response_model=schemas.Appointment)
def book_new_appointment_and_create_invoice(
    payload: BookingPayload,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Streamlined endpoint to book a consultation. Creates an invoice and a
    pending appointment simultaneously.
    """
    try:
        new_appointment = crud.book_appointment_with_invoice(
            db=db,
            patient_id=str(payload.patient_id),
            doctor_id=str(payload.doctor_id),
            appointment_time=payload.appointment_time,
            clinic_id=current_user.clinic_id,
            user_id=str(current_user.id)
        )
        db.commit()

        log_action(db, "APPOINTMENT_BOOKED_WITH_INVOICE", user_id=current_user.id, clinic_id=current_user.clinic_id, details={"appointment_id": str(new_appointment.id), "invoice_id": str(new_appointment.invoice_id)})

        return new_appointment
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred during booking.")


@router.get("/my-schedule", response_model=List[schemas.Appointment])
def get_doctor_schedule(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves the appointment schedule for the currently logged-in doctor."""
    return crud.get_appointments_by_doctor(
        db, clinic_id=current_user.clinic_id, doctor_id=str(current_user.id)
    )
