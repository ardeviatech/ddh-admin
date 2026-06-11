import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "../components/Header";
import { fetchFPEByCaseNumber } from "../../services/fpeService";
import { type FPERecord } from "../../store/slices/fpeSlice";
import {
  uploadFPEDocuments,
  type FPEDocumentResponse,
} from "../../services/fpeDocumentService";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, File, CheckCircle } from "lucide-react";

export function UploadDocuments() {
  const { caseNumber } = useParams<{ caseNumber: string }>();
  const navigate = useNavigate();

  type SelectedUploadFile = {
    file: File;
    displayName: string;
  };

  const [uploadedFiles, setUploadedFiles] = useState<SelectedUploadFile[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const queryClient = useQueryClient();

  const {
    data: fpeRecord,
    isLoading: isFPELoading,
    isError: isFPEError,
  } = useQuery<FPERecord>({
    queryKey: ["fpe", caseNumber],
    queryFn: () => fetchFPEByCaseNumber(caseNumber!),
    enabled: !!caseNumber,
    staleTime: 1000 * 60 * 2,
  });

  const uploadMutation = useMutation<FPEDocumentResponse[], Error, SelectedUploadFile[]>({
    mutationFn: (files) =>
      uploadFPEDocuments(
        caseNumber!,
        files.map((item) => item.file),
        files.map((item) => item.displayName),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fpe", caseNumber, "documents"],
      });
      setUploadSuccess(true);
      toast.success("Documents uploaded successfully");
      setTimeout(() => navigate(`/fpe/${caseNumber}/documents`), 1200);
    },
    onError: () => {
      toast.error("Unable to upload documents");
    },
  });

  if (isFPELoading) {
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const incoming = Array.from(files)
        .filter((file) => {
          if (file.size > MAX_FILE_SIZE) {
            toast.error(`${file.name} exceeds the 10MB size limit.`);
            return false;
          }
          return true;
        })
        .filter(
          (file) =>
            !uploadedFiles.some(
              (f) => f.file.name === file.name && f.file.size === file.size,
            ),
        )
        .map((file) => ({ file, displayName: file.name }));

      if (incoming.length > 0) {
        setUploadedFiles((current) => [...current, ...incoming]);
      }
      event.currentTarget.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleDisplayNameChange = (index: number, value: string) => {
    setUploadedFiles((current) =>
      current.map((item, i) =>
        i === index ? { ...item, displayName: value } : item,
      ),
    );
  };

  const handleSubmitDocuments = () => {
    if (uploadedFiles.length === 0) return;
    uploadMutation.mutate(uploadedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files) {
      const incoming = Array.from(files)
        .filter((file) => {
          if (file.size > MAX_FILE_SIZE) {
            toast.error(`${file.name} exceeds the 10MB size limit.`);
            return false;
          }
          return true;
        })
        .filter(
          (file) =>
            !uploadedFiles.some(
              (f) => f.file.name === file.name && f.file.size === file.size,
            ),
        )
        .map((file) => ({ file, displayName: file.name }));

      if (incoming.length > 0) {
        setUploadedFiles((current) => [...current, ...incoming]);
      }
    }
  };

  const formatSize = (size: number) =>
    size < 1024 * 1024
      ? `${(size / 1024).toFixed(2)} KB`
      : `${(size / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`Upload Documents - ${fpeRecord.caseNumber}`}
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
        </div>

        {/* Upload Header */}
        <div className="bg-white border-2 border-gray-900 mb-6">
          <div className="border-b-2 border-gray-900 bg-gray-50 px-8 py-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                UPLOAD SUPPORTING DOCUMENTS
              </h1>
              <p className="text-sm text-gray-600">
                Add medical records and test results
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
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white border-2 border-gray-900">
          <div className="px-8 py-6">
            {uploadSuccess ? (
              <div className="text-center py-12">
                <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Upload Successful!
                </h2>
                <p className="text-gray-600 mb-4">
                  {uploadedFiles.length} document
                  {uploadedFiles.length !== 1 ? "s" : ""} uploaded successfully.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to documents page...
                </p>
              </div>
            ) : (
              <>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-4 border-dashed border-gray-300 p-12 text-center mb-6 hover:border-blue-400 transition-colors"
                >
                  <Upload className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Drag and drop files here
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    or click the button below to browse
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    Accepted formats: PDF, DOC, DOCX, JPG, PNG (max 10MB per
                    file)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-8 py-3 bg-blue-600 text-white font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Browse Files
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="border-t-2 border-gray-300 pt-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                      Selected Files ({uploadedFiles.length})
                    </h3>
                    <div className="space-y-3 mb-6">
                      {uploadedFiles.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 border border-gray-300 bg-gray-50"
                        >
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <File
                              size={24}
                              className="text-blue-600 flex-shrink-0 mt-2"
                            />
                            <div className="flex-1 min-w-0 space-y-3">
                              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] items-end">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Document Name
                                  </label>
                                  <input
                                    type="text"
                                    value={item.displayName}
                                    onChange={(e) =>
                                      handleDisplayNameChange(index, e.target.value)
                                    }
                                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                  />
                                </div>
                                <button
                                  onClick={() => handleRemoveFile(index)}
                                  className="inline-flex items-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
                                  title="Remove file"
                                >
                                  <X size={18} />
                                  Remove
                                </button>
                              </div>
                              <div className="rounded border border-gray-200 bg-white p-3">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {item.file.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatSize(item.file.size)} • {item.file.type || "Unknown type"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleSubmitDocuments}
                        disabled={
                          uploadMutation.isPending || uploadedFiles.length === 0
                        }
                        className="flex-1 px-8 py-3 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadMutation.isPending
                          ? "Uploading..."
                          : `Upload ${uploadedFiles.length} Document${uploadedFiles.length !== 1 ? "s" : ""}`}
                      </button>
                      <button
                        onClick={() => navigate(`/fpe/${caseNumber}/documents`)}
                        disabled={uploadMutation.isPending}
                        className="flex-1 px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {uploadedFiles.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      No files selected yet
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
