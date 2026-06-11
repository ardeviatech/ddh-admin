import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { type Patient } from '../../store/slices/patientsSlice';

interface PatientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
}

export function PatientSelectionModal({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
}: PatientSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredPatients = patients.filter(
    (patient) =>
      patient.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Select Patient</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by Patient ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredPatients.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No patients found</p>
          ) : (
            <div className="grid gap-3">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.patientId}
                  onClick={() => onSelectPatient(patient)}
                  className="text-left p-4 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {patient.lastName}, {patient.firstName} {patient.middleName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Patient ID: {patient.patientId} • Age: {patient.age} • Gender:{' '}
                        {patient.gender}
                      </p>
                      <p className="text-sm text-gray-500">
                        {patient.street}, {patient.barangay}, {patient.town}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
