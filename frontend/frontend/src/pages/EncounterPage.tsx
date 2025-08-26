// src/pages/EncounterPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import ProposeOrderForm from '../components/ProposeOrderForm';
import CreatePrescriptionForm from '../components/CreatePrescriptionForm';

// Define interfaces for the data
interface Patient {
  first_name: string;
  last_name: string;
  mrn: string;
}
interface SOAPNote {
  id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  created_at: string;
}
interface EncounterData {
    patient: Patient;
    current_soap_note: SOAPNote;
    past_notes: SOAPNote[];
}

const EncounterPage = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [encounterData, setEncounterData] = useState<EncounterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { register, handleSubmit, setValue, reset } = useForm<SOAPNote>();

  // State to manage which form modal is open
  const [showProposeForm, setShowProposeForm] = useState<'lab' | 'radiology' | null>(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const fetchEncounterData = async () => {
    if (appointmentId) {
      setLoading(true);
      try {
        const response = await api.get(`/api/doctor/encounter/${appointmentId}`);
        setEncounterData(response.data);
        const currentNote = response.data.current_soap_note;
        // Pre-fill the form with existing data using reset
        reset(currentNote);
      } catch (err) {
        setError('Failed to fetch encounter data.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEncounterData();
  }, [appointmentId, reset]);

  const onSaveNote = async (data: SOAPNote) => {
    if (encounterData?.current_soap_note) {
      try {
        await api.patch(`/api/doctor/soap-note/${encounterData.current_soap_note.id}`, data);
        alert('Note Saved Successfully!');
        // After saving, refresh the data to show the note in the history for the *next* visit
        fetchEncounterData();
      } catch (err) {
        alert('Failed to save note.');
      }
    }
  };

  const handleActionCompleted = () => {
    setShowProposeForm(null);
    setShowPrescriptionForm(false);
    // No need to re-fetch here, as these actions don't modify the SOAP note history
    // The new proposed orders will appear in the receptionist's queue.
  };

  if (loading) return <div>Loading Encounter...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!encounterData) return <div>No encounter data found.</div>;

  return (
    <div className="container mx-auto">
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{encounterData.patient.first_name} {encounterData.patient.last_name}</h1>
        <p className="text-sm text-gray-500 font-mono">MRN: {encounterData.patient.mrn}</p>
      </div>

      {/* Modals for Quick Actions */}
      {showProposeForm && encounterData.patient && (
        <ProposeOrderForm
          patientId={encounterData.patient.id} // This needs patientId from the encounter data
          orderType={showProposeForm}
          onOrderProposed={handleActionCompleted}
          onCancel={() => setShowProposeForm(null)}
        />
      )}
      {showPrescriptionForm && encounterData.patient && (
        <CreatePrescriptionForm
          patientId={encounterData.patient.id} // This needs patientId
          onPrescriptionCreated={handleActionCompleted}
          onCancel={() => setShowPrescriptionForm(false)}
        />
      )}

      {/* Main Encounter Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">SOAP Note (Current Visit)</h2>
          <form onSubmit={handleSubmit(onSaveNote)}>
            <div className="space-y-4">
              <div>
                <label className="font-bold text-gray-700">S</label>ubjective
                <textarea {...register('subjective')} rows={4} className="mt-1 shadow border rounded w-full py-2 px-3" />
              </div>
              <div>
                <label className="font-bold text-gray-700">O</label>bjective
                <textarea {...register('objective')} rows={4} className="mt-1 shadow border rounded w-full py-2 px-3" />
              </div>
              <div>
                <label className="font-bold text-gray-700">A</label>ssessment
                <textarea {...register('assessment')} rows={4} className="mt-1 shadow border rounded w-full py-2 px-3" />
              </div>
              <div>
                <label className="font-bold text-gray-700">P</label>lan
                <textarea {...register('plan')} rows={4} className="mt-1 shadow border rounded w-full py-2 px-3" />
              </div>
            </div>
            <div className="mt-6 text-right">
              <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Save Note
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
            <div className="flex flex-col space-y-2">
              <button onClick={() => setShowProposeForm('lab')} className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-3 rounded">Propose Lab Order</button>
              <button onClick={() => setShowProposeForm('radiology')} className="text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-800 py-2 px-3 rounded">Propose Radiology</button>
              <button onClick={() => setShowPrescriptionForm(true)} className="text-sm bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-3 rounded">Create Prescription</button>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-semibold mb-2">Past Clinical Notes</h3>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {encounterData.past_notes.length > 0 ? (
                encounterData.past_notes.map(note => (
                  <div key={note.id} className="text-xs p-2 border rounded bg-gray-50">
                    <p className="font-bold">{new Date(note.created_at).toLocaleDateString()}</p>
                    <p><strong>S:</strong> {note.subjective || 'N/A'}</p>
                    <p><strong>A:</strong> {note.assessment || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No past notes found for this patient.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncounterPage;
