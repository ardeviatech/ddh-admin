import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updatePatient, type Patient } from "../../store/slices/patientsSlice";
import { type PatientFormData } from "../../schemas/patientSchema";
import { calculateAge } from "../../utils/patientValidation";
import { logAction, detectChanges } from "../../utils/auditLogger";
import { updatePatient as updatePatientApi } from "../../services/patientService";
import { toast } from "sonner";
import { X } from "lucide-react";

export function PatientEditPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [updatedPatientInfo, setUpdatedPatientInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(2);

  const patientData = location.state?.patientData as
    | PatientFormData
    | undefined;
  const patientId = location.state?.patientId as string | undefined;

  // Get original patient data to preserve createdAt and validIdName
  const originalPatient = useAppSelector((state) =>
    state.patients.patients.find((p) => p.patientId === patientId),
  );

  // Redirect if no patient data or ID
  useEffect(() => {
    if (!patientData || !patientId) {
      navigate("/patients", { replace: true });
    }
  }, [patientData, patientId, navigate]);

  const handleBack = () => {
    navigate(`/patients/${patientId}/edit`, { state: { patientData } });
  };

  // Early return if no data (will redirect via useEffect)
  if (!patientData || !patientId) {
    return null;
  }

  const handleConfirm = async () => {
    setIsLoading(true);

    // Simulate update delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Convert birthdate to Date object for age calculation
    const birthdateObj =
      patientData.birthdate instanceof Date
        ? patientData.birthdate
        : new Date(patientData.birthdate);

    // Format birthdate as YYYY-MM-DD string
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const userName = user?.name ?? "Unknown User";

    const payload = {
      lastName: patientData.lastName,
      firstName: patientData.firstName,
      middleName: patientData.middleName,
      gender: patientData.gender,
      birthdate: formatDate(birthdateObj),
      birthPlace: patientData.birthPlace,
      occupation: patientData.occupation,
      civilStatus: patientData.civilStatus,
      street: patientData.street,
      barangay: patientData.barangay,
      town: patientData.town,
      provinceCity: patientData.provinceCity,
      zipCode: patientData.zipCode,
      country: patientData.country,
      mobileNumber: patientData.mobileNumber,
      email: patientData.email,
      fatherName: patientData.fatherName,
      motherName: patientData.motherName,
      validIdName: originalPatient?.validIdName,
    };

    let updatedPatient: Patient;

    try {
      updatedPatient = await updatePatientApi(patientId, payload);
      dispatch(updatePatient(updatedPatient));
      queryClient.invalidateQueries({ queryKey: ["patients"], exact: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update patient";
      toast.error("Patient update failed", {
        description: message,
      });
      setIsLoading(false);
      return;
    }

    // Log the changes
    if (originalPatient) {
      const changes = detectChanges(originalPatient, updatedPatient);
      logAction({
        dispatch,
        userId: user?.id || "unknown",
        userName,
        action: "UPDATE",
        module: "PATIENT",
        entityType: "Patient",
        entityId: patientId,
        entityName: `${patientData.firstName} ${patientData.lastName}`,
        details: `Updated patient record for ${patientData.firstName} ${patientData.lastName}`,
        changes,
      });
    }

    setIsLoading(false);
    setUpdatedPatientInfo({
      id: updatedPatient.patientId,
      name: `${updatedPatient.firstName} ${updatedPatient.lastName}`,
    });
    setShowSuccess(true);
    setCountdown(2);
  };

  // Countdown effect for auto-redirect
  useEffect(() => {
    if (showSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          navigate("/patients", { replace: true });
        } else {
          setCountdown(countdown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, countdown, navigate]);

  const handleCloseSuccess = () => {
    navigate("/patients");
  };

  // Helper to safely format birthdate for display (avoiding timezone issues)
  const formatBirthdateForDisplay = (birthdate: Date | string): string => {
    const date = birthdate instanceof Date ? birthdate : new Date(birthdate);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Review Updated Patient Information
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Please review all changes below before saving.
          </p>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Patient Information
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Last Name</p>
                <p className="font-medium text-gray-900">
                  {patientData.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">First Name</p>
                <p className="font-medium text-gray-900">
                  {patientData.firstName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Middle Name</p>
                <p className="font-medium text-gray-900">
                  {patientData.middleName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Gender</p>
                <p className="font-medium text-gray-900">
                  {patientData.gender}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Birthdate</p>
                <p className="font-medium text-gray-900">
                  {formatBirthdateForDisplay(patientData.birthdate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Age</p>
                <p className="font-medium text-gray-900">
                  {calculateAge(
                    patientData.birthdate instanceof Date
                      ? patientData.birthdate
                      : new Date(patientData.birthdate),
                  )}{" "}
                  years old
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Birth Place</p>
                <p className="font-medium text-gray-900">
                  {patientData.birthPlace}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Occupation</p>
                <p className="font-medium text-gray-900">
                  {patientData.occupation}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Civil Status</p>
                <p className="font-medium text-gray-900">
                  {patientData.civilStatus}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Address Information
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Street</p>
                <p className="font-medium text-gray-900">
                  {patientData.street}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Barangay</p>
                <p className="font-medium text-gray-900">
                  {patientData.barangay}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Town</p>
                <p className="font-medium text-gray-900">{patientData.town}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Province/City</p>
                <p className="font-medium text-gray-900">
                  {patientData.provinceCity}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Zip Code</p>
                <p className="font-medium text-gray-900">
                  {patientData.zipCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Country</p>
                <p className="font-medium text-gray-900">
                  {patientData.country}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Contact Information
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Mobile Number</p>
                <p className="font-medium text-gray-900">
                  {patientData.mobileNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{patientData.email}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Other Information
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Father's Name</p>
                <p className="font-medium text-gray-900">
                  {patientData.fatherName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mother's Name</p>
                <p className="font-medium text-gray-900">
                  {patientData.motherName || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving Changes..." : "Confirm and Save Changes"}
          </button>
        </div>
      </div>

      {/* Success Modal Overlay */}
      {showSuccess && updatedPatientInfo && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-6 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm bg-white shadow-lg border border-gray-200 relative animate-slideUp">
            <button
              onClick={handleCloseSuccess}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 text-center">
              {/* Hospital Illustration */}
              <div className="mb-8 flex justify-center">
                <svg width="200" height="140" viewBox="0 0 200 140" fill="none">
                  {/* Hospital Building */}
                  <rect x="40" y="40" width="120" height="90" fill="#3B82F6" />
                  <rect x="45" y="45" width="110" height="80" fill="#60A5FA" />

                  {/* Cross Symbol */}
                  <rect x="85" y="55" width="30" height="10" fill="white" />
                  <rect x="95" y="45" width="10" height="30" fill="white" />

                  {/* Windows */}
                  <rect x="55" y="80" width="15" height="15" fill="#DBEAFE" />
                  <rect x="75" y="80" width="15" height="15" fill="#DBEAFE" />
                  <rect x="110" y="80" width="15" height="15" fill="#DBEAFE" />
                  <rect x="130" y="80" width="15" height="15" fill="#DBEAFE" />

                  <rect x="55" y="100" width="15" height="15" fill="#DBEAFE" />
                  <rect x="75" y="100" width="15" height="15" fill="#DBEAFE" />
                  <rect x="110" y="100" width="15" height="15" fill="#DBEAFE" />
                  <rect x="130" y="100" width="15" height="15" fill="#DBEAFE" />

                  {/* Door */}
                  <rect x="90" y="110" width="20" height="20" fill="#1E40AF" />

                  {/* Trees */}
                  <circle cx="25" cy="110" r="12" fill="#34D399" />
                  <rect x="22" y="110" width="6" height="20" fill="#92400E" />

                  <circle cx="175" cy="110" r="12" fill="#34D399" />
                  <rect x="172" y="110" width="6" height="20" fill="#92400E" />

                  {/* Clouds */}
                  <circle cx="30" cy="20" r="8" fill="#E0F2FE" />
                  <circle cx="40" cy="20" r="10" fill="#E0F2FE" />
                  <circle cx="50" cy="20" r="8" fill="#E0F2FE" />

                  <circle cx="150" cy="15" r="8" fill="#E0F2FE" />
                  <circle cx="160" cy="15" r="10" fill="#E0F2FE" />
                  <circle cx="170" cy="15" r="8" fill="#E0F2FE" />

                  {/* Ambulance */}
                  <rect
                    x="155"
                    y="125"
                    width="30"
                    height="15"
                    fill="#EF4444"
                    rx="2"
                  />
                  <rect
                    x="160"
                    y="120"
                    width="20"
                    height="8"
                    fill="#DC2626"
                    rx="1"
                  />
                  <circle cx="163" cy="140" r="3" fill="#1F2937" />
                  <circle cx="177" cy="140" r="3" fill="#1F2937" />
                  <rect x="168" y="128" width="4" height="4" fill="white" />
                  <rect x="170" y="126" width="2" height="8" fill="white" />
                </svg>
              </div>

              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Patient information updated successfully!
              </h1>

              <p className="text-gray-600 mb-6">
                {updatedPatientInfo.name}'s record (ID:{" "}
                <span className="font-semibold text-blue-600">
                  {updatedPatientInfo.id}
                </span>
                ) has been updated in the Yakap System
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleCloseSuccess}
                  className="w-full px-6 py-3 bg-teal-600 text-white hover:bg-teal-700 transition-colors font-medium"
                >
                  View Patient Records
                </button>
                <button
                  onClick={handleCloseSuccess}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Close ({countdown}s)
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .animate-slideUp {
              animation: slideUp 0.4s ease-out;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
