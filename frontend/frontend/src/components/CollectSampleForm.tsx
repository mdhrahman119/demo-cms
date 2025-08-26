// src/components/CollectSampleForm.tsx

import React, { useState } from 'react';
import api from '../services/api';

interface CollectSampleFormProps {
  labOrderId: string;
  onSampleCollected: () => void;
  onCancel: () => void;
}

const CollectSampleForm: React.FC<CollectSampleFormProps> = ({ labOrderId, onSampleCollected, onCancel }) => {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        lab_order_id: labOrderId,
        sample_barcode: barcode,
      };
      await api.post('/api/lab/collect-sample', payload);
      onSampleCollected(); // Notify the parent to refresh
    } catch (err) {
      setError('Failed to record sample collection.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6">Collect Sample</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Sample Barcode</label>
            <input
              type="text"
              placeholder="Scan or enter barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectSampleForm;