// src/components/CreatePatientForm.tsx

import React, { useState } from 'react';
import api from '../services/api';

interface CreatePatientFormProps {
  onPatientCreated: () => void; // A function to call when a patient is successfully created
  onCancel: () => void; // A function to call when the form is cancelled
}

const CreatePatientForm: React.FC<CreatePatientFormProps> = ({ onPatientCreated, onCancel }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        national_id: nationalId,
      };
      await api.post('/api/patients/', payload);
      onPatientCreated(); // Notify the parent component to refresh
    } catch (err) {
      setError('Failed to create patient. Please check the details.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Register New Patient</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text" placeholder="First Name" value={firstName}
              onChange={(e) => setFirstName(e.target.value)} required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
            <input
              type="text" placeholder="Last Name" value={lastName}
              onChange={(e) => setLastName(e.target.value)} required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Date of Birth</label>
            <input
              type="date" placeholder="Date of Birth" value={dob}
              onChange={(e) => setDob(e.target.value)} required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
          <div className="mb-6">
             <input
              type="text" placeholder="National ID" value={nationalId}
              onChange={(e) => setNationalId(e.target.value)} required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button" onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Save Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePatientForm;