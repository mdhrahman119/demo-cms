// src/pages/RadiologyDashboard.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import UploadResultForm from '../components/UploadResultForm'; // Reuses the same result upload form

// Define a type for the radiology order data
interface RadiologyOrder {
  id: string;
  created_at: string;
  status: string;
  patient: { id: string; first_name: string; last_name: string; } | null; // Patient can be null
  radiology_test: { name: string; } | null; // Test can be null
}

const RadiologyDashboard = () => {
  const [worklist, setWorklist] = useState<RadiologyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State to manage the upload result modal
  const [uploadingResultFor, setUploadingResultFor] = useState<RadiologyOrder | null>(null);

  const fetchWorklist = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/radiology/worklist');
      setWorklist(response.data);
    } catch (err) {
      setError('Failed to fetch radiology worklist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
  }, []);

  const handleResultUploaded = () => {
    setUploadingResultFor(null); // Close the modal
    fetchWorklist(); // Refresh the worklist
  };

  if (loading) return <div>Loading Radiology Dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const pendingCount = worklist.filter(o => o.status === 'Pending').length;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Radiology Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Pending Scans</h2>
          <p className="text-3xl font-bold text-indigo-500">{pendingCount}</p>
        </div>
        {/* You can add more KPI cards here, e.g., "Reports Completed Today" */}
      </div>

      {/* Modal for uploading results */}
      {uploadingResultFor && uploadingResultFor.patient && (
        <UploadResultForm
          patientId={uploadingResultFor.patient.id}
          orderId={uploadingResultFor.id}
          orderType="radiology"
          onResultUploaded={handleResultUploaded}
          onCancel={() => setUploadingResultFor(null)}
        />
      )}
      
      {/* Worklist Table */}
      <div className="bg-white shadow-md rounded my-6">
        <h2 className="text-2xl font-semibold p-4">Worklist</h2>
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Patient</th>
              <th className="py-3 px-6 text-left">Scan Name</th>
              <th className="py-3 px-6 text-center">Status</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {worklist.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-6 text-left font-medium">
                  {/* This check prevents the page from crashing */}
                  {order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : 'N/A'}
                </td>
                <td className="py-3 px-6 text-left">{order.radiology_test?.name || 'N/A'}</td>
                <td className="py-3 px-6 text-center">
                  <span className={`py-1 px-3 rounded-full text-xs ${
                      order.status === 'Pending' ? 'bg-yellow-200 text-yellow-600' : 
                      order.status === 'Reported' ? 'bg-green-200 text-green-600' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-3 px-6 text-center">
                  <button 
                    onClick={() => setUploadingResultFor(order)} 
                    className="bg-green-500 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                    disabled={order.status !== 'Pending'}
                  >
                    Upload Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RadiologyDashboard;
