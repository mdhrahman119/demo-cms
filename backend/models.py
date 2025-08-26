# backend/models.py

import uuid
from sqlalchemy import (
    Column, String, ForeignKey, TIMESTAMP, Text, Boolean, Date, Integer, BigInteger, Numeric
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# --- Core Models ---
class Clinic(Base):
    __tablename__ = "clinics"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False, default='PendingApproval')
    contact_person = Column(Text)
    contact_number = Column(Text)
    moh_license_number = Column(Text)
    contract_details = Column(Text)
    dhaman_api_key = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    users = relationship("User", back_populates="clinic")
    staff = relationship("Staff", back_populates="clinic")
    patients = relationship("Patient", back_populates="clinic")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    permissions = Column(JSONB)

class Staff(Base):
    __tablename__ = "staff"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(Text, unique=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    designation = Column(Text)
    date_of_birth = Column(Date)
    education = Column(Text)
    experience = Column(Text)
    salary = Column(Numeric(10, 3))
    joining_date = Column(Date)
    contract_details = Column(Text)
    profile_photo_url = Column(Text)
    status = Column(String, nullable=False, default='Active')
    consultation_fee = Column(Numeric(10, 3), nullable=True)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    user_account = relationship("User", back_populates="staff_member", uselist=False)
    clinic = relationship("Clinic", back_populates="staff")

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superadmin = Column(Boolean, default=False)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff.id"), unique=True, nullable=True)
    license_expiry_date = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    role = relationship("Role")
    clinic = relationship("Clinic", back_populates="users")
    staff_member = relationship("Staff", back_populates="user_account")
    vitals_records = relationship("Vitals", back_populates="nurse")


# --- Patient Model ---
class Patient(Base):
    __tablename__ = "patients"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mrn = Column(Text, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String)
    national_id = Column(String, unique=True, index=True)
    contact_number = Column(String)
    address = Column(String)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    clinic = relationship("Clinic", back_populates="patients")
    invoices = relationship("Invoice", back_populates="patient")


# --- Billing Models ---
class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    price = Column(Numeric(10, 3), nullable=False, default=0.000)
    category = Column(String)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    lab_test_id = Column(Integer, ForeignKey("lab_tests.id"), unique=True, nullable=True)
    radiology_test_id = Column(Integer, ForeignKey("radiology_tests.id"), unique=True, nullable=True)

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    subtotal_amount = Column(Numeric(10, 3), nullable=False)
    discount_amount = Column(Numeric(10, 3), nullable=False, default=0)
    total_amount = Column(Numeric(10, 3), nullable=False)
    total_amount = Column(Numeric(10, 3), nullable=False)
    status = Column(String, nullable=False, default='Unpaid')
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    items = relationship("InvoiceItem", back_populates="invoice")
    patient = relationship("Patient", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id = Column(Integer, primary_key=True)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    price_at_time_of_invoice = Column(Numeric(10, 3), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    invoice = relationship("Invoice", back_populates="items")
    service = relationship("Service")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    amount_paid = Column(Numeric(10, 3), nullable=False)
    payment_mode = Column(String, nullable=False)
    payment_date = Column(Date, nullable=False, server_default=func.current_date())
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    received_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    invoice = relationship("Invoice", back_populates="payments")
    received_by = relationship("User", foreign_keys=[received_by_user_id])

# --- Appointments Model ---
class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    appointment_time = Column(TIMESTAMP(timezone=True), nullable=False)
    reason_for_visit = Column(Text)
    status = Column(String, nullable=False, default='Scheduled')
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    patient = relationship("Patient")
    doctor = relationship("User", foreign_keys=[doctor_id])
    invoice = relationship("Invoice")

# --- Nursing Module Models ---
class TriageRecord(Base):
    __tablename__ = "triage_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    chief_complaint = Column(Text, nullable=False)
    history_of_present_illness = Column(Text)
    nurse_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    patient = relationship("Patient")
    appointment = relationship("Appointment")
    nurse = relationship("User", foreign_keys=[nurse_id])

class Vitals(Base):
    __tablename__ = "vitals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)

    blood_pressure_systolic = Column(Integer)
    blood_pressure_diastolic = Column(Integer)
    heart_rate = Column(Integer)
    temperature_celsius = Column(Numeric(4, 1))
    respiratory_rate = Column(Integer)
    oxygen_saturation = Column(Numeric(4, 1))

    recorded_by_nurse_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    recorded_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    patient = relationship("Patient")
    appointment = relationship("Appointment")
    recorded_by = relationship("User", foreign_keys=[recorded_by_nurse_id])   # ✅ renamed to recorded_by
    nurse = relationship("User", back_populates="vitals_records")   
# --- Lab & Radiology Definitions ---
class LabTest(Base):
    __tablename__ = "lab_tests"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    price = Column(Numeric(10, 3), nullable=False, default=0.000)
    category = Column(String, default='Laboratory')
    department = Column(String, default='General') # e.g., Hematology, Biochemistry
    specimen_type = Column(String, default='Blood') # e.g., Blood, Urine, Stool
    reference_range_normal = Column(String) # e.g., "12.0-15.5 g/dL"
    reference_range_critical = Column(String) # e.g., "<7.0 or >21.0 g/dL"
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)

class RadiologyTest(Base):
    __tablename__ = "radiology_tests"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    price = Column(Numeric(10, 3), nullable=False, default=0.000)
    category = Column(String, default='Radiology')
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)

# --- Professional Workflow Models ---
class LabOrder(Base):
    __tablename__ = "lab_orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lab_test_id = Column(Integer, ForeignKey("lab_tests.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)

    # Status options: Proposed, AwaitingPayment, Pending, SampleCollected, InProgress, SampleRejected, ResultEntered, Completed
    status = Column(String, nullable=False, default='Proposed') 
    rejection_reason = Column(Text, nullable=True)
    priority = Column(String, nullable=False, default='Normal')
    specimen_id = Column(String, index=True) # To link multiple orders to one sample
    is_dhamani_approved = Column(Boolean, default=True) # Placeholder for insurance validation
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    patient = relationship("Patient")
    doctor = relationship("User", foreign_keys=[doctor_id])
    lab_test = relationship("LabTest")

class RadiologyOrder(Base):
    __tablename__ = "radiology_orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    radiology_test_id = Column(Integer, ForeignKey("radiology_tests.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    status = Column(String, nullable=False, default='Proposed')
    rejection_reason = Column(Text, nullable=True)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    patient = relationship("Patient")
    doctor = relationship("User", foreign_keys=[doctor_id])
    radiology_test = relationship("RadiologyTest")

class LabSample(Base):
    __tablename__ = "lab_samples"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lab_order_id = Column(UUID(as_uuid=True), ForeignKey("lab_orders.id"), nullable=False)
    sample_barcode = Column(Text, unique=True)
    collected_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    collection_time = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    received_at = Column(TIMESTAMP(timezone=True))
    rejection_reason = Column(Text) # e.g., Hemolyzed, Insufficient volume

    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)

class OrderResult(Base):
    __tablename__ = "order_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    lab_order_id = Column(UUID(as_uuid=True), ForeignKey("lab_orders.id"), nullable=True)
    radiology_order_id = Column(UUID(as_uuid=True), ForeignKey("radiology_orders.id"), nullable=True)
    result_data = Column(JSONB) # e.g., {"Hb": 8.5, "unit": "g/dL", "is_critical": true}
    report_notes = Column(Text)
    report_file_url = Column(Text)
    reported_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reported_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    validated_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    validated_at = Column(TIMESTAMP(timezone=True))
    interpretation_notes = Column(Text) # AI/Rule-based interpretation
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)

class MedicationAdministration(Base):
    __tablename__ = "medication_administrations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    medication_name = Column(Text, nullable=False)
    dosage = Column(Text, nullable=False)
    route = Column(Text, nullable=False)
    administered_by_nurse_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    administered_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    patient = relationship("Patient")
    appointment = relationship("Appointment")
    nurse = relationship("User", foreign_keys=[administered_by_nurse_id])

# --- Accounting Module Models ---
class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    normal_balance = Column(String, nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_date = Column(Date, nullable=False, server_default=func.current_date())
    description = Column(Text, nullable=False)
    debit_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    credit_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    amount = Column(Numeric(10, 3), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    debit_account = relationship("Account", foreign_keys=[debit_account_id])
    credit_account = relationship("Account", foreign_keys=[credit_account_id])
    created_by = relationship("User", foreign_keys=[created_by_user_id])

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_name = Column(String)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(10, 3), nullable=False)
    expense_date = Column(Date, nullable=False)
    expense_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    payment_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    recorded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

# --- Pharmacy Module Models ---
class Medication(Base):
    __tablename__ = "medications"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    manufacturer = Column(Text)
    stock_quantity = Column(Integer, nullable=False, default=0)
    unit_price = Column(Numeric(10, 3), nullable=False)
    category = Column(String, default='Pharmacy')
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)

class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default='Proposed')
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    items = relationship("PrescriptionItem", back_populates="prescription")
    patient = relationship("Patient")
    doctor = relationship("User", foreign_keys=[doctor_id])

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    id = Column(Integer, primary_key=True)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id"), nullable=False)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    dosage = Column(Text, nullable=False)
    quantity_prescribed = Column(Integer, nullable=False)
    category = Column(String, default='Regular') # --- NEW FIELD ---
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    prescription = relationship("Prescription", back_populates="items")
    medication = relationship("Medication")

class PharmacySale(Base):
    __tablename__ = "pharmacy_sales"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), unique=True, nullable=False)
    pharmacist_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    total_amount = Column(Numeric(10, 3), nullable=False)
    sale_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    dispensations = relationship("Dispensation", back_populates="pharmacy_sale")

class Dispensation(Base):
    __tablename__ = "dispensations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pharmacy_sale_id = Column(UUID(as_uuid=True), ForeignKey("pharmacy_sales.id"), nullable=False)
    prescription_item_id = Column(Integer, ForeignKey("prescription_items.id"), nullable=False)
    quantity_dispensed = Column(Integer, nullable=False)
    dispensed_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    pharmacy_sale = relationship("PharmacySale", back_populates="dispensations")



class ICD10Code(Base):
    __tablename__ = "icd10_codes"

    id = Column(Integer, primary_key=True)
    code = Column(Text, nullable=False, unique=True)
    description = Column(Text, nullable=False)

class AppointmentDiagnosis(Base):
    __tablename__ = "appointment_diagnoses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    icd10_code_id = Column(Integer, ForeignKey("icd10_codes.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    diagnosed_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    appointment = relationship("Appointment")
    patient = relationship("Patient")
    icd10_code = relationship("ICD10Code")
    doctor = relationship("User", foreign_keys=[doctor_id])

# --- CPT Code Models (Structure Only) ---

class CPTCode(Base):
    __tablename__ = "cpt_codes"

    id = Column(Integer, primary_key=True)
    code = Column(Text, nullable=False, unique=True)
    description = Column(Text, nullable=False)

class AppointmentProcedure(Base):
    __tablename__ = "appointment_procedures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    cpt_code_id = Column(Integer, ForeignKey("cpt_codes.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    procedure_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    appointment = relationship("Appointment")
    patient = relationship("Patient")
    cpt_code = relationship("CPTCode")
    doctor = relationship("User", foreign_keys=[doctor_id])

# --- Dhaman Integration & Claims Model ---

class Claim(Base):
    __tablename__ = "claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), unique=True, nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    dhaman_claim_id = Column(Text, nullable=True) # The ID from Dhaman's system
    status = Column(String, nullable=False, default='PendingSubmission')
    submission_payload = Column(JSONB)
    response_payload = Column(JSONB)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    invoice = relationship("Invoice")
    patient = relationship("Patient")
    created_by = relationship("User", foreign_keys=[created_by_user_id])


class EligibilityCheck(Base):
    __tablename__ = "eligibility_checks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    is_eligible = Column(Boolean, nullable=False)
    policy_number = Column(Text)
    coverage_details = Column(JSONB)
    checked_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    checked_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    patient = relationship("Patient")
    checked_by = relationship("User", foreign_keys=[checked_by_user_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(BigInteger, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"))
    action = Column(String, nullable=False)
    details = Column(JSONB)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now())
    user = relationship("User")

class SOAPNote(Base):
    __tablename__ = "soap_notes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), unique=True, nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    subjective = Column(Text)
    objective = Column(Text)
    assessment = Column(Text)
    plan = Column(Text)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
