// src/pages/SuperAdminDashboard.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Clinic {
  id: string;
  name: string;
  status: string;
  contact_person: string | null;
  contact_number: string | null;
  moh_license_number: string | null;
}

const SuperAdminDashboard = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/clinics');
      setClinics(response.data);
    } catch (err) {
      setError('Failed to fetch clinics. You may not have superadmin privileges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleUpdateStatus = async (clinicId: string, newStatus: 'Active' | 'Suspended') => {
    try {
      await api.patch(`/api/admin/update-status/${clinicId}`, { status: newStatus });
      fetchClinics(); // Refresh the list
    } catch (err) {
      alert(`Failed to update clinic status.`);
    }
  };

  if (loading) return <div>Loading Super Admin Dashboard...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Platform Clinics</h1>
      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Clinic Name</th>
              <th className="py-3 px-6 text-left">Contact Person</th>
              <th className="py-3 px-6 text-left">MOH License</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {clinics.map((clinic) => (
              <tr key={clinic.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-6 font-medium">{clinic.name}</td>
                <td className="py-3 px-6">{clinic.contact_person || 'N/A'} ({clinic.contact_number || 'N/A'})</td>
                <td className="py-3 px-6">{clinic.moh_license_number || 'N/A'}</td>
                <td className="py-3 px-6">
                  <span className={`py-1 px-3 rounded-full text-xs ${
                    clinic.status === 'Active' ? 'bg-green-200 text-green-600' : 
                    clinic.status === 'Suspended' ? 'bg-red-200 text-red-600' : 'bg-yellow-200 text-yellow-600'
                  }`}>
                    {clinic.status}
                  </span>
                </td>
                <td className="py-3 px-6 text-center">
                  {clinic.status === 'PendingApproval' && (
                    <button onClick={() => handleUpdateStatus(clinic.id, 'Active')} className="bg-green-500 text-white text-xs py-1 px-2 rounded">Approve</button>
                  )}
                  {clinic.status === 'Active' && (
                    <button onClick={() => handleUpdateStatus(clinic.id, 'Suspended')} className="bg-red-500 text-white text-xs py-1 px-2 rounded">Suspend</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default SuperAdminDashboard;
