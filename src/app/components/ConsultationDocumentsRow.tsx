import {
  useConsultationDocumentsQuery,
  useDeleteConsultationDocumentMutation,
} from "../../services/useConsultationQueries";
import { ConsultationDocumentUpload } from "./ConsultationDocumentUpload";
import { Loader, AlertTriangle } from "lucide-react";

interface ConsultationDocumentsRowProps {
  consultationNumber: string;
  caseNumber?: string;
  onClose: () => void;
}

export function ConsultationDocumentsRow({
  consultationNumber,
  caseNumber,
  onClose,
}: ConsultationDocumentsRowProps) {
  const {
    data: documents,
    isLoading,
    error,
  } = useConsultationDocumentsQuery(consultationNumber);
  const deleteMutation =
    useDeleteConsultationDocumentMutation(consultationNumber);

  return (
    <tr className="bg-blue-50 border-t-2 border-b-2 border-blue-200">
      <td colSpan={9} className="px-6 py-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Documents for Consultation {consultationNumber}
            </h3>
            <button
              onClick={onClose}
              className="text-sm px-3 py-1 bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors rounded"
            >
              Close
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader size={24} className="animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading documents...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  Error loading documents
                </p>
                <p className="text-sm text-red-700">
                  {error.message || "Failed to load consultation documents"}
                </p>
              </div>
            </div>
          ) : (
            <ConsultationDocumentUpload
              consultationNumber={consultationNumber}
              caseNumber={caseNumber}
              documents={documents || []}
              onDocumentDeleted={(documentId) =>
                deleteMutation.mutate(documentId)
              }
              isLoading={deleteMutation.isPending}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
