# backend/schemas.py

import uuid
from pydantic import BaseModel, EmailStr, Field, conint, constr
from datetime import datetime, date
from decimal import Decimal
from typing import List, Any, Optional

# --- Core Schemas ---
class ClinicBase(BaseModel):
    name: str
    contact_person: str | None = None
    contact_number: str | None = None
    moh_license_number: str | None = None
    contract_details: str | None = None

class ClinicCreate(ClinicBase):
    pass

class Clinic(ClinicBase):
    id: uuid.UUID
    status: str
    created_at: datetime
    class Config: from_attributes = True

class UpdateClinicStatus(BaseModel):
    status: str

class Role(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True

class UserBase(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None = None
    role: Role | None = None   # nested schema

    class Config:
        from_attributes = True  # ✅ important

class UserCreate(UserBase):
    password: str
    role: str = "Admin"
    license_expiry_date: date | None = None

class User(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: Role
    is_superadmin: bool
    staff_member: Optional["Staff"] = None
    employee_id: str | None = None
    license_expiry_date: date | None = None
    clinic_id: uuid.UUID | None = None
    created_at: datetime
    class Config: from_attributes = True

class StaffBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date | None = None
    education: str | None = None
    experience: str | None = None
    salary: Decimal | None = None
    joining_date: date | None = None
    contract_details: str | None = None
    profile_photo_url: str | None = None
    designation: str | None = None
    consultation_fee: Decimal | None = None

class StaffCreate(StaffBase):
    pass

class StaffUpdate(StaffBase):
   pass

class Staff(StaffBase):
    id: uuid.UUID
    employee_id: str | None = None
    designation: str | None = None
    status: str
    user_account: Optional[UserBase] = None
    class Config: from_attributes = True

class UserCreateFromStaff(BaseModel):
    staff_id: uuid.UUID
    email: EmailStr
    password: str
    role: str

class UpdateStaffStatus(BaseModel):
    status: str # Expected values: 'Active', 'Resigned', etc.

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class AuditLog(BaseModel):
    id: int
    action: str
    details: dict | None = None
    timestamp: datetime
    user: User | None = None
    class Config: from_attributes = True

# --- Patient Schemas ---
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str | None = None
    national_id: str | None = None
    contact_number: str | None = None
    address: str | None = None

class PatientCreate(PatientBase): pass
class Patient(PatientBase):
    id: uuid.UUID
    mrn: str | None = None
    clinic_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    class Config: from_attributes = True

# --- Billing & Service Schemas ---
class ServiceBase(BaseModel):
    name: str
    price: Decimal = Field(..., max_digits=10, decimal_places=3)
    category: str | None = None

class ServiceCreate(ServiceBase): pass
class Service(ServiceBase):
    id: int
    clinic_id: uuid.UUID
    class Config: from_attributes = True

class InvoiceItemCreate(BaseModel):
    service_id: int
    quantity: int = 1

class InvoiceCreate(BaseModel):
    patient_id: uuid.UUID
    items: List[InvoiceItemCreate]
    proposed_order_ids: List[uuid.UUID] = [] 
    discount: Decimal = Field(0, max_digits=10, decimal_places=3)

class InvoiceItem(BaseModel):
    id: int
    service: Service
    quantity: int
    price_at_time_of_invoice: Decimal
    class Config: from_attributes = True

class Invoice(BaseModel):
    id: uuid.UUID
    patient: Patient
    total_amount: Decimal
    status: str
    created_at: datetime
    items: List[InvoiceItem]
    class Config: from_attributes = True

# --- Payment Schemas ---
class PaymentCreate(BaseModel):
    invoice_id: uuid.UUID
    amount_paid: Decimal = Field(..., gt=0, max_digits=10, decimal_places=3)
    payment_mode: constr(pattern='^(Cash|Card)$')
    payment_date: date = Field(default_factory=date.today)

class Payment(BaseModel):
    id: uuid.UUID
    invoice_id: uuid.UUID
    amount_paid: Decimal
    payment_mode: str
    payment_date: date
    received_by: User
    created_at: datetime
    class Config: from_attributes = True

# --- Appointments Schema ---
class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    invoice_id: uuid.UUID
    appointment_time: datetime
    reason_for_visit: str | None = None

class Appointment(BaseModel):
    id: uuid.UUID
    patient: Patient
    doctor: User
    invoice_id: uuid.UUID
    appointment_time: datetime
    status: str
    reason_for_visit: str | None = None
    class Config: from_attributes = True

# --- Lab & Radiology Definitions ---
class LabTestBase(BaseModel):
    name: str
    price: Decimal = Field(..., max_digits=10, decimal_places=3)
class LabTestCreate(LabTestBase): pass
class LabTest(LabTestBase):
    id: int
    clinic_id: uuid.UUID
    category: str | None = None
    class Config: from_attributes = True

class RadiologyTestBase(BaseModel):
    name: str
    price: Decimal = Field(..., max_digits=10, decimal_places=3)
class RadiologyTestCreate(RadiologyTestBase): pass
class RadiologyTest(RadiologyTestBase):
    id: int
    clinic_id: uuid.UUID
    category: str | None = None
    class Config: from_attributes = True

# --- Professional Workflow Schemas ---
class OrderPropose(BaseModel):
    patient_id: uuid.UUID
    test_id: int

class OrdersLinkToInvoice(BaseModel):
    invoice_id: uuid.UUID
    lab_order_ids: List[uuid.UUID] = []
    radiology_order_ids: List[uuid.UUID] = []

class LabSampleCreate(BaseModel):
    lab_order_id: uuid.UUID
    sample_barcode: str

class LabSample(LabSampleCreate):
    id: uuid.UUID
    collected_by_user_id: uuid.UUID # Changed to match the model
    collection_time: datetime

    class Config:
        from_attributes = True

class OrderResultCreate(BaseModel):
    patient_id: uuid.UUID
    lab_order_id: uuid.UUID | None = None
    radiology_order_id: uuid.UUID | None = None
    result_data: dict | None = None
    report_notes: str | None = None
    report_file_url: str | None = None

class LabOrder(BaseModel):
    id: uuid.UUID
    patient: Patient
    doctor: User
    lab_test: LabTest
    invoice_id: uuid.UUID | None = None
    status: str
    created_at: datetime
    class Config: from_attributes = True

class RadiologyOrder(BaseModel):
    id: uuid.UUID
    patient: Patient
    doctor: User
    radiology_test: RadiologyTest
    invoice_id: uuid.UUID | None = None
    status: str
    created_at: datetime
    class Config: from_attributes = True

class OrderResult(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    result_data: dict | None = None
    report_notes: str | None = None
    reported_by: User
    reported_at: datetime
    class Config: from_attributes = True

# --- Nursing Schemas ---
class TriageRecordCreate(BaseModel):
    patient_id: uuid.UUID
    appointment_id: uuid.UUID
    chief_complaint: str
    history_of_present_illness: str | None = None

class TriageRecord(TriageRecordCreate):
    id: uuid.UUID
    nurse: User
    created_at: datetime
    class Config: from_attributes = True

class VitalsCreate(BaseModel):
    patient_id: uuid.UUID
    appointment_id: uuid.UUID
    blood_pressure_systolic: int | None = None
    blood_pressure_diastolic: int | None = None
    heart_rate: int | None = None
    temperature_celsius: Decimal | None = None
    respiratory_rate: int | None = None
    oxygen_saturation: Decimal | None = None

class Vitals(VitalsCreate):
    id: uuid.UUID
    recorded_by_nurse: User = Field(..., alias="recorded_by")
    recorded_at: datetime
    class Config:
        from_attributes = True

class MedicationAdministrationCreate(BaseModel):
    patient_id: uuid.UUID
    appointment_id: uuid.UUID
    medication_name: str
    dosage: str
    route: str

class MedicationAdministration(MedicationAdministrationCreate):
    id: uuid.UUID
    administered_by: User
    administered_at: datetime
    class Config: from_attributes = True

# --- Accounting Schemas ---
class AccountBase(BaseModel):
    name: str
    type: constr(pattern='^(Asset|Liability|Equity|Revenue|Expense)$')
    normal_balance: constr(pattern='^(Debit|Credit)$')

class AccountCreate(AccountBase): pass
class Account(AccountBase):
    id: int
    clinic_id: uuid.UUID
    class Config: from_attributes = True

class LedgerEntryCreate(BaseModel):
    description: str
    debit_account_id: int
    credit_account_id: int
    amount: Decimal = Field(..., gt=0, max_digits=10, decimal_places=3)
    transaction_date: date = Field(default_factory=date.today)
    invoice_id: uuid.UUID | None = None

class LedgerEntry(BaseModel):
    id: uuid.UUID
    description: str
    debit_account: Account
    credit_account: Account
    amount: Decimal
    transaction_date: date
    created_by: User
    created_at: datetime
    class Config: from_attributes = True

class ExpenseCreate(BaseModel):
    description: str
    amount: Decimal = Field(..., gt=0, max_digits=10, decimal_places=3)
    expense_date: date
    expense_account_id: int
    payment_account_id: int
    vendor_name: str | None = None

class Expense(ExpenseCreate):
    id: uuid.UUID
    recorded_by: User
    created_at: datetime
    class Config: from_attributes = True

# --- Pharmacy Schemas ---
class MedicationBase(BaseModel):
    name: str
    manufacturer: str | None = None
    unit_price: Decimal = Field(..., max_digits=10, decimal_places=3)

class MedicationCreate(MedicationBase):
    stock_quantity: int = 0

class Medication(MedicationBase):
    id: int
    stock_quantity: int
    clinic_id: uuid.UUID
    class Config: from_attributes = True

class PrescriptionItemCreate(BaseModel):
    medication_id: int
    dosage: str
    quantity_prescribed: int
    category: str = 'Regular'

class PrescriptionCreate(BaseModel):
    patient_id: uuid.UUID
    appointment_id: uuid.UUID 
    items: List[PrescriptionItemCreate]
    diagnoses: List[int] 
    procedures: List[int]

class PrescriptionItem(PrescriptionItemCreate):
    id: int
    medication: Medication
    class Config: from_attributes = True

class Prescription(BaseModel):
    id: uuid.UUID
    patient: Patient
    doctor: User
    status: str
    created_at: datetime
    items: List[PrescriptionItem]
    class Config: from_attributes = True

class DispensationItem(BaseModel):
    prescription_item_id: int
    quantity_to_dispense: int

class PharmacySaleCreate(BaseModel):
    patient_id: uuid.UUID
    prescription_id: uuid.UUID
    items_to_dispense: List[DispensationItem]

class Dispensation(BaseModel):
    id: uuid.UUID
    prescription_item: PrescriptionItem
    quantity_dispensed: int
    class Config: from_attributes = True

class PharmacySale(BaseModel):
    id: uuid.UUID
    patient: Patient
    pharmacist: User
    invoice_id: uuid.UUID
    total_amount: Decimal
    sale_at: datetime
    dispensations: List[Dispensation]
    class Config: from_attributes = True

# --- Dhaman / Medical Coding Schemas ---
class ICD10Code(BaseModel):
    id: int
    code: str
    description: str
    class Config: from_attributes = True

class AppointmentDiagnosisCreate(BaseModel):
    appointment_id: uuid.UUID
    patient_id: uuid.UUID
    icd10_code_id: int

class AppointmentDiagnosis(BaseModel):
    id: uuid.UUID
    appointment_id: uuid.UUID
    patient: Patient
    icd10_code: ICD10Code
    doctor: User
    diagnosed_at: datetime
    class Config: from_attributes = True

class CPTCode(BaseModel):
    id: int
    code: str
    description: str
    class Config: from_attributes = True

class AppointmentProcedureCreate(BaseModel):
    appointment_id: uuid.UUID
    patient_id: uuid.UUID
    cpt_code_id: int

class AppointmentProcedure(BaseModel):
    id: uuid.UUID
    appointment_id: uuid.UUID
    patient: Patient
    cpt_code: CPTCode
    doctor: User
    procedure_at: datetime
    class Config: from_attributes = True

# --- Dhaman / Claims & Eligibility Schemas ---
class ClaimCreate(BaseModel):
    invoice_id: uuid.UUID
    patient_id: uuid.UUID

class Claim(BaseModel):
    id: uuid.UUID
    invoice_id: uuid.UUID
    patient: Patient
    dhaman_claim_id: str | None = None
    status: str
    submission_payload: dict | None = None
    response_payload: dict | None = None
    created_by: User
    created_at: datetime
    updated_at: datetime
    class Config: from_attributes = True

class EligibilityCheckCreate(BaseModel):
    patient_id: uuid.UUID

class EligibilityCheck(BaseModel):
    id: uuid.UUID
    patient: Patient
    is_eligible: bool
    policy_number: str | None = None
    coverage_details: dict | None = None
    checked_by: User
    checked_at: datetime
    class Config: from_attributes = True

# --- Patient History Schema ---
class PatientHistory(BaseModel):
    patient_details: Patient
    appointments: List[Appointment]
    vitals: List[Vitals]
    prescriptions: List[Prescription]
    lab_orders: List[LabOrder]
    radiology_orders: List[RadiologyOrder]
    results: List[OrderResult]
    class Config: from_attributes = True

class AppointmentDetailsCreate(BaseModel):
    doctor_id: uuid.UUID
    appointment_time: datetime

class ComprehensiveInvoiceCreate(BaseModel):
    patient_id: uuid.UUID
    items: List[InvoiceItemCreate]
    appointment_details: AppointmentDetailsCreate | None = None
    mark_as_paid: bool = False

class LabDashboardKpis(BaseModel):
    pending: int
    in_progress: int
    completed_today: int
    urgent_stat: int

class LabDashboardData(BaseModel):
    kpi_cards: LabDashboardKpis
    worklist_by_department: dict[str, List[LabOrder]] # This now expects the new structure

    class Config:
        from_attributes = True

class SOAPNoteBase(BaseModel):
    subjective: str | None = None
    objective: str | None = None
    assessment: str | None = None
    plan: str | None = None

class SOAPNoteCreate(SOAPNoteBase):
    appointment_id: uuid.UUID
    patient_id: uuid.UUID

class SOAPNote(SOAPNoteBase):
    id: uuid.UUID
    class Config: from_attributes = True

class EncounterData(BaseModel):
    patient: Patient
    current_soap_note: SOAPNote
    past_notes: List[SOAPNote]

    class Config:
        from_attributes = True

class ReceptionistKpis(BaseModel):
    todays_appointments: int
    new_patients_today: int
    unpaid_invoices: int

class ReceptionistDashboardData(BaseModel):
    kpis: ReceptionistKpis
    recent_unpaid_invoices: List[Invoice] # We can reuse the existing Invoice schema

    class Config:
        from_attributes = True

User.model_rebuild()
Staff.model_rebuild()
