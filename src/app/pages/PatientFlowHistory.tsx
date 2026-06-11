import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { addAuditLog } from "../../store/slices/auditLogSlice";
import { usePatientFlowRealtime } from "../hooks/usePatientFlowRealtime";
import { Header } from "../components/Header";
import {
  ArrowLeft,
  Search,
  Download,
  Edit,
  Trash2,
  Calendar,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePatientFlowMetricsQuery,
  useDeletePatientFlowMetricMutation,
} from "../../services/usePatientFlowQueries";

export function PatientFlowHistory() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [metricToDelete, setMetricToDelete] = useState<any>(null);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const { data: metrics = [] } = usePatientFlowMetricsQuery({
    search: searchQuery,
    startDate,
    endDate,
  });

  usePatientFlowRealtime();

  const deleteMutation = useDeletePatientFlowMetricMutation();

  const filteredMetrics = metrics;

  // Calculate totals
  const totals = useMemo(() => {
    return filteredMetrics.reduce(
      (
        acc: {
          opdPatients: any;
          erPatients: any;
          admissions: any;
          discharges: any;
          incomingReferrals: any;
          outgoingReferrals: any;
          deaths: any;
        },
        metric: {
          opdPatients: any;
          erPatients: any;
          admissions: any;
          discharges: any;
          incomingReferrals: any;
          outgoingReferrals: any;
          deaths: any;
        },
      ) => ({
        opdPatients: acc.opdPatients + metric.opdPatients,
        erPatients: acc.erPatients + metric.erPatients,
        admissions: acc.admissions + metric.admissions,
        discharges: acc.discharges + metric.discharges,
        incomingReferrals: acc.incomingReferrals + metric.incomingReferrals,
        outgoingReferrals: acc.outgoingReferrals + metric.outgoingReferrals,
        deaths: acc.deaths + metric.deaths,
      }),
      {
        opdPatients: 0,
        erPatients: 0,
        admissions: 0,
        discharges: 0,
        incomingReferrals: 0,
        outgoingReferrals: 0,
        deaths: 0,
      },
    );
  }, [filteredMetrics]);

  const handleDelete = (metric: (typeof metrics)[0]) => {
    setMetricToDelete(metric);
    setDeleteDialogOpen(true);
    setConfirmText("");
  };

  const confirmDelete = () => {
    if (!metricToDelete) return;

    const expectedText = metricToDelete.id;
    if (confirmText !== expectedText) {
      toast.error(
        "Confirmation text does not match. Please copy and paste the ID correctly.",
      );
      return;
    }

    deleteMutation.mutate(metricToDelete.id, {
      onSuccess: () => {
        dispatch(
          addAuditLog({
            userId: user?.id || "",
            userName: user?.name || "Unknown User",
            action: "DELETE",
            module: "PATIENT_FLOW",
            entityType: "Patient Flow Metrics",
            entityId: metricToDelete.id,
            entityName: new Date(metricToDelete.date).toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            ),
            details: `Deleted patient flow metrics: OPD: ${metricToDelete.opdPatients}, ER: ${metricToDelete.erPatients}, Admissions: ${metricToDelete.admissions}, Discharges: ${metricToDelete.discharges}, Incoming Referrals: ${metricToDelete.incomingReferrals}, Outgoing Referrals: ${metricToDelete.outgoingReferrals}, Deaths: ${metricToDelete.deaths}`,
          }),
        );

        toast.success("Patient flow metrics deleted successfully");
        setDeleteDialogOpen(false);
        setMetricToDelete(null);
        setConfirmText("");
      },
      onError: () => {
        toast.error("Failed to delete patient flow metrics. Please try again.");
      },
    });
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setMetricToDelete(null);
    setConfirmText("");
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Date",
        "OPD",
        "ER",
        "Admissions",
        "Discharges",
        "Incoming Referrals",
        "Outgoing Referrals",
        "Deaths",
        "Entered By",
      ],
      ...filteredMetrics.map(
        (m: {
          date: any;
          opdPatients: any;
          erPatients: any;
          admissions: any;
          discharges: any;
          incomingReferrals: any;
          outgoingReferrals: any;
          deaths: any;
          enteredBy: any;
        }) => [
          m.date,
          m.opdPatients,
          m.erPatients,
          m.admissions,
          m.discharges,
          m.incomingReferrals,
          m.outgoingReferrals,
          m.deaths,
          m.enteredBy,
        ],
      ),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient-flow-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Patient Flow History"
        subtitle="Historical patient flow data and records"
      />

      <div className="p-8">
        <button
          onClick={() => navigate("/patient-flow")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Patient Flow
        </button>

        <div className="bg-white border border-gray-200 mb-6">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search by entered by..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="relative">
                <input
                  ref={startDateRef}
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  style={{ colorScheme: "light" }}
                />
                <Calendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>

              <div className="relative">
                <input
                  ref={endDateRef}
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  style={{ colorScheme: "light" }}
                />
                <Calendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>

              <div>
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Summary Totals (Filtered Period)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div>
                <p className="text-xs text-gray-600">OPD</p>
                <p className="text-lg font-semibold text-gray-900">
                  {totals.opdPatients}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">ER</p>
                <p className="text-lg font-semibold text-gray-900">
                  {totals.erPatients}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Admissions</p>
                <p className="text-lg font-semibold text-gray-900">
                  {totals.admissions}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Discharges</p>
                <p className="text-lg font-semibold text-gray-900">
                  {totals.discharges}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">In Referrals</p>
                <p className="text-lg font-semibold text-gray-900">
                  {totals.incomingReferrals}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Out Referrals</p>
                <p className="text-lg font-semibold text-gray-900">
                  {totals.outgoingReferrals}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Deaths</p>
                <p className="text-lg font-semibold text-gray-900">
                  {totals.deaths}
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr className="border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    OPD
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    ER
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Admissions
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Discharges
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    In Ref
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Out Ref
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Deaths
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Entered By
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredMetrics.map((metric, index) => (
                    <tr
                      key={metric.id}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {new Date(metric.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {metric.opdPatients}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {metric.erPatients}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {metric.admissions}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {metric.discharges}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {metric.incomingReferrals}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {metric.outgoingReferrals}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {metric.deaths}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {metric.enteredBy}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              navigate(`/patient-flow/edit/${metric.id}`)
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(metric)}
                            className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {filteredMetrics.length} of {metrics.length} records
            </p>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteDialogOpen && metricToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white max-w-2xl w-full mx-4 border-2 border-gray-300 shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
                <h3 className="text-xl font-semibold text-red-900">
                  Confirm Deletion
                </h3>
                <button
                  onClick={cancelDelete}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-700">
                  You are about to delete the following patient flow metrics
                  entry:
                </p>

                {/* Details Box */}
                <div className="bg-gray-50 border border-gray-300 p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Date:</span>{" "}
                      <span className="text-gray-900">
                        {new Date(metricToDelete.date).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        Entered By:
                      </span>{" "}
                      <span className="text-gray-900">
                        {metricToDelete.enteredBy}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        OPD Patients:
                      </span>{" "}
                      <span className="text-gray-900">
                        {metricToDelete.opdPatients}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        ER Patients:
                      </span>{" "}
                      <span className="text-gray-900">
                        {metricToDelete.erPatients}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        Admissions:
                      </span>{" "}
                      <span className="text-gray-900">
                        {metricToDelete.admissions}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        Discharges:
                      </span>{" "}
                      <span className="text-gray-900">
                        {metricToDelete.discharges}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        Incoming Referrals:
                      </span>{" "}
                      <span className="text-gray-900">
                        {metricToDelete.incomingReferrals}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        Outgoing Referrals:
                      </span>{" "}
                      <span className="text-gray-900">
                        {metricToDelete.outgoingReferrals}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        Deaths:
                      </span>{" "}
                      <span className="text-gray-900">
                        {metricToDelete.deaths}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirmation Instructions */}
                <div className="bg-yellow-50 border border-yellow-300 p-4">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">
                    To confirm deletion, copy and paste the following ID:
                  </p>
                  <div className="bg-white border border-gray-300 p-2 font-mono text-sm text-gray-900 select-all">
                    {metricToDelete.id}
                  </div>
                </div>

                {/* Confirmation Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paste the ID here to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Paste ID here"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={cancelDelete}
                  className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={confirmText !== metricToDelete.id}
                  className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
