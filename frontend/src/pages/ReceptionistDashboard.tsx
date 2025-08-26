// src/pages/ReceptionistDashboard.tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaFileInvoiceDollar, FaCalendarPlus } from 'react-icons/fa';
import PatientSearch from '../components/PatientSearch';
import api from '../services/api';

// --- Interfaces for our new, clean dashboard data structure ---
interface Invoice {
  id: string;
  total_amount: string; // Data from JSON is often a string
  patient: {
    first_name: string;
    last_name: string;
  } | null;
}

interface DashboardData {
  kpis: {
    todays_appointments: number;
    new_patients_today: number;
    unpaid_invoices: number;
  };
  recent_unpaid_invoices: Invoice[];
}

const ReceptionistDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // We now make a single, efficient call to our dedicated dashboard endpoint
        const response = await api.get('/api/dashboards/receptionist');
        setData(response.data);
      } catch (err) {
        setError('Failed to load dashboard data. Please check the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading Receptionist Dashboard...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!data) return <div className="p-6">No dashboard data available.</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reception Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-lg font-semibold text-gray-600">Today's Appointments</h2>
            <p className="text-4xl font-bold text-blue-500">{data.kpis.todays_appointments}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-lg font-semibold text-gray-600">New Patients Today</h2>
            <p className="text-4xl font-bold text-green-500">{data.kpis.new_patients_today}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-lg font-semibold text-gray-600">Total Unpaid Invoices</h2>
            <p className="text-4xl font-bold text-yellow-500">{data.kpis.unpaid_invoices}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Actions and Search */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Find a Patient</h2>
            <PatientSearch />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <Link to="/create-invoice" className="bg-green-500 text-white w-full flex items-center justify-center p-4 rounded-lg shadow-md hover:bg-green-600 transition-colors">
                <FaFileInvoiceDollar className="mr-3 text-2xl" />
                <span className="text-lg font-semibold">Create New Invoice</span>
              </Link>
              <Link to="/patients" className="bg-blue-500 text-white w-full flex items-center justify-center p-4 rounded-lg shadow-md hover:bg-blue-600 transition-colors">
                <FaUserPlus className="mr-3 text-2xl" />
                <span className="text-lg font-semibold">Register Patient</span>
              </Link>
              <Link to="/book-appointment" className="bg-purple-500 text-white w-full flex items-center justify-center p-4 rounded-lg shadow-md hover:bg-purple-600 transition-colors">
                <FaCalendarPlus className="mr-3 text-2xl" />
                <span className="text-lg font-semibold">Book Appointment</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Worklist of Unpaid Invoices */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Unpaid Invoices</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 text-left">Patient</th>
                  <th className="py-3 px-4 text-right">Amount (OMR)</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm">
                {data.recent_unpaid_invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-left font-medium">
                      {inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : 'N/A'}
                    </td>
                    {/* THIS IS THE FIX: Convert string to a number before formatting */}
                    <td className="py-3 px-4 text-right font-mono">
                      {Number(inv.total_amount).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.recent_unpaid_invoices.length === 0 && (
              <p className="text-center text-gray-500 py-4">No unpaid invoices found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;