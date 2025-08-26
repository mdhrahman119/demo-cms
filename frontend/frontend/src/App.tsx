// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterClinicPage from './pages/RegisterClinicPage';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardController from './pages/DashboardController';
import PatientManagementPage from './pages/PatientManagementPage';
import ServiceManagementPage from './pages/ServiceManagementPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import DoctorSchedulePage from './pages/DoctorSchedulePage';
import PatientClinicalRecordPage from './pages/PatientClinicalRecordPage';
import PharmacyQueuePage from './pages/PharmacyQueuePage';
import InventoryManagementPage from './pages/InventoryManagementPage';
import LabWorklistPage from './pages/LabWorklistPage';
import StaffManagementPage from './pages/StaffManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import ReceptionQueuePage from './pages/ReceptionQueuePage';
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import RecordExpensePage from './pages/RecordExpensePage';
import GeneralLedgerPage from './pages/GeneralLedgerPage';
import ProfitAndLossPage from './pages/ProfitAndLossPage';
import AuditLogPage from './pages/AuditLogPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TestManagementPage from './pages/TestManagementPage';
import InvoiceListPage from './pages/InvoiceListPage';
import RadiologyDashboard from './pages/RadiologyDashboard';
import StaffDetailPage from './pages/StaffDetailPage';
import EncounterPage from './pages/EncounterPage';
import LabDashboard from './pages/LabDashboard';
import QualityControlPage from './pages/QualityControlPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-clinic" element={<RegisterClinicPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Main Dashboard Router */}
            <Route path="/" element={<DashboardController />} />
            
            {/* All Module Pages */}
            <Route path="/patients" element={<PatientManagementPage />} />
            <Route path="/services" element={<ServiceManagementPage />} />
            <Route path="/create-invoice" element={<CreateInvoicePage />} />
            <Route path="/book-appointment" element={<BookAppointmentPage />} />
            <Route path="/my-schedule" element={<DoctorSchedulePage />} />
            <Route path="/patient/:patientId/record" element={<PatientClinicalRecordPage />} />
            <Route path="/pharmacy-queue" element={<PharmacyQueuePage />} />
            <Route path="/inventory" element={<InventoryManagementPage />} />
            <Route path="/lab-worklist" element={<LabWorklistPage />} />
            <Route path="/staff" element={<StaffManagementPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/reception-queue" element={<ReceptionQueuePage />} />
            <Route path="/chart-of-accounts" element={<ChartOfAccountsPage />} />
            <Route path="/record-expense" element={<RecordExpensePage />} />
            <Route path="/general-ledger" element={<GeneralLedgerPage />} />
            <Route path="/reports/profit-and-loss" element={<ProfitAndLossPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/superadmin" element={<SuperAdminDashboard />} />
            <Route path="/tests" element={<TestManagementPage />} />
            <Route path="/invoices" element={<InvoiceListPage />} />
            <Route path="/radiology-dashboard" element={<RadiologyDashboard />} />
            <Route path="/staff/:staffId" element={<StaffDetailPage />} />
            <Route path="/encounter/:appointmentId" element={<EncounterPage />} />
            <Route path="/lab/dashboard" element={<LabDashboard />} />
            <Route path="/lab/qc-management" element={<QualityControlPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
