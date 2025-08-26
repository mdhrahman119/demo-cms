// src/pages/GeneralLedgerPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface LedgerEntry {
  id: string;
  transaction_date: string;
  description: string;
  debit_account: { name: string };
  credit_account: { name: string };
  amount: number;
}

const GeneralLedgerPage = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const response = await api.get('/api/accounting/ledger');
        setEntries(response.data);
      } catch (err) {
        setError('Failed to fetch general ledger.');
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  if (loading) return <div>Loading General Ledger...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">General Ledger</h1>
      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Date</th>
              <th className="py-3 px-6 text-left">Description</th>
              <th className="py-3 px-6 text-left">Debit Account</th>
              <th className="py-3 px-6 text-left">Credit Account</th>
              <th className="py-3 px-6 text-right">Amount (OMR)</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
  {entries.map((entry) => (
    <tr key={entry.id} className="border-b hover:bg-gray-100">
      <td className="py-3 px-6 text-left">{entry.transaction_date}</td>
      <td className="py-3 px-6 text-left">{entry.description}</td>
      <td className="py-3 px-6 text-left">{entry.debit_account?.name ?? "N/A"}</td>
      <td className="py-3 px-6 text-left">{entry.credit_account?.name ?? "N/A"}</td>
      <td className="py-3 px-6 text-right font-mono">{Number(entry.amount).toFixed(3)}</td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralLedgerPage;