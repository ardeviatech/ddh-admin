import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFPEByCaseNumber } from "../../services/fpeService";
import { type FPERecord } from "../../store/slices/fpeSlice";
import {
  fetchFPEDocuments,
  deleteFPEDocument,
  downloadFPEDocument,
  type FPEDocumentResponse,
} from "../../services/fpeDocumentService";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { ArrowLeft, Upload, File, Download, Trash2, Eye } from "lucide-react";

export function SupportingDocuments() {
  const { caseNumber } = useParams<{ caseNumber: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: fpeRecord,
    isLoading: isFPELoading,
    isError: isFPEError,
  } = useQuery<FPERecord, Error>({
    queryKey: ["fpe", caseNumber],
    queryFn: () => fetchFPEByCaseNumber(caseNumber!),
    enabled: !!caseNumber,
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: documents,
    isLoading: isDocumentsLoading,
    isError: isDocumentsError,
  } = useQuery<FPEDocumentResponse[], Error>({
    queryKey: ["fpe", caseNumber, "documents"],
    queryFn: () => fetchFPEDocuments(caseNumber!),
    enabled: !!caseNumber,
    staleTime: 1000 * 60 * 2,
  });

  const documentsList = documents ?? [];

  useEffect(() => {
    if (isFPEError) {
      toast.error("Unable to load FPE record");
    }
  }, [isFPEError]);

  useEffect(() => {
    if (isDocumentsError) {
      toast.error("Unable to load documents");
    }
  }, [isDocumentsError]);

  const deleteMutation = useMutation<{ documentId: string }, Error, string>({
    mutationFn: (documentId: string) =>
      deleteFPEDocument(caseNumber!, documentId),
    onSuccess: () => {
      toast.success("Document deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["fpe", caseNumber, "documents"],
      });
    },
    onError: () => toast.error("Unable to delete document"),
  });

  const handleDeleteDocument = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownloadDocument = async (doc: FPEDocumentResponse) => {
    try {
      const blob = await downloadFPEDocument(caseNumber!, doc.id!);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.originalName || doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Unable to download document");
    }
  };

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isFPELoading || isDocumentsLoading) {
    return <div className="min-h-screen bg-gray-50">Loading...</div>;
  }

  if (isFPEError || !fpeRecord) {
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
        title={`Supporting Documents - ${fpeRecord.caseNumber}`}
        subtitle={`Patient: ${fpeRecord.patientName} • Year: ${fpeRecord.year}`}
      />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/fpe/${caseNumber}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to FPE Details
          </button>

          <button
            onClick={() => navigate(`/fpe/${caseNumber}/documents/upload`)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Upload size={20} />
            Upload Documents
          </button>
        </div>

        {/* Document Header */}
        <div className="bg-white border-2 border-gray-900 mb-6">
          <div className="border-b-2 border-gray-900 bg-gray-50 px-8 py-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                SUPPORTING DOCUMENTS
              </h1>
              <p className="text-sm text-gray-600">
                Medical Records and Test Results
              </p>
            </div>
          </div>

          <div className="px-8 py-6 grid grid-cols-2 gap-x-12 gap-y-3 border-b border-gray-300">
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
                Total Documents:
              </span>
              <span className="text-gray-900 font-medium">
                {documentsList.length}
              </span>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white border-2 border-gray-900">
          <div className="px-8 py-6">
            {documentsList.length === 0 ? (
              <div className="text-center py-12">
                <File size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-2">No documents uploaded yet</p>
                <p className="text-sm text-gray-500">
                  Click "Upload Documents" to add files
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documentsList.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <File size={24} className="text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {doc.originalName || doc.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {doc.size} • Uploaded {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          navigate(
                            `/fpe/${caseNumber}/documents/${doc.id}/preview`,
                            {
                              state: { document: doc },
                            },
                          )
                        }
                        className="p-2 text-green-600 hover:bg-green-50 transition-colors"
                        title="Preview"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
