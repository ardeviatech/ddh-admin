import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addAuditLog } from "../../store/slices/auditLogSlice";
import { Header } from "../components/Header";
import { ArrowLeft, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  usePatientFlowMetricQuery,
  useUpdatePatientFlowMetricMutation,
} from "../../services/usePatientFlowQueries";
import { usePatientFlowRealtime } from "../hooks/usePatientFlowRealtime";
import {
  usePatientFlowDocumentsQuery,
  useUploadPatientFlowDocumentsMutation,
  useDeletePatientFlowDocumentMutation,
} from "../../services/usePatientFlowDocumentQueries";
import {
  downloadPatientFlowDocument,
  type PatientFlowDocument,
} from "../../services/patientFlowDocumentService";

const schema = yup.object().shape({
  date: yup.string().required("Date is required"),
  opdPatients: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("OPD patients count is required"),
  erPatients: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("ER patients count is required"),
  admissions: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Admissions count is required"),
  discharges: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Discharges count is required"),
  incomingReferrals: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Incoming referrals count is required"),
  outgoingReferrals: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Outgoing referrals count is required"),
  deaths: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Deaths count is required"),
});

type FormData = yup.InferType<typeof schema>;

type MetricChange = {
  field: string;
  oldValue: string;
  newValue: string;
};

export function EditPatientFlowMetrics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const metricId = id ?? "";
  const {
    data: metric,
    isLoading: isMetricLoading,
    isError,
  } = usePatientFlowMetricQuery(metricId, {
    enabled: !!metricId,
  });

  const { data: documentsData, isLoading: isDocsLoading } =
    usePatientFlowDocumentsQuery(metricId, {
      enabled: !!metricId,
    });

  usePatientFlowRealtime(metricId);

  const documents = (documentsData ?? []) as PatientFlowDocument[];

  const updateMutation = useUpdatePatientFlowMetricMutation();
  const uploadMutation = useUploadPatientFlowDocumentsMutation();
  const deleteDocumentMutation = useDeletePatientFlowDocumentMutation();
  const isUploading = uploadMutation.status === "pending";
  const isDeletingDocument = deleteDocumentMutation.status === "pending";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const { ref: dateRegisterRef, ...dateRegisterRest } = register("date");

  useEffect(() => {
    if (metric) {
      reset({
        date: metric.date,
        opdPatients: metric.opdPatients,
        erPatients: metric.erPatients,
        admissions: metric.admissions,
        discharges: metric.discharges,
        incomingReferrals: metric.incomingReferrals,
        outgoingReferrals: metric.outgoingReferrals,
        deaths: metric.deaths,
      });
    }
  }, [metric, reset]);

  if (isMetricLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title="Edit Patient Flow Metrics"
          subtitle="Loading metric..."
        />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600">
              Loading metric details, please wait.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !metric) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Edit Patient Flow Metrics" subtitle="Metric not found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              The metric you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/patient-flow/history")}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = (data: FormData) => {
    if (!metric) return;

    const changes: MetricChange[] = [];
    if (metric.date !== data.date) {
      changes.push({
        field: "Date",
        oldValue: metric.date,
        newValue: data.date,
      });
    }
    if (metric.opdPatients !== data.opdPatients) {
      changes.push({
        field: "OPD Patients",
        oldValue: metric.opdPatients.toString(),
        newValue: data.opdPatients.toString(),
      });
    }
    if (metric.erPatients !== data.erPatients) {
      changes.push({
        field: "ER Patients",
        oldValue: metric.erPatients.toString(),
        newValue: data.erPatients.toString(),
      });
    }
    if (metric.admissions !== data.admissions) {
      changes.push({
        field: "Admissions",
        oldValue: metric.admissions.toString(),
        newValue: data.admissions.toString(),
      });
    }
    if (metric.discharges !== data.discharges) {
      changes.push({
        field: "Discharges",
        oldValue: metric.discharges.toString(),
        newValue: data.discharges.toString(),
      });
    }
    if (metric.incomingReferrals !== data.incomingReferrals) {
      changes.push({
        field: "Incoming Referrals",
        oldValue: metric.incomingReferrals.toString(),
        newValue: data.incomingReferrals.toString(),
      });
    }
    if (metric.outgoingReferrals !== data.outgoingReferrals) {
      changes.push({
        field: "Outgoing Referrals",
        oldValue: metric.outgoingReferrals.toString(),
        newValue: data.outgoingReferrals.toString(),
      });
    }
    if (metric.deaths !== data.deaths) {
      changes.push({
        field: "Deaths",
        oldValue: metric.deaths.toString(),
        newValue: data.deaths.toString(),
      });
    }

    updateMutation.mutate(
      {
        metricId: metric.id,
        payload: {
          date: data.date,
          opdPatients: data.opdPatients,
          erPatients: data.erPatients,
          admissions: data.admissions,
          discharges: data.discharges,
          incomingReferrals: data.incomingReferrals,
          outgoingReferrals: data.outgoingReferrals,
          deaths: data.deaths,
        },
      },
      {
        onSuccess: () => {
          dispatch(
            addAuditLog({
              userId: user?.id || "",
              userName: user?.name || "",
              action: "UPDATE",
              module: "PATIENT_FLOW",
              entityType: "Patient Flow Metrics",
              entityId: metric.id,
              entityName: new Date(data.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
              details: `Updated patient flow metrics`,
              changes: changes.length > 0 ? changes : undefined,
            }),
          );
          navigate("/patient-flow/history");
        },
      },
    );
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setFiles(event.target.files);
  };

  const handleUploadDocuments = () => {
    if (!metric) return;
    if (!files || files.length === 0) {
      setUploadError("Please select at least one file to upload.");
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    uploadMutation.mutate(
      { metricId: metric.id, formData },
      {
        onSuccess: () => {
          setFiles(null);
          setUploadError(null);
        },
      },
    );
  };

  const handleDownloadDocument = async (
    documentId: string,
    filename: string,
  ) => {
    try {
      const blob = await downloadPatientFlowDocument(metricId, documentId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    if (!metric) return;
    deleteDocumentMutation.mutate({ metricId: metric.id, documentId });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Edit Patient Flow Metrics"
        subtitle="Update daily patient statistics"
      />

      <div className="p-8">
        <button
          onClick={() => navigate("/patient-flow/history")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to History
        </button>

        <div className="max-w-4xl mx-auto bg-white border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...dateRegisterRest}
                  ref={(e) => {
                    dateRegisterRef(e);
                    dateInputRef.current = e;
                  }}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  max={new Date().toISOString().split("T")[0]}
                  style={{ colorScheme: "light" }}
                />
                <Calendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.date.message}
                </p>
              )}
            </div>

            {/* OPD and ER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of OPD Patients <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("opdPatients")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.opdPatients && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.opdPatients.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of ER Patients <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("erPatients")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.erPatients && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.erPatients.message}
                  </p>
                )}
              </div>
            </div>

            {/* Admissions and Discharges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Admissions <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("admissions")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.admissions && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.admissions.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Discharges <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("discharges")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.discharges && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.discharges.message}
                  </p>
                )}
              </div>
            </div>

            {/* Referrals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Incoming Referrals{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("incomingReferrals")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.incomingReferrals && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.incomingReferrals.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Outgoing Referrals{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("outgoingReferrals")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.outgoingReferrals && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.outgoingReferrals.message}
                  </p>
                )}
              </div>
            </div>

            {/* Deaths */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Deaths <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                {...register("deaths")}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              {errors.deaths && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.deaths.message}
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">
                Originally entered by:{" "}
                <span className="font-semibold">
                  {metric.enteredBy || "Unknown"}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Created:{" "}
                {new Date(metric.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Attached Documents
              </h3>

              <div className="grid gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Upload Documents
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700 file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleUploadDocuments}
                    disabled={isUploading}
                    className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
                {uploadError && (
                  <p className="text-sm text-red-600">{uploadError}</p>
                )}
              </div>

              <div className="mt-6">
                {isDocsLoading ? (
                  <p className="text-sm text-gray-500">Loading documents...</p>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No documents uploaded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left text-sm text-gray-700">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Uploaded By</th>
                          <th className="px-4 py-3">Uploaded At</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc.id} className="border-t border-gray-200">
                            <td className="px-4 py-3 text-gray-900">
                              {doc.name}
                            </td>
                            <td className="px-4 py-3">{doc.uploadedBy}</td>
                            <td className="px-4 py-3">
                              {new Date(doc.uploadedAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadDocument(
                                    doc.id,
                                    doc.originalName,
                                  )
                                }
                                className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                              >
                                Download
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={isDeletingDocument}
                                className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
              >
                Update Metrics
              </button>
              <button
                type="button"
                onClick={() => navigate("/patient-flow/history")}
                className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
