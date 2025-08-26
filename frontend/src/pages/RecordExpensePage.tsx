// src/pages/RecordExpensePage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Account {
  id: number;
  name: string;
  type: string;
}

const RecordExpensePage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/api/accounting/accounts');
        setAccounts(response.data);
      } catch (err) {
        setError('Failed to fetch accounts.');
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        description,
        amount: parseFloat(amount),
        expense_date: expenseDate,
        expense_account_id: parseInt(expenseAccountId),
        payment_account_id: parseInt(paymentAccountId),
      };
      await api.post('/api/accounting/expenses', payload);
      setSuccess('Expense recorded successfully!');
      // Clear form
      setDescription('');
      setAmount('');
    } catch (err) {
      setError('Failed to record expense. Please check all fields.');
    }
  };

  const expenseAccounts = accounts.filter(acc => acc.type === 'Expense');
  const assetAccounts = accounts.filter(acc => acc.type === 'Asset');

  if (loading) return <div>Loading accounts...</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Record Clinic Expense</h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="shadow border rounded w-full py-2 px-3" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Amount (OMR)</label>
              <input type="number" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} required className="shadow border rounded w-full py-2 px-3" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Expense Date</label>
              <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required className="shadow border rounded w-full py-2 px-3" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Expense Account (Debit)</label>
              <select value={expenseAccountId} onChange={(e) => setExpenseAccountId(e.target.value)} required className="shadow border rounded w-full py-2 px-3 bg-white">
                <option value="">-- Select Expense Account --</option>
                {expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Payment Account (Credit)</label>
              <select value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value)} required className="shadow border rounded w-full py-2 px-3 bg-white">
                <option value="">-- Select Asset Account --</option>
                {assetAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
          {success && <p className="text-green-500 text-xs mt-4">{success}</p>}
          <div className="mt-6">
            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Record Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordExpensePage;
