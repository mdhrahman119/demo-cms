// src/components/TriageVitalsForm.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';

interface TriageVitalsFormProps {
  patientId: string;
  appointmentId: string;
  onSuccess: () => void;
  onClose: () => void;
}

const TriageVitalsForm: React.FC<TriageVitalsFormProps> = ({ patientId, appointmentId, onSuccess, onClose }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data: any) => {
    setServerError('');
    try {
      // 1. Create the Triage Record
      const triagePayload = {
        patient_id: patientId,
        appointment_id: appointmentId,
        chief_complaint: data.chief_complaint,
        history_of_present_illness: data.history,
      };
      await api.post('/api/nursing/triage', triagePayload);

      // 2. Create the Vitals Record
      const vitalsPayload = {
        patient_id: patientId,
        appointment_id: appointmentId,
        blood_pressure_systolic: Number(data.bp_sys) || null,
        blood_pressure_diastolic: Number(data.bp_dia) || null,
        heart_rate: Number(data.hr) || null,
        temperature_celsius: Number(data.temp) || null,
        respiratory_rate: Number(data.rr) || null,
        oxygen_saturation: Number(data.o2_sat) || null,
      };
      await api.post('/api/nursing/vitals', vitalsPayload);

      onSuccess();
    } catch (err) {
      setServerError('Failed to save records. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Triage & Vitals</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Chief Complaint</label>
            <input {...register('chief_complaint', { required: true })} className="shadow border rounded w-full py-2 px-3" />
            {errors.chief_complaint && <p className="text-red-500 text-xs mt-1">This field is required.</p>}
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">History of Present Illness</label>
            <textarea {...register('history')} rows={3} className="shadow border rounded w-full py-2 px-3" />
          </div>
          <h3 className="text-xl font-semibold mb-4 border-t pt-4">Vital Signs</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <input type="number" placeholder="BP Systolic" {...register('bp_sys')} className="shadow border rounded w-full py-2 px-3" />
            <input type="number" placeholder="BP Diastolic" {...register('bp_dia')} className="shadow border rounded w-full py-2 px-3" />
            <input type="number" placeholder="Heart Rate (bpm)" {...register('hr')} className="shadow border rounded w-full py-2 px-3" />
            <input type="number" step="0.1" placeholder="Temp (°C)" {...register('temp')} className="shadow border rounded w-full py-2 px-3" />
            <input type="number" placeholder="Resp. Rate" {...register('rr')} className="shadow border rounded w-full py-2 px-3" />
            <input type="number" step="0.1" placeholder="O2 Sat (%)" {...register('o2_sat')} className="shadow border rounded w-full py-2 px-3" />
          </div>
          {serverError && <p className="text-red-500 text-xs mt-4">{serverError}</p>}
          <div className="flex justify-end space-x-4 mt-6">
            <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TriageVitalsForm;
