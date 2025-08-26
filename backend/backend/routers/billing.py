# backend/routers/billing.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/billing",
    tags=["Billing"]
)

@router.post("/invoices", response_model=schemas.Invoice)
def create_invoice(
    invoice_data: schemas.InvoiceCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Creates a new invoice for services from the reception workflow.
    This is the single endpoint for creating service invoices.
    """
    try:
        new_invoice = crud.create_invoice_for_reception(
            db=db, 
            invoice_data=invoice_data, 
            clinic_id=current_user.clinic_id, 
            user_id=str(current_user.id)
        )
        log_action(db, "INVOICE_CREATED", user_id=current_user.id, clinic_id=current_user.clinic_id, details={"invoice_id": str(new_invoice.id)})
        return new_invoice
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/invoices", response_model=List[schemas.Invoice])
def list_invoices(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves a list of invoices, with optional search and status filter."""
    return crud.get_invoices_by_clinic(db, clinic_id=current_user.clinic_id, status=status, search=search)

@router.post("/payments", response_model=schemas.Payment)
def record_payment(
    payment_data: schemas.PaymentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Records a new payment for an invoice."""
    try:
        new_payment = crud.record_payment(db, payment_data=payment_data, clinic_id=current_user.clinic_id, user_id=str(current_user.id))
        log_action(db, "PAYMENT_RECORDED", user_id=current_user.id, clinic_id=current_user.clinic_id, details={"invoice_id": str(payment_data.invoice_id)})
        return new_payment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
@router.get("/services", response_model=List[schemas.Service])
def list_services(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves a list of all billable services for the clinic."""
    return crud.get_services_by_clinic(db, clinic_id=current_user.clinic_id)