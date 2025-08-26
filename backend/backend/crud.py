# backend/crud.py

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, case
from typing import List
import uuid
from datetime import date, timedelta, datetime
from decimal import Decimal

from . import models, schemas, security

# --- User & Clinic CRUD ---
def get_user_by_email(db: Session, email: str):
    return (
        db.query(models.User)
        .options(joinedload(models.User.role), joinedload(models.User.clinic))
        .filter(models.User.email == email)
        .first()
    )

def create_user(db: Session, user: schemas.UserCreate, clinic_id: str, is_active: bool = True):
    """Creates a new user and generates a unique Employee ID for them."""
    db_role = db.query(models.Role).filter(models.Role.name == user.role).first()
    if not db_role:
        raise ValueError(f"Role '{user.role}' does not exist.")

    user_count = db.query(models.User).filter(models.User.clinic_id == clinic_id).count()
    new_employee_id = f"E-{user_count + 1:04d}"

    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        role_id=db_role.id,
        clinic_id=clinic_id,
        is_active=is_active,
        employee_id=new_employee_id
    )
    db.add(db_user)
    # The commit is handled by the calling function (e.g., in the router)
    return db_user

def get_audit_logs_by_clinic(db: Session, clinic_id: str):
    """Fetches all audit log entries for a clinic, ordered by most recent."""
    return (
        db.query(models.AuditLog)
        .options(joinedload(models.AuditLog.user))
        .filter(models.AuditLog.clinic_id == clinic_id)
        .order_by(models.AuditLog.timestamp.desc())
        .limit(200) # Limit to the most recent 200 logs for performance
        .all()
    )

def get_users_by_clinic(db: Session, clinic_id: str):
    """
    Fetches all users for a specific clinic, eagerly loading the
    related staff member and role details.
    """
    return (
        db.query(models.User)
        .options(
            joinedload(models.User.staff_member),
            joinedload(models.User.role)
        )
        .filter(models.User.clinic_id == clinic_id)
        .order_by(models.User.created_at.desc())
        .all()
    )


def get_roles(db: Session):
    return db.query(models.Role).all()

def get_clinic_by_id(db: Session, clinic_id: str):
    return db.query(models.Clinic).filter(models.Clinic.id == clinic_id).first()


def approve_clinic(db: Session, clinic_id: str):
    db_clinic = get_clinic_by_id(db, clinic_id=clinic_id)
    if not db_clinic: return None
    db_clinic.status = "Active"
    admin_user = db.query(models.User).join(models.Role).filter(
        models.User.clinic_id == clinic_id, models.Role.name == 'Admin'
    ).first()
    if admin_user:
        admin_user.is_active = True
    db.commit()
    db.refresh(db_clinic)
    return db_clinic

def get_clinics(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Clinic).offset(skip).limit(limit).all()

# --- Patient CRUD ---
def create_patient(db: Session, patient: schemas.PatientCreate, clinic_id: str):
    """Creates a new patient and generates a unique MRN."""
    patient_count = db.query(models.Patient).filter(models.Patient.clinic_id == clinic_id).count()
    new_mrn = f"P-{patient_count + 1:05d}"
    
    db_patient = models.Patient(
        **patient.dict(), 
        clinic_id=clinic_id,
        mrn=new_mrn
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def get_patient_by_id(db: Session, patient_id: str, clinic_id: str):
    return db.query(models.Patient).filter(
        models.Patient.id == patient_id,
        models.Patient.clinic_id == clinic_id
    ).first()

def get_patients_by_clinic(db: Session, clinic_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.Patient).filter(models.Patient.clinic_id == clinic_id).offset(skip).limit(limit).all()

# --- Patient History & Clinical Record Functions ---

def get_patient_appointments(db: Session, patient_id: str, clinic_id: str):
    """Fetches all past and future appointments for a patient."""
    return db.query(models.Appointment).filter(
        models.Appointment.patient_id == patient_id,
        models.Appointment.clinic_id == clinic_id
    ).order_by(models.Appointment.appointment_time.desc()).all()

def get_patient_vitals(db: Session, patient_id: str, clinic_id: uuid.UUID):
    """
    Fetches all recorded vitals for a patient, eagerly loading the nurse who recorded them.
    """
    return db.query(models.Vitals).filter(
        models.Vitals.patient_id == patient_id,
        models.Vitals.clinic_id == clinic_id
    ).options(
        # Eager-load the 'recorded_by' relationship to prevent Pydantic validation errors
        joinedload(models.Vitals.recorded_by)
    ).order_by(models.Vitals.recorded_at.desc()).all()

def get_patient_lab_orders(db: Session, patient_id: str, clinic_id: str):
    """Fetches all lab orders for a patient."""
    return db.query(models.LabOrder).filter(
        models.LabOrder.patient_id == patient_id,
        models.LabOrder.clinic_id == clinic_id
    ).order_by(models.LabOrder.created_at.desc()).all()

def get_patient_prescriptions(db: Session, patient_id: str, clinic_id: str):
    """Fetches all prescriptions for a patient."""
    return db.query(models.Prescription).filter(
        models.Prescription.patient_id == patient_id,
        models.Prescription.clinic_id == clinic_id
    ).order_by(models.Prescription.created_at.desc()).all()

def get_patient_results(db: Session, patient_id: str, clinic_id: str):
    """Fetches all lab/radiology results for a patient."""
    return db.query(models.OrderResult).filter(
        models.OrderResult.patient_id == patient_id,
        models.OrderResult.clinic_id == clinic_id
    ).order_by(models.OrderResult.reported_at.desc()).all()

# --- Service & Invoice CRUD ---
def create_service(db: Session, service: schemas.ServiceCreate, clinic_id: str):
    db_service = models.Service(**service.dict(), clinic_id=clinic_id)
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

def get_service_by_id(db: Session, service_id: int, clinic_id: str):
    return db.query(models.Service).filter(
        models.Service.id == service_id,
        models.Service.clinic_id == clinic_id
    ).first()

def create_invoice(db: Session, invoice_data: schemas.InvoiceCreate, clinic_id: str, user_id: str):
    """
    Creates a new invoice and automatically generates the corresponding
    double-entry transaction in the general ledger.
    """
    total_amount = 0
    invoice_items_to_create = []
    for item_data in invoice_data.items:
        service = get_service_by_id(db, service_id=item_data.service_id, clinic_id=clinic_id)
        if not service:
            raise ValueError(f"Service with ID {item_data.service_id} not found in this clinic.")
        price_for_item = service.price * item_data.quantity
        total_amount += price_for_item
        invoice_items_to_create.append(models.InvoiceItem(
            service_id=service.id, quantity=item_data.quantity,
            price_at_time_of_invoice=service.price, clinic_id=clinic_id
        ))
    db_invoice = models.Invoice(
        patient_id=invoice_data.patient_id, total_amount=total_amount,
        clinic_id=clinic_id, created_by_user_id=user_id
    )
    db.add(db_invoice)
    db.flush()
    for item in invoice_items_to_create:
        item.invoice_id = db_invoice.id
        db.add(item)

    accounts_receivable = db.query(models.Account).filter(models.Account.name == 'Accounts Receivable', models.Account.clinic_id == clinic_id).first()
    service_revenue = db.query(models.Account).filter(models.Account.name == 'Service Revenue', models.Account.clinic_id == clinic_id).first()
    if accounts_receivable and service_revenue:
        create_ledger_entry(
            db,
            schemas.LedgerEntryCreate(
                description=f"Invoice #{db_invoice.id} for patient {db_invoice.patient_id}",
                debit_account_id=accounts_receivable.id,
                credit_account_id=service_revenue.id,
                amount=total_amount
            ),
            clinic_id=clinic_id,
            user_id=user_id
        )
    else:
        print("WARNING: 'Accounts Receivable' or 'Service Revenue' not found in Chart of Accounts. Skipping ledger entry.")
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def get_services_by_clinic(db: Session, clinic_id: str):
    """Fetches a list of all billable services for a clinic."""
    return db.query(models.Service).filter(models.Service.clinic_id == clinic_id).all()

def get_invoices_by_clinic(db: Session, clinic_id: str, status: str | None = None, search: str | None = None, skip: int = 0, limit: int = 100):
    """
    Fetches a list of all invoices for a clinic, with optional search and status filter.
    """
    query = db.query(models.Invoice).options(
        joinedload(models.Invoice.patient)
    ).filter(models.Invoice.clinic_id == clinic_id)

    # --- THIS IS THE NEW LOGIC ---
    if status:
        query = query.filter(models.Invoice.status == status)
    # -----------------------------

    if search:
        query = query.join(models.Patient).filter(
            or_(
                models.Patient.first_name.ilike(f"%{search}%"),
                models.Patient.last_name.ilike(f"%{search}%"),
                models.Patient.mrn.ilike(f"%{search}%")
            )
        )

    return query.order_by(models.Invoice.created_at.desc()).offset(skip).limit(limit).all()

# def create_comprehensive_invoice(
#     db: Session, 
#     invoice_data: schemas.ComprehensiveInvoiceCreate, 
#     clinic_id: str, 
#     user_id: str
# ):
#     """
#     Creates a new invoice and any required downstream records (appointments, orders)
#     in a single, secure transaction, based on the provided details.
#     """
#     total_amount = 0
#     invoice_items_to_create = []

#     # 1. Validate services and calculate total amount
#     for item_data in invoice_data.items:
#         service = db.query(models.Service).filter(models.Service.id == item_data.service_id, models.Service.clinic_id == clinic_id).first()
#         if not service:
#             raise ValueError(f"Service with ID {item_data.service_id} not found.")
        
#         price_for_item = service.price * item_data.quantity
#         total_amount += price_for_item
        
#         invoice_items_to_create.append(models.InvoiceItem(
#             service_id=service.id,
#             quantity=item_data.quantity,
#             price_at_time_of_invoice=service.price,
#             clinic_id=clinic_id
#         ))

#     # 2. Create the main invoice record
#     db_invoice = models.Invoice(
#         patient_id=invoice_data.patient_id,
#         total_amount=total_amount,
#         clinic_id=clinic_id,
#         created_by_user_id=user_id
#     )
#     db.add(db_invoice)
#     db.flush() # Use flush to get the new invoice ID

#     for item in invoice_items_to_create:
#         item.invoice_id = db_invoice.id
#         db.add(item)

#     # 3. Create linked Appointment if details are provided
#     if invoice_data.appointment_details:
#         db_appointment = models.Appointment(
#             patient_id=invoice_data.patient_id,
#             doctor_id=invoice_data.appointment_details.doctor_id,
#             invoice_id=db_invoice.id,
#             appointment_time=invoice_data.appointment_details.appointment_time,
#             clinic_id=clinic_id,
#             created_by_user_id=user_id
#         )
#         db.add(db_appointment)

#     # 4. --- THIS IS THE CRITICAL FIX ---
#     # If the invoice is marked as paid, create the Lab/Radiology orders
#     if invoice_data.mark_as_paid:
#         db_invoice.status = 'Paid'
#         # Also create a payment record for accounting
#         db.add(models.Payment(
#             invoice_id=db_invoice.id, 
#             amount_paid=total_amount, 
#             payment_mode='Cash', # Default to Cash for this workflow
#             clinic_id=clinic_id, 
#             received_by_user_id=user_id
#         ))

#         # Now, create the orders for the relevant departments
#         for item in invoice_items_to_create:
#             service = db.query(models.Service).filter(models.Service.id == item.service_id).first()
#             if service.lab_test_id:
#                 db.add(models.LabOrder(
#                     patient_id=invoice_data.patient_id, 
#                     doctor_id=user_id, # The receptionist is the effective "ordering" user here
#                     lab_test_id=service.lab_test_id, 
#                     invoice_id=db_invoice.id,
#                     status='Pending', 
#                     clinic_id=clinic_id
#                 ))
#             if service.radiology_test_id:
#                 db.add(models.RadiologyOrder(
#                     patient_id=invoice_data.patient_id, 
#                     doctor_id=user_id,
#                     radiology_test_id=service.radiology_test_id, 
#                     invoice_id=db_invoice.id,
#                     status='Pending', 
#                     clinic_id=clinic_id
#                 ))

#     db.commit()
#     db.refresh(db_invoice)
#     return db_invoice

# --- Payment CRUD Operations ---

def record_payment(
    db: Session, 
    payment_data: schemas.PaymentCreate, 
    clinic_id: str, 
    user_id: str
):
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == payment_data.invoice_id,
        models.Invoice.clinic_id == clinic_id
    ).first()
    if not invoice:
        raise ValueError("Invoice not found.")

    db_payment = models.Payment(
        **payment_data.dict(),
        clinic_id=clinic_id,
        received_by_user_id=user_id
    )
    db.add(db_payment)

    total_paid = db.query(func.sum(models.Payment.amount_paid)).filter(
        models.Payment.invoice_id == payment_data.invoice_id
    ).scalar() or 0
    total_paid += payment_data.amount_paid

    if total_paid >= invoice.total_amount:
        invoice.status = 'Paid'
        print(f"\n--- CHECKPOINT 2: Invoice {invoice.id} is now PAID. Activating linked services... ---")

        # --- CHECKPOINT FOR LAB ORDERS ---
        lab_orders_to_activate = db.query(models.LabOrder).filter(
            models.LabOrder.invoice_id == invoice.id, 
            models.LabOrder.status == 'AwaitingPayment'
        ).all()
        print(f"--- CHECKPOINT 3A: Found {len(lab_orders_to_activate)} Lab Orders to activate.")

        updated_lab_rows = db.query(models.LabOrder).filter(
            models.LabOrder.invoice_id == invoice.id, 
            models.LabOrder.status == 'AwaitingPayment'
        ).update({"status": "Pending"})
        print(f"--- CHECKPOINT 4A: Updated {updated_lab_rows} Lab Order rows to 'Pending'.")

        # --- CHECKPOINT FOR RADIOLOGY ORDERS ---
        rad_orders_to_activate = db.query(models.RadiologyOrder).filter(
            models.RadiologyOrder.invoice_id == invoice.id, 
            models.RadiologyOrder.status == 'AwaitingPayment'
        ).all()
        print(f"--- CHECKPOINT 3B: Found {len(rad_orders_to_activate)} Radiology Orders to activate.")

        updated_rad_rows = db.query(models.RadiologyOrder).filter(
            models.RadiologyOrder.invoice_id == invoice.id, 
            models.RadiologyOrder.status == 'AwaitingPayment'
        ).update({"status": "Pending"})
        print(f"--- CHECKPOINT 4B: Updated {updated_rad_rows} Radiology Order rows to 'Pending'.\n")

    db.commit()
    db.refresh(db_payment)
    return db_payment

# --- Appointment CRUD ---
def create_appointment(
    db: Session, 
    appointment_data: schemas.AppointmentCreate, 
    clinic_id: str, 
    user_id: str
):
    """
    Creates a new appointment, but first verifies that the provided
    invoice belongs to the correct patient.
    """
    # --- NEW SECURITY CHECK ---
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == appointment_data.invoice_id,
        models.Invoice.clinic_id == clinic_id
    ).first()

    if not invoice:
        raise ValueError("Invoice not found.")
    if invoice.patient_id != appointment_data.patient_id:
        raise ValueError("Security error: Invoice does not belong to the selected patient.")
    # --- END OF SECURITY CHECK ---

    db_appointment = models.Appointment(
        **appointment_data.dict(),
        clinic_id=clinic_id,
        created_by_user_id=user_id
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def get_appointments_by_doctor(db: Session, clinic_id: str, doctor_id: str, skip: int = 0, limit: int = 100):
    """
    Fetches a list of appointments for a doctor, but ONLY if the associated
    invoice has been marked as 'Paid'.
    """
    return (
        db.query(models.Appointment)
        .join(models.Invoice, models.Appointment.invoice_id == models.Invoice.id)
        .filter(
            models.Appointment.clinic_id == clinic_id,
            models.Appointment.doctor_id == doctor_id,
            models.Invoice.status == 'Paid' # The critical business rule
        )
        .order_by(models.Appointment.appointment_time.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

# --- Lab & Radiology Test Definition CRUD ---
def create_lab_test(db: Session, lab_test: schemas.LabTestCreate, clinic_id: str):
    """Creates a new lab test AND a corresponding billable service."""
    # 1. Create the clinical test definition
    db_lab_test = models.LabTest(**lab_test.dict(), clinic_id=clinic_id)
    db.add(db_lab_test)
    db.commit()
    db.refresh(db_lab_test)

    # 2. Automatically create the linked billable service
    service_schema = schemas.ServiceCreate(
        name=db_lab_test.name, 
        price=db_lab_test.price, 
        category='Laboratory'
    )
    db_service = models.Service(
        **service_schema.dict(), 
        clinic_id=clinic_id, 
        lab_test_id=db_lab_test.id # Link them together
    )
    db.add(db_service)
    db.commit()

    return db_lab_test

def create_radiology_test(db: Session, radiology_test: schemas.RadiologyTestCreate, clinic_id: str):
    """Creates a new radiology test AND a corresponding billable service."""
    # 1. Create the clinical test definition
    db_radiology_test = models.RadiologyTest(**radiology_test.dict(), clinic_id=clinic_id)
    db.add(db_radiology_test)
    db.commit()
    db.refresh(db_radiology_test)

    # 2. Automatically create the linked billable service
    service_schema = schemas.ServiceCreate(
        name=db_radiology_test.name, 
        price=db_radiology_test.price, 
        category='Radiology'
    )
    db_service = models.Service(
        **service_schema.dict(), 
        clinic_id=clinic_id, 
        radiology_test_id=db_radiology_test.id # Link them together
    )
    db.add(db_service)
    db.commit()

    return db_radiology_test

def get_lab_tests_by_clinic(db: Session, clinic_id: str):
    """Fetches a list of all lab tests for a clinic."""
    return db.query(models.LabTest).filter(models.LabTest.clinic_id == clinic_id).order_by(models.LabTest.name).all()

def get_radiology_tests_by_clinic(db: Session, clinic_id: str):
    """Fetches a list of all radiology tests for a clinic."""
    return db.query(models.RadiologyTest).filter(models.RadiologyTest.clinic_id == clinic_id).order_by(models.RadiologyTest.name).all()

def get_lab_report_details(db: Session, order_id: str, clinic_id: str):
    # This is a placeholder for a complex query that would join the
    # order, patient, doctor, test, and result tables to get all data.
    # For now, we'll just return the result.
    return db.query(models.OrderResult).join(models.LabOrder).filter(models.LabOrder.id == order_id).first()

def get_lab_dashboard_data(db: Session, clinic_id: str):
    """
    Calculates and returns all key metrics for the new Laboratory Dashboard,
    including KPIs and a worklist grouped by department.
    """
    # 1. Calculate KPI Cards
    base_query = db.query(models.LabOrder).filter(models.LabOrder.clinic_id == clinic_id)
    
    pending_count = base_query.filter(models.LabOrder.status == 'Pending').count()
    in_progress_count = base_query.filter(models.LabOrder.status.in_(['SampleCollected', 'InProgress'])).count()
    urgent_count = base_query.filter(models.LabOrder.priority == 'STAT', models.LabOrder.status != 'Completed').count()
    
    today = date.today()
    completed_today_count = base_query.filter(
        models.LabOrder.status == 'Completed',
        func.date(models.LabOrder.updated_at) == today # Assuming status update changes updated_at
    ).count()

    # 2. Get the full worklist and group it by department
    worklist_items = db.query(models.LabOrder).options(
        joinedload(models.LabOrder.patient),
        joinedload(models.LabOrder.lab_test)
    ).filter(
        models.LabOrder.clinic_id == clinic_id,
        models.LabOrder.status.in_(['Pending', 'SampleCollected', 'InProgress', 'ResultEntered'])
    ).order_by(
        # NEW: Use a CASE statement for custom sorting in PostgreSQL
        case(
            (models.LabOrder.priority == 'STAT', 1),
            (models.LabOrder.priority == 'Urgent', 2),
            (models.LabOrder.priority == 'Normal', 3),
            else_=4
        ),
        models.LabOrder.created_at.asc()
    ).all()
    
    worklist_by_department = {}
    for order in worklist_items:
        department = order.lab_test.department if order.lab_test else 'Uncategorized'
        if department not in worklist_by_department:
            worklist_by_department[department] = []
        worklist_by_department[department].append(order)

    return {
        "kpi_cards": {
            "pending": pending_count,
            "in_progress": in_progress_count,
            "completed_today": completed_today_count,
            "urgent_stat": urgent_count
        },
        "worklist_by_department": worklist_by_department
    }
# --- PROFESSIONAL WORKFLOW LOGIC ---

# 1. Doctor Proposes Orders
def propose_lab_order(db: Session, order_data: schemas.OrderPropose, clinic_id: str, doctor_id: str):
    """
    Proposes a lab order and ensures all related data (doctor, lab_test)
    is loaded for the response.
    """
    db_order = models.LabOrder(
        patient_id=order_data.patient_id,
        lab_test_id=order_data.test_id,
        doctor_id=doctor_id,
        clinic_id=clinic_id,
        status='Proposed'
    )
    db.add(db_order)
    db.commit()

    # After committing, re-fetch the order to load the relationships
    # This is the critical step that fixes the error.
    order_with_details = (
        db.query(models.LabOrder)
        .options(
            joinedload(models.LabOrder.doctor).joinedload(models.User.role),
            joinedload(models.LabOrder.lab_test)
        )
        .filter(models.LabOrder.id == db_order.id)
        .first()
    )

    return order_with_details

def propose_radiology_order(db: Session, order_data: schemas.OrderPropose, clinic_id: str, doctor_id: str):
    db_order = models.RadiologyOrder(
        patient_id=order_data.patient_id, radiology_test_id=order_data.test_id,
        doctor_id=doctor_id, clinic_id=clinic_id, status='Proposed'
    )
    db.add(db_order)
    db.commit()
    order_with_details = (
        db.query(models.RadiologyOrder)
        .options(
            joinedload(models.RadiologyOrder.doctor).joinedload(models.User.role),
            joinedload(models.RadiologyOrder.radiology_test)
        )
        .filter(models.RadiologyOrder.id == db_order.id).first()
    )
    return order_with_details

# 2. Receptionist Links Orders to Invoice
def link_orders_to_invoice(db: Session, link_data: schemas.OrdersLinkToInvoice, clinic_id: str):
    """
    Links proposed orders to an invoice, but first verifies that the invoice
    belongs to the correct patient.
    """
    # --- NEW SECURITY CHECK ---
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == link_data.invoice_id,
        models.Invoice.clinic_id == clinic_id
    ).first()
    if not invoice:
        raise ValueError("Invoice not found.")

    # Link lab orders
    lab_orders = db.query(models.LabOrder).filter(
        models.LabOrder.id.in_(link_data.lab_order_ids),
        models.LabOrder.clinic_id == clinic_id,
        models.LabOrder.status == 'Proposed'
    ).all()
    for order in lab_orders:
        if order.patient_id != invoice.patient_id:
            raise ValueError(f"Security error: Lab order {order.id} does not belong to the patient on this invoice.")
        order.invoice_id = link_data.invoice_id
        order.status = 'Pending'

    # Link radiology orders
    radiology_orders = db.query(models.RadiologyOrder).filter(
        models.RadiologyOrder.id.in_(link_data.radiology_order_ids),
        models.RadiologyOrder.clinic_id == clinic_id,
        models.RadiologyOrder.status == 'Proposed'
    ).all()
    for order in radiology_orders:
        if order.patient_id != invoice.patient_id:
            raise ValueError(f"Security error: Radiology order {order.id} does not belong to the patient on this invoice.")
        order.invoice_id = link_data.invoice_id
        order.status = 'Pending'
        
    db.commit()
    return {"status": "success", "linked_lab_orders": len(lab_orders), "linked_radiology_orders": len(radiology_orders)}


# 3. Lab Tech Collects Sample
def collect_lab_sample(db: Session, sample_data: schemas.LabSampleCreate, clinic_id: str, user_id: str):
    db_sample = models.LabSample(
        **sample_data.dict(), clinic_id=clinic_id, collected_by_user_id=user_id
    )
    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)
    return db_sample

# 4. Lab/Radiology Tech Uploads Results
def create_order_result(db: Session, result_data: schemas.OrderResultCreate, clinic_id: str, user_id: str):
    db_result = models.OrderResult(
        **result_data.dict(), clinic_id=clinic_id, reported_by_user_id=user_id
    )
    db.add(db_result)
    if result_data.lab_order_id:
        order = db.query(models.LabOrder).filter(models.LabOrder.id == result_data.lab_order_id).first()
        if order: order.status = 'Completed'
    elif result_data.radiology_order_id:
        order = db.query(models.RadiologyOrder).filter(models.RadiologyOrder.id == result_data.radiology_order_id).first()
        if order: order.status = 'Reported'
    db.commit()
    db.refresh(db_result)
    return db_result

def get_proposed_orders_by_patient(db: Session, patient_id: str, clinic_id: str):
    """
    Fetches all 'Proposed' lab and radiology orders for a specific patient,
    eagerly loading details needed for the invoice page.
    """
    lab_orders = (
        db.query(models.LabOrder)
        .options(
            joinedload(models.LabOrder.lab_test)
        )
        .filter(
            models.LabOrder.patient_id == patient_id,
            models.LabOrder.clinic_id == clinic_id,
            models.LabOrder.status == 'Proposed'
        ).all()
    )
    radiology_orders = (
        db.query(models.RadiologyOrder)
        .options(
            joinedload(models.RadiologyOrder.radiology_test)
        )
        .filter(
            models.RadiologyOrder.patient_id == patient_id,
            models.RadiologyOrder.clinic_id == clinic_id,
            models.RadiologyOrder.status == 'Proposed'
        ).all()
    )
    return {"lab_orders": lab_orders, "radiology_orders": radiology_orders}

# --- Functions for viewing worklists ---
def get_all_proposed_orders(db: Session, clinic_id: str):
    """
    Fetches all 'Proposed' lab and radiology orders for a clinic,
    eagerly loading all necessary details for the reception queue.
    """
    lab_orders = (
        db.query(models.LabOrder)
        .options(
            joinedload(models.LabOrder.patient),
            joinedload(models.LabOrder.doctor),
            joinedload(models.LabOrder.lab_test)
        )
        .filter(
            models.LabOrder.clinic_id == clinic_id,
            models.LabOrder.status == 'Proposed'
        ).all()
    )
    radiology_orders = (
        db.query(models.RadiologyOrder)
        .options(
            joinedload(models.RadiologyOrder.patient),
            joinedload(models.RadiologyOrder.doctor),
            joinedload(models.RadiologyOrder.radiology_test)
        )
        .filter(
            models.RadiologyOrder.clinic_id == clinic_id,
            models.RadiologyOrder.status == 'Proposed'
        ).all()
    )
    return {"lab_orders": lab_orders, "radiology_orders": radiology_orders}


def get_pending_lab_orders(db: Session, clinic_id: str):
    return db.query(models.LabOrder).filter(
        models.LabOrder.clinic_id == clinic_id, models.LabOrder.status == 'Pending'
    ).all()

def get_pending_radiology_orders(db: Session, clinic_id: str):
    """
    Fetches the worklist of all 'Pending' radiology orders for the clinic,
    eagerly loading patient and test details.
    """
    return (
        db.query(models.RadiologyOrder)
        .options(
            joinedload(models.RadiologyOrder.patient),
            joinedload(models.RadiologyOrder.radiology_test)
        )
        .filter(
            models.RadiologyOrder.clinic_id == clinic_id,
            models.RadiologyOrder.status == 'Pending'
        )
        .order_by(models.RadiologyOrder.created_at.asc())
        .all()
    )

# --- Nursing CRUD Operations ---

def create_triage_record(
    db: Session, 
    triage_data: schemas.TriageRecordCreate, 
    clinic_id: str, 
    nurse_id: str
):
    """Creates a new triage record for a patient's appointment."""
    db_triage = models.TriageRecord(
        **triage_data.dict(),
        clinic_id=clinic_id,
        nurse_id=nurse_id
    )
    db.add(db_triage)
    db.commit()
    db.refresh(db_triage)
    return db_triage

def create_vitals_record(
    db: Session, 
    vitals_data: schemas.VitalsCreate, 
    clinic_id: str, 
    nurse_id: str
):
    """
    Creates a new vitals record and ensures all related data (the nurse)
    is loaded for the response.
    """
    db_vitals = models.Vitals(
        **vitals_data.dict(),
        clinic_id=clinic_id,
        recorded_by_nurse_id=nurse_id
    )
    db.add(db_vitals)
    db.commit()
    
    # Re-fetch the record to load the 'nurse' relationship for the response
    # This is the critical step that fixes the error.
    vitals_with_details = (
    db.query(models.Vitals)
    .options(
        joinedload(models.Vitals.recorded_by_nurse).joinedload(models.User.role)  # Use correct relationship
    )
    .filter(models.Vitals.id == db_vitals.id)
    .first()
)
    
    return vitals_with_details

def create_medication_administration_record(
    db: Session, 
    med_admin_data: schemas.MedicationAdministrationCreate, 
    clinic_id: str, 
    nurse_id: str
):
    """Creates a record of a medication administered by a nurse."""
    db_med_admin = models.MedicationAdministration(
        **med_admin_data.dict(),
        clinic_id=clinic_id,
        administered_by_nurse_id=nurse_id
    )
    db.add(db_med_admin)
    db.commit()
    db.refresh(db_med_admin)
    return db_med_admin

def get_scheduled_appointments(db: Session, clinic_id: str):
    """Fetches a list of all 'Scheduled' appointments for the clinic (the nurse's queue)."""
    return (
        db.query(models.Appointment)
        .filter(
            models.Appointment.clinic_id == clinic_id,
            models.Appointment.status == 'Scheduled'
        )
        .order_by(models.Appointment.appointment_time.asc())
        .all()
    )

def get_doctors_by_clinic(db: Session, clinic_id: str):
    """
    Fetches a list of all users with the 'Doctor' role for a clinic,
    eagerly loading their linked staff member details.
    """
    return (
        db.query(models.User)
        .join(models.Role)
        .options(joinedload(models.User.staff_member)) # This line includes the staff details
        .filter(
            models.User.clinic_id == clinic_id,
            models.Role.name == 'Doctor'
        )
        .all()
    )

# --- Accounting CRUD Operations ---

def create_account(db: Session, account: schemas.AccountCreate, clinic_id: str):
    db_account = models.Account(**account.dict(), clinic_id=clinic_id)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def get_accounts_by_clinic(db: Session, clinic_id: str):
    return db.query(models.Account).filter(models.Account.clinic_id == clinic_id).all()

def create_ledger_entry(
    db: Session, 
    entry_data: schemas.LedgerEntryCreate, 
    clinic_id: str, 
    user_id: str
):
    """
    Creates a new double-entry transaction and ensures all related data
    is loaded for the response.
    """
    debit_acc = db.query(models.Account).filter(models.Account.id == entry_data.debit_account_id, models.Account.clinic_id == clinic_id).first()
    credit_acc = db.query(models.Account).filter(models.Account.id == entry_data.credit_account_id, models.Account.clinic_id == clinic_id).first()
    if not debit_acc or not credit_acc:
        raise ValueError("Debit or Credit account not found for this clinic.")

    db_entry = models.LedgerEntry(
        **entry_data.dict(),
        clinic_id=clinic_id,
        created_by_user_id=user_id
    )
    db.add(db_entry)
    db.commit()

    # Re-fetch the entry to load all relationships for the response model
    entry_with_details = (
        db.query(models.LedgerEntry)
        .options(
            joinedload(models.LedgerEntry.debit_account),
            joinedload(models.LedgerEntry.credit_account),
            joinedload(models.LedgerEntry.created_by).joinedload(models.User.role)
        )
        .filter(models.LedgerEntry.id == db_entry.id)
        .first()
    )
    return entry_with_details

def create_expense_record(
    db: Session, 
    expense_data: schemas.ExpenseCreate, 
    clinic_id: str, 
    user_id: str
):
    # This function now correctly uses the fixed create_ledger_entry
    db_expense = models.Expense(
        **expense_data.dict(),
        clinic_id=clinic_id,
        recorded_by_user_id=user_id
    )
    db.add(db_expense)
    
    ledger_description = f"Expense: {expense_data.description}"
    if expense_data.vendor_name:
        ledger_description += f" (Vendor: {expense_data.vendor_name})"
        
    create_ledger_entry(
        db,
        schemas.LedgerEntryCreate(
            description=ledger_description,
            debit_account_id=expense_data.expense_account_id,
            credit_account_id=expense_data.payment_account_id,
            amount=expense_data.amount,
            transaction_date=expense_data.expense_date
        ),
        clinic_id=clinic_id,
        user_id=user_id
    )
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

def get_ledger_entries(db: Session, clinic_id: str):
    return (
        db.query(models.LedgerEntry)
        .options(
            joinedload(models.LedgerEntry.debit_account),
            joinedload(models.LedgerEntry.credit_account)
        )
        .filter(models.LedgerEntry.clinic_id == clinic_id)
        .order_by(models.LedgerEntry.transaction_date.desc())
        .all()
    )

def get_profit_and_loss_statement(db: Session, clinic_id: str, start_date: date, end_date: date):
    """
    Calculates total revenue and expenses to generate a Profit & Loss statement
    for a specific period.
    """
    # Find all Revenue accounts for the clinic
    revenue_account_ids = db.query(models.Account.id).filter(
        models.Account.clinic_id == clinic_id,
        models.Account.type == 'Revenue'
    ).all()
    revenue_ids = [r_id for r_id, in revenue_account_ids]

    # Find all Expense accounts for the clinic
    expense_account_ids = db.query(models.Account.id).filter(
        models.Account.clinic_id == clinic_id,
        models.Account.type == 'Expense'
    ).all()
    expense_ids = [e_id for e_id, in expense_account_ids]

    # Calculate total revenue (credits to revenue accounts)
    total_revenue = db.query(func.sum(models.LedgerEntry.amount)).filter(
        models.LedgerEntry.clinic_id == clinic_id,
        models.LedgerEntry.credit_account_id.in_(revenue_ids),
        models.LedgerEntry.transaction_date.between(start_date, end_date)
    ).scalar() or 0

    # Calculate total expenses (debits to expense accounts)
    total_expenses = db.query(func.sum(models.LedgerEntry.amount)).filter(
        models.LedgerEntry.clinic_id == clinic_id,
        models.LedgerEntry.debit_account_id.in_(expense_ids),
        models.LedgerEntry.transaction_date.between(start_date, end_date)
    ).scalar() or 0

    net_profit = total_revenue - total_expenses

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "net_profit": net_profit
    }

def get_accounting_dashboard_data(db: Session, clinic_id: str):
    """
    Calculates and returns key financial metrics for the accountant dashboard,
    including monthly cash flow.
    """
    today = date.today()
    start_of_month = today.replace(day=1)

    # Get account IDs for different types
    revenue_ids = [r_id for r_id, in db.query(models.Account.id).filter(models.Account.clinic_id == clinic_id, models.Account.type == 'Revenue').all()]
    expense_ids = [e_id for e_id, in db.query(models.Account.id).filter(models.Account.clinic_id == clinic_id, models.Account.type == 'Expense').all()]
    asset_ids = [a_id for a_id, in db.query(models.Account.id).filter(models.Account.clinic_id == clinic_id, models.Account.type == 'Asset').all()]

    # Calculate monthly revenue and expenses
    monthly_revenue = db.query(func.coalesce(func.sum(models.LedgerEntry.amount), 0)).filter(
        models.LedgerEntry.clinic_id == clinic_id,
        models.LedgerEntry.credit_account_id.in_(revenue_ids),
        models.LedgerEntry.transaction_date >= start_of_month
    ).scalar()

    monthly_expenses = db.query(func.coalesce(func.sum(models.LedgerEntry.amount), 0)).filter(
        models.LedgerEntry.clinic_id == clinic_id,
        models.LedgerEntry.debit_account_id.in_(expense_ids),
        models.LedgerEntry.transaction_date >= start_of_month
    ).scalar()

    # --- NEW: Calculate Cash Flow ---
    # Cash In: Debits to Asset accounts (like Cash, Bank)
    cash_in = db.query(func.coalesce(func.sum(models.LedgerEntry.amount), 0)).filter(
        models.LedgerEntry.clinic_id == clinic_id,
        models.LedgerEntry.debit_account_id.in_(asset_ids),
        models.LedgerEntry.transaction_date >= start_of_month
    ).scalar()

    # Cash Out: Credits from Asset accounts
    cash_out = db.query(func.coalesce(func.sum(models.LedgerEntry.amount), 0)).filter(
        models.LedgerEntry.clinic_id == clinic_id,
        models.LedgerEntry.credit_account_id.in_(asset_ids),
        models.LedgerEntry.transaction_date >= start_of_month
    ).scalar()

    monthly_cash_flow = cash_in - cash_out
    # --- END OF NEW LOGIC ---

    accounts_receivable = db.query(func.coalesce(func.sum(models.Invoice.total_amount), 0)).filter(
        models.Invoice.clinic_id == clinic_id,
        models.Invoice.status == 'Unpaid'
    ).scalar()

    return {
        "monthly_revenue": float(monthly_revenue),
        "monthly_expenses": float(monthly_expenses),
        "net_profit_month": float(monthly_revenue) - float(monthly_expenses),
        "accounts_receivable": float(accounts_receivable),
        "monthly_cash_flow": float(monthly_cash_flow) # Add new metric to response
    }

# --- Pharmacy CRUD Operations ---

def create_medication(db: Session, medication: schemas.MedicationCreate, clinic_id: str):
    """Adds a new medication to the clinic's formulary/inventory."""
    db_medication = models.Medication(**medication.dict(), clinic_id=clinic_id)
    db.add(db_medication)
    db.commit()
    db.refresh(db_medication)
    return db_medication

def get_proposed_prescriptions(db: Session, clinic_id: str):
    """Fetches a list of all 'Proposed' prescriptions for the clinic (the pharmacist's queue)."""
    return (
        db.query(models.Prescription)
        .filter(
            models.Prescription.clinic_id == clinic_id,
            models.Prescription.status == 'Proposed'
        )
        .order_by(models.Prescription.created_at.asc())
        .all()
    )

def get_medications_by_clinic(db: Session, clinic_id: str):
    """Fetches a list of all medications in the clinic's inventory."""
    return db.query(models.Medication).filter(models.Medication.clinic_id == clinic_id).order_by(models.Medication.name).all()

def create_prescription(db: Session, prescription_data: schemas.PrescriptionCreate, clinic_id: str, doctor_id: str):
    """
    Creates a new, detailed prescription, including linking diagnoses and procedures.
    """
    db_prescription = models.Prescription(
        patient_id=prescription_data.patient_id,
        doctor_id=doctor_id,
        clinic_id=clinic_id,
        status='Proposed'
    )
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)

    # Add prescription items
    for item_data in prescription_data.items:
        db.add(models.PrescriptionItem(**item_data.dict(), prescription_id=db_prescription.id, clinic_id=clinic_id))

    # Link diagnoses to the appointment
    for code_id in prescription_data.diagnoses:
        db.add(models.AppointmentDiagnosis(
            appointment_id=prescription_data.appointment_id,
            patient_id=prescription_data.patient_id,
            icd10_code_id=code_id,
            doctor_id=doctor_id,
            clinic_id=clinic_id
        ))

    # Link procedures to the appointment
    for code_id in prescription_data.procedures:
        db.add(models.AppointmentProcedure(
            appointment_id=prescription_data.appointment_id,
            patient_id=prescription_data.patient_id,
            cpt_code_id=code_id,
            doctor_id=doctor_id,
            clinic_id=clinic_id
        ))
    
    db.commit()
    return db_prescription

def process_pharmacy_sale(db: Session, sale_data: schemas.PharmacySaleCreate, clinic_id: str, pharmacist_id: str):
    # ... (code for calculation and validation remains the same)
    total_amount = 0
    invoice_items_to_create = []
    for item_to_dispense in sale_data.items_to_dispense:
        prescription_item = db.query(models.PrescriptionItem).options(joinedload(models.PrescriptionItem.medication)).filter(
            models.PrescriptionItem.id == item_to_dispense.prescription_item_id
        ).first()
        if not prescription_item or prescription_item.prescription.patient_id != sale_data.patient_id:
            raise ValueError(f"Prescription item {item_to_dispense.prescription_item_id} not found for this patient.")
        medication = prescription_item.medication
        if medication.stock_quantity < item_to_dispense.quantity_to_dispense:
            raise ValueError(f"Not enough stock for {medication.name}. Available: {medication.stock_quantity}")
        price_for_item = medication.unit_price * item_to_dispense.quantity_to_dispense
        total_amount += price_for_item
        pharmacy_service = db.query(models.Service).filter(models.Service.name == medication.name).first()
        if not pharmacy_service:
             pharmacy_service = create_service(db, schemas.ServiceCreate(name=medication.name, price=medication.unit_price, category="Pharmacy"), clinic_id)
        invoice_items_to_create.append(schemas.InvoiceItemCreate(service_id=pharmacy_service.id, quantity=item_to_dispense.quantity_to_dispense))

    invoice_data = schemas.InvoiceCreate(patient_id=sale_data.patient_id, items=invoice_items_to_create)
    db_invoice = create_invoice(db, invoice_data=invoice_data, clinic_id=clinic_id, user_id=pharmacist_id)
    db_sale = models.PharmacySale(
        patient_id=sale_data.patient_id, invoice_id=db_invoice.id,
        pharmacist_id=pharmacist_id, total_amount=total_amount, clinic_id=clinic_id
    )
    db.add(db_sale)
    db.flush()
    for item_to_dispense in sale_data.items_to_dispense:
        db_dispensation = models.Dispensation(
            pharmacy_sale_id=db_sale.id,
            prescription_item_id=item_to_dispense.prescription_item_id,
            quantity_dispensed=item_to_dispense.quantity_to_dispense,
            clinic_id=clinic_id
        )
        db.add(db_dispensation)
        prescription_item = db.query(models.PrescriptionItem).filter(models.PrescriptionItem.id == item_to_dispense.prescription_item_id).first()
        prescription_item.medication.stock_quantity -= item_to_dispense.quantity_to_dispense
    prescription = db.query(models.Prescription).filter(models.Prescription.id == sale_data.prescription_id).first()
    if prescription:
        prescription.status = 'Dispensed'
    
    # ... (ledger entry code remains the same)
    cash_account = db.query(models.Account).filter(models.Account.name == 'Cash', models.Account.clinic_id == clinic_id).first()
    revenue_account = db.query(models.Account).filter(models.Account.name == 'Pharmacy Revenue', models.Account.clinic_id == clinic_id).first()
    if cash_account and revenue_account:
        create_ledger_entry(
            db,
            schemas.LedgerEntryCreate(
                description=f"Pharmacy sale for invoice {db_invoice.id}",
                debit_account_id=cash_account.id,
                credit_account_id=revenue_account.id,
                amount=total_amount
            ),
            clinic_id=clinic_id,
            user_id=pharmacist_id
        )

    db.commit()
    
    # Re-fetch the sale to load all relationships for the response
    sale_with_details = (
        db.query(models.PharmacySale)
        .options(
            joinedload(models.PharmacySale.dispensations).joinedload(models.Dispensation.prescription_item).joinedload(models.PrescriptionItem.medication),
            joinedload(models.PharmacySale.patient),
            joinedload(models.PharmacySale.pharmacist).joinedload(models.User.role)
        )
        .filter(models.PharmacySale.id == db_sale.id).first()
    )
    return sale_with_details

def get_patient_radiology_orders(db: Session, patient_id: str, clinic_id: str):
    """Fetches all radiology orders for a patient."""
    return db.query(models.RadiologyOrder).filter(
        models.RadiologyOrder.patient_id == patient_id,
        models.RadiologyOrder.clinic_id == clinic_id
    ).order_by(models.RadiologyOrder.created_at.desc()).all()

# --- Medical Coding CRUD Operations ---

def search_icd10_codes(db: Session, search_term: str):
    """
    Searches for ICD-10 codes by code or description.
    This allows doctors to easily find the right diagnosis code.
    """
    search_filter = f"%{search_term.lower()}%"
    return (
        db.query(models.ICD10Code)
        .filter(
            (models.ICD10Code.code.ilike(search_filter)) |
            (models.ICD10Code.description.ilike(search_filter))
        )
        .limit(20) # Limit results for performance
        .all()
    )

def add_diagnosis_to_appointment(
    db: Session, 
    diagnosis_data: schemas.AppointmentDiagnosisCreate, 
    clinic_id: str, 
    doctor_id: str
):
    """Adds a new diagnosis record to a patient's appointment."""
    # Optional: Add validation to ensure the appointment and patient belong to the clinic.
    
    db_diagnosis = models.AppointmentDiagnosis(
        **diagnosis_data.dict(),
        clinic_id=clinic_id,
        doctor_id=doctor_id
    )
    db.add(db_diagnosis)
    db.commit()
    db.refresh(db_diagnosis)
    return db_diagnosis

def search_cpt_codes(db: Session, search_term: str):
    """Searches for CPT codes by code or description."""
    search_filter = f"%{search_term.lower()}%"
    return (
        db.query(models.CPTCode)
        .filter(
            (models.CPTCode.code.ilike(search_filter)) |
            (models.CPTCode.description.ilike(search_filter))
        )
        .limit(20)
        .all()
    )

def add_procedure_to_appointment(
    db: Session, 
    procedure_data: schemas.AppointmentProcedureCreate, 
    clinic_id: str, 
    doctor_id: str
):
    """Adds a new procedure record to a patient's appointment."""
    db_procedure = models.AppointmentProcedure(
        **procedure_data.dict(),
        clinic_id=clinic_id,
        doctor_id=doctor_id
    )
    db.add(db_procedure)
    db.commit()
    db.refresh(db_procedure)
    return db_procedure

# --- Dhaman Claims CRUD Operations ---

def create_claim_from_invoice(
    db: Session, 
    claim_data: schemas.ClaimCreate, 
    clinic_id: str, 
    user_id: str
):
    """
    Creates an initial claim record from an invoice.
    The claim starts in a 'PendingSubmission' state.
    """
    db_claim = models.Claim(
        **claim_data.dict(),
        clinic_id=clinic_id,
        created_by_user_id=user_id,
        status='PendingSubmission'
    )
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)
    return db_claim

def prepare_dhaman_submission_payload(db: Session, invoice_id: str, clinic_id: str) -> dict:
    """
    Gathers all necessary data for a claim and formats it into a dictionary
    ready to be sent to Dhaman's API.
    
    NOTE: The structure of the returned dictionary is a placeholder. In a real
    integration, this must exactly match Dhaman's technical specifications.
    """
    # Fetch all related data for the invoice
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id, models.Invoice.clinic_id == clinic_id).first()
    if not invoice:
        raise ValueError("Invoice not found.")

    patient = db.query(models.Patient).filter(models.Patient.id == invoice.patient_id).first()
    
    # Find the appointment linked to this invoice to get diagnoses and procedures
    appointment = db.query(models.Appointment).filter(models.Appointment.invoice_id == invoice_id).first()
    
    diagnoses = []
    if appointment:
        diagnoses_records = db.query(models.AppointmentDiagnosis).options(
            joinedload(models.AppointmentDiagnosis.icd10_code)
        ).filter(models.AppointmentDiagnosis.appointment_id == appointment.id).all()
        diagnoses = [{"code": d.icd10_code.code, "description": d.icd10_code.description} for d in diagnoses_records]

    procedures = []
    if appointment:
        procedure_records = db.query(models.AppointmentProcedure).options(
            joinedload(models.AppointmentProcedure.cpt_code)
        ).filter(models.AppointmentProcedure.appointment_id == appointment.id).all()
        procedures = [{"code": p.cpt_code.code, "description": p.cpt_code.description} for p in procedure_records]

    # Assemble the payload
    payload = {
        "patient_info": {
            "name": f"{patient.first_name} {patient.last_name}",
            "national_id": patient.national_id,
            "date_of_birth": str(patient.date_of_birth)
        },
        "encounter_details": {
            "appointment_id": str(appointment.id) if appointment else None,
            "diagnoses": diagnoses,
            "procedures": procedures
        },
        "billing_info": {
            "invoice_id": str(invoice.id),
            "total_amount": float(invoice.total_amount),
            "items": [{"service": item.service.name, "price": float(item.price_at_time_of_invoice)} for item in invoice.items]
        }
    }
    return payload

def update_claim_after_submission(
    db: Session,
    claim_id: str,
    dhaman_claim_id: str,
    submission_payload: dict
):
    """
    Updates a claim record after submission and ensures all related data
    is loaded for the response.
    """
    db_claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if db_claim:
        db_claim.dhaman_claim_id = dhaman_claim_id
        db_claim.submission_payload = submission_payload
        db_claim.status = 'Submitted'
        db_claim.updated_at = func.now() # This line now works
        db.commit()

        claim_with_details = (
            db.query(models.Claim)
            .options(
                joinedload(models.Claim.patient),
                joinedload(models.Claim.created_by).joinedload(models.User.role)
            )
            .filter(models.Claim.id == claim_id)
            .first()
        )
        return claim_with_details
    return None

def create_eligibility_check(
    db: Session, 
    patient_id: str, 
    eligibility_response: dict, 
    clinic_id: str, 
    user_id: str
):
    """
    Creates and saves a new eligibility check record in the database.
    """
    db_check = models.EligibilityCheck(
        patient_id=patient_id,
        is_eligible=eligibility_response.get("is_eligible", False),
        policy_number=eligibility_response.get("policy_number"),
        coverage_details=eligibility_response.get("coverage_details"),
        checked_by_user_id=user_id,
        clinic_id=clinic_id
    )
    db.add(db_check)
    db.commit()
    db.refresh(db_check)
    return db_check

# Super Admin CRUD Operations

def update_clinic_status(db: Session, clinic_id: str, new_status: str):
    """Updates the status of a clinic (e.g., Active, Suspended)."""
    db_clinic = get_clinic_by_id(db, clinic_id=clinic_id)
    if not db_clinic: return None
    
    is_activating = new_status == 'Active'
    db.query(models.User).filter(models.User.clinic_id == clinic_id).update({"is_active": is_activating})

    db_clinic.status = new_status
    db.commit()
    db.refresh(db_clinic)
    return db_clinic

def get_users_with_expiring_licenses(db: Session, clinic_id: str, days_ahead: int = 30):
    """
    Fetches users whose licenses are expiring within the specified number of days.
    This function now correctly queries the 'users' table.
    """
    expiry_threshold = date.today() + timedelta(days=days_ahead)
    return db.query(models.User).filter(
        models.User.clinic_id == clinic_id,
        models.User.license_expiry_date != None,
        models.User.license_expiry_date <= expiry_threshold
    ).all()

def create_staff_member(db: Session, staff_data: schemas.StaffCreate, clinic_id: str):
    """Creates a new staff member and generates a unique Employee ID."""
    staff_count = db.query(models.Staff).filter(models.Staff.clinic_id == clinic_id).count()
    new_employee_id = f"E-{staff_count + 1:04d}"
    
    db_staff = models.Staff(
        **staff_data.dict(), 
        clinic_id=clinic_id,
        employee_id=new_employee_id
    )
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

def create_user_for_staff(db: Session, user_data: schemas.UserCreateFromStaff, clinic_id: str):
    """Creates a login account for an existing staff member."""
    existing_user = db.query(models.User).filter(models.User.staff_id == user_data.staff_id).first()
    if existing_user:
        raise ValueError("This staff member already has a user account.")

    db_role = db.query(models.Role).filter(models.Role.name == user_data.role).first()
    if not db_role:
        raise ValueError(f"Role '{user_data.role}' does not exist.")
    
    hashed_password = security.get_password_hash(user_data.password)
    db_user = models.User(
        email=user_data.email,
        hashed_password=hashed_password,
        role_id=db_role.id,
        staff_id=user_data.staff_id,
        clinic_id=clinic_id,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_clinic_and_admin(db: Session, clinic: schemas.ClinicCreate, admin: schemas.UserCreate):
    """Creates a new clinic and its first admin user/staff record."""
    db_clinic = models.Clinic(**clinic.dict())
    db.add(db_clinic)
    db.commit()
    db.refresh(db_clinic)

    admin_staff_data = schemas.StaffCreate(
        first_name=admin.email.split('@')[0],
        last_name="Admin",
        designation="Clinic Administrator"
    )
    db_staff_member = create_staff_member(db, staff_data=admin_staff_data, clinic_id=db_clinic.id)

    db_admin = create_user_for_staff(
        db, 
        user_data=schemas.UserCreateFromStaff(
            staff_id=db_staff_member.id,
            email=admin.email,
            password=admin.password,
            role="Admin"
        ),
        clinic_id=db_clinic.id
    )
    # The user is created inactive until the clinic is approved
    db_admin.is_active = False
    db.commit()
    
    return db_clinic, db_admin

def get_staff_by_clinic(db: Session, clinic_id: str):
    """
    Fetches all staff members for a specific clinic, eagerly loading
    their user account details and the user's role.
    """
    return (
        db.query(models.Staff)
        .options(
            joinedload(models.Staff.user_account).joinedload(models.User.role)
        )
        .filter(models.Staff.clinic_id == clinic_id)
        .all()
    )

def get_staff_by_id(db: Session, staff_id: str, clinic_id: str):
    """Fetches a single staff member by their ID, ensuring they belong to the correct clinic."""
    return db.query(models.Staff).options(
        joinedload(models.Staff.user_account)
    ).filter(
        models.Staff.id == staff_id,
        models.Staff.clinic_id == clinic_id
    ).first()

def get_or_create_soap_note_for_appointment(db: Session, appointment_id: str, patient_id: str, doctor_id: str, clinic_id: str):
    """
    Fetches the SOAP note for an appointment. If one doesn't exist, it creates a new, blank one.
    """
    db_note = db.query(models.SOAPNote).filter(models.SOAPNote.appointment_id == appointment_id).first()
    if not db_note:
        db_note = models.SOAPNote(
            appointment_id=appointment_id,
            patient_id=patient_id,
            doctor_id=doctor_id,
            clinic_id=clinic_id
        )
        db.add(db_note)
        db.commit()
        db.refresh(db_note)
    return db_note

def update_soap_note(db: Session, note_id: str, note_data: schemas.SOAPNoteBase):
    """Updates an existing SOAP note."""
    db_note = db.query(models.SOAPNote).filter(models.SOAPNote.id == note_id).first()
    if db_note:
        for key, value in note_data.dict(exclude_unset=True).items():
            setattr(db_note, key, value)
        db.commit()
        db.refresh(db_note)
    return db_note

def get_encounter_details(db: Session, appointment_id: str, clinic_id: str):
    """
    Fetches all details for a single patient encounter, including the patient,
    the current SOAP note, and all past clinical notes for the patient.
    """
    appointment = db.query(models.Appointment).options(
        joinedload(models.Appointment.patient)
    ).filter(
        models.Appointment.id == appointment_id,
        models.Appointment.clinic_id == clinic_id
    ).first()

    if not appointment:
        return None

    patient_id = str(appointment.patient_id)
    doctor_id = str(appointment.doctor_id)

    # Get or create the SOAP note for THIS specific appointment
    current_soap_note = get_or_create_soap_note_for_appointment(
        db,
        appointment_id=str(appointment.id),
        patient_id=patient_id,
        doctor_id=doctor_id,
        clinic_id=clinic_id
    )
    past_notes = db.query(models.SOAPNote).filter(
        models.SOAPNote.patient_id == patient_id,
        models.SOAPNote.appointment_id != appointment_id # Exclude the current one
    ).order_by(models.SOAPNote.created_at.desc()).all()

    return {
        "patient": appointment.patient, 
        "current_soap_note": current_soap_note,
        "past_notes": past_notes
    }

def get_vitals_by_appointment(db: Session, appointment_id: str, clinic_id: str):
    """Fetches the most recent vitals record for a specific appointment."""
    return db.query(models.Vitals).filter(
        models.Vitals.appointment_id == appointment_id,
        models.Vitals.clinic_id == clinic_id
    ).order_by(models.Vitals.recorded_at.desc()).first()

def search_patients(db: Session, clinic_id: str, search_term: str):
    """
    Searches for patients by first name, last name, or MRN in a given clinic.
    The search is case-insensitive.
    """
    search_filter = f"%{search_term.lower()}%"
    return (
        db.query(models.Patient)
        .filter(
            models.Patient.clinic_id == clinic_id,
            or_(
                func.lower(models.Patient.first_name).like(search_filter),
                func.lower(models.Patient.last_name).like(search_filter),
                func.lower(models.Patient.mrn).like(search_filter)
            )
        )
        .limit(10) # Limit results for performance
        .all()
    )

def get_receptionist_dashboard_data(db: Session, clinic_id: str):
    """
    Calculates and returns key metrics for the Receptionist dashboard.
    """
    today = date.today()
    
    todays_appointments = db.query(models.Appointment).filter(
        models.Appointment.clinic_id == clinic_id,
        func.date(models.Appointment.appointment_time) == today
    ).count()

    new_patients_today = db.query(models.Patient).filter(
        models.Patient.clinic_id == clinic_id,
        func.date(models.Patient.created_at) == today
    ).count()

    unpaid_invoices_count = db.query(models.Invoice).filter(
        models.Invoice.clinic_id == clinic_id,
        models.Invoice.status == 'Unpaid'
    ).count()

    # Get the 5 most recent unpaid invoices to display as a worklist
    recent_unpaid_invoices = db.query(models.Invoice).options(
        joinedload(models.Invoice.patient)
    ).filter(
        models.Invoice.clinic_id == clinic_id,
        models.Invoice.status == 'Unpaid'
    ).order_by(models.Invoice.created_at.desc()).limit(5).all()

    return {
        "kpis": {
            "todays_appointments": todays_appointments,
            "new_patients_today": new_patients_today,
            "unpaid_invoices": unpaid_invoices_count
        },
        "recent_unpaid_invoices": recent_unpaid_invoices
    }

def book_appointment_with_invoice(db: Session, patient_id: str, doctor_id: str, appointment_time: datetime, clinic_id: str, user_id: str):
    """
    Creates an invoice for a doctor's consultation and a linked appointment
    with 'AwaitingPayment' status in a single transaction.
    """
    doctor = db.query(models.User).options(joinedload(models.User.staff_member)).filter(models.User.id == doctor_id).first()
    if not doctor or not doctor.staff_member or doctor.staff_member.consultation_fee is None:
        raise ValueError("Selected doctor does not have a valid consultation fee set.")
    fee = doctor.staff_member.consultation_fee

    consultation_service = db.query(models.Service).filter(models.Service.clinic_id == clinic_id, models.Service.name == "Doctor Consultation").first()
    if not consultation_service:
        consultation_service = models.Service(name="Doctor Consultation", price=0, category="Consultation", clinic_id=clinic_id)
        db.add(consultation_service)
        db.flush()

    db_invoice = models.Invoice(
        patient_id=patient_id,
        subtotal_amount=fee,
        discount_amount=0,
        total_amount=fee,
        status='Unpaid',
        clinic_id=clinic_id,
        created_by_user_id=user_id
    )
    db.add(db_invoice)
    db.flush()

    db.add(models.InvoiceItem(
        invoice_id=db_invoice.id, service_id=consultation_service.id,
        quantity=1, price_at_time_of_invoice=fee, clinic_id=clinic_id
    ))
    
    db_appointment = models.Appointment(
        patient_id=patient_id, doctor_id=doctor_id,
        appointment_time=appointment_time, invoice_id=db_invoice.id,
        clinic_id=clinic_id, created_by_user_id=user_id,
        status='AwaitingPayment'
    )
    db.add(db_appointment)
    return db_appointment

def update_staff_member(db: Session, staff_id: str, clinic_id: str, staff_data: schemas.StaffUpdate):
    """Updates a staff member's details, ensuring they belong to the correct clinic."""
    db_staff = db.query(models.Staff).filter(
        models.Staff.id == staff_id,
        models.Staff.clinic_id == clinic_id
    ).first()

    if not db_staff:
        return None
    
    update_data = staff_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_staff, key, value)
    
    db.commit()
    db.refresh(db_staff)
    return db_staff

# In backend/crud.py

def create_invoice_for_reception(
    db: Session,
    invoice_data: schemas.InvoiceCreate,
    clinic_id: str,
    user_id: str
):
    """
    THE MAIN, UNIFIED FUNCTION for creating invoices from reception.
    Handles proposed orders, walk-ins, and correctly calculates discounts.
    """
    # 1. Calculate the subtotal from all items in the cart
    subtotal_amount = Decimal(0)
    for item_data in invoice_data.items:
        service = get_service_by_id(db, service_id=item_data.service_id, clinic_id=clinic_id)
        if not service:
            raise ValueError(f"Service with ID {item_data.service_id} not found.")
        subtotal_amount += service.price * item_data.quantity

    # 2. Apply the discount
    discount = invoice_data.discount
    if discount > subtotal_amount:
        raise ValueError("Discount cannot be greater than the subtotal.")
    total_amount = subtotal_amount - discount

    # 3. Create the main invoice record with all correct amounts
    db_invoice = models.Invoice(
        patient_id=invoice_data.patient_id,
        subtotal_amount=subtotal_amount,
        discount_amount=discount,
        total_amount=total_amount,
        status='Unpaid',
        clinic_id=clinic_id,
        created_by_user_id=user_id
    )
    db.add(db_invoice)
    db.flush()

    # 4. Add invoice items for accounting
    for item_data in invoice_data.items:
        service = get_service_by_id(db, item_data.service_id, clinic_id)
        db.add(models.InvoiceItem(
            invoice_id=db_invoice.id, service_id=service.id,
            quantity=item_data.quantity, price_at_time_of_invoice=service.price,
            clinic_id=clinic_id
        ))

    # 5. If proposed_order_ids were sent, link them and update their status
    if invoice_data.proposed_order_ids:
        db.query(models.LabOrder).filter(
            models.LabOrder.id.in_(invoice_data.proposed_order_ids)
        ).update({"status": 'AwaitingPayment', "invoice_id": db_invoice.id}, synchronize_session=False)

        db.query(models.RadiologyOrder).filter(
            models.RadiologyOrder.id.in_(invoice_data.proposed_order_ids)
        ).update({"status": 'AwaitingPayment', "invoice_id": db_invoice.id}, synchronize_session=False)

    db.commit()
    db.refresh(db_invoice)
    return db_invoice


def process_payment_for_proposed_orders(
    db: Session, 
    patient_id: str, 
    proposed_order_ids: List[uuid.UUID], 
    payment_mode: str, 
    discount: Decimal, 
    clinic_id: str, 
    user_id: str
):
    """
    Creates a paid invoice for SELECTED proposed orders, applies a discount, and activates them.
    """
    orders_to_process = []
    subtotal_amount = Decimal(0)

    # 1. Find the selected LabOrders and add to subtotal
    lab_orders = db.query(models.LabOrder).options(joinedload(models.LabOrder.lab_test)) \
        .filter(models.LabOrder.id.in_(proposed_order_ids)).all()
    for order in lab_orders:
        subtotal_amount += order.lab_test.price
        orders_to_process.append(order)

    # 2. Find the selected RadiologyOrders and add to subtotal
    rad_orders = db.query(models.RadiologyOrder).options(joinedload(models.RadiologyOrder.radiology_test)) \
        .filter(models.RadiologyOrder.id.in_(proposed_order_ids)).all()
    for order in rad_orders:
        subtotal_amount += order.radiology_test.price
        orders_to_process.append(order)

    if not orders_to_process:
        raise ValueError("No valid proposed orders found to process.")

    # 3. Validate discount
    if discount is None:
        discount = Decimal(0)
    if discount > subtotal_amount:
        raise ValueError("Discount cannot be greater than the subtotal.")

    total_amount = subtotal_amount - discount

    # 4. Create the invoice
    db_invoice = models.Invoice(
        patient_id=patient_id,
        subtotal_amount=subtotal_amount,
        discount_amount=discount,
        total_amount=total_amount,
        status='Paid',
        clinic_id=clinic_id,
        created_by_user_id=user_id
    )
    db.add(db_invoice)
    db.flush()  # flush to get invoice ID

    # 5. Create the payment record
    db.add(models.Payment(
        invoice_id=db_invoice.id,
        amount_paid=total_amount,
        payment_mode=payment_mode,
        clinic_id=clinic_id,
        received_by_user_id=user_id
    ))

    # 6. Link orders to the invoice and update their status
    for order in orders_to_process:
        order.status = 'Pending'
        order.invoice_id = db_invoice.id

    db.commit()
    return db_invoice


def reject_proposed_order(db: Session, order_id: uuid.UUID, reason: str, clinic_id: str, user_id: str):
    """Rejects a proposed order with a mandatory reason."""
    order = db.query(models.LabOrder).filter(models.LabOrder.id == order_id, models.LabOrder.clinic_id == clinic_id).first()
    if not order:
        order = db.query(models.RadiologyOrder).filter(models.RadiologyOrder.id == order_id, models.RadiologyOrder.clinic_id == clinic_id).first()
    
    if not order or order.status != 'Proposed':
        raise ValueError("Order not found or cannot be rejected.")
    
    order.status = 'Rejected'
    order.rejection_reason = f"Rejected by {user_id}: {reason}"
    db.commit()
    return order
