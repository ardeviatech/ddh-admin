import {
  useState,
  useEffect,
  type JSXElementConstructor,
  type Key,
  type ReactElement,
  type ReactNode,
  type ReactPortal,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setFPERecords } from "../../store/slices/fpeSlice";
import { fetchFPEs } from "../../services/fpeService";
import { Header } from "../components/Header";
import { SkeletonDetail } from "../components/loading/SkeletonDetail";
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Calendar,
  FileText,
  Edit,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";

export function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const patient = useAppSelector((state) =>
    state.patients.patients.find(
      (p: { patientId: string | undefined }) => p.patientId === patientId,
    ),
  );
  const fpeRecords = useAppSelector((state) => state.fpe.fpeRecords);

  const [showConsultationModal, setShowConsultationModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Fetch FPE records for this patient
  useEffect(() => {
    const loadFPERecords = async () => {
      if (!patientId) return;
      try {
        const response = await fetchFPEs({ patientId });
        dispatch(setFPERecords(response.data));
      } catch (error) {
        console.error("Failed to load FPE records:", error);
      }
    };
    loadFPERecords();
  }, [patientId, dispatch]);

  const currentYear = new Date().getFullYear();

  // Get FPE records for this patient
  const patientFPEs = fpeRecords.filter(
    (fpe: { patientId: string | undefined }) => fpe.patientId === patientId,
  );

  // Get current year FPE
  const currentYearFPE = patientFPEs.find(
    (fpe: { year: number; status: string }) =>
      fpe.year === currentYear && fpe.status === "Completed",
  );
  const draftFPE = patientFPEs.find(
    (fpe: { year: number; status: string }) =>
      fpe.year === currentYear && fpe.status === "Draft",
  );

  // Get previous year FPE
  const previousYearFPE = patientFPEs.find(
    (fpe: { year: number; status: string }) =>
      fpe.year === currentYear - 1 && fpe.status === "Completed",
  );

  // Sort FPE history by year descending
  const fpeHistory = patientFPEs
    .filter((fpe: { status: string }) => fpe.status === "Completed")
    .sort((a: { year: number }, b: { year: number }) => b.year - a.year);

  const handleStartConsultation = () => {
    if (!currentYearFPE) {
      setShowConsultationModal(true);
    } else {
      // Navigate to consultation (placeholder for now)
      alert("Proceeding to consultation...");
    }
  };

  const handleStartFPE = () => {
    sessionStorage.removeItem("fpeFormData");
    navigate("/fpe/new/0", { state: { patientId: patient?.patientId } });
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Patient Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              The patient you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/patients")}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to Patient List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Patient Details"
        subtitle={`Patient ID: ${patient.patientId}`}
      />

      <div className="p-4 md:p-8">
        {isLoading ? (
          <SkeletonDetail />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
              <button
                onClick={() => navigate("/patients")}
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Patient List</span>
              </button>

              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <button
                  onClick={handleStartConsultation}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  <FileText size={20} />
                  <span className="hidden sm:inline">Start Consultation</span>
                  <span className="sm:hidden">Consult</span>
                </button>
                <button
                  onClick={() =>
                    navigate(`/patients/${patient.patientId}/edit`)
                  }
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Edit size={20} />
                  <span className="hidden sm:inline">Edit Patient</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Patient Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="p-3 bg-blue-50 text-blue-600">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Patient Information
                      </h3>
                      <p className="text-sm text-gray-500">
                        Personal details and identification
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Patient ID</p>
                      <p className="font-medium text-gray-900">
                        {patient.patientId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Last Name</p>
                      <p className="font-medium text-gray-900">
                        {patient.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">First Name</p>
                      <p className="font-medium text-gray-900">
                        {patient.firstName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Middle Name</p>
                      <p className="font-medium text-gray-900">
                        {patient.middleName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Gender</p>
                      <p className="font-medium text-gray-900">
                        {patient.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Birthdate</p>
                      <p className="font-medium text-gray-900">
                        {new Date(patient.birthdate).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Age</p>
                      <p className="font-medium text-gray-900">
                        {patient.age} years old
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Birth Place</p>
                      <p className="font-medium text-gray-900">
                        {patient.birthPlace}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Occupation</p>
                      <p className="font-medium text-gray-900">
                        {patient.occupation}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Civil Status</p>
                      <p className="font-medium text-gray-900">
                        {patient.civilStatus}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="p-3 bg-green-50 text-green-600">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Address Information
                      </h3>
                      <p className="text-sm text-gray-500">
                        Residential address details
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Street</p>
                      <p className="font-medium text-gray-900">
                        {patient.street}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Barangay</p>
                      <p className="font-medium text-gray-900">
                        {patient.barangay}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Town</p>
                      <p className="font-medium text-gray-900">
                        {patient.town}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Province/City
                      </p>
                      <p className="font-medium text-gray-900">
                        {patient.provinceCity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Zip Code</p>
                      <p className="font-medium text-gray-900">
                        {patient.zipCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Country</p>
                      <p className="font-medium text-gray-900">
                        {patient.country}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="p-3 bg-purple-50 text-purple-600">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Contact Information
                      </h3>
                      <p className="text-sm text-gray-500">
                        Phone and email details
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Mobile Number
                      </p>
                      <p className="font-medium text-gray-900">
                        {patient.mobileNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Email Address
                      </p>
                      <p className="font-medium text-gray-900">
                        {patient.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="p-3 bg-orange-50 text-orange-600">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Other Information
                      </h3>
                      <p className="text-sm text-gray-500">
                        Additional patient details
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Father's Name
                      </p>
                      <p className="font-medium text-gray-900">
                        {patient.fatherName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Mother's Name
                      </p>
                      <p className="font-medium text-gray-900">
                        {patient.motherName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Valid ID</p>
                      <p className="font-medium text-gray-900">
                        {patient.validIdName || "Not uploaded"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="p-3 bg-gray-50 text-gray-600">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Record Information
                      </h3>
                      <p className="text-sm text-gray-500">
                        Registration and update history
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Date Registered
                      </p>
                      <p className="font-medium text-gray-900">
                        {new Date(patient.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                      <p className="font-medium text-gray-900">
                        {new Date(patient.updatedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - FPE Status Panel */}
              <div className="col-span-1 space-y-6">
                {/* FPE Status Card */}
                <div className="bg-white border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    FPE Status
                  </h3>

                  {/* Valid FPE */}
                  {currentYearFPE && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-50">
                          <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium">
                              FPE Completed ({currentYear})
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            Valid for current year
                          </p>
                          <div className="space-y-2">
                            <button
                              onClick={() =>
                                navigate(`/fpe/${currentYearFPE.caseNumber}`)
                              }
                              className="w-full px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors"
                            >
                              View FPE
                            </button>
                            <button
                              onClick={handleStartFPE}
                              className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                            >
                              Start New FPE
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Draft FPE */}
                  {draftFPE && !currentYearFPE && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50">
                          <Clock className="text-blue-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
                              Draft FPE ({currentYear})
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            In progress
                          </p>
                          <button
                            onClick={() => navigate(`/fpe/new/0`)}
                            className="w-full px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                          >
                            Continue FPE
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Outdated FPE */}
                  {!currentYearFPE && !draftFPE && previousYearFPE && (
                    <div className="space-y-4">
                      <div
                        className="border border-yellow-200 p-4 relative bg-cover bg-center overflow-hidden"
                        style={{
                          backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDDH%20Yakap%2FCheck%20this.jpg?alt=media&token=fc787d13-8674-4386-8b1f-f517af49e433')`,
                        }}
                      >
                        {/* Yellow overlay for readability */}
                        <div className="absolute inset-0 bg-yellow-50/90 backdrop-blur-sm"></div>

                        {/* Content */}
                        <div className="relative z-10">
                          <div className="flex items-start gap-3">
                            <AlertTriangle
                              className="text-yellow-600"
                              size={20}
                            />
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                FPE Expired
                              </h4>
                              <p className="text-xs text-gray-700 mb-3">
                                Last FPE was completed in {previousYearFPE.year}
                              </p>
                              <div className="space-y-2">
                                <button
                                  onClick={handleStartFPE}
                                  className="w-full px-4 py-2 bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition-colors"
                                >
                                  Renew FPE
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/fpe/${previousYearFPE.caseNumber}`,
                                    )
                                  }
                                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                                >
                                  View Previous FPE
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No FPE */}
                  {!currentYearFPE && !draftFPE && !previousYearFPE && (
                    <div className="space-y-4">
                      <div
                        className="border border-red-200 p-4 relative bg-cover bg-center overflow-hidden"
                        style={{
                          backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDDH%20Yakap%2FCheck%20this.jpg?alt=media&token=fc787d13-8674-4386-8b1f-f517af49e433')`,
                        }}
                      >
                        {/* Red overlay for readability */}
                        <div className="absolute inset-0 bg-red-50/90 backdrop-blur-sm"></div>

                        {/* Content */}
                        <div className="relative z-10">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="text-red-600" size={20} />
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                First Patient Encounter Required
                              </h4>
                              <p className="text-xs text-gray-700 mb-3">
                                Patient must complete annual FPE before
                                consultation
                              </p>
                              <button
                                onClick={handleStartFPE}
                                className="w-full px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                              >
                                Start FPE
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* FPE History */}
                {fpeHistory.length > 0 && (
                  <div className="bg-white border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                      FPE History
                    </h3>
                    <div className="space-y-3">
                      {fpeHistory.map(
                        (fpe: {
                          caseNumber: Key | null | undefined;
                          year:
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactElement<
                                unknown,
                                string | JSXElementConstructor<any>
                              >
                            | Iterable<ReactNode>
                            | Promise<
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactPortal
                                | ReactElement<
                                    unknown,
                                    string | JSXElementConstructor<any>
                                  >
                                | Iterable<ReactNode>
                                | null
                                | undefined
                              >
                            | null
                            | undefined;
                          dateCreated: string | number | Date;
                          status:
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactElement<
                                unknown,
                                string | JSXElementConstructor<any>
                              >
                            | Iterable<ReactNode>
                            | ReactPortal
                            | Promise<
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactPortal
                                | ReactElement<
                                    unknown,
                                    string | JSXElementConstructor<any>
                                  >
                                | Iterable<ReactNode>
                                | null
                                | undefined
                              >
                            | null
                            | undefined;
                        }) => (
                          <div
                            key={fpe.caseNumber}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-600"></div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {fpe.year}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(fpe.dateCreated).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block px-2 py-1 text-xs font-medium ${
                                  fpe.year === currentYear
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {fpe.status}
                              </span>
                              <button
                                onClick={() =>
                                  navigate(`/fpe/${fpe.caseNumber}`)
                                }
                                className="text-xs text-blue-600 hover:underline"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Consultation Gating Modal */}
      {showConsultationModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-6 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDDH%20Yakap%2FCheck%20this.jpg?alt=media&token=fc787d13-8674-4386-8b1f-f517af49e433')`,
          }}
        >
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-black/40"></div>

          <div className="bg-white w-full max-w-md p-6 relative z-10 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2 bg-red-50">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  FPE Required
                </h3>
                <p className="text-sm text-gray-700">
                  Consultation cannot proceed without a valid First Patient
                  Encounter for this year.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowConsultationModal(false);
                  handleStartFPE();
                }}
                className="flex-1 px-6 py-2.5 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Start FPE
              </button>
              <button
                onClick={() => setShowConsultationModal(false)}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
