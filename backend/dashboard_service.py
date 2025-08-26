# In backend/dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case, distinct
from datetime import date, timedelta

from . import models, crud 

def get_lab_dashboard_data(db: Session, clinic_id: str):
    """
    Calculates and returns key metrics for the Laboratory Dashboard,
    including a worklist categorized by department.
    """
    today = date.today()

    # --- KPI Card Calculations ---
    
    # Get counts for different statuses
    pending_count = db.query(models.LabOrder).filter(
        models.LabOrder.clinic_id == clinic_id,
        models.LabOrder.status == 'Pending'
    ).count()
    
    completed_today_count = db.query(models.LabOrder).filter(
        models.LabOrder.clinic_id == clinic_id,
        models.LabOrder.status == 'Completed',
        func.date(models.OrderResult.reported_at) == today
    ).join(models.OrderResult, models.LabOrder.id == models.OrderResult.lab_order_id).count()

    # --- NEW: Departmental Worklist Logic ---
    
    # Fetch all pending orders and join with the test details to get the category
    pending_orders = db.query(models.LabOrder).options(
        joinedload(models.LabOrder.patient),
        joinedload(models.LabOrder.lab_test)
    ).filter(
        models.LabOrder.clinic_id == clinic_id,
        models.LabOrder.status.in_(['Pending', 'SampleCollected'])
    ).order_by(models.LabOrder.created_at.asc()).all()

    # Group the orders by the test's category
    worklist_by_department = {}
    for order in pending_orders:
        department = order.lab_test.category or "General"
        if department not in worklist_by_department:
            worklist_by_department[department] = []
        worklist_by_department[department].append(order)

    return {
        "kpi_cards": {
            "pending_orders": pending_count,
            "completed_today": completed_today_count,
            "urgent_orders": 0 # Placeholder for priority logic
        },
        "worklist_by_department": worklist_by_department
    }

def get_clinic_admin_dashboard_data(db: Session, clinic_id: str):
    """
    Calculates and returns all key metrics for the Clinic Admin dashboard,
    including compliance reminders for expiring licenses.
    """
    today = date.today()
    start_of_month = today.replace(day=1)
    
    # --- Core Operational Overview ---
    appointments_today = db.query(models.Appointment).filter(
        models.Appointment.clinic_id == clinic_id,
        func.date(models.Appointment.appointment_time) == today
    ).all()
    
    patient_flow = {
        "scheduled": len(appointments_today),
        "completed": len([a for a in appointments_today if a.status == 'Completed']),
        "pending_lab": db.query(models.LabOrder).filter(models.LabOrder.clinic_id == clinic_id, models.LabOrder.status == 'Pending').count(),
        "pending_pharmacy": db.query(models.Prescription).filter(models.Prescription.clinic_id == clinic_id, models.Prescription.status == 'Proposed').count()
    }
    
    # --- Financial & Insurance Analytics ---
    monthly_revenue = db.query(func.coalesce(func.sum(models.Invoice.total_amount), 0)).filter(
        models.Invoice.clinic_id == clinic_id,
        models.Invoice.status == 'Paid',
        func.date(models.Invoice.created_at) >= start_of_month
    ).scalar()

    outstanding_payments = db.query(func.coalesce(func.sum(models.Invoice.total_amount), 0)).filter(
        models.Invoice.clinic_id == clinic_id,
        models.Invoice.status == 'Unpaid'
    ).scalar()
    
    total_claims = db.query(func.count(models.Claim.id)).filter(models.Claim.clinic_id == clinic_id).scalar() or 0
    paid_claims = db.query(func.count(models.Claim.id)).filter(models.Claim.clinic_id == clinic_id, models.Claim.status == 'Paid').scalar() or 0
    claim_success_rate = (paid_claims / total_claims * 100) if total_claims > 0 else 0

    revenue_by_category = db.query(
        models.Service.category,
        func.coalesce(func.sum(models.InvoiceItem.price_at_time_of_invoice * models.InvoiceItem.quantity), 0)
    ).join(models.InvoiceItem, models.Service.id == models.InvoiceItem.service_id)\
     .join(models.Invoice, models.InvoiceItem.invoice_id == models.Invoice.id)\
     .filter(
        models.Service.clinic_id == clinic_id,
        models.Invoice.status == 'Paid',
        func.date(models.Invoice.created_at) >= start_of_month
     ).group_by(models.Service.category).all()
    
    # --- Patient & Staff Metrics ---
    total_unique_patients_this_month = db.query(func.count(distinct(models.Appointment.patient_id))).filter(
        models.Appointment.clinic_id == clinic_id,
        func.date(models.Appointment.appointment_time) >= start_of_month
    ).scalar() or 0

    new_patients_this_month = db.query(func.count(models.Patient.id)).filter(
        models.Patient.clinic_id == clinic_id,
        func.date(models.Patient.created_at) >= start_of_month
    ).scalar() or 0

    returning_patients_this_month = total_unique_patients_this_month - new_patients_this_month
    
    doctor_productivity = db.query(
        models.User.email, 
        func.count(models.Appointment.id)
    ).join(models.Appointment, models.User.id == models.Appointment.doctor_id).filter(
        models.Appointment.clinic_id == clinic_id,
        func.date(models.Appointment.appointment_time) == today
    ).group_by(models.User.email).all()

    # --- THIS IS THE CRITICAL FIX ---
    # Call the corrected function from crud.py
    expiring_licenses_users = crud.get_users_with_expiring_licenses(db, clinic_id=clinic_id)
    
    return {
        "kpi_cards": {
            "revenue_this_month": float(monthly_revenue),
            "outstanding_payments": float(outstanding_payments),
            "new_patients_this_month": new_patients_this_month,
            "returning_patients_this_month": returning_patients_this_month,
            "claim_success_rate": round(claim_success_rate, 2)
        },
        "patient_flow": patient_flow,
        "doctor_productivity": [{"doctor": email, "patient_count": count} for email, count in doctor_productivity],
        "revenue_by_category": [{"name": category if category else "Other", "value": float(total)} for category, total in revenue_by_category],
        "expiring_licenses": [{"email": user.email, "license_expiry_date": str(user.license_expiry_date)} for user in expiring_licenses_users]
    }