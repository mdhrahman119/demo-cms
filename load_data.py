import csv
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from the .env file in the parent directory
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)

# Read the database URL from the environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

def load_csv_to_db(csv_file_path, table_name):
    """
    Reads a CSV file and bulk inserts its data into a specified database table.
    Includes checks to ensure the CSV file is valid and not empty.
    """
    # --- Step 1: Validate the CSV file ---
    if not os.path.exists(csv_file_path):
        print(f"Error: The file '{csv_file_path}' was not found.")
        print("Please make sure you have run the 'convert_xml.py' script successfully first.")
        return

    with open(csv_file_path, 'r', encoding='utf-8') as f:
        # Check if the file has more than just a header
        if len(f.readlines()) <= 1:
            print(f"Error: The CSV file '{csv_file_path}' is empty or contains only a header.")
            print("This likely means the XML conversion failed. Please check your 'convert_xml.py' script and the 'icd102019en.xml' file.")
            return
    
    # --- Step 2: Connect to the database ---
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env file. Please ensure it is set correctly.")
        return

    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        print("Successfully connected to the database.")

        # --- Step 3: Load data ---
        with open(csv_file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data_to_insert = [row for row in reader]

            if not data_to_insert:
                print("CSV file is empty. Nothing to insert.")
                return

            # Use text() for the SQL statement to handle parameters correctly
            insert_statement = text(f"INSERT INTO {table_name} (code, description) VALUES (:code, :description)")
            
            db.execute(insert_statement, data_to_insert)
            db.commit()
            print(f"Successfully loaded {len(data_to_insert)} records into the '{table_name}' table.")

    except Exception as e:
        print(f"An error occurred during database operation: {e}")
    finally:
        if 'db' in locals() and db:
            db.close()

# --- How to use this script ---
if __name__ == "__main__":
    csv_file = 'icd10_codes.csv'  #'cpt_codes.csv'
    table = 'icd10_codes' #'cpt_codes'
    load_csv_to_db(csv_file, table)
