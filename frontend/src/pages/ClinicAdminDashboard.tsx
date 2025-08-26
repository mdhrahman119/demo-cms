// src/pages/ClinicAdminDashboard.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define a type for the complex dashboard data
interface DashboardData {
  kpi_cards: {
    revenue_this_month: number;
    outstanding_payments: number;
    new_patients_this_month: number;
    returning_patients_this_month: number;
    claim_success_rate: number;
  };
  patient_flow: {
    scheduled: number;
    completed: number;
    pending_lab: number;
    pending_pharmacy: number;
  };
  doctor_productivity: {
    doctor: string;
    patient_count: number;
  }[];
  revenue_by_category: {
    name: string;
    value: number;
  }[];
  expiring_licenses: {
    email: string;
    license_expiry_date: string;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const ClinicAdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/api/dashboards/clinic-admin');
        setData(response.data as DashboardData);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading Clinic Admin Dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>No dashboard data available.</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Clinic Command Center</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Revenue (This Month)</h2>
          <p className="text-3xl font-bold text-green-500">
            {(data.kpi_cards.revenue_this_month ?? 0).toFixed(3)} OMR
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Outstanding Payments</h2>
          <p className="text-3xl font-bold text-yellow-500">
            {(data.kpi_cards.outstanding_payments ?? 0).toFixed(3)} OMR
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">New Patients (This Month)</h2>
          <p className="text-3xl font-bold text-blue-500">{data.kpi_cards.new_patients_this_month ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Returning Patients (This Month)</h2>
          <p className="text-3xl font-bold text-cyan-500">{data.kpi_cards.returning_patients_this_month ?? 0}</p>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Breakdown Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Revenue by Category (This Month)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.revenue_by_category}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name} (${(value ?? 0).toFixed(3)})`}
              >
                {data.revenue_by_category.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(3)} OMR`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Doctor Productivity */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Doctor Productivity (Today)</h2>
          {data.doctor_productivity.length > 0 ? (
            <ul className="space-y-2">
              {data.doctor_productivity.map(doc => (
                <li key={doc.doctor} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{doc.doctor}</span>
                  <span className="font-bold bg-gray-200 px-2 py-1 rounded">
                    {doc.patient_count} Patients
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No appointments today.</p>
          )}
        </div>

        {/* Live Patient Flow */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Live Patient Flow (Today)</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <p className="text-2xl font-bold text-blue-800">{data.patient_flow.scheduled ?? 0}</p>
              <p className="text-xs font-semibold text-blue-600">Scheduled</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <p className="text-2xl font-bold text-green-800">{data.patient_flow.completed ?? 0}</p>
              <p className="text-xs font-semibold text-green-600">Completed</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <p className="text-2xl font-bold text-yellow-800">{data.patient_flow.pending_lab ?? 0}</p>
              <p className="text-xs font-semibold text-yellow-600">Pending Lab</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <p className="text-2xl font-bold text-purple-800">{data.patient_flow.pending_pharmacy ?? 0}</p>
              <p className="text-xs font-semibold text-purple-600">Pending Pharmacy</p>
            </div>
          </div>
        </div>

        {/* Compliance Dashboard Widget */}
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Compliance Reminders</h2>
          <h3 className="font-semibold text-gray-700">Staff Licenses Expiring Soon</h3>
          {data.expiring_licenses && data.expiring_licenses.length > 0 ? (
            <ul className="text-sm text-red-500 mt-2 list-disc list-inside">
              {data.expiring_licenses.map(user => (
                <li key={user.email}>
                  <strong>{user.email}</strong> - Expires on{' '}
                  {new Date(user.license_expiry_date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              No licenses are expiring in the next 30 days.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicAdminDashboard;
