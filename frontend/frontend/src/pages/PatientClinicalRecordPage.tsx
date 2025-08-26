// src/pages/PatientClinicalRecordPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ProposeOrderForm from '../components/ProposeOrderForm';
import CreatePrescriptionForm from '../components/CreatePrescriptionForm';

// Define more specific types for the history data
interface PatientDetails {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  national_id: string;
  contact_number: string;
  mrn: string; // This line fixes the error
}

interface PatientHistory {
  patient_details: PatientDetails;
  appointments: any[];
  vitals: any[];
  prescriptions: any[];
  lab_orders: any[];
  radiology_orders: any[];
  results: any[];
}

const PatientClinicalRecordPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showProposeForm, setShowProposeForm] = useState<'lab' | 'radiology' | null>(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const fetchHistory = async () => {
    if (patientId) {
      setLoading(true);
      try {
        const response = await api.get(`/api/clinical-records/patient/${patientId}`);
        setHistory(response.data);
      } catch (err) {
        setError('Failed to fetch patient history.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const handleActionCompleted = () => {
    setShowProposeForm(null);
    setShowPrescriptionForm(false);
    fetchHistory(); // Refresh the history to show the new data
  };

  if (loading) return <div>Loading patient record...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!history) return <div>No patient data found.</div>;

  return (
    <div className="container mx-auto">
      {/* Patient Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {history.patient_details.first_name} {history.patient_details.last_name}
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mt-2">
          <span><strong>MRN:</strong> {history.patient_details.mrn}</span>
          <span><strong>DOB:</strong> {history.patient_details.date_of_birth}</span>
          <span><strong>National ID:</strong> {history.patient_details.national_id}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {/* <div className="mb-6 flex flex-wrap gap-4">
        <button onClick={() => setShowProposeForm('lab')} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          + Propose Lab Order
        </button>
        <button onClick={() => setShowProposeForm('radiology')} className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
          + Propose Radiology Order
        </button>
        <button onClick={() => setShowPrescriptionForm(true)} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          + Create Prescription
        </button>
      </div> */}

      {/* Form Modals */}
      {showProposeForm && patientId && (
        <ProposeOrderForm
          patientId={patientId}
          orderType={showProposeForm}
          onOrderProposed={handleActionCompleted}
          onCancel={() => setShowProposeForm(null)}
        />
      )}
      {showPrescriptionForm && patientId && (
        <CreatePrescriptionForm
          patientId={patientId}
          onPrescriptionCreated={handleActionCompleted}
          onCancel={() => setShowPrescriptionForm(false)}
        />
      )}
      
      {/* Clinical History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {/* Appointments */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Appointments</h2>
              {history.appointments.length > 0 ? (
                <ul>{history.appointments.map((appt: any) => <li key={appt.id} className="text-sm border-b py-1">{new Date(appt.appointment_time).toLocaleString()} - {appt.reason_for_visit}</li>)}</ul>
              ) : <p className="text-sm text-gray-500">No appointment history.</p>}
            </div>
            {/* Prescriptions */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Prescriptions</h2>
              {history.prescriptions.length > 0 ? (
                <ul>{history.prescriptions.map((presc: any) => <li key={presc.id} className="text-sm border-b py-1">Prescription from {new Date(presc.created_at).toLocaleDateString()} - Status: {presc.status}</li>)}</ul>
              ) : <p className="text-sm text-gray-500">No prescription history.</p>}
            </div>
        </div>
        <div className="lg:col-span-1 space-y-6">
            {/* Lab Orders */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Lab Orders</h2>
              {history.lab_orders.length > 0 ? (
                <ul>{history.lab_orders.map((order: any) => <li key={order.id} className="text-sm border-b py-1">{new Date(order.created_at).toLocaleDateString()} - Status: {order.status}</li>)}</ul>
              ) : <p className="text-sm text-gray-500">No lab order history.</p>}
            </div>
            {/* Radiology Orders */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Radiology Orders</h2>
              {history.radiology_orders.length > 0 ? (
                <ul>{history.radiology_orders.map((order: any) => <li key={order.id} className="text-sm border-b py-1">{new Date(order.created_at).toLocaleDateString()} - Status: {order.status}</li>)}</ul>
              ) : <p className="text-sm text-gray-500">No radiology order history.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PatientClinicalRecordPage;
