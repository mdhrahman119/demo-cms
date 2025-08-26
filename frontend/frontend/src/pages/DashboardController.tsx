// src/pages/DashboardController.tsx

import React from 'react';
import { useAuthStore } from '../store/authStore';

// Import all the dashboard components
import SuperAdminDashboard from './SuperAdminDashboard';
import ClinicAdminDashboard from './ClinicAdminDashboard';
import DoctorDashboard from './DoctorDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import NurseDashboard from './NurseDashboard';
import LabDashboard from './LabDashboard'; // Make sure this is imported
import RadiologyDashboard from './RadiologyDashboard';
import PharmacyDashboard from './PharmacyDashboard';
import AccountantDashboard from './AccountantDashboard';

const DashboardController = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <div>Loading user information...</div>;
  }

  if (user.is_superadmin) {
    return <SuperAdminDashboard />;
  }

  if (user.role && user.role.name) {
    switch (user.role.name) {
      case 'Admin':
        return <ClinicAdminDashboard />;
      case 'Doctor':
        return <DoctorDashboard />;
      case 'Receptionist':
        return <ReceptionistDashboard />;
      case 'Nurse':
        return <NurseDashboard />;
      // --- THIS IS THE CRITICAL FIX ---
      case 'LabTechnician':
        return <LabDashboard />;
      // ---------------------------------
      case 'Radiologist':
        return <RadiologyDashboard />;
      case 'Pharmacist':
        return <PharmacyDashboard />;
      case 'Accountant':
        return <AccountantDashboard />;
      default:
        return <div>Welcome! Your role does not have a dedicated dashboard yet.</div>;
    }
  }

  return <div>Welcome! Role not recognized.</div>;
};

export default DashboardController;
