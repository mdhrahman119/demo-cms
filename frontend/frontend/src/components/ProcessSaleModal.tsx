// src/components/ProcessSaleModal.tsx

import React, { useState } from 'react';
import api from '../services/api';

interface Prescription {
  id: string;
  patient: { id: string; first_name: string; last_name: string; };
  items: {
    id: number;
    medication: { name: string; unit_price: number; };
    quantity_prescribed: number;
  }[];
}

interface ProcessSaleModalProps {
  prescription: Prescription;
  onSaleProcessed: () => void;
  onClose: () => void;
}

const ProcessSaleModal: React.FC<ProcessSaleModalProps> = ({ prescription, onSaleProcessed, onClose }) => {
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateTotal = () => {
    return prescription.items.reduce((total, item) => {
      return total + (item.medication.unit_price * item.quantity_prescribed);
    }, 0).toFixed(3);
  };

  const handleProcessSale = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const payload = {
        patient_id: prescription.patient.id,
        prescription_id: prescription.id,
        items_to_dispense: prescription.items.map(item => ({
          prescription_item_id: item.id,
          quantity_to_dispense: item.quantity_prescribed,
        })),
      };
      await api.post('/api/pharmacy/process-sale', payload);
      onSaleProcessed();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process sale. Check inventory stock.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-4">Process Sale for {prescription.patient.first_name} {prescription.patient.last_name}</h2>
        <div className="border-t border-b py-4">
          {prescription.items.map(item => (
            <div key={item.id} className="flex justify-between items-center mb-2">
              <span>{item.medication.name} (x{item.quantity_prescribed})</span>
              <span className="font-mono">{(item.medication.unit_price * item.quantity_prescribed).toFixed(3)} OMR</span>
            </div>
          ))}
          <div className="flex justify-between items-center mt-4 font-bold text-lg border-t pt-2">
            <span>Total Amount</span>
            <span className="font-mono">{calculateTotal()} OMR</span>
          </div>
        </div>
        {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
        <div className="flex items-center justify-end space-x-4 mt-6">
          <button onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
            Cancel
          </button>
          <button onClick={handleProcessSale} disabled={isProcessing} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {isProcessing ? 'Processing...' : 'Confirm Sale & Dispense'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessSaleModal;
