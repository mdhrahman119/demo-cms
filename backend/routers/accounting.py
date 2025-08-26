# backend/routers/accounting.py

from typing import List, Dict
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas, security, database, models
from ..audit_service import log_action

router = APIRouter(
    # This prefix is now corrected to include /api
    prefix="/api/accounting",
    tags=["Accounting"]
)

# === NEW: Accountant Dashboard Endpoint ===
@router.get("/dashboard", response_model=Dict[str, float])
def get_accountant_dashboard(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Returns monthly dashboard metrics for the accountant.
    """
    if not current_user.clinic_id:
        raise HTTPException(status_code=400, detail="User does not belong to a clinic.")
    
    return crud.get_accounting_dashboard_data(db, clinic_id=current_user.clinic_id)


# === Chart of Accounts Management ===
@router.post("/accounts", response_model=schemas.Account)
def create_chart_of_accounts_entry(
    account: schemas.AccountCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_admin_user)
):
    """Creates a new account in the clinic's Chart of Accounts."""
    clinic_id = current_user.clinic_id
    new_account = crud.create_account(db, account=account, clinic_id=clinic_id)
    log_action(db, "ACCOUNT_CREATED", user_id=current_user.id, clinic_id=clinic_id, details={"account_id": new_account.id, "account_name": new_account.name})
    return new_account

@router.get("/accounts", response_model=List[schemas.Account])
def get_chart_of_accounts(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves the full Chart of Accounts for the clinic."""
    clinic_id = current_user.clinic_id
    return crud.get_accounts_by_clinic(db, clinic_id=clinic_id)

# === Expense Management ===
@router.post("/expenses", response_model=schemas.Expense)
def record_new_expense(
    expense_data: schemas.ExpenseCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Records a new clinic expense and creates the general ledger entry."""
    clinic_id = current_user.clinic_id
    user_id = current_user.id
    try:
        expense_record = crud.create_expense_record(db, expense_data=expense_data, clinic_id=clinic_id, user_id=user_id)
        log_action(db, "EXPENSE_RECORDED", user_id=user_id, clinic_id=clinic_id, details={"expense_id": str(expense_record.id), "amount": float(expense_record.amount)})
        return expense_record
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# === General Ledger ===
@router.get("/ledger", response_model=List[schemas.LedgerEntry])
def get_general_ledger(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Retrieves all entries from the general ledger for the clinic."""
    clinic_id = current_user.clinic_id
    return crud.get_ledger_entries(db, clinic_id=clinic_id)
