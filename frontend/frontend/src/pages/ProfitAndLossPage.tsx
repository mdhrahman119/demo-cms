// src/pages/ProfitAndLossPage.tsx

import React, { useState } from 'react';
import api from '../services/api';

interface PnlReport {
  start_date: string;
  end_date: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
}

const ProfitAndLossPage = () => {
  const [report, setReport] = useState<PnlReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state for date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const response = await api.get('/api/accounting/reports/profit-and-loss', {
        params: { start_date: startDate, end_date: endDate },
      });
      setReport(response.data);
    } catch (err) {
      setError('Failed to generate report. Please check the date range.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Profit & Loss Statement</h1>

      {/* Date Range Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <form onSubmit={handleGenerateReport} className="flex items-end space-x-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="shadow border rounded w-full py-2 px-3" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="shadow border rounded w-full py-2 px-3" />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </form>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Report Display */}
      {report && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Report for {report.start_date} to {report.end_date}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg">
              <span className="font-semibold text-green-800">Total Revenue</span>
              <span className="font-mono text-lg font-bold text-green-800">{Number(report.total_revenue).toFixed(3)} OMR</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-100 rounded-lg">
              <span className="font-semibold text-red-800">Total Expenses</span>
              <span className="font-mono text-lg font-bold text-red-800">{Number(report.total_expenses).toFixed(3)} OMR</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-200 rounded-lg border-t-2 border-gray-300">
              <span className="font-bold text-xl text-gray-900">Net Profit</span>
              <span className={`font-mono text-xl font-bold ${report.net_profit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {Number(report.net_profit).toFixed(3)} OMR
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitAndLossPage;
