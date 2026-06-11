import { X } from 'lucide-react';
import { type PatientFormData } from '../../schemas/patientSchema';

interface PatientPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientData: PatientFormData;
  isLoading: boolean;
}

export function PatientPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  patientData,
  isLoading,
}: PatientPreviewModalProps) {
  if (!isOpen) return null;

  const calculateAge = (birthdate: Date) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Review Patient Information</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <p className="text-sm text-gray-600 mb-6">
            Please review all the information below before registering the patient.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Patient Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Last Name</p>
                  <p className="font-medium text-gray-900">{patientData.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">First Name</p>
                  <p className="font-medium text-gray-900">{patientData.firstName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Middle Name</p>
                  <p className="font-medium text-gray-900">{patientData.middleName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="font-medium text-gray-900">{patientData.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Birthdate</p>
                  <p className="font-medium text-gray-900">
                    {new Date(patientData.birthdate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="font-medium text-gray-900">
                    {calculateAge(new Date(patientData.birthdate))} years old
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Birth Place</p>
                  <p className="font-medium text-gray-900">{patientData.birthPlace}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Occupation</p>
                  <p className="font-medium text-gray-900">{patientData.occupation}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Civil Status</p>
                  <p className="font-medium text-gray-900">{patientData.civilStatus}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Address Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Street</p>
                  <p className="font-medium text-gray-900">{patientData.street}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Barangay</p>
                  <p className="font-medium text-gray-900">{patientData.barangay}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Town</p>
                  <p className="font-medium text-gray-900">{patientData.town}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Province/City</p>
                  <p className="font-medium text-gray-900">{patientData.provinceCity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Zip Code</p>
                  <p className="font-medium text-gray-900">{patientData.zipCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Country</p>
                  <p className="font-medium text-gray-900">{patientData.country}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Contact Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Mobile Number</p>
                  <p className="font-medium text-gray-900">{patientData.mobileNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{patientData.email}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Other Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Father's Name</p>
                  <p className="font-medium text-gray-900">{patientData.fatherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mother's Name</p>
                  <p className="font-medium text-gray-900">{patientData.motherName || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Registering...' : 'Confirm and Register Patient'}
          </button>
        </div>
      </div>
    </div>
  );
}
