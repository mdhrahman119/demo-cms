// src/pages/BookAppointmentPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Select from 'react-select'; // Using a searchable dropdown for patients
import { useNavigate } from 'react-router-dom';

// --- Interface Definitions ---
interface PatientOption {
  value: string; // Patient ID
  label: string; // "MRN - First Last"
}

// Updated Doctor interface to include full name
interface Doctor {
  id: string;
  email: string;
  staff_member: {
    first_name: string;
    last_name: string;
    consultation_fee: string | null;
  } | null;
}

const BookAppointmentPage = () => {
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [consultationFee, setConsultationFee] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          api.get('/api/patients/'),
          api.get('/api/directory/doctors')
        ]);
        
        const options: PatientOption[] = patientsRes.data.map((p: any) => ({
          value: p.id,
          label: `${p.mrn} - ${p.first_name} ${p.last_name}`
        }));
        setPatientOptions(options);
        setDoctors(doctorsRes.data);
      } catch (err) {
        setError('Failed to load initial data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Effect to update the fee when a doctor is selected
  useEffect(() => {
    if (selectedDoctorId) {
      const doctor = doctors.find(d => d.id === selectedDoctorId);
      const fee = doctor?.staff_member?.consultation_fee;
      setConsultationFee(fee ?? null);
    } else {
      setConsultationFee(null);
    }
  }, [selectedDoctorId, doctors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDoctorId || !appointmentTime) {
        setError("Please fill out all fields.");
        return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const payload = {
        patient_id: selectedPatient.value,
        doctor_id: selectedDoctorId,
        appointment_time: new Date(appointmentTime).toISOString(),
      };
      await api.post('/api/appointments/book', payload);
      setSuccess('Appointment booked successfully! Invoice has been created.');
      
      setTimeout(() => navigate('/invoices'), 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to book appointment.');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading booking information...</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Book Consultation</h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Search and Select Patient</label>
            <Select
                options={patientOptions}
                value={selectedPatient}
                onChange={setSelectedPatient}
                placeholder="Type to search for a patient..."
                isClearable
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Doctor</label>
            <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} required className="shadow border rounded w-full py-2 px-3 bg-white">
              <option value="">-- Select a Doctor --</option>
              {doctors.map((d) => (
                // --- THIS IS THE FIX ---
                // It now displays the name, but falls back to email if the name isn't set.
                <option key={d.id} value={d.id}>
                  {d.staff_member ? `${d.staff_member.first_name} ${d.staff_member.last_name}` : d.email}
                </option>
              ))}
            </select>
          </div>
          
          {consultationFee && (
             <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-gray-700">Consultation Fee: <span className="font-bold text-blue-600">{Number(consultationFee).toFixed(3)} OMR</span></p>
             </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Appointment Time</label>
            <input type="datetime-local" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3" />
          </div>

          {error && <p className="text-red-500 text-sm my-4">{error}</p>}
          {success && <p className="text-green-500 text-sm my-4">{success}</p>}

          <div className="mt-6">
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:bg-gray-400">
              {isSubmitting ? 'Processing...' : 'Book & Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentPage;