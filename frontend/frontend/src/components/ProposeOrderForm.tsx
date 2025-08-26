// src/components/ProposeOrderForm.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Test {
  id: number;
  name: string;
}

interface ProposeOrderFormProps {
  patientId: string;
  orderType: 'lab' | 'radiology';
  onOrderProposed: () => void;
  onCancel: () => void;
}

const ProposeOrderForm: React.FC<ProposeOrderFormProps> = ({ patientId, orderType, onOrderProposed, onCancel }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTests = async () => {
      const endpoint = orderType === 'lab' ? '/api/lab/tests' : '/api/radiology/tests';
      try {
        const response = await api.get(endpoint);
        setTests(response.data);
      } catch (err) {
        setError(`Failed to fetch ${orderType} tests.`);
      }
    };
    fetchTests();
  }, [orderType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) {
      setError('Please select a test.');
      return;
    }
    setError('');
    const endpoint = orderType === 'lab' ? '/api/doctor/propose-lab-order' : '/api/doctor/propose-radiology-order';
    try {
      const payload = {
        patient_id: patientId,
        test_id: parseInt(selectedTest),
      };
      await api.post(endpoint, payload);
      onOrderProposed();
    } catch (err) {
      setError(`Failed to propose ${orderType} order.`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Propose New {orderType === 'lab' ? 'Lab' : 'Radiology'} Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Test</label>
            <select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)} required className="shadow border rounded w-full py-2 px-3">
              <option value="">-- Select a Test --</option>
              {tests.map((test) => <option key={test.id} value={test.id}>{test.name}</option>)}
            </select>
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-end space-x-4">
            <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Propose Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposeOrderForm;