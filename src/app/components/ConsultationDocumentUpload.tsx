import { useState, useRef } from "react";
import { Upload, X, FileText, Download, Trash2, Loader } from "lucide-react";
import { useUploadConsultationDocumentsMutation } from "../../services/useConsultationQueries";
import type { ConsultationDocument } from "../../services/consultationService";
import { ConfirmationModal } from "./ConfirmationModal";

interface ConsultationDocumentUploadProps {
  consultationNumber: string;
  caseNumber?: string;
  documents?: ConsultationDocument[];
  onDocumentUploaded?: (documents: ConsultationDocument[]) => void;
  onDocumentDeleted?: (documentId: string) => void;
  isLoading?: boolean;
}

export function ConsultationDocumentUpload({
  consultationNumber,
  caseNumber,
  documents = [],
  onDocumentUploaded,
  onDocumentDeleted,
  isLoading = false,
}: ConsultationDocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentNames, setDocumentNames] = useState<string[]>([]);
  const [documentToDelete, setDocumentToDelete] =
    useState<ConsultationDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadConsultationDocumentsMutation(
    consultationNumber,
    {
      onSuccess: (data) => {
        setSelectedFiles([]);
        setDocumentNames([]);
        onDocumentUploaded?.(data);
      },
    },
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    setDocumentNames((prev) => [
      ...prev,
      ...files.map((f) => f.name.replace(/\.[^/.]+$/, "")),
    ]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setDocumentNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    uploadMutation.mutate({
      files: selectedFiles,
      names: documentNames,
      caseNumber,
    });
  };

  const handleDownload = (doc: ConsultationDocument) => {
    const link = window.document.createElement("a");
    link.href = doc.downloadUrl;
    link.download = doc.originalName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Upload Documents
          </h3>
        </div>

        {/* File Input */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            setSelectedFiles((prev) => [...prev, ...files]);
            setDocumentNames((prev) => [
              ...prev,
              ...files.map((f) => f.name.replace(/\.[^/.]+$/, "")),
            ]);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploadMutation.isPending || isLoading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 mx-auto"
            disabled={uploadMutation.isPending || isLoading}
          >
            <Upload className="text-gray-400" size={32} />
            <span className="text-sm text-gray-600">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-gray-500">
              Supported formats: PDF, Word, Images (Max 20MB per file)
            </span>
          </button>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">
              Files to upload ({selectedFiles.length})
            </h4>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={documentNames[index]}
                      onChange={(e) => {
                        const newNames = [...documentNames];
                        newNames[index] = e.target.value;
                        setDocumentNames(newNames);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Document name"
                    />
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  disabled={uploadMutation.isPending || isLoading}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || isLoading}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors rounded flex items-center justify-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Documents
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Documents ({documents.length})
          </h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 rounded border border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText size={16} className="text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{doc.size}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {doc.uploadedBy && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            by {doc.uploadedBy}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => setDocumentToDelete(doc)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && selectedFiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No documents uploaded yet</p>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!documentToDelete}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={() => {
          if (documentToDelete) {
            onDocumentDeleted?.(documentToDelete.id);
          }
          setDocumentToDelete(null);
        }}
        title="Delete Document"
        message={
          documentToDelete
            ? `Are you sure you want to delete "${documentToDelete.name}"? This action cannot be undone.`
            : "Are you sure you want to delete this document?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
