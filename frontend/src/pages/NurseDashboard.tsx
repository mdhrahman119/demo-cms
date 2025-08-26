// src/pages/NurseDashboard.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import TriageVitalsForm from '../components/TriageVitalsForm';

interface Appointment {
  id: string;
  appointment_time: string;
  patient: { id: string; first_name: string; last_name: string; mrn: string; };
  doctor: { email: string; };
}

const NurseDashboard = () => {
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State to manage the triage/vitals modal
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/nursing/queue');
      setQueue(response.data);
    } catch (err) {
      setError('Failed to fetch nursing queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSuccess = () => {
    setSelectedAppointment(null); // Close the modal
    fetchQueue(); // Refresh the queue
  };

  if (loading) return <div>Loading Nurse Dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Nurse's Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Patients in Queue</h2>
          <p className="text-3xl font-bold text-blue-500">{queue.length}</p>
        </div>
      </div>

      {/* Modal */}
      {selectedAppointment && (
        <TriageVitalsForm
          patientId={selectedAppointment.patient.id}
          appointmentId={selectedAppointment.id}
          onSuccess={handleSuccess}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
      
      {/* Patient Queue Table */}
      <div className="bg-white shadow-md rounded my-6">
        <h2 className="text-2xl font-semibold p-4">Patient Queue</h2>
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Time</th>
              <th className="py-3 px-6 text-left">Patient (MRN)</th>
              <th className="py-3 px-6 text-left">Doctor</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {queue.map((appt) => (
              <tr key={appt.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-6 text-left">
                  {new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-3 px-6 text-left font-medium">
                  {appt.patient.first_name} {appt.patient.last_name} ({appt.patient.mrn})
                </td>
                <td className="py-3 px-6 text-left">{appt.doctor.email}</td>
                <td className="py-3 px-6 text-center">
                  <button 
                    onClick={() => setSelectedAppointment(appt)}
                    className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                  >
                    Record Triage/Vitals
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

export default NurseDashboard;
