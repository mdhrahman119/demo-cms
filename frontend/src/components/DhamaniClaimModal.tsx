// --- src/components/DhamaniClaimModal.tsx ---

import React, { useState } from 'react';
import api from '../services/api';

interface DhamaniClaimModalProps {
    invoiceId: string;
    patientId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const DhamaniClaimModal: React.FC<DhamaniClaimModalProps> = ({ invoiceId, patientId, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // First, create the claim record
            const claimRes = await api.post('/api/claims/', { invoice_id: invoiceId, patient_id: patientId });
            // Then, submit it
            await api.post(`/api/claims/submit/${claimRes.data.id}`);
            onSuccess();
        } catch (error) {
            alert('Failed to submit claim.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Submit Claim to Dhamani</h2>
                <p className="text-gray-600 mb-6">Are you sure you want to submit this invoice for claim processing?</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-500 text-white font-bold py-2 px-4 rounded">
                        {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DhamaniClaimModal;
