// src/components/CreatePrescriptionForm.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useForm, useFieldArray, Controller } from 'react-hook-form';

// --- Interface Definitions ---
interface Medication { id: number; name: string; }
interface Code { id: number; code: string; description: string; }
interface Vitals {
    blood_pressure_systolic: number;
    blood_pressure_diastolic: number;
    heart_rate: number;
    temperature_celsius: number;
}

const CreatePrescriptionForm = ({ patientId, appointmentId, onSuccess, onClose }) => {
  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      items: [{ medication_id: '', dosage: '', duration: 7, category: 'Regular' }]
    }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [icd10Results, setIcd10Results] = useState<Code[]>([]);
  const [cptResults, setCptResults] = useState<Code[]>([]);
  const [icd10Search, setIcd10Search] = useState('');
  const [cptSearch, setCptSearch] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Code[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<Code[]>([]);
  const [vitals, setVitals] = useState<Vitals | null>(null);

  // Fetch initial data (medications, vitals)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [medsRes, vitalsRes] = await Promise.all([
          api.get('/api/pharmacy/medications'),
          api.get(`/api/nursing/vitals/${appointmentId}`).catch(() => null) // Ignore error if no vitals
        ]);
        setMedications(medsRes.data);
        if (vitalsRes) setVitals(vitalsRes.data);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchInitialData();
  }, [appointmentId]);

  // Debounced search for ICD-10 codes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (icd10Search.length > 2) {
        api.get(`/api/medical-coding/search-icd10/${icd10Search}`).then(res => setIcd10Results(res.data));
      } else {
        setIcd10Results([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [icd10Search]);
  
  // Debounced search for CPT codes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cptSearch.length > 2) {
        api.get(`/api/medical-coding/search-cpt/${cptSearch}`).then(res => setCptResults(res.data));
      } else {
        setCptResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [cptSearch]);

  const addCode = (code: Code, type: 'icd' | 'cpt') => {
    if (type === 'icd') {
      if (!selectedDiagnoses.find(d => d.id === code.id)) setSelectedDiagnoses([...selectedDiagnoses, code]);
      setIcd10Search('');
    } else {
      if (!selectedProcedures.find(p => p.id === code.id)) setSelectedProcedures([...selectedProcedures, code]);
      setCptSearch('');
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      patient_id: patientId,
      appointment_id: appointmentId,
      items: data.items.map(item => ({
        ...item,
        medication_id: Number(item.medication_id),
        quantity_prescribed: Number(item.quantity_prescribed)
      })),
      diagnoses: selectedDiagnoses.map(d => d.id),
      procedures: selectedProcedures.map(p => p.id)
    };
    try {
      await api.post('/api/doctor/create-prescription', payload);
      onSuccess();
    } catch (err) {
      alert('Failed to create prescription.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Clinical Orders & Prescription</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diagnosis & Coding Section */}
            <fieldset className="border p-4 rounded">
              <legend className="text-lg font-semibold px-2">Diagnosis & Procedures</legend>
              <input type="text" placeholder="Search ICD-10 Diagnosis..." value={icd10Search} onChange={e => setIcd10Search(e.target.value)} className="shadow border rounded w-full py-2 px-3 mb-2"/>
              {icd10Results.length > 0 && <ul className="border rounded max-h-24 overflow-y-auto">{icd10Results.map(d => <li key={d.id} onClick={() => addCode(d, 'icd')} className="p-2 hover:bg-gray-100 cursor-pointer text-sm"><strong>{d.code}</strong> - {d.description}</li>)}</ul>}
              <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">{selectedDiagnoses.map(d => <span key={d.id} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">{d.code}</span>)}</div>
              
              <input type="text" placeholder="Search CPT Procedure..." value={cptSearch} onChange={e => setCptSearch(e.target.value)} className="shadow border rounded w-full py-2 px-3 mt-4 mb-2"/>
              {cptResults.length > 0 && <ul className="border rounded max-h-24 overflow-y-auto">{cptResults.map(p => <li key={p.id} onClick={() => addCode(p, 'cpt')} className="p-2 hover:bg-gray-100 cursor-pointer text-sm"><strong>{p.code}</strong> - {p.description}</li>)}</ul>}
              <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">{selectedProcedures.map(p => <span key={p.id} className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">{p.code}</span>)}</div>
            </fieldset>

            {/* Vitals Section */}
            <fieldset className="border p-4 rounded">
              <legend className="text-lg font-semibold px-2">Vital Signs</legend>
              {vitals ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><strong>BP:</strong> {vitals.blood_pressure_systolic}/{vitals.blood_pressure_diastolic} mmHg</p>
                  <p><strong>HR:</strong> {vitals.heart_rate} bpm</p>
                  <p><strong>Temp:</strong> {vitals.temperature_celsius} °C</p>
                </div>
              ) : <p className="text-sm text-gray-500">No vitals recorded by nurse for this visit.</p>}
            </fieldset>
          </div>

          {/* Medication Section */}
          <fieldset className="mt-6 border p-4 rounded">
            <legend className="text-lg font-semibold px-2">Medications</legend>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <select {...register(`items.${index}.medication_id`)} className="col-span-3 shadow border rounded py-2 px-3 bg-white">
                  <option value="">-- Select Medication --</option>
                  {medications.map(med => <option key={med.id} value={med.id}>{med.name}</option>)}
                </select>
                <input type="text" placeholder="Dosage" {...register(`items.${index}.dosage`)} className="col-span-4 shadow border rounded py-2 px-3" />
                <input type="number" placeholder="Duration (days)" {...register(`items.${index}.duration`)} className="col-span-2 shadow border rounded py-2 px-3" />
                <input type="number" placeholder="Qty" {...register(`items.${index}.quantity_prescribed`)} className="col-span-2 shadow border rounded py-2 px-3" />
                <button type="button" onClick={() => remove(index)} className="col-span-1 bg-red-100 text-red-700 py-2 px-2 rounded text-xs">X</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ medication_id: '', dosage: '', duration: 7, category: 'Regular' })} className="text-sm text-blue-500 hover:text-blue-700 mt-2">
              + Add Medication
            </button>
          </fieldset>

          <div className="flex justify-end space-x-4 mt-6 border-t pt-4">
            <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancel</button>
            <button type="submit" className="bg-green-500 text-white font-bold py-2 px-4 rounded">Save Prescription & Orders</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePrescriptionForm;
