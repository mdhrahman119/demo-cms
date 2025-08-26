// src/pages/InventoryManagementPage.tsx

import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Medication {
  id: number;
  name: string;
  manufacturer: string | null;
  stock_quantity: number;
  unit_price: number;
}

const InventoryManagementPage = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newStock, setNewStock] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [addError, setAddError] = useState('');

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/pharmacy/medications');
      setMedications(response.data);
    } catch (err) {
      setError('Failed to fetch medication inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select a file first.');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/api/pharmacy/medications/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMessage(response.data.message);
      fetchMedications(); // Refresh list
    } catch (error) {
      setUploadMessage('Error uploading file. Please check the file format.');
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    try {
      const payload = {
        name: newName,
        manufacturer: newManufacturer,
        stock_quantity: newStock,
        unit_price: newPrice,
      };
      await api.post('/api/pharmacy/medications', payload);
      setShowAddForm(false);
      setNewName('');
      setNewManufacturer('');
      setNewStock(0);
      setNewPrice(0);
      fetchMedications();
    } catch (err) {
      setAddError('Failed to add medication.');
    }
  };

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Inventory Management</h1>

      {/* Bulk Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4">Bulk Upload Inventory (CSV)</h2>
        <p className="text-sm text-gray-600 mb-2">CSV must have columns: name, manufacturer, stock_quantity, unit_price</p>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                       file:rounded-full file:border-0 file:text-sm file:font-semibold 
                       file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={handleUpload}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Upload
          </button>
        </div>
        {uploadMessage && <p className="mt-4 text-sm font-semibold">{uploadMessage}</p>}
      </div>

      {/* Add Single Medication Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Add Single Medication</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {showAddForm ? 'Cancel' : '+ Add One'}
          </button>
        </div>
        {showAddForm && (
          <form onSubmit={handleAddMedication} className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Medication Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="shadow border rounded w-full py-2 px-3"
              />
              <input
                type="text"
                placeholder="Manufacturer"
                value={newManufacturer}
                onChange={(e) => setNewManufacturer(e.target.value)}
                className="shadow border rounded w-full py-2 px-3"
              />
              <input
                type="number"
                placeholder="Stock Quantity"
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                required
                className="shadow border rounded w-full py-2 px-3"
              />
              <input
                type="number"
                step="0.001"
                placeholder="Unit Price (OMR)"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                required
                className="shadow border rounded w-full py-2 px-3"
              />
            </div>
            {addError && <p className="text-red-500 text-xs mt-2">{addError}</p>}
            <div className="mt-4">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Save Medication
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow-md rounded my-6">
        <h2 className="text-2xl font-semibold p-4">Current Stock</h2>
        {loading ? (
          <p className="p-4">Loading inventory...</p>
        ) : (
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Medication Name</th>
                <th className="py-3 px-6 text-left">Manufacturer</th>
                <th className="py-3 px-6 text-center">Stock Quantity</th>
                <th className="py-3 px-6 text-right">Unit Price (OMR)</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {medications.map((med) => (
                <tr key={med.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{med.name}</td>
                  <td className="py-3 px-6 text-left">{med.manufacturer}</td>
                  <td className="py-3 px-6 text-center">{med.stock_quantity}</td>
                  <td className="py-3 px-6 text-right">{Number(med.unit_price).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InventoryManagementPage;
