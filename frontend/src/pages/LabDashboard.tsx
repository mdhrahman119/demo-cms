// src/pages/LabDashboard.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import CollectSampleForm from '../components/CollectSampleForm';
// We would create other modals like UploadResultForm, RejectSampleForm, etc.

// --- TypeScript Interfaces for our new data structure ---
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface LabTest {
  name: string;
  department: string;
}

interface LabOrder {
  id: string;
  created_at: string;
  status: string;
  priority: 'STAT' | 'Urgent' | 'Normal';
  patient: Patient | null;
  lab_test: LabTest | null;
}

interface DashboardData {
  kpi_cards: {
    pending: number;
    in_progress: number;
    completed_today: number;
    urgent_stat: number;
  };
  worklist_by_department: Record<string, LabOrder[]>;
}

// --- Helper Functions ---
const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'STAT': return 'bg-red-500 border-red-700 text-white';
    case 'Urgent': return 'bg-yellow-500 border-yellow-700 text-white';
    default: return 'bg-gray-200 border-gray-400 text-gray-800';
  }
};

// --- The Main Component ---
const LabDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('');
  const [collectingSampleFor, setCollectingSampleFor] = useState<string | null>(null);
  // Add state for other modals, e.g., setUploadingResultFor

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/lab/dashboard');
      setData(response.data);
      // Automatically set the first department as the active tab
      if (response.data?.worklist_by_department) {
        const firstDept = Object.keys(response.data.worklist_by_department)[0];
        setActiveTab(firstDept || '');
      }
    } catch (err) {
      setError('Failed to fetch lab dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleActionSuccess = () => {
    setCollectingSampleFor(null);
    fetchDashboardData(); // Refresh all data after an action
  };

  if (loading) return <div className="p-6">Loading Laboratory Dashboard...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  
  // --- ROBUSTNESS FIX ---
  // Use optional chaining (?.) and default empty objects/arrays to prevent crashes
  const kpis = data?.kpi_cards;
  const departments = Object.keys(data?.worklist_by_department || {});
  const currentWorklist = data?.worklist_by_department?.[activeTab] || [];
  // --------------------

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Laboratory Control Panel</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Pending Samples</h2>
          <p className="text-4xl font-bold text-blue-500">{kpis?.pending ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">In Progress</h2>
          <p className="text-4xl font-bold text-yellow-500">{kpis?.in_progress ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Completed Today</h2>
          <p className="text-4xl font-bold text-green-500">{kpis?.completed_today ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-red-500">
          <h2 className="text-lg font-semibold text-red-600">Urgent / STAT</h2>
          <p className="text-4xl font-bold text-red-600">{kpis?.urgent_stat ?? 0}</p>
        </div>
      </div>

      {/* Modals for actions */}
      {collectingSampleFor && (
        <CollectSampleForm
          labOrderId={collectingSampleFor}
          onSampleCollected={handleActionSuccess}
          onCancel={() => setCollectingSampleFor(null)}
        />
      )}
      
      {/* Worklist with Department Tabs */}
      <div className="bg-white shadow-md rounded-lg my-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 px-4" aria-label="Tabs">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveTab(dept)}
                className={`${
                  activeTab === dept
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none`}
              >
                {dept} ({data?.worklist_by_department[dept]?.length || 0})
              </button>
            ))}
          </nav>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="py-3 px-4 text-left">Priority</th>
                <th className="py-3 px-4 text-left">Patient</th>
                <th className="py-3 px-4 text-left">Test Name</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {currentWorklist.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-left">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getPriorityClass(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-left font-medium">
                    {order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-left">{order.lab_test?.name || 'N/A'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="py-1 px-3 rounded-full text-xs bg-gray-100 text-gray-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center space-x-2">
                    <button onClick={() => setCollectingSampleFor(order.id)} className="text-blue-600 hover:text-blue-900 text-xs">Collect</button>
                    <button className="text-green-600 hover:text-green-900 text-xs">Enter Result</button>
                    <button className="text-red-600 hover:text-red-900 text-xs">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentWorklist.length === 0 && (
          <div className="p-6 text-gray-500 text-center">Worklist for {activeTab} is empty.</div>
        )}
      </div>
    </div>
  );
};

export default LabDashboard;