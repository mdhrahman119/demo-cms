# backend/routers/pharmacy.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import csv
import io

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    prefix="/api/pharmacy",
    tags=["Pharmacy Workflow"]
)

# === Inventory Management (for Clinic Admins) ===
@router.post("/medications", response_model=schemas.Medication)
def add_new_medication_to_inventory(
    medication_data: schemas.MedicationCreate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """Adds a new medication to the clinic's inventory/formulary."""
    clinic_id = current_admin.clinic_id
    medication = crud.create_medication(db, medication=medication_data, clinic_id=clinic_id)
    log_action(db, "MEDICATION_ADDED", user_id=current_admin.id, clinic_id=clinic_id, details={"medication_id": medication.id, "name": medication.name})
    return medication

@router.get("/medications", response_model=List[schemas.Medication])
def list_medications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves a list of all medications in the clinic's inventory."""
    clinic_id = current_user.clinic_id
    return crud.get_medications_by_clinic(db, clinic_id=clinic_id)

@router.post("/medications/upload-csv")
async def upload_medications_csv(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(security.get_current_admin_user)
):
    """
    Uploads a CSV file to bulk-add medications to the inventory.
    Requires Clinic Admin privileges.
    """
    clinic_id = current_admin.clinic_id
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")

    contents = await file.read()
    buffer = io.StringIO(contents.decode('utf-8'))
    csv_reader = csv.DictReader(buffer)
    
    medications_to_add = []
    for row in csv_reader:
        medications_to_add.append(
            models.Medication(
                name=row['name'],
                manufacturer=row.get('manufacturer'),
                stock_quantity=int(row['stock_quantity']),
                unit_price=float(row['unit_price']),
                clinic_id=clinic_id
            )
        )
    
    db.add_all(medications_to_add)
    db.commit()
    
    log_action(db, "INVENTORY_BULK_UPLOAD", user_id=current_admin.id, clinic_id=clinic_id, details={"count": len(medications_to_add)})
    return {"message": f"Successfully added {len(medications_to_add)} medications."}

# === Pharmacist Workflow ===
@router.get("/prescriptions/proposed", response_model=List[schemas.Prescription])
def get_proposed_prescriptions_queue(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves the queue of all 'Proposed' prescriptions for the clinic."""
    clinic_id = current_user.clinic_id
    return crud.get_proposed_prescriptions(db, clinic_id=clinic_id)

@router.post("/process-sale", response_model=schemas.PharmacySale)
def process_a_pharmacy_sale(
    sale_data: schemas.PharmacySaleCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Processes a complete pharmacy sale for a patient's prescription."""
    clinic_id = current_user.clinic_id
    pharmacist_id = current_user.id
    
    try:
        sale = crud.process_pharmacy_sale(db, sale_data=sale_data, clinic_id=clinic_id, pharmacist_id=pharmacist_id)
        log_action(db, "PHARMACY_SALE_PROCESSED", user_id=pharmacist_id, clinic_id=clinic_id, details={"sale_id": str(sale.id), "invoice_id": str(sale.invoice_id)})
        return sale
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
