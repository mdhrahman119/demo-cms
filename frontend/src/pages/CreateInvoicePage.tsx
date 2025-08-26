// src/pages/CreateInvoicePage.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Select from 'react-select';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid'; // for generating cart_item_id

// --- Interfaces ---
interface PatientOption { value: string; label: string; }
interface Service { id: string; name: string; price: number; category: string; }
interface CartItem {
  cart_item_id: string; // Unique ID for this specific item in the cart
  service_id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  proposed_order_id?: string;
}
interface CreatedInvoice { id: string; }
interface ProposedOrder { id: string; lab_test?: Service; radiology_test?: Service; }

const CreateInvoicePage = () => {
  const patientIdFromUrl = new URLSearchParams(useLocation().search).get('patientId');

  const [patients, setPatients] = useState<{ id: string; mrn: string; first_name: string; last_name: string; }[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [proposedOrders, setProposedOrders] = useState<ProposedOrder[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [createdInvoice, setCreatedInvoice] = useState<CreatedInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [discount, setDiscount] = useState('0.000');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- Fetch patients and services ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [patientsRes, servicesRes] = await Promise.all([
          api.get('/api/patients/'),
          api.get('/api/billing/services'),
        ]);
        setPatients(patientsRes.data);
        setServices(servicesRes.data);
      } catch {
        toast.error('Failed to load initial data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const patientOptions: PatientOption[] = useMemo(
    () => patients.map(p => ({ value: p.id, label: `${p.mrn} - ${p.first_name} ${p.last_name}` })),
    [patients]
  );

  useEffect(() => {
    if (patientIdFromUrl && patientOptions.length > 0) {
      const option = patientOptions.find(p => p.value === patientIdFromUrl);
      if (option) setSelectedPatient(option);
    }
  }, [patientIdFromUrl, patientOptions]);

  // --- Fetch proposed orders ---
  useEffect(() => {
    const fetchProposedOrders = async () => {
      if (!selectedPatient) {
        setProposedOrders([]);
        setCart([]);
        return;
      }
      try {
        const res = await api.get(`/api/reception/proposed-orders/${selectedPatient.value}`);
        setProposedOrders([...res.data.lab_orders, ...res.data.radiology_orders]);
        setCart([]);
      } catch {
        console.error('Failed to fetch proposed orders.');
      }
    };
    fetchProposedOrders();
    setCreatedInvoice(null);
  }, [selectedPatient]);

  const serviceCategories = useMemo(() => ['All', ...Array.from(new Set(services.map(s => s.category)))], [services]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
      const matchesSearch = service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, serviceSearchTerm]);

  // --- Cart operations ---
  const addServiceToCart = (service: Service) => {
    setCart(prev => [
      ...prev,
      { ...service, quantity: 1, cart_item_id: `manual-${uuidv4()}` }
    ]);
  };

  const addProposedOrdersToCart = () => {
    const items: CartItem[] = proposedOrders.map(order => {
      const s = order.lab_test || order.radiology_test;
      const service = services.find(serv => serv.name === s?.name);
      if (!service) return null;
      return {
        ...service,
        quantity: 1,
        proposed_order_id: order.id,
        cart_item_id: `proposed-${uuidv4()}`
      };
    }).filter(Boolean) as CartItem[];

    setCart(prev => [...prev, ...items]);
    setProposedOrders([]);
  };

  const removeServiceFromCart = (cartItemId: string) => setCart(prev => prev.filter(item => item.cart_item_id !== cartItemId));

  // --- Create invoice ---
  const handleCreateInvoice = async () => {
    if (!selectedPatient || cart.length === 0) return;

    setCreatedInvoice(null);
    setIsLoading(true);
    try {
      const payload = { 
        patient_id: selectedPatient.value, // UUID string
        items: cart.map(item => ({ service_id: item.id, quantity: item.quantity })), // service_id as UUID string
        proposed_order_ids: cart.map(item => item.proposed_order_id).filter(Boolean) as string[],
        discount: parseFloat(discount || '0').toFixed(3),
      };

      const response = await api.post('/api/billing/invoices', payload);
      setCreatedInvoice(response.data);
      toast.success(`Invoice ${response.data.id} created successfully!`);
      setCart([]);
      setSelectedPatient(null);
      setProposedOrders([]);
      setDiscount('0.000');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create invoice.');
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const totalAmount = useMemo(() => subtotal - parseFloat(discount || '0'), [subtotal, discount]);
  const isButtonDisabled = !selectedPatient || cart.length === 0 || totalAmount < 0 || isLoading;

  if (isLoading && patients.length === 0) return <div>Loading...</div>;

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Service Invoice</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Available Services</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {serviceCategories.map(category => (
                <button key={category} onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-xs rounded-full ${selectedCategory === category ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {category ?? 'Uncategorized'}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Search services..." value={serviceSearchTerm} onChange={e => setServiceSearchTerm(e.target.value)} className="w-full p-2 border rounded mb-4" />
            <div className="space-y-2 max-h-[45vh] overflow-y-auto">
              {filteredServices.map(service => (
                <button key={service.id} onClick={() => addServiceToCart(service)} className="w-full text-left p-2 bg-gray-50 hover:bg-blue-100 rounded">
                  {service.name} - {Number(service.price).toFixed(3)} OMR
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Search and Select Patient</label>
              <Select options={patientOptions} value={selectedPatient} onChange={setSelectedPatient} placeholder="Type to search..." isClearable />
            </div>

            {selectedPatient && proposedOrders.length > 0 && (
              <div className="p-4 border border-yellow-400 bg-yellow-50 rounded-md mb-4">
                <h3 className="font-bold text-yellow-800">Doctor Proposed Orders</h3>
                <ul className="list-disc list-inside mt-2 text-sm">
                  {proposedOrders.map(order => <li key={order.id}>{order.lab_test?.name || order.radiology_test?.name}</li>)}
                </ul>
                <button onClick={addProposedOrdersToCart} className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-sm">Add All to Invoice</button>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Invoice Cart</h3>
              {cart.length === 0 ? <p className="text-gray-500">Cart is empty.</p> :
                cart.map((item) => (
                  <div key={item.cart_item_id} className="flex justify-between items-center mb-2 group">
                    <div>
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-gray-600"> (x{item.quantity})</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-mono mr-4">{(item.price * item.quantity).toFixed(3)} OMR</span>
                        <button onClick={() => removeServiceFromCart(item.cart_item_id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <FaTrash />
                        </button>
                    </div>
                  </div>
                ))
              }
              {cart.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center text-md">
                        <span>Subtotal</span>
                        <span className="font-mono">{subtotal.toFixed(3)} OMR</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">Discount</span>
                        <input 
                            type="number" step="0.001" value={discount}
                            onChange={e => setDiscount(e.target.value)}
                            className="w-28 p-1 border rounded text-right font-mono text-red-500"
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2 font-bold text-lg">
                        <span>Total Amount</span>
                        <span className="font-mono text-blue-600">{totalAmount < 0 ? '0.000' : totalAmount.toFixed(3)} OMR</span>
                    </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button onClick={handleCreateInvoice} className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg" disabled={isButtonDisabled}>
                {isLoading ? 'Processing...' : 'Create Invoice'}
              </button>
            </div>

            {createdInvoice && (
              <div className="mt-6 p-4 bg-green-100 border rounded">
                <h3 className="font-bold">Invoice Created Successfully!</h3>
                <p className="text-sm">Invoice ID: {createdInvoice.id}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateInvoicePage;
