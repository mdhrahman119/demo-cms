// src/pages/PharmacyQueuePage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Prescription {
  id: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
  };
  doctor: {
    email: string;
  };
  items: {
      medication: { name: string };
      quantity_prescribed: number;
  }[];
}

const PharmacyQueuePage = () => {
  const [queue, setQueue] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await api.get('/api/pharmacy/prescriptions/proposed');
        setQueue(response.data);
      } catch (err) {
        setError('Failed to fetch pharmacy queue.');
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  if (loading) return <div>Loading pharmacy queue...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Pharmacy Queue (Proposed Prescriptions)</h1>

      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Date</th>
              <th className="py-3 px-6 text-left">Patient</th>
              <th className="py-3 px-6 text-left">Doctor</th>
              <th className="py-3 px-6 text-left">Medications</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {queue.length > 0 ? (
              queue.map((prescription) => (
                <tr key={prescription.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left">
                    {new Date(prescription.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {prescription.patient.first_name} {prescription.patient.last_name}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {prescription.doctor.email}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {prescription.items.map(item => `${item.medication.name} (x${item.quantity_prescribed})`).join(', ')}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <button className="bg-green-500 hover:bg-green-700 text-white text-xs py-1 px-2 rounded">
                      Process Sale
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-3 px-6 text-center">There are no proposed prescriptions.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyQueuePage;