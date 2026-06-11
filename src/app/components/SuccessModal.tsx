import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export function SuccessModal({ isOpen, onClose, patientId, patientName }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-md w-full p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Patient Registered Successfully!
          </h2>

          <div className="my-6 p-4 bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Patient ID</p>
            <p className="text-xl font-bold text-blue-600">{patientId}</p>

            <p className="text-sm text-gray-600 mt-4 mb-2">Patient Name</p>
            <p className="text-lg font-semibold text-gray-900">{patientName}</p>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            The patient has been successfully registered to the Yakap System.
          </p>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
