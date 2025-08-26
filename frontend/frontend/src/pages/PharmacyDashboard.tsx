// src/pages/PharmacyDashboard.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ProcessSaleModal from '../components/ProcessSaleModal';

interface Prescription {
  id: string;
  created_at: string;
  patient: { id: string; first_name: string; last_name: string; };
  doctor: { email: string; };
  items: {
    id: number;
    medication: { name: string; unit_price: number; };
    quantity_prescribed: number;
  }[];
}

const PharmacyDashboard = () => {
  const [queue, setQueue] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State to manage the sale modal
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/pharmacy/prescriptions/proposed');
      setQueue(response.data);
    } catch (err) {
      setError('Failed to fetch pharmacy queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSaleProcessed = () => {
    setSelectedPrescription(null); // Close the modal
    fetchQueue(); // Refresh the queue
  };

  if (loading) return <div>Loading Pharmacy Dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Pharmacy Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Prescriptions in Queue</h2>
          <p className="text-3xl font-bold text-purple-500">{queue.length}</p>
        </div>
      </div>

      {/* Modal */}
      {selectedPrescription && (
        <ProcessSaleModal
          prescription={selectedPrescription}
          onSaleProcessed={handleSaleProcessed}
          onClose={() => setSelectedPrescription(null)}
        />
      )}
      
      {/* Prescription Queue Table */}
      <div className="bg-white shadow-md rounded my-6">
        <h2 className="text-2xl font-semibold p-4">Pending Prescriptions</h2>
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Date</th>
              <th className="py-3 px-6 text-left">Patient</th>
              <th className="py-3 px-6 text-left">Prescribed By</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {queue.map((prescription) => (
              <tr key={prescription.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-6 text-left">{new Date(prescription.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-6 text-left font-medium">{prescription.patient.first_name} {prescription.patient.last_name}</td>
                <td className="py-3 px-6 text-left">{prescription.doctor.email}</td>
                <td className="py-3 px-6 text-center">
                  <button 
                    onClick={() => setSelectedPrescription(prescription)}
                    className="bg-green-500 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                  >
                    Process Sale
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
