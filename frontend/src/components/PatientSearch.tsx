// src/components/PatientSearch.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
}

const PatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // This is a "debouncing" effect. It waits for the user to stop typing
    // for 300ms before it sends the API request.
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length > 1) {
        setIsLoading(true);
        api.get(`/api/patients/search?q=${searchTerm}`)
          .then(response => {
            setResults(response.data);
          })
          .catch(console.error)
          .finally(() => setIsLoading(false));
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectPatient = (patientId: string) => {
    setSearchTerm('');
    setResults([]);
    navigate(`/patient/${patientId}/record`);
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search Patient by Name or MRN..."
        className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {searchTerm.length > 1 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
          {isLoading && <div className="p-2 text-gray-500">Searching...</div>}
          {!isLoading && results.length === 0 && (
            <div className="p-2 text-gray-500">No patients found.</div>
          )}
          {results.map((patient) => (
            <div
              key={patient.id}
              onClick={() => handleSelectPatient(patient.id)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              {patient.first_name} {patient.last_name} ({patient.mrn})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientSearch;