# In backend/audit_service.py

import uuid
from sqlalchemy.orm import Session
from . import models
from fastapi import Request

def log_action(
    db: Session,
    action: str,
    user_id: uuid.UUID | None = None,
    clinic_id: uuid.UUID | None = None,
    details: dict | None = None,
    request: Request | None = None
):

    if request:
        # If the request object is provided, get the client's IP address
        ip_address = request.client.host
        if details:
            details['ip_address'] = ip_address
        else:
            details = {'ip_address': ip_address}
    """
    Creates and saves a new audit log entry.
    This is a central function for all audit logging.
    """
    db_log = models.AuditLog(
        user_id=user_id,
        clinic_id=clinic_id,
        action=action,
        details=details
    )
    db.add(db_log)
    db.commit()