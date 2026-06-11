import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { deleteDocument } from "../../store/slices/fpeSlice";
import { Header } from "../components/Header";
import { ArrowLeft, Download, Trash2, ZoomIn, ZoomOut, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFPEByCaseNumber } from "../../services/fpeService";
import { type FPERecord } from "../../store/slices/fpeSlice";
import {
  fetchFPEDocuments,
  fetchFPEDocument,
  downloadFPEDocument,
  type FPEDocumentResponse,
} from "../../services/fpeDocumentService";

export function DocumentPreview() {
  const { caseNumber, documentId } = useParams<{
    caseNumber: string;
    documentId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const fpeRecordFromStore = useAppSelector((state) =>
    state.fpe.fpeRecords.find(
      (f: { caseNumber: string | undefined }) => f.caseNumber === caseNumber,
    ),
  );

  const previewState = location.state as {
    document?: FPEDocumentResponse;
  } | null;
  const documentFromState = previewState?.document;
  const documentFromStore = fpeRecordFromStore?.documents?.find(
    (d: { id: string | undefined }) => d.id === documentId,
  );
  const [zoom, setZoom] = useState(100);

  const { data: fetchedDocuments, isLoading: isDocumentsLoading } = useQuery<
    FPEDocumentResponse[],
    Error,
    FPEDocumentResponse[]
  >({
    queryKey: ["fpe", caseNumber, "documents"],
    queryFn: () => fetchFPEDocuments(caseNumber!),
    enabled: !!caseNumber,
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: fpeRecordFromApi,
    isLoading: isFPELoading,
    isError: isFPEError,
  } = useQuery<FPERecord, Error>({
    queryKey: ["fpe", caseNumber],
    queryFn: () => fetchFPEByCaseNumber(caseNumber!),
    enabled: !!caseNumber,
    staleTime: 1000 * 60 * 2,
  });

  const documents = fetchedDocuments ?? [];
  const docFromCache =
    documentFromState ||
    documentFromStore ||
    documents.find((d) => d.id === documentId);

  const { data: fetchedDocument, isLoading: isDocumentLoading } = useQuery<
    FPEDocumentResponse,
    Error
  >({
    queryKey: ["fpe", caseNumber, "documents", documentId],
    queryFn: () => fetchFPEDocument(caseNumber!, documentId!),
    enabled: !!caseNumber && !!documentId && !docFromCache?.type,
    staleTime: 1000 * 60 * 2,
  });

  const fpeRecord = fpeRecordFromStore || fpeRecordFromApi;
  const doc = fetchedDocument || docFromCache;

  const isImage = !!doc?.type && doc.type.startsWith("image/");
  const isPDF = !!doc?.type && doc.type.includes("pdf");

  const { data: fileObjectUrl, isLoading: isFileLoading } = useQuery<
    string,
    Error
  >({
    queryKey: ["fpe", caseNumber, "documents", documentId, "file"],
    queryFn: async () => {
      const blob = await downloadFPEDocument(caseNumber!, documentId!);
      return URL.createObjectURL(blob);
    },
    enabled: !!doc && (isImage || isPDF),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
  });

  useEffect(() => {
    return () => {
      if (typeof fileObjectUrl === "string") {
        URL.revokeObjectURL(fileObjectUrl);
      }
    };
  }, [fileObjectUrl]);

  if (
    isFPELoading ||
    isDocumentsLoading ||
    isDocumentLoading ||
    isFileLoading
  ) {
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

  if (!doc) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Document Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              The document you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate(`/fpe/${caseNumber}/documents`)}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getDocumentUrl = (): string | undefined => {
    if (!doc) return undefined;
    if (fileObjectUrl) return fileObjectUrl;
    if (doc.fileData) return doc.fileData;
    return "downloadUrl" in doc
      ? (doc as FPEDocumentResponse).downloadUrl
      : undefined;
  };

  const handleDownload = () => {
    const href = getDocumentUrl();
    if (href) {
      const link = window.document.createElement("a");
      link.href = href;
      link.download = doc.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleDelete = () => {
    if (
      confirm("Are you sure you want to delete this document?") &&
      caseNumber &&
      documentId
    ) {
      dispatch(deleteDocument({ caseNumber, documentId }));
      // Navigate back to documents list
      navigate(`/fpe/${caseNumber}/documents`);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`Document Preview - ${fpeRecord.caseNumber}`}
        subtitle={`Patient: ${fpeRecord.patientName} • Year: ${fpeRecord.year}`}
      />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/fpe/${caseNumber}/documents`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Documents
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/fpe/${caseNumber}/documents`)}
              className="flex items-center gap-2 px-6 py-2 border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-100 transition-colors font-semibold"
              title="Close Preview"
            >
              <X size={20} />
              Close Preview
            </button>
            {(isImage || isPDF) && (
              <>
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="text-sm font-semibold text-gray-700">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={20} />
                </button>
              </>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Download size={20} />
              Download
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <Trash2 size={20} />
              Delete
            </button>
          </div>
        </div>

        {/* Document Info Header */}
        <div className="bg-white border-2 border-gray-900 mb-6">
          <div className="border-b-2 border-gray-900 bg-gray-50 px-8 py-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                DOCUMENT PREVIEW
              </h1>
              <p className="text-sm text-gray-600">{doc.name}</p>
            </div>
          </div>

          <div className="px-8 py-6 grid grid-cols-3 gap-x-12 gap-y-3 border-b border-gray-300">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                File Name:
              </span>
              <span className="text-gray-900 font-medium">{doc.name}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                File Size:
              </span>
              <span className="text-gray-900 font-medium">{doc.size}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                File Type:
              </span>
              <span className="text-gray-900 font-medium">
                {doc.type || "Unknown"}
              </span>
            </div>
            <div className="flex col-span-3">
              <span className="font-semibold text-gray-700 w-40">
                Uploaded:
              </span>
              <span className="text-gray-900 font-medium">
                {formatDate(doc.uploadedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Document Preview */}
        <div className="bg-white border-2 border-gray-900">
          <div className="px-8 py-6">
            {isImage ? (
              <div className="flex justify-center items-center bg-gray-100 p-8 min-h-[600px]">
                <img
                  src={getDocumentUrl()}
                  alt={doc.name}
                  style={{ maxWidth: `${zoom}%`, height: "auto" }}
                  className="border border-gray-300 shadow-lg"
                />
              </div>
            ) : isPDF ? (
              <div className="flex justify-center items-center bg-gray-100 p-8 min-h-[600px]">
                <iframe
                  src={getDocumentUrl()}
                  title={doc.name}
                  style={{ width: `${zoom}%`, height: "800px" }}
                  className="border-2 border-gray-300 shadow-lg bg-white"
                />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ArrowLeft size={48} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Preview Not Available
                </h3>
                <p className="text-gray-600 mb-6">
                  This file type cannot be previewed in the browser.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  File type: {doc.type || "Unknown"}
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Download to View
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
