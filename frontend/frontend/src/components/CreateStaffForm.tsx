// src/components/CreateStaffForm.tsx

import React, { useState } from 'react';
import api from '../services/api';
import { useForm } from 'react-hook-form';

interface CreateStaffFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

const CreateStaffForm: React.FC<CreateStaffFormProps> = ({ onSuccess, onClose }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: any) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      // The payload now includes all the detailed fields
      const payload = {
        ...data,
        salary: parseFloat(data.salary) || null,
      };
      await api.post('/api/staff/', payload);
      onSuccess();
    } catch (err) {
      setServerError('Failed to create staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Add New Staff Member</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          
          <fieldset className="mb-6 border p-4 rounded">
            <legend className="text-lg font-semibold px-2">Personal Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="First Name" {...register('first_name', { required: true })} className="shadow border rounded w-full py-2 px-3" />
              <input type="text" placeholder="Last Name" {...register('last_name', { required: true })} className="shadow border rounded w-full py-2 px-3" />
              <input type="text" placeholder="Guardian's Name" {...register('guardian_name')} className="shadow border rounded w-full py-2 px-3" />
              <input type="date" placeholder="Date of Birth" {...register('date_of_birth')} className="shadow border rounded w-full py-2 px-3" />
              <select {...register('gender')} className="shadow border rounded w-full py-2 px-3 bg-white">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <input type="text" placeholder="Contact Number" {...register('contact_number')} className="shadow border rounded w-full py-2 px-3" />
            </div>
            <div className="mt-4">
                <textarea placeholder="Address" {...register('address')} rows={2} className="shadow border rounded w-full py-2 px-3" />
            </div>
          </fieldset>

          <fieldset className="mb-6 border p-4 rounded">
            <legend className="text-lg font-semibold px-2">Professional Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Designation" {...register('designation', { required: true })} className="shadow border rounded w-full py-2 px-3" />
                <input type="text" placeholder="Education" {...register('education')} className="shadow border rounded w-full py-2 px-3" />
                <input type="text" placeholder="Work Experience" {...register('work_experience')} className="shadow border rounded w-full py-2 px-3" />
                <input type="number" step="0.001" placeholder="Salary (OMR)" {...register('salary')} className="shadow border rounded w-full py-2 px-3" />
                <input type="date" placeholder="Joining Date" {...register('joining_date')} className="shadow border rounded w-full py-2 px-3" />
                <input type="text" placeholder="License Number" {...register('license_number')} className="shadow border rounded w-full py-2 px-3" />
                 <input type="date" placeholder="License Expiry" {...register('license_expiry_date')} className="shadow border rounded w-full py-2 px-3" />
            </div>
          </fieldset>

           <fieldset className="mb-6 border p-4 rounded">
            <legend className="text-lg font-semibold px-2">Documents</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                    <input type="file" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 hover:file:bg-blue-100"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Contract Document</label>
                    <input type="file" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 hover:file:bg-blue-100"/>
                </div>
            </div>
          </fieldset>

          {serverError && <p className="text-red-500 text-xs italic mb-4">{serverError}</p>}
          <div className="flex items-center justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
              {isSubmitting ? 'Saving...' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStaffForm;
