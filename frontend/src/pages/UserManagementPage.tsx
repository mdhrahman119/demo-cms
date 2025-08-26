// src/pages/UserManagementPage.tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  staff_member: {
    id: string;
    employee_id: string;
  } | null;
  role: { name: string };
}

interface Role {
  id: number;
  name: string;
}

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/api/users/'),
        api.get('/api/directory/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);

      if (rolesRes.data.length > 0 && !selectedRole) {
        setSelectedRole(rolesRes.data[0].name);
      }
    } catch (err) {
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { email, password, role: selectedRole };
      await api.post('/api/users/', payload);
      // Clear form
      setEmail('');
      setPassword('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user.');
    }
  };

  if (loading) return <div>Loading user accounts...</div>;
  if (error && users.length === 0) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">User Accounts</h1>

      {/* --- Info Alert --- */}
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
        <p className="font-bold">Information</p>
        <p>
          New user accounts should be created from the <strong>Staff Management</strong> page. 
          First, add a staff member, then create a user account for them.
        </p>
        <Link
          to="/staff"
          className="text-blue-600 hover:text-blue-800 font-bold underline mt-2 inline-block"
        >
          Go to Staff Management
        </Link>
      </div>

      {/* Create User Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4">Add New User</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              placeholder="User Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="shadow border rounded w-full py-2 px-3"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="shadow border rounded w-full py-2 px-3"
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
              className="shadow border rounded w-full py-2 px-3 bg-white"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          <div className="mt-4">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              + Add User
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Employee ID</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Role</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-6 text-left font-mono">
                  {user.staff_member ? (
                    <Link
                      to={`/staff/${user.staff_member.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {user.staff_member.employee_id}
                    </Link>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="py-3 px-6 text-left">{user.email}</td>
                <td className="py-3 px-6 text-left">{user.role.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage;
