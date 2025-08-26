# backend/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve the database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("No DATABASE_URL environment variable set")

# Create the SQLAlchemy engine
# The pool_pre_ping argument will test connections for liveness before handing them out.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Each instance of the SessionLocal class will be a database session.
# The class itself is not a database session yet.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# We will inherit from this class to create each of the ORM models.
Base = declarative_base()

# Dependency to get a database session
def get_db():
    """
    Provides a database session to a dependency.
    Ensures the session is closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
