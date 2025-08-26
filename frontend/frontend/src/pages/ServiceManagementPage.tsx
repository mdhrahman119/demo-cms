// src/pages/ServiceManagementPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Service {
  id: number;
  name: string;
  price: number;
  category: string;
}

const ServiceManagementPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the new service form
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');

  const fetchServices = async () => {
    // In a real app, you would fetch a list of services.
    // For now, we'll just show the form.
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { name: serviceName, price: parseFloat(price), category };
      await api.post('/api/billing/services', payload);
      // Clear form and refresh list
      setServiceName('');
      setPrice('');
      setCategory('');
      fetchServices();
    } catch (err) {
      setError('Failed to create service.');
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Service Management</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4">Add New Service</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text" placeholder="Service Name (e.g., Consultation)"
              value={serviceName} onChange={(e) => setServiceName(e.target.value)} required
              className="shadow appearance-none border rounded w-full py-2 px-3"
            />
            <input
              type="number" step="0.001" placeholder="Price (OMR)"
              value={price} onChange={(e) => setPrice(e.target.value)} required
              className="shadow appearance-none border rounded w-full py-2 px-3"
            />
            <input
              type="text" placeholder="Category (e.g., Doctor)"
              value={category} onChange={(e) => setCategory(e.target.value)} required
              className="shadow appearance-none border rounded w-full py-2 px-3"
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          <div className="mt-4">
            <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              + Add Service
            </button>
          </div>
        </form>
      </div>

      {/* A table to list existing services would go here */}
    </div>
  );
};

export default ServiceManagementPage;