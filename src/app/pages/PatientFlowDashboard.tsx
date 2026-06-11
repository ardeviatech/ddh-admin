import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePatientFlowMetricsQuery } from "../../services/usePatientFlowQueries";
import { usePatientFlowRealtime } from "../hooks/usePatientFlowRealtime";
import { Header } from "../components/Header";
import { Plus, History } from "lucide-react";

export function PatientFlowDashboard() {
  const navigate = useNavigate();
  const { data: metrics = [] } = usePatientFlowMetricsQuery();
  usePatientFlowRealtime();

  // Get today's metrics entries and totals
  const today = new Date().toISOString().split("T")[0];
  const { todayMetrics, latestEnteredBy, entryCount } = useMemo(() => {
    const todays = metrics.filter((m) => m.date === today);
    const totals = todays.reduce(
      (acc, metric) => ({
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

    const sortedByCreated = [...todays].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      todayMetrics: totals,
      latestEnteredBy: sortedByCreated[0]?.enteredBy || "Unknown",
      entryCount: todays.length,
    };
  }, [metrics, today]);

  const hasTodayMetrics = entryCount > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Patient Flow Metrics"
        subtitle="Daily patient statistics and flow monitoring"
      />

      <div className="p-4 md:p-8">
        {/* Data Entry Status */}
        <div className="bg-white border border-gray-200 p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h2>
            <p
              className={`text-lg ${hasTodayMetrics ? "text-green-600" : "text-orange-600"}`}
            >
              {hasTodayMetrics
                ? `✓ Data recorded by ${latestEnteredBy}${
                    entryCount > 1 ? ` (${entryCount} entries)` : ""
                  }`
                : "⚠ No data entered yet for today"}
            </p>
          </div>

          {/* Today's Metrics Display */}
          {hasTodayMetrics && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Today's Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
                <div>
                  <p className="text-sm text-gray-600">OPD Patients</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {todayMetrics.opdPatients}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ER Patients</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {todayMetrics.erPatients}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admissions</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {todayMetrics.admissions}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Discharges</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {todayMetrics.discharges}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Incoming Referrals</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {todayMetrics.incomingReferrals}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Outgoing Referrals</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {todayMetrics.outgoingReferrals}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deaths</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {todayMetrics.deaths}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/patient-flow/new")}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Enter New Metrics</span>
            </button>
            <button
              onClick={() => navigate("/patient-flow/history")}
              className="flex items-center justify-center gap-3 px-6 py-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <History size={20} />
              <span>View All Records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
