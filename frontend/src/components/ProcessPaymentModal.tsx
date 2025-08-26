// src/components/ProcessPaymentModal.tsx

import React, { useState } from 'react';
import api from '../services/api';

interface ProposedOrder {
  id: string;
  lab_test?: { name: string; price: number };
  radiology_test?: { name: string; price: number };
}

interface ProcessPaymentModalProps {
  patientId: string;
  patientName: string;
  proposedOrders: ProposedOrder[];
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const ProcessPaymentModal: React.FC<ProcessPaymentModalProps> = ({
  patientId,
  patientName,
  proposedOrders,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set(proposedOrders.map(o => o.id)));
  const [discount, setDiscount] = useState('0.000');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card'>('Cash');

  const handleToggleOrder = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const subtotal = proposedOrders
    .filter(o => selectedOrders.has(o.id))
    .reduce((sum, order) => sum + (order.lab_test?.price || order.radiology_test?.price || 0), 0);

  const totalAmount = subtotal - parseFloat(discount || '0');

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const payload = {
        patient_id: patientId,
        proposed_order_ids: Array.from(selectedOrders),
        payment_mode: paymentMode,
        discount: parseFloat(discount || '0'),
      };
      await api.post('/api/reception/process-payment', payload);
      onPaymentSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Process Payment for {patientName}</h2>

        {/* Orders Selection */}
        <div className="border-t border-b py-4">
          <p className="font-semibold mb-2">Select orders to process:</p>
          {proposedOrders.map(order => (
            <div key={order.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={order.id}
                checked={selectedOrders.has(order.id)}
                onChange={() => handleToggleOrder(order.id)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor={order.id} className="ml-3 flex-grow flex justify-between">
                <span>{order.lab_test?.name || order.radiology_test?.name}</span>
                <span className="font-mono">
                  {(order.lab_test?.price || order.radiology_test?.price || 0).toFixed(3)} OMR
                </span>
              </label>
            </div>
          ))}
        </div>

        {/* Payment Options */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as any)}
              className="shadow border rounded w-full py-2 px-3 bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Discount (OMR)</label>
            <input
              type="number"
              step="0.001"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              className="shadow border rounded w-full py-2 px-3"
            />
          </div>
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t font-bold text-lg flex justify-between">
          <span>Total Amount</span>
          <span className="font-mono">{totalAmount.toFixed(3)} OMR</span>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPayment}
            disabled={isProcessing || selectedOrders.size === 0}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            {isProcessing ? 'Processing...' : 'Confirm Payment & Activate Orders'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessPaymentModal;
