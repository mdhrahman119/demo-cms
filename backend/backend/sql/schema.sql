-- Enable UUID generation (if not already done)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for Clinics (Tenants)
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Users (extended roles)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN (
            'Admin', 
            'Doctor', 
            'Nurse', 
            'Receptionist', 
            'Lab Operator', 
            'Radiologist', 
            'Pharmacy',
            'Accountant'
        )
    ),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for future user invitations (extended roles)
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN (
            'Admin', 
            'Doctor', 
            'Nurse', 
            'Receptionist', 
            'Lab Operator', 
            'Radiologist', 
            'Pharmacy',
            'Accountant'
        )
    ),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON user_invitations(token);
