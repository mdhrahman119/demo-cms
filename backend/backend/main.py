# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from . import models
from .routers import (
    auth, patients, admin, billing, appointments, laboratory, 
    radiology, doctor, reception, nursing, accounting, 
    clinical_records, users, claims, medical_coding, directory, pharmacy, dashboards, staff
)

app = FastAPI(
    title="Clinic Management SaaS API",
    description="The API for a multi-tenant clinic management system.",
    version="1.0.0"
)

# --- ADD THIS TEMPORARY CODE BLOCK ---
@app.on_event("startup")
def on_startup():
    """
    This function runs when the application starts.
    It forces SQLAlchemy to create all tables based on the models.
    """
    models.Base.metadata.create_all(bind=engine)
# --- END OF TEMPORARY CODE BLOCK ---


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)
# --- END OF CRITICAL PART ---

# Include all the routers for different roles and modules
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(patients.router)
app.include_router(billing.router)
app.include_router(appointments.router)
app.include_router(doctor.router)
app.include_router(reception.router)
app.include_router(laboratory.router)
app.include_router(radiology.router)
app.include_router(nursing.router)
app.include_router(accounting.router)
app.include_router(pharmacy.router)
app.include_router(clinical_records.router)
app.include_router(users.router)
app.include_router(claims.router)
app.include_router(medical_coding.router)
app.include_router(directory.router)
app.include_router(dashboards.router)
app.include_router(staff.router)


@app.get("/api/health", tags=["Health Check"])
def health_check():
    return {"status": "ok"}
