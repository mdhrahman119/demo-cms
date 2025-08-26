// src/components/UploadResultForm.tsx

import React, { useState } from 'react';
import api from '../services/api';

interface UploadResultFormProps {
  patientId: string;
  orderId: string;
  orderType: 'lab' | 'radiology';
  onResultUploaded: () => void;
  onCancel: () => void;
}

const UploadResultForm: React.FC<UploadResultFormProps> = ({ patientId, orderId, orderType, onResultUploaded, onCancel }) => {
  const [reportNotes, setReportNotes] = useState('');
  const [resultData, setResultData] = useState(''); // For structured JSON data
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // FormData is required to send both JSON data and a file in the same request.
    const formData = new FormData();
    
    const resultPayload = {
      patient_id: patientId,
      report_notes: reportNotes,
      // Conditionally add the correct order ID based on the department
      ...(orderType === 'lab' ? { lab_order_id: orderId } : { radiology_order_id: orderId }),
      // Add structured data if the user provided valid JSON
      ...(resultData && { result_data: JSON.parse(resultData) })
    };
    
    // We send the main data as a JSON string
    formData.append('result_data_json', JSON.stringify(resultPayload));

    // If a file was selected, we append it to the form data
    if (selectedFile) {
      formData.append('report_file', selectedFile);
    }

    try {
      const endpoint = orderType === 'lab' ? '/api/lab/upload-result' : '/api/radiology/upload-report';
      await api.post(endpoint, formData, {
        headers: {
          // This header is essential for file uploads
          'Content-Type': 'multipart/form-data',
        },
      });
      onResultUploaded();
    } catch (err) {
      setError(`Failed to upload ${orderType} result. Please check the data and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Upload {orderType === 'lab' ? 'Lab' : 'Radiology'} Result</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Structured Results (JSON format)</label>
            <textarea
              rows={4}
              placeholder='e.g., {"WBC": "7.5", "RBC": "4.8"}'
              value={resultData}
              onChange={(e) => setResultData(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 font-mono text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Report Notes / Summary</label>
            <textarea
              rows={4}
              placeholder="Enter any summary or interpretation notes here..."
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3"
            />
          </div>
           <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Upload PDF Report (Optional)</label>
            <input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 hover:file:bg-blue-100"/>
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-end space-x-4">
            <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
              {isSubmitting ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadResultForm;
