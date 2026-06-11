import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import type { FPERecord } from "../../store/slices/fpeSlice";
import { addFPE, getCurrentYear } from "../../store/slices/fpeSlice";
import { fetchFPEByCaseNumber } from "../../services/fpeService";
import { useConsultationsQuery } from "../../services/useConsultationQueries";
import { Header } from "../components/Header";
import { SkeletonTable } from "../components/loading/SkeletonTable";
import { ConsultationDocumentsRow } from "../components/ConsultationDocumentsRow";
import { ArrowLeft, Plus, FileText, Eye, AlertTriangle, X } from "lucide-react";

export function ConsultationRecord() {
  const { caseNumber } = useParams<{ caseNumber: string }>();
  const navigate = useNavigate();
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [showFPEWarning, setShowFPEWarning] = useState(false);
  const [activeConsultationDocuments, setActiveConsultationDocuments] =
    useState<string | null>(null);

  const fpeRecord = useAppSelector((state) =>
    state.fpe.fpeRecords.find(
      (f: { caseNumber: string | undefined }) => f.caseNumber === caseNumber,
    ),
  );

  // Fetch consultations for this FPE case
  const {
    data: consultationsResponse,
    isLoading: isLoadingConsultations,
    error: consultationsError,
  } = useConsultationsQuery({ caseNumber }, { enabled: !!caseNumber });

  const dispatch = useAppDispatch();
  const allFPERecords = useAppSelector((state) => state.fpe.fpeRecords);
  const [isLoadingFPE, setIsLoadingFPE] = useState(false);

  const consultations = consultationsResponse?.data || [];

  // Check if patient has valid FPE for current year
  const currentYear = getCurrentYear();
  const patientId = fpeRecord?.patientId;
  const hasValidCurrentYearFPE = useMemo(() => {
    if (!patientId) return false;
    return allFPERecords.some(
      (fpe) =>
        fpe.patientId === patientId &&
        fpe.year === currentYear &&
        fpe.status === "Completed",
    );
  }, [patientId, allFPERecords, currentYear]);

  useEffect(() => {
    if (!caseNumber) return;
    if (fpeRecord) return;

    setIsLoadingFPE(true);
    fetchFPEByCaseNumber(caseNumber)
      .then((record) => {
        dispatch(addFPE(record));
      })
      .catch((error) => {
        if (error.response?.status !== 404) {
          console.error("Unable to load FPE record:", error);
        }
      })
      .finally(() => {
        setIsLoadingFPE(false);
      });
  }, [caseNumber, fpeRecord, dispatch]);

  const mostRecentFPE = useMemo<FPERecord | null>(() => {
    if (!patientId) return null;
    const patientFPEs = allFPERecords.filter(
      (fpe) => fpe.patientId === patientId,
    );
    if (patientFPEs.length === 0) return null;

    return patientFPEs.reduce((latest, current) => {
      if (current.year > latest.year) return current;
      if (
        current.year === latest.year &&
        new Date(current.dateCreated) > new Date(latest.dateCreated)
      ) {
        return current;
      }
      return latest;
    });
  }, [patientId, allFPERecords]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingInitial(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleNewConsultation = () => {
    if (!hasValidCurrentYearFPE) {
      setShowFPEWarning(true);
    } else {
      navigate(`/fpe/${caseNumber}/consultations/new/0`);
    }
  };

  const handleProceedAnyway = () => {
    setShowFPEWarning(false);
    navigate(`/fpe/${caseNumber}/consultations/new/0`);
  };

  const handleStartFPE = () => {
    setShowFPEWarning(false);
    sessionStorage.removeItem("fpeFormData");
    navigate("/fpe/new/0", { state: { patientId: fpeRecord?.patientId } });
  };

  if (!fpeRecord && isLoadingFPE) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Loading FPE Record" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600">
              Loading FPE record for this consultation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!fpeRecord) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="FPE Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              The FPE record you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/fpe")}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to FPE List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`Consultation Record - ${fpeRecord.caseNumber}`}
        subtitle={`Patient: ${fpeRecord.patientName} • Year: ${fpeRecord.year}`}
      />

      <div className="p-4 md:p-8">
        {/* FPE Status Warning Banner */}
        {!hasValidCurrentYearFPE && !isLoadingFPE && (
          <div className="bg-red-50 border-2 border-red-600 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={24}
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-1">
                  Yearly FPE Renewal Required
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  This patient does not have a valid FPE for {currentYear}.
                  {mostRecentFPE && (
                    <>
                      {" "}
                      Their last FPE (Year {mostRecentFPE.year}) expired on
                      December 31, {mostRecentFPE.year}.
                    </>
                  )}
                </p>
                <button
                  onClick={handleStartFPE}
                  className="px-4 py-2 bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors rounded text-sm"
                >
                  Create {currentYear} FPE
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <button
            onClick={() => navigate(`/fpe/${caseNumber}`)}
            className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to FPE Details</span>
          </button>

          <button
            onClick={handleNewConsultation}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Consultation</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Consultation Header */}
        <div className="bg-white border-2 border-gray-900 mb-6">
          <div className="border-b-2 border-gray-900 bg-gray-50 px-4 md:px-8 py-4">
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                CONSULTATION RECORD
              </h1>
              <p className="text-xs md:text-sm text-gray-600">
                Patient Visit History and Medical Consultations
              </p>
            </div>
          </div>

          <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 border-b border-gray-300">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Case Number:
              </span>
              <span className="text-gray-900 font-medium">
                {fpeRecord.caseNumber}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Patient Name:
              </span>
              <span className="text-gray-900 font-medium uppercase">
                {fpeRecord.patientName}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Patient ID:
              </span>
              <span className="text-gray-900 font-medium">
                {fpeRecord.patientId}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                PhilHealth No.:
              </span>
              <span className="text-gray-900 font-medium">
                {fpeRecord.philhealthNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Consultation Records */}
        {isLoadingInitial || isLoadingConsultations || isLoadingFPE ? (
          <div className="bg-white border-2 border-gray-900">
            <SkeletonTable rows={5} columns={8} />
          </div>
        ) : consultationsError ? (
          <div className="bg-white border-2 border-gray-900">
            <div className="px-8 py-12">
              <div className="text-center max-w-md mx-auto">
                <AlertTriangle
                  size={48}
                  className="mx-auto mb-4 text-red-500"
                />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Error Loading Consultations
                </h2>
                <p className="text-gray-600 mb-6">
                  {consultationsError.message ||
                    "Failed to load consultation records"}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : consultations.length === 0 ? (
          <div className="bg-white border-2 border-gray-900">
            <div className="px-8 py-12">
              <div className="text-center max-w-md mx-auto">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText size={48} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  No Consultations Yet
                </h2>
                <p className="text-gray-600 mb-6">
                  There are no consultation records for this patient yet. Click
                  "New Consultation" above to create the first consultation
                  record.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-900 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Consultation ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Main Complaint
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Diagnosis
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      eKonsulta
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Documents
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consultation: any, index: number) => (
                    <tr
                      key={consultation.id as string}
                      className={`border-b border-gray-300 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {consultation.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(
                          consultation.consultationDate,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {consultation.mainComplaint || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {consultation.diagnosis || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {consultation.doctor || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold ${
                            consultation.eKonsulta
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : "bg-gray-100 text-gray-800 border border-gray-300"
                          }`}
                        >
                          {consultation.eKonsulta ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold ${
                            consultation.status === "Completed"
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                          }`}
                        >
                          {consultation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            setActiveConsultationDocuments(
                              activeConsultationDocuments === consultation.id
                                ? null
                                : consultation.id,
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white hover:bg-orange-700 transition-colors text-xs rounded"
                        >
                          <FileText size={14} />
                          Docs
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            navigate(
                              `/fpe/${caseNumber}/consultations/${consultation.id}`,
                            )
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expanded Documents Section */}
            {activeConsultationDocuments && (
              <ConsultationDocumentsRow
                consultationNumber={activeConsultationDocuments}
                caseNumber={caseNumber}
                onClose={() => setActiveConsultationDocuments(null)}
              />
            )}

            {/* Summary Footer */}
            <div className="border-t-2 border-gray-900 bg-gray-50 px-6 py-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Total Consultations:</span>{" "}
                {consultations.length}
              </p>
            </div>
          </div>
        )}

        {/* Consultation Documents Section - Individual consultation documents can be managed from ConsultationDetail page */}

        {/* FPE Expiration Warning Modal */}
        {showFPEWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="bg-red-600 px-6 py-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-white" size={24} />
                  <h2 className="text-xl font-bold text-white">
                    FPE Renewal Required
                  </h2>
                </div>
                <button
                  onClick={() => setShowFPEWarning(false)}
                  className="text-white hover:bg-red-700 rounded p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 mb-3">
                    Patient does not have a completed FPE for the current year{" "}
                    <span className="font-bold">({currentYear})</span>.
                  </p>

                  {mostRecentFPE && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-4">
                      <p className="text-sm font-semibold text-yellow-900 mb-2">
                        Last FPE:
                      </p>
                      <div className="text-sm text-yellow-800 space-y-1">
                        <p>
                          <span className="font-medium">Case Number:</span>{" "}
                          {mostRecentFPE.caseNumber}
                        </p>
                        <p>
                          <span className="font-medium">Year:</span>{" "}
                          {mostRecentFPE.year}
                        </p>
                        <p>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(
                            mostRecentFPE.dateCreated,
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="font-bold text-red-700 mt-2">
                          ⚠️ EXPIRED: December 31, {mostRecentFPE.year}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-300 rounded p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      FPE Yearly Validity Rule:
                    </p>
                    <p className="text-sm text-blue-800">
                      An FPE expires at the end of the calendar year. A new FPE
                      must be created each year before consultations can be
                      recorded.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleStartFPE}
                    className="w-full px-6 py-3 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors rounded"
                  >
                    Start {currentYear} FPE
                  </button>
                  <button
                    onClick={handleProceedAnyway}
                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors rounded"
                  >
                    Continue Anyway (Not Recommended)
                  </button>
                  <button
                    onClick={() => setShowFPEWarning(false)}
                    className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
