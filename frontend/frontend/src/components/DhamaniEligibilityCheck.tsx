// src/components/DhamaniEligibilityCheck.tsx

import React, { useState } from 'react';
import api from '../services/api';

interface EligibilityResult {
    is_eligible: boolean;
    policy_number: string | null;
    coverage_details: any;
}

const DhamaniEligibilityCheck = () => {
    const [patientId, setPatientId] = useState('');
    const [result, setResult] = useState<EligibilityResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCheck = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const response = await api.post('/api/reception/check-eligibility', { patient_id: patientId });
            setResult(response.data);
        } catch (error) {
            alert('Failed to check eligibility.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Dhamani Eligibility Check</h3>
            <div className="flex items-center space-x-2">
                <input 
                    type="text" 
                    placeholder="Enter Patient National ID" 
                    className="shadow border rounded w-full py-2 px-3"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                />
                <button onClick={handleCheck} disabled={isLoading} className="bg-blue-500 text-white font-bold py-2 px-4 rounded">
                    {isLoading ? 'Checking...' : 'Check'}
                </button>
            </div>
            {result && (
                <div className={`mt-4 p-4 rounded text-sm ${result.is_eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <p><strong>Status:</strong> {result.is_eligible ? 'Eligible' : 'Not Eligible'}</p>
                    {result.policy_number && <p><strong>Policy No:</strong> {result.policy_number}</p>}
                </div>
            )}
        </div>
    );
};

export default DhamaniEligibilityCheck;