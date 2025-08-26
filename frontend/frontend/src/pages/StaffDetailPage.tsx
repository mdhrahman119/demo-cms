// src/pages/StaffDetailPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import api from '../services/api';

interface StaffFormInputs {
  first_name: string;
  last_name: string;
  designation: string;
  consultation_fee: number | null;
}

interface StaffDetail {
  id: string;
  employee_id: string | null;
  first_name: string;
  last_name: string;
  designation: string | null;
  status: string;
  consultation_fee: number | null;
  user_account: { email: string } | null;
}

const StaffDetailPage = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const { register, handleSubmit, reset } = useForm<StaffFormInputs>();
  const [staffMember, setStaffMember] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch staff details
  const fetchStaffDetails = async () => {
    if (staffId) {
      setLoading(true);
      try {
        const response = await api.get(`/api/staff/${staffId}`);
        setStaffMember(response.data);
        reset({
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          designation: response.data.designation || '',
          consultation_fee: response.data.consultation_fee,
        });
      } catch (err) {
        setError('Failed to fetch staff details.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStaffDetails();
  }, [staffId, reset]);

  // Form submit handler
  const onSubmit: SubmitHandler<StaffFormInputs> = async (data) => {
    if (!staffId) return;
    try {
      await api.put(`/api/staff/${staffId}`, {
        ...data,
        consultation_fee: data.consultation_fee ? Number(data.consultation_fee) : null,
      });
      alert('Staff details updated successfully!');
      fetchStaffDetails();
    } catch (err) {
      alert('Failed to update staff details.');
    }
  };

  // Status update handler
  const handleUpdateStatus = async (newStatus: 'Active' | 'Resigned') => {
    if (!staffId) return;
    try {
      // Replace this with actual backend endpoint
      // await api.patch(`/api/staff/${staffId}/status`, { status: newStatus });
      alert(`Status would be updated to ${newStatus}. Backend endpoint needs implementation.`);
      fetchStaffDetails();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  if (loading) return <div>Loading staff details...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!staffMember) return <div>Staff member not found.</div>;

  return (
    <div className="container mx-auto max-w-2xl space-y-6">
      {/* Staff Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {staffMember.first_name} {staffMember.last_name}
            </h1>
            <p className="text-lg text-gray-600">{staffMember.designation || 'N/A'}</p>
            <p className="text-sm font-mono text-gray-500 mt-1">
              Employee ID: {staffMember.employee_id || 'N/A'}
            </p>
            {staffMember.user_account && (
              <p className="text-sm text-green-700 mt-1">
                User Account: {staffMember.user_account.email}
              </p>
            )}
          </div>
          <span
            className={`py-1 px-3 rounded-full text-xs font-semibold ${
              staffMember.status === 'Active' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
            }`}
          >
            {staffMember.status}
          </span>
        </div>

        {/* Status Actions */}
        <div className="mt-6 border-t pt-4">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex space-x-4">
            {staffMember.status === 'Active' ? (
              <button
                onClick={() => handleUpdateStatus('Resigned')}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Mark as Resigned
              </button>
            ) : (
              <button
                onClick={() => handleUpdateStatus('Active')}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Re-activate Staff
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit Staff Details</h2>
        <div>
          <label className="block text-gray-700">First Name</label>
          <input {...register('first_name', { required: true })} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-gray-700">Last Name</label>
          <input {...register('last_name', { required: true })} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-gray-700">Designation</label>
          <input {...register('designation')} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-gray-700">Consultation Fee (OMR)</label>
          <input
            type="number"
            step="0.001"
            {...register('consultation_fee')}
            className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" className="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default StaffDetailPage;
