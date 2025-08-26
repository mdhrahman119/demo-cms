// src/components/CreateUserForStaffForm.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Role {
  id: number;
  name: string;
}

interface CreateUserForStaffFormProps {
  staffId: string;
  staffName: string;
  onSuccess: () => void;
  onClose: () => void;
}

const CreateUserForStaffForm: React.FC<CreateUserForStaffFormProps> = ({ staffId, staffName, onSuccess, onClose }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/api/directory/roles');
        setRoles(response.data);
        if (response.data.length > 0) {
          setSelectedRole(response.data[0].name);
        }
      } catch (err) {
        setError('Failed to load roles.');
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = { staff_id: staffId, email, password, role: selectedRole };
      await api.post('/api/staff/create-user', payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Create User Account</h2>
        <p className="text-gray-600 mb-6">for {staffName}</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
            <input type="email" placeholder="User Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="shadow border rounded w-full py-2 px-3" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="shadow border rounded w-full py-2 px-3" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Assign Role</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} required className="shadow border rounded w-full py-2 px-3 bg-white">
              {roles.map(role => <option key={role.id} value={role.name}>{role.name}</option>)}
            </select>
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserForStaffForm;
