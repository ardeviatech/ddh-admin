import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { useInventoryItemsQuery } from "../../services/useInventoryQueries";
import type { Patient } from "../../store/slices/patientsSlice";
import type { FPERecord } from "../../store/slices/fpeSlice";
import type { ConsultationRecord } from "../../store/slices/consultationSlice";
import type { InventoryItem } from "../../store/slices/inventorySlice";
import { Header } from "../components/Header";
import { useHasPermission } from "../../hooks/usePermissions";
import {
  Users,
  FileText,
  Stethoscope,
  Package,
  AlertTriangle,
} from "lucide-react";
import { useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket, initSocket } from "../../lib/socket";
import { addPatient, updatePatient } from "../../store/slices/patientsSlice";
import { addFPE, updateFPE } from "../../store/slices/fpeSlice";
import {
  addConsultation,
  updateConsultation,
  deleteConsultation,
} from "../../store/slices/consultationSlice";
import { inventoryKeys } from "../../services/useInventoryQueries";
import { useQuery } from "@tanstack/react-query";
import { fetchFPEs } from "../../services/fpeService";
import { fetchConsultations } from "../../services/consultationService";

export function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const patients = useAppSelector((state) => state.patients.patients);
  const fpeRecords = useAppSelector((state) => state.fpe.fpeRecords);
  const consultations = useAppSelector(
    (state) => state.consultation.consultations,
  );
  const { data: inventoryItems = [] } = useInventoryItemsQuery();

  // Calculate low stock items
  const lowStockCount = useMemo(() => {
    return (inventoryItems as InventoryItem[]).filter(
      (item) => item?.status === "Low Stock" || item?.status === "Out of Stock",
    ).length;
  }, [inventoryItems]);

  // Calculate recent activities
  type Activity =
    | { type: "patient"; timestamp: number; id: string; data: Patient }
    | { type: "fpe"; timestamp: number; id: string; data: FPERecord }
    | {
        type: "consultation";
        timestamp: number;
        id: string;
        data: ConsultationRecord;
      }
    | { type: "inventory"; timestamp: number; id: string; data: InventoryItem };

  const recentActivities = useMemo<Activity[]>(() => {
    const safeDate = (value: unknown) => {
      const d = value ? new Date(value as string) : new Date();
      const t = d.getTime();
      return Number.isFinite(t) ? t : Date.now();
    };

    const allActivities: Activity[] = [
      ...patients.map((p) => ({
        type: "patient" as const,
        timestamp: safeDate(p.createdAt),
        id: p.patientId,
        data: p,
      })),
      ...fpeRecords.map((f) => ({
        type: "fpe" as const,
        timestamp: safeDate(f.dateCreated),
        id: f.caseNumber,
        data: f,
      })),
      ...consultations.map((c) => ({
        type: "consultation" as const,
        timestamp: safeDate(c.consultationDate),
        id: c.id,
        data: c,
      })),
      ...((inventoryItems as InventoryItem[]) || []).map((i) => ({
        type: "inventory" as const,
        timestamp: safeDate(i.lastUpdatedDate),
        id: i.id,
        data: i,
      })),
    ];

    return allActivities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  }, [patients, fpeRecords, consultations, inventoryItems]);

  type Stat = {
    title: string;
    value: string;
    icon: any;
    color: string;
    subtitle?: string;
  };

  const stats: Stat[] = [
    {
      title: "Total Patients",
      value: patients.length.toString(),
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "FPE Records",
      value: fpeRecords.length.toString(),
      icon: FileText,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Consultations",
      value: consultations.length.toString(),
      icon: Stethoscope,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Inventory Items",
      value: inventoryItems.length.toString(),
      icon: Package,
      color: "bg-orange-50 text-orange-600",
      subtitle:
        lowStockCount > 0
          ? `${lowStockCount} Low/Out of Stock`
          : "All in Stock",
    },
  ];

  // Fetch FPE count for dashboard (use meta.total for efficient count)
  const { data: fpeQueryData } = useQuery({
    queryKey: ["fpe", "dashboard", "count"],
    queryFn: () => fetchFPEs({ latest: true, limit: 1 }),
    staleTime: 1000 * 60 * 2,
  });

  const fpeCount = fpeQueryData?.meta?.total ?? fpeRecords.length;
  // Fetch consultation count for dashboard
  const { data: consultationQueryData } = useQuery({
    queryKey: ["consultations", "dashboard", "count"],
    queryFn: () => fetchConsultations({ page: 1, limit: 1 }),
    staleTime: 1000 * 60 * 2,
  });

  const consultationCount =
    consultationQueryData?.meta?.total ?? consultations.length;

  // replace value in stats array with fetched counts
  stats[1].value = String(fpeCount || 0);
  stats[2].value = String(consultationCount || 0);

  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch (err) {
      socket = initSocket();
    }

    socket.on("patientCreated", (payload: any) => {
      try {
        dispatch(addPatient(payload));
      } catch (e) {
        console.warn("patientCreated handler error", e);
      }
    });

    socket.on("patientUpdated", (payload: any) => {
      try {
        dispatch(updatePatient(payload));
      } catch (e) {
        console.warn("patientUpdated handler error", e);
      }
    });

    socket.on("fpeCreated", (payload: any) => {
      try {
        dispatch(addFPE(payload));
      } catch (e) {
        console.warn("fpeCreated handler error", e);
      }
    });

    socket.on("fpeUpdated", (payload: any) => {
      try {
        dispatch(updateFPE(payload));
      } catch (e) {
        console.warn("fpeUpdated handler error", e);
      }
    });

    socket.on("consultationCreated", (payload: any) => {
      try {
        dispatch(addConsultation(payload));
      } catch (e) {
        console.warn("consultationCreated handler error", e);
      }
    });

    socket.on("consultationUpdated", (payload: any) => {
      try {
        dispatch(updateConsultation(payload));
      } catch (e) {
        console.warn("consultationUpdated handler error", e);
      }
    });

    socket.on("consultationDeleted", (payload: any) => {
      try {
        // payload: { consultationNumber }
        // backend emits consultationNumber; map to frontend id if available
        dispatch(deleteConsultation(payload.consultationNumber || payload));
      } catch (e) {
        console.warn("consultationDeleted handler error", e);
      }
    });

    socket.on("inventoryCreated", () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list() });
    });

    socket.on("inventoryUpdated", (payload: any) => {
      try {
        queryClient.invalidateQueries({ queryKey: inventoryKeys.list() });
        if (payload?.id) {
          queryClient.setQueryData(inventoryKeys.detail(payload.id), payload);
        }
      } catch (e) {
        console.warn("inventoryUpdated handler error", e);
      }
    });

    return () => {
      try {
        socket.off("patientCreated");
        socket.off("patientUpdated");
        socket.off("fpeCreated");
        socket.off("fpeUpdated");
        socket.off("consultationCreated");
        socket.off("consultationUpdated");
        socket.off("consultationDeleted");
        socket.off("inventoryCreated");
        socket.off("inventoryUpdated");
      } catch (e) {
        /* ignore */
      }
    };
  }, [dispatch, queryClient]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Dashboard"
        subtitle="Welcome to Dupax District Hospital Yakap System"
      />

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p
                      className={`text-xs mt-1 ${
                        stat.subtitle.includes("Low")
                          ? "text-orange-600 font-semibold"
                          : "text-gray-500"
                      }`}
                    >
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={`p-3 ${stat.color}`}>
                  {(() => {
                    const Icon = stat.icon as any;
                    return <Icon size={24} />;
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activities
            </h3>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No recent activities
                </p>
              ) : (
                recentActivities.map((activity) => {
                  let color, text, subtext;

                  if (activity.type === "patient") {
                    const patient = activity.data as any;
                    color = "bg-blue-600";
                    text = `New patient registered: ${patient.firstName} ${patient.lastName}`;
                    subtext = new Date(patient.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    );
                  } else if (activity.type === "fpe") {
                    const fpe = activity.data as any;
                    color = "bg-green-600";
                    text = `New FPE created: ${fpe.patientName}`;
                    subtext = `Case #${fpe.caseNumber}`;
                  } else if (activity.type === "consultation") {
                    const consultation = activity.data as any;
                    color = "bg-purple-600";
                    text = `Consultation: ${consultation.patientName}`;
                    subtext = new Date(
                      consultation.consultationDate,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  } else {
                    const item = activity.data as any;
                    color = "bg-orange-600";
                    text = `Inventory updated: ${item.itemName}`;
                    subtext = `Stock: ${item.stockLevel} ${item.unit} • ${item.status}`;
                  }

                  return (
                    <div
                      key={`activity-${activity.type}-${activity.id}`}
                      className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
                    >
                      <div className={`w-2 h-2 ${color} mt-2`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{text}</p>
                        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {useHasPermission("patientRegistry", "registerNewPatient") && (
                <button
                  onClick={() => navigate("/patients/new")}
                  className="w-full px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-left"
                >
                  Register New Patient
                </button>
              )}
              {useHasPermission("fpe", "registerNewFPE") && (
                <button
                  onClick={() => navigate("/fpe/new")}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  Create New FPE
                </button>
              )}
              {useHasPermission("inventory", "addInventoryItem") && (
                <button
                  onClick={() => navigate("/inventory/new")}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  Add Inventory Item
                </button>
              )}
              <button
                onClick={() => navigate("/inventory")}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                View Inventory
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Alerts */}
        {lowStockCount > 0 && (
          <div className="mt-4 md:mt-6">
            <div className="bg-white border border-orange-300 p-4 md:p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle size={24} className="text-orange-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Inventory Alerts
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} require
                    {lowStockCount === 1 ? "s" : ""} attention
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {inventoryItems
                  .filter(
                    (item: InventoryItem) =>
                      item.status === "Low Stock" ||
                      item.status === "Out of Stock",
                  )
                  .slice(0, 5)
                  .map((item: InventoryItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.itemName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Current: {item.stockLevel} {item.unit} | Reorder
                          Level: {item.reorderLevel} {item.unit}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold ${
                          item.status === "Out of Stock"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : "bg-orange-100 text-orange-800 border border-orange-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                {lowStockCount > 5 && (
                  <button
                    onClick={() => navigate("/inventory")}
                    className="w-full px-4 py-2 text-sm text-orange-600 hover:text-orange-700 font-semibold text-center"
                  >
                    View All {lowStockCount} Items →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
