// src/components/RecordPaymentModal.tsx

import React, { useState } from 'react';
import api from '../services/api';

interface RecordPaymentModalProps {
  invoiceId: string;
  totalAmount: number;
  onPaymentRecorded: () => void;
  onClose: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ invoiceId, totalAmount, onPaymentRecorded, onClose }) => {
  const [amountPaid, setAmountPaid] = useState(totalAmount.toString());
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card'>('Cash');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // For loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true); // Start loading

    try {
      // Ensure amountPaid is a valid number before sending
      const paidAmount = parseFloat(amountPaid);
      if (isNaN(paidAmount) || paidAmount <= 0) {
        setError('Please enter a valid, positive amount.');
        setIsProcessing(false);
        return;
      }

      const payload = {
        invoice_id: invoiceId,
        amount_paid: paidAmount,
        payment_mode: paymentMode,
      };

      await api.post('/api/billing/payments', payload);
      onPaymentRecorded(); // Notify the parent to refresh
    } catch (err: any) {
      // Show the specific error from the server
      setError(err.response?.data?.detail || 'Failed to record payment.');
    } finally {
      setIsProcessing(false); // Stop loading
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Record Payment</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Amount Paid (OMR)</label>
            <input
              type="number"
              step="0.001"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="shadow border rounded w-full py-2 px-3 bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm my-4">{error}</p>}
          <div className="flex items-center justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;