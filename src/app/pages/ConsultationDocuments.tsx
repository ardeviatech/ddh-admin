import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { ConsultationDocumentUpload } from "../components/ConsultationDocumentUpload";
import {
  useConsultationQuery,
  useConsultationDocumentsQuery,
  useDeleteConsultationDocumentMutation,
} from "../../services/useConsultationQueries";
import { ArrowLeft } from "lucide-react";

export function ConsultationDocuments() {
  const { caseNumber, consultationId } = useParams<{
    caseNumber: string;
    consultationId: string;
  }>();
  const navigate = useNavigate();

  const {
    data: consultation,
    isLoading: isConsultationLoading,
    isError: isConsultationError,
  } = useConsultationQuery(consultationId ?? "", {
    enabled: !!consultationId,
  });

  const {
    data: documents,
    isLoading: isDocumentsLoading,
    error: documentsError,
  } = useConsultationDocumentsQuery(consultationId ?? "", {
    enabled: !!consultationId,
  });

  const deleteMutation = useDeleteConsultationDocumentMutation(
    consultationId ?? "",
  );

  const headerSubtitle = useMemo(() => {
    if (!consultation) return "";
    return `Patient: ${consultation.patientName} • Case: ${consultation.caseNumber}`;
  }, [consultation]);

  if (!consultationId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Consultation Files" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Consultation not found.</p>
            <button
              onClick={() => navigate("/fpe")}
              className="mt-4 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to FPE List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isConsultationLoading || isDocumentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Consultation Files" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Loading consultation files...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isConsultationError || !consultation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Consultation Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              The consultation record you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate(`/fpe/${caseNumber}/consultations`)}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to Consultation Records
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Consultation Files" subtitle={headerSubtitle} />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6 gap-3">
          <button
            onClick={() =>
              navigate(`/fpe/${caseNumber}/consultations/${consultationId}`)
            }
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Consultation Details
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Consultation ID</p>
            <p className="text-base font-semibold text-gray-900">
              {consultation.id}
            </p>
          </div>
          <ConsultationDocumentUpload
            consultationNumber={consultationId}
            caseNumber={consultation.caseNumber}
            documents={documents || []}
            onDocumentDeleted={(documentId) =>
              deleteMutation.mutate(documentId)
            }
            isLoading={deleteMutation.isPending}
          />
          {documentsError && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {documentsError.message ||
                "Unable to load consultation documents."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
