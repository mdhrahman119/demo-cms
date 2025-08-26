// src/pages/ChartOfAccountsPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Account {
  id: number;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  normal_balance: 'Debit' | 'Credit';
}

const ChartOfAccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state for creating a new account
  const [name, setName] = useState('');
  const [type, setType] = useState<'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'>('Expense');
  const [normalBalance, setNormalBalance] = useState<'Debit' | 'Credit'>('Debit');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/accounting/accounts');
      setAccounts(response.data);
    } catch (err) {
      setError('Failed to fetch chart of accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { name, type, normal_balance: normalBalance };
      await api.post('/api/accounting/accounts', payload);
      // Clear form and refresh the list
      setName('');
      fetchAccounts();
    } catch (err) {
      setError('Failed to create account. Name might already exist.');
    }
  };

  if (loading) return <div>Loading Chart of Accounts...</div>;
  if (error && accounts.length === 0) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Chart of Accounts</h1>

      {/* Create Account Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4">Add New Account</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <input type="text" placeholder="Account Name" value={name} onChange={(e) => setName(e.target.value)} required className="shadow border rounded w-full py-2 px-3" />
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="shadow border rounded w-full py-2 px-3 bg-white">
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expense</option>
          </select>
          <select value={normalBalance} onChange={(e) => setNormalBalance(e.target.value as any)} className="shadow border rounded w-full py-2 px-3 bg-white">
            <option value="Debit">Debit</option>
            <option value="Credit">Credit</option>
          </select>
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            + Add Account
          </button>
        </form>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Accounts List Table */}
      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="py-3 px-6 text-left">Account Name</th>
              <th className="py-3 px-6 text-left">Type</th>
              <th className="py-3 px-6 text-left">Normal Balance</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {accounts.map((account) => (
              <tr key={account.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-6 text-left font-medium">{account.name}</td>
                <td className="py-3 px-6 text-left">{account.type}</td>
                <td className="py-3 px-6 text-left">{account.normal_balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChartOfAccountsPage;
