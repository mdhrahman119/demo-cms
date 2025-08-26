// src/pages/InvoiceListPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import RecordPaymentModal from '../components/RecordPaymentModal';

interface Invoice {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  patient: {
    mrn: string;
    first_name: string;
    last_name: string;
  } | null;
}

const InvoiceListPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/billing/invoices', {
        params: { search: searchTerm || undefined },
      });
      setInvoices(response.data);
    } catch (err) {
      setError('Failed to fetch invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchInvoices();
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const handlePaymentRecorded = () => {
    setSelectedInvoice(null); // Close the modal
    fetchInvoices(); // Refresh the invoice list
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Invoice List</h1>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Patient Name, MRN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shadow appearance-none border rounded w-full md:w-1/3 py-2 px-3 text-gray-700"
        />
      </div>

      {selectedInvoice && (
        <RecordPaymentModal
          invoiceId={selectedInvoice.id}
          totalAmount={selectedInvoice.total_amount}
          onPaymentRecorded={handlePaymentRecorded}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Date</th>
              <th className="py-3 px-6 text-left">Invoice ID</th>
              <th className="py-3 px-6 text-left">Patient (MRN)</th>
              <th className="py-3 px-6 text-center">Status</th>
              <th className="py-3 px-6 text-right">Amount (OMR)</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-6 text-left">{new Date(invoice.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-6 text-left font-mono text-xs">{invoice.id}</td>
                <td className="py-3 px-6 text-left font-medium">
                  {invoice.patient ? `${invoice.patient.first_name} ${invoice.patient.last_name} (${invoice.patient.mrn || 'N/A'})` : 'Patient Not Found'}
                </td>
                <td className="py-3 px-6 text-center">
                  <span className={`py-1 px-3 rounded-full text-xs ${
                    invoice.status === 'Paid' ? 'bg-green-200 text-green-600' : 'bg-yellow-200 text-yellow-600'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="py-3 px-6 text-right font-mono">{Number(invoice.total_amount).toFixed(3)}</td>
                <td className="py-3 px-6 text-center">
                  {invoice.status === 'Unpaid' && (
                    <button 
                      onClick={() => setSelectedInvoice(invoice)}
                      className="bg-green-500 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                    >
                      Record Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceListPage;
