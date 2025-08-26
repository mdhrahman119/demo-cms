# backend/dhaman_service.py

import os
import uuid
import random
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

DHAMANI_API_URL = os.getenv("DHAMANI_API_URL")
DHAMANI_API_KEY = os.getenv("DHAMANI_API_KEY")

def check_patient_eligibility_api(patient_national_id: str) -> dict:
    """
    Simulates a real-time API call to Dhaman to check a patient's insurance eligibility.
    """
    print(f"--- SIMULATING DHAMAN ELIGIBILITY CHECK FOR: {patient_national_id} ---")
    
    # In a real integration, you would make a secure HTTP request here.
    # For now, we simulate a random response.
    is_eligible = random.choice([True, False])

    if is_eligible:
        return {
            "is_eligible": True,
            "policy_number": f"DMN-{random.randint(100000, 999999)}",
            "coverage_details": {"co_payment": 10, "annual_limit": 5000.00}
        }
    else:
        return {
            "is_eligible": False,
            "policy_number": None,
            "coverage_details": {"reason": "Policy not found or expired."}
        }

def submit_claim_to_dhaman_api(payload: dict) -> dict:
    """
    Simulates submitting a prepared claim payload to Dhaman's API.
    """
    print("--- SIMULATING DHAMAN CLAIM SUBMISSION ---")
    print(f"URL: {DHAMANI_API_URL}")
    print(f"Payload: {payload}")
    
    # In a real integration, you would make a secure POST request here.
    # For now, we simulate a successful response.
    simulated_dhaman_claim_id = f"DHAMAN-CL-{uuid.uuid4()}"
    
    return {"success": True, "dhaman_claim_id": simulated_dhaman_claim_id}
