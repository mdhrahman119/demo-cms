// src/pages/RegisterClinicPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const RegisterClinicPage = () => {
    const [clinicName, setClinicName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [mohLicense, setMohLicense] = useState('');
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const payload = {
                clinic_data: { 
                    name: clinicName,
                    contact_person: contactPerson,
                    contact_number: contactNumber,
                    moh_license_number: mohLicense
                },
                admin_data: { 
                    email, 
                    password 
                }
            };

            await api.post('/api/register-clinic', payload);
            
            setSuccess('Clinic registered successfully! A platform administrator will review your application and approve it shortly.');
            setTimeout(() => navigate('/login'), 5000);

        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Failed to register clinic. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Register a New Clinic</h2>
                <form onSubmit={handleSubmit}>
                    <fieldset className="mb-6 border p-4 rounded">
                        <legend className="text-lg font-semibold px-2">Clinic Details</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                type="text" placeholder="Clinic Name"
                                value={clinicName} onChange={(e) => setClinicName(e.target.value)} required
                            />
                             <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                type="text" placeholder="MOH License Number"
                                value={mohLicense} onChange={(e) => setMohLicense(e.target.value)} required
                            />
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                type="text" placeholder="Contact Person"
                                value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required
                            />
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                type="text" placeholder="Contact Number"
                                value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required
                            />
                        </div>
                    </fieldset>
                    
                     <fieldset className="mb-6 border p-4 rounded">
                        <legend className="text-lg font-semibold px-2">Administrator Account</legend>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                type="email" placeholder="Admin Email Address"
                                value={email} onChange={(e) => setEmail(e.target.value)} required
                            />
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                type="password" placeholder="Admin Password"
                                value={password} onChange={(e) => setPassword(e.target.value)} required
                            />
                        </div>
                    </fieldset>

                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    {success && <p className="text-green-500 text-xs italic mb-4">{success}</p>}
                    
                    <div className="flex items-center justify-between">
                        <button
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
                            type="submit"
                        >
                            Submit Registration for Approval
                        </button>
                    </div>
                    <p className="text-center text-gray-500 text-xs mt-6">
                        Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-700">Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterClinicPage;
