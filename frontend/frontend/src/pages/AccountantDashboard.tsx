// src/pages/AccountantDashboard.tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface DashboardData {
  monthly_revenue: number;
  monthly_expenses: number;
  net_profit_month: number;
  accounts_receivable: number;
  monthly_cash_flow: number; // Added new field
}

const AccountantDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/api/accounting/dashboard');
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading Accountant Dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Accountant Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Revenue (This Month)</h2>
          <p className="text-3xl font-bold text-green-500">{data?.monthly_revenue.toFixed(3)} OMR</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Expenses (This Month)</h2>
          <p className="text-3xl font-bold text-red-500">{data?.monthly_expenses.toFixed(3)} OMR</p>
        </div>
        {/* --- NEW CASH FLOW CARD --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Cash Flow (This Month)</h2>
          <p className={`text-3xl font-bold ${data && data.monthly_cash_flow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {data?.monthly_cash_flow.toFixed(3)} OMR
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Accounts Receivable</h2>
          <p className="text-3xl font-bold text-yellow-500">{data?.accounts_receivable.toFixed(3)} OMR</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions & Reports</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/chart-of-accounts" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
            Manage Chart of Accounts
          </Link>
          <Link to="/record-expense" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
            Record an Expense
          </Link>
          <Link to="/general-ledger" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
            View General Ledger
          </Link>
          <Link to="/reports/profit-and-loss" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Generate P&L Report
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
