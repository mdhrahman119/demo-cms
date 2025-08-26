// src/components/RejectOrderModal.tsx

import React, { useState } from 'react';
import api from '../services/api';

interface ProposedOrder { id: string; lab_test?: { name: string }; radiology_test?: { name: string }; }
interface RejectOrderModalProps {
  orders: ProposedOrder[];
  onClose: () => void;
  onSuccess: () => void;
}

const RejectOrderModal: React.FC<RejectOrderModalProps> = ({ orders, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('A reason for rejection is mandatory.');
      return;
    }
    setIsProcessing(true);
    try {
      // Create a rejection request for each order
      const rejectionPromises = orders.map(order => 
        api.post(`/api/reception/orders/${order.id}/reject`, { reason })
      );
      await Promise.all(rejectionPromises);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject orders.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Reject Proposed Orders</h2>
        <p className="text-sm text-gray-600 mb-2">You are rejecting the following orders:</p>
        <ul className="list-disc list-inside mb-4 bg-gray-50 p-2 rounded">
            {orders.map(o => <li key={o.id}>{o.lab_test?.name || o.radiology_test?.name}</li>)}
        </ul>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Enter mandatory reason for rejection..."
          className="w-full p-2 border rounded"
          rows={3}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex items-center justify-end space-x-4 mt-6">
          <button onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancel</button>
          <button onClick={handleReject} disabled={isProcessing} className="bg-red-500 text-white font-bold py-2 px-4 rounded disabled:bg-red-300">
            {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectOrderModal;