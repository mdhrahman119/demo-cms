// src/pages/StaffManagementPage.tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CreateStaffForm from '../components/CreateStaffForm';
import CreateUserForStaffForm from '../components/CreateUserForStaffForm';

interface StaffMember {
  id: string;
  employee_id: string | null;
  first_name: string;
  last_name: string;
  designation: string | null;
  status: string;
  user_account: {
    email: string;
  } | null;
}

const StaffManagementPage = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for modals
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/staff/');
      setStaff(response.data);
    } catch (error) {
      setError("Failed to fetch staff list. Please ensure you are logged in as a Clinic Admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSuccess = () => {
    setShowAddStaffForm(false);
    setSelectedStaff(null);
    fetchStaff(); // Refresh the list after any successful action
  };

  if (loading) return <div>Loading staff...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      {/* Header with Add button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
        <button 
          onClick={() => setShowAddStaffForm(true)} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          + Add New Staff Member
        </button>
      </div>
      
      {/* Modals */}
      {showAddStaffForm && (
        <CreateStaffForm 
          onSuccess={handleSuccess} 
          onClose={() => setShowAddStaffForm(false)} 
        />
      )}
      {selectedStaff && (
        <CreateUserForStaffForm
          staffId={selectedStaff.id}
          staffName={`${selectedStaff.first_name} ${selectedStaff.last_name}`}
          onSuccess={handleSuccess}
          onClose={() => setSelectedStaff(null)}
        />
      )}

      {/* Staff Table */}
      <div className="bg-white shadow-md rounded my-6 overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Employee ID</th>
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Designation</th>
              <th className="py-3 px-6 text-center">Status</th>
              <th className="py-3 px-6 text-center">User Account</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {staff.map((member) => (
              <tr key={member.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-6 font-mono">{member.employee_id || 'N/A'}</td>
                <td className="py-3 px-6 font-medium">
                  {member.first_name} {member.last_name}
                </td>
                <td className="py-3 px-6">{member.designation || 'N/A'}</td>
                <td className="py-3 px-6 text-center">
                  <span 
                    className={`py-1 px-3 rounded-full text-xs ${
                      member.status === 'active' 
                        ? 'bg-green-200 text-green-700' 
                        : 'bg-red-200 text-red-700'
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="py-3 px-6 text-center">
                  {member.user_account ? (
                    <span className="bg-green-200 text-green-600 py-1 px-3 rounded-full text-xs">
                      {member.user_account.email}
                    </span>
                  ) : (
                    <button 
                      onClick={() => setSelectedStaff(member)} 
                      className="bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600"
                    >
                      Create User
                    </button>
                  )}
                </td>
                <td className="py-3 px-6 text-center">
                  <Link 
                    to={`/staff/${member.id}`} 
                    className="bg-blue-500 text-white py-1 px-3 rounded text-xs hover:bg-blue-600"
                  >
                    View/Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffManagementPage;
