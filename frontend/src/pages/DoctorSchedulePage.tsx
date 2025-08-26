// src/pages/DoctorSchedulePage.tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Define a type for the appointment data
interface Appointment {
  id: string;
  appointment_time: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  reason_for_visit: string;
}

const DoctorSchedulePage = () => {
  const [schedule, setSchedule] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await api.get('/api/appointments/my-schedule');
        setSchedule(response.data);
      } catch (err) {
        setError('Failed to fetch schedule.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  if (loading) return <div>Loading schedule...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Schedule</h1>

      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Time</th>
              <th className="py-3 px-6 text-left">Patient</th>
              <th className="py-3 px-6 text-left">Reason for Visit</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {schedule.length > 0 ? (
              schedule.map((appt) => (
                <tr key={appt.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left">
                    {new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {appt.patient.first_name} {appt.patient.last_name}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {appt.reason_for_visit}
                  </td>
                  <td className="py-3 px-6 text-center">
  <Link 
    to={`/encounter/${appt.id}`}
    className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
  >
    Start Encounter
  </Link>
</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-3 px-6 text-center">You have no scheduled appointments.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorSchedulePage;
