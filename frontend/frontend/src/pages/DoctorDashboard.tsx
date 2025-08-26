// src/pages/DoctorDashboard.tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PatientSearch from '../components/PatientSearch';

// Define a type for the appointment data to ensure type safety
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

const DoctorDashboard = () => {
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

  // Filter the full schedule to get only appointments for the current day
  const todaysAppointments = schedule.filter(appt => {
      const apptDate = new Date(appt.appointment_time).toLocaleDateString();
      const today = new Date().toLocaleDateString();
      return apptDate === today;
  });

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Doctor's Dashboard</h1>
      <PatientSearch />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Today's Appointments</h2>
          <p className="text-3xl font-bold text-blue-500">{todaysAppointments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Pending Lab Results</h2>
          <p className="text-3xl font-bold text-yellow-500">3</p> {/* Placeholder for a future feature */}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Unread Messages</h2>
          <p className="text-3xl font-bold text-red-500">5</p> {/* Placeholder for a future feature */}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white shadow-md rounded my-6">
        <div className="p-4 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Today's Patient Queue</h2>
            <Link to="/my-schedule" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
                View Full Schedule
            </Link>
        </div>
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Time</th>
              <th className="py-3 px-6 text-left">Patient</th>
              <th className="py-3 px-6 text-left">Reason</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {todaysAppointments.length > 0 ? (
              todaysAppointments.map((appt) => (
                <tr key={appt.id} className="border-b hover:bg-gray-100">
                  <td className="py-3 px-6 text-left">
                    {new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-6 text-left font-medium">
                    {appt.patient.first_name} {appt.patient.last_name}
                  </td>
                  <td className="py-3 px-6 text-left">{appt.reason_for_visit}</td>
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
                <td colSpan={4} className="py-3 px-6 text-center">You have no appointments scheduled for today.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorDashboard;
