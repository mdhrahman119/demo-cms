// src/pages/TestManagementPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Test {
  id: number;
  name: string;
  price: number;
}

const TestManagementPage = () => {
  const [labTests, setLabTests] = useState<Test[]>([]);
  const [radiologyTests, setRadiologyTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [testType, setTestType] = useState<'lab' | 'radiology'>('lab');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [labRes, radioRes] = await Promise.all([
        api.get('/api/lab/tests'),
        api.get('/api/radiology/tests'),
      ]);
      setLabTests(labRes.data);
      setRadiologyTests(radioRes.data);
    } catch (err) {
      setError('Failed to fetch test lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = testType === 'lab' ? '/api/lab/tests' : '/api/radiology/tests';
    try {
      await api.post(endpoint, { name, price: parseFloat(price) });
      setName('');
      setPrice('');
      fetchData(); // Refresh lists
    } catch (err) {
      setError(`Failed to create ${testType} test.`);
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Test & Service Management</h1>

      {/* Create Test Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4">Add New Test</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <select value={testType} onChange={(e) => setTestType(e.target.value as any)} className="shadow border rounded w-full py-2 px-3 bg-white">
            <option value="lab">Laboratory</option>
            <option value="radiology">Radiology</option>
          </select>
          <input type="text" placeholder="Test Name" value={name} onChange={(e) => setName(e.target.value)} required className="shadow border rounded w-full py-2 px-3" />
          <input type="number" step="0.001" placeholder="Price (OMR)" value={price} onChange={(e) => setPrice(e.target.value)} required className="shadow border rounded w-full py-2 px-3" />
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            + Add Test
          </button>
        </form>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Test Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lab Tests */}
        <div className="bg-white shadow-md rounded">
          <h3 className="text-xl font-semibold p-4 border-b">Laboratory Tests</h3>
          {loading ? <p className="p-4">Loading...</p> : (
            <ul>{labTests.map(t => <li key={t.id} className="p-3 border-b">{t.name} - {t.price} OMR</li>)}</ul>
          )}
        </div>
        {/* Radiology Tests */}
        <div className="bg-white shadow-md rounded">
          <h3 className="text-xl font-semibold p-4 border-b">Radiology Tests</h3>
           {loading ? <p className="p-4">Loading...</p> : (
            <ul>{radiologyTests.map(t => <li key={t.id} className="p-3 border-b">{t.name} - {t.price} OMR</li>)}</ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestManagementPage;
