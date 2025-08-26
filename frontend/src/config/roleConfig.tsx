// src/config/roleConfig.tsx

import React from 'react';

// Import all the dashboard components
import ClinicAdminDashboard from '../pages/ClinicAdminDashboard';
import DoctorDashboard from '../pages/DoctorDashboard';
import ReceptionistDashboard from '../pages/ReceptionistDashboard';
import LabDashboard from '../pages/LabDashboard';
// Add other dashboard imports here as you create them
// import NurseDashboard from '../pages/NurseDashboard';

// Define the structure for a sidebar link
interface NavLink {
  path: string;
  name: string;
  section: string;
}

// Define the structure for a role's configuration
interface RoleConfig {
  dashboard: React.ComponentType;
  navLinks: NavLink[];
}

// THE CENTRAL ROLE CONFIGURATION "BLUEPRINT"
export const roleConfig: Record<string, RoleConfig> = {
  Admin: {
    dashboard: ClinicAdminDashboard,
    navLinks: [
      { path: '/staff', name: 'Staff Management', section: 'Management' },
      { path: '/users', name: 'Users', section: 'Management' },
      { path: '/services', name: 'Billing Services', section: 'Management' },
      { path: '/tests', name: 'Clinical Tests', section: 'Management' },
      { path: '/inventory', name: 'Inventory', section: 'Management' },
      { path: '/audit-log', name: 'Audit Log', section: 'Management' },
    ],
  },
  Doctor: {
    dashboard: DoctorDashboard,
    navLinks: [
        { path: '/my-schedule', name: 'My Schedule', section: 'Clinical' },
        { path: '/patients', name: 'Search Patients', section: 'Clinical' },
    ],
  },
  Receptionist: {
    dashboard: ReceptionistDashboard,
    navLinks: [
      { path: '/patients', name: 'Patients', section: 'Front Desk' },
      { path: '/reception-queue', name: 'Payment Queue', section: 'Front Desk' },
      { path: '/invoices', name: 'Invoice List', section: 'Front Desk' },
      { path: '/create-invoice', name: 'Create Invoice', section: 'Front Desk' },
      { path: '/book-appointment', name: 'Book Appointment', section: 'Front Desk' },
    ],
  },
  Radiologist: {
    // Assuming you have a RadiologyDashboard component
    dashboard: () => <div>Radiology Dashboard</div>,
    navLinks: [
        { path: '/radiology-dashboard', name: 'Worklist', section: 'Radiology' }
    ]
  },
  LabTechnician: {
    dashboard: LabDashboard, // This correctly sets the main dashboard
    navLinks: [
        // We only need links to OTHER pages here
        { path: '/lab/qc-management', name: 'Quality Control', section: 'Laboratory' },
    ]
  },
  // Add new roles here in the future!
  // e.g., Nurse: { ... }
};