import { useState, useRef } from "react";
import { Upload, X, FileText, Download, Trash2, Loader } from "lucide-react";
import { useUploadInventoryDocumentsMutation } from "../../services/useInventoryDocumentQueries";
import {
  downloadInventoryDocument,
  type InventoryDocument,
} from "../../services/inventoryDocumentService";

interface InventoryDocumentUploadProps {
  itemId: string;
  itemCode?: string;
  documents?: InventoryDocument[];
  onDocumentDeleted?: (documentId: string) => void;
  onDocumentUploaded?: (documents: InventoryDocument[]) => void;
  isLoading?: boolean;
}

export function InventoryDocumentUpload({
  itemId,
  itemCode,
  documents = [],
  onDocumentDeleted,
  onDocumentUploaded,
  isLoading = false,
}: InventoryDocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentNames, setDocumentNames] = useState<string[]>([]);
  const [documentToDelete, setDocumentToDelete] =
    useState<InventoryDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadInventoryDocumentsMutation(itemId, {
    onSuccess: (data) => {
      setSelectedFiles([]);
      setDocumentNames([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onDocumentUploaded?.(data);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    setDocumentNames((prev) => [
      ...prev,
      ...files.map((file) => file.name.replace(/\.[^/.]+$/, "")),
    ]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setDocumentNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    uploadMutation.mutate({ files: selectedFiles, itemCode });
  };

  const handleDownload = async (document: InventoryDocument) => {
    await downloadInventoryDocument(itemId, document.id, document.originalName);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Upload Documents
          </h3>
        </div>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            setSelectedFiles((prev) => [...prev, ...files]);
            setDocumentNames((prev) => [
              ...prev,
              ...files.map((file) => file.name.replace(/\.[^/.]+$/, "")),
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

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">
              Files to upload ({selectedFiles.length})
            </h4>
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
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

      {documents.length > 0 ? (
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
                      {doc.name || doc.originalName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>
                        {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {doc.uploadedBy && (
                        <>
                          <span>•</span>
                          <span>by {doc.uploadedBy}</span>
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
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          <FileText size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">
            No documents uploaded for this inventory item yet.
          </p>
        </div>
      )}

      {documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-md w-full bg-white rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Document
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{documentToDelete.name}"? This
              action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDocumentToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDocumentDeleted?.(documentToDelete.id);
                  setDocumentToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
