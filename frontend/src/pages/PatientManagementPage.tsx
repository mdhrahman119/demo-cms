// src/pages/PatientManagementPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import CreatePatientForm from '../components/CreatePatientForm';

interface Patient {
  id: string;
  mrn: string; // Added MRN
  first_name: string;
  last_name: string;
  date_of_birth: string;
  national_id: string;
}

const PatientManagementPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/patients/');
      setPatients(response.data);
    } catch (err) {
      setError('Failed to fetch patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handlePatientCreated = () => {
    setShowCreateForm(false);
    fetchPatients();
  };

  if (loading) return <div>Loading patients...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Patient Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          + Add New Patient
        </button>
      </div>

      {showCreateForm && (
        <CreatePatientForm
          onPatientCreated={handlePatientCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">MRN</th>
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Date of Birth</th>
              <th className="py-3 px-6 text-center">National ID</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {patients.length > 0 ? (
              patients.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left font-mono">{patient.mrn}</td>
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {patient.first_name} {patient.last_name}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {patient.date_of_birth}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {patient.national_id}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-3 px-6 text-center">No patients found. Click 'Add New Patient' to begin.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientManagementPage;
