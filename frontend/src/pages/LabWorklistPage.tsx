// src/pages/LabWorklistPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import CollectSampleForm from '../components/CollectSampleForm'; // 1. Import the new form

interface LabOrder {
  id: string;
  created_at: string;
  status: string;
  patient: { first_name: string; last_name: string; };
  lab_test: { name: string; };
}

const LabWorklistPage = () => {
  const [worklist, setWorklist] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. Add state to manage the form modal
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const fetchWorklist = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/lab/worklist');
      setWorklist(response.data);
    } catch (err) {
      setError('Failed to fetch lab worklist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
  }, []);

  const handleSampleCollected = () => {
    setSelectedOrder(null); // Close the form
    fetchWorklist(); // Refresh the worklist
  };

  if (loading) return <div>Loading worklist...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Laboratory Worklist</h1>

      {/* 3. Conditionally render the form modal */}
      {selectedOrder && (
        <CollectSampleForm
          labOrderId={selectedOrder}
          onSampleCollected={handleSampleCollected}
          onCancel={() => setSelectedOrder(null)}
        />
      )}

      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Order Date</th>
              <th className="py-3 px-6 text-left">Patient</th>
              <th className="py-3 px-6 text-left">Test Name</th>
              <th className="py-3 px-6 text-center">Status</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {worklist.length > 0 ? (
              worklist.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {order.patient.first_name} {order.patient.last_name}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {order.lab_test.name}
                  </td>
                   <td className="py-3 px-6 text-center">
                    <span className="bg-yellow-200 text-yellow-600 py-1 px-3 rounded-full text-xs">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    {/* 4. Update the button's onClick handler */}
                    <button 
                      onClick={() => setSelectedOrder(order.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded mr-2"
                    >
                      Collect Sample
                    </button>
                    <button className="bg-green-500 hover:bg-green-700 text-white text-xs py-1 px-2 rounded">
                      Upload Result
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-3 px-6 text-center">The worklist is empty.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabWorklistPage;