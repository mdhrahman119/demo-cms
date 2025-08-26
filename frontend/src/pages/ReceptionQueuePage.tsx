// src/pages/ReceptionQueuePage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ProcessPaymentModal from '../components/ProcessPaymentModal';
import RejectOrderModal from '../components/RejectOrderModal';

interface ProposedOrder {
  id: string;
  patient: { id: string; first_name: string; last_name: string };
  lab_test?: { name: string; price: number };
  radiology_test?: { name: string; price: number };
}

interface GroupedOrders {
  patient: { id: string; name: string };
  orders: ProposedOrder[];
}

const ReceptionQueuePage = () => {
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for modals
  const [patientForPayment, setPatientForPayment] = useState<GroupedOrders | null>(null);
  const [ordersForRejection, setOrdersForRejection] = useState<ProposedOrder[] | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/reception/queue');
      const allOrders: ProposedOrder[] = [
        ...response.data.lab_orders,
        ...response.data.radiology_orders,
      ];

      const patientMap = new Map<string, GroupedOrders>();
      allOrders.forEach(order => {
        const patientName = `${order.patient.first_name} ${order.patient.last_name}`;
        if (!patientMap.has(patientName)) {
          patientMap.set(patientName, { patient: { id: order.patient.id, name: patientName }, orders: [] });
        }
        patientMap.get(patientName)!.orders.push(order);
      });
      setGroupedOrders(Array.from(patientMap.values()));
    } catch (err) {
      setError('Failed to fetch reception queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSuccess = () => {
    setPatientForPayment(null);
    setOrdersForRejection(null);
    fetchQueue(); // Refresh after payment or rejection
  };

  if (loading) return <div className="p-6">Loading Reception Queue...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reception Queue (Proposed Orders)</h1>

      {/* Payment Modal */}
      {patientForPayment && (
        <ProcessPaymentModal
          patientId={patientForPayment.patient.id}
          patientName={patientForPayment.patient.name}
          proposedOrders={patientForPayment.orders}
          onClose={() => setPatientForPayment(null)}
          onPaymentSuccess={handleSuccess}
        />
      )}

      {/* Reject Modal */}
      {ordersForRejection && (
        <RejectOrderModal
          orders={ordersForRejection}
          onClose={() => setOrdersForRejection(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {groupedOrders.map(({ patient, orders }) => (
          <div key={patient.id} className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-700">{patient.name}</h2>
                <ul className="text-sm text-gray-600 list-disc list-inside mt-2">
                  {orders.map(o => (
                    <li key={o.id}>{o.lab_test?.name || o.radiology_test?.name}</li>
                  ))}
                </ul>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setOrdersForRejection(orders)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Reject
                </button>
                <button
                  onClick={() => setPatientForPayment({ patient, orders })}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Process Payment
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {groupedOrders.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">The proposed orders queue is empty.</p>
        </div>
      )}
    </div>
  );
};

export default ReceptionQueuePage;
