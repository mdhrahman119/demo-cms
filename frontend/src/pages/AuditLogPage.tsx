// src/pages/AuditLogPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface AuditLog {
  id: number;
  action: string;
  details: any;
  timestamp: string;
  user: {
    email: string;
  };
}

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/api/admin/audit-logs');
        setLogs(response.data);
      } catch (err) {
        setError('Failed to fetch audit logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div>Loading Audit Logs...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Clinic Audit Log</h1>
      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Timestamp</th>
              <th className="py-3 px-6 text-left">User</th>
              <th className="py-3 px-6 text-left">Action</th>
              <th className="py-3 px-6 text-left">Details</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-6 text-left">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="py-3 px-6 text-left">{log.user?.email || 'System'}</td>
                <td className="py-3 px-6 text-left font-medium">{log.action}</td>
                <td className="py-3 px-6 text-left font-mono text-xs">{JSON.stringify(log.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogPage;