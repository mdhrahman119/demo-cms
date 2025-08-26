# create_superadmin.py

import os
import sys
from pathlib import Path
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from dotenv import load_dotenv

# --- This is a crucial step to make the script find your backend modules ---
# Add the project root to the Python path
project_root = Path(__file__).resolve().parent
sys.path.append(str(project_root))
# -------------------------------------------------------------------------

# Now you can import from your backend
from backend import models, schemas, security

# --- Configuration ---
# Load environment variables from the .env file
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Define your new Super Admin credentials here
SUPERADMIN_EMAIL = "superadmin@ainah.net"
SUPERADMIN_PASSWORD = "SuperAdminPassword123!"

def create_superadmin():
    """
    Connects to the database and creates a Super Admin user.
    """
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in your .env file.")
        return

    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        print("Successfully connected to the database.")

        # 1. Check if the user already exists
        existing_user = db.query(models.User).filter(models.User.email == SUPERADMIN_EMAIL).first()
        if existing_user:
            print(f"User '{SUPERADMIN_EMAIL}' already exists. Aborting.")
            return

        # 2. Get the 'Admin' role ID
        admin_role = db.query(models.Role).filter(models.Role.name == 'Admin').first()
        if not admin_role:
            print("Error: 'Admin' role not found in the database. Please run the initial setup first.")
            return

        # 3. Create the new Super Admin user
        hashed_password = security.get_password_hash(SUPERADMIN_PASSWORD)
        
        new_superadmin = models.User(
            email=SUPERADMIN_EMAIL,
            hashed_password=hashed_password,
            role_id=admin_role.id,
            is_active=True,
            is_superadmin=True,
            clinic_id=None # Superadmins do not belong to a clinic
        )
        
        db.add(new_superadmin)
        db.commit()
        
        print(f"Successfully created Super Admin user: {SUPERADMIN_EMAIL}")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    create_superadmin()
