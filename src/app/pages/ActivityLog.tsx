import { useState, useMemo } from "react";
import { useAppSelector } from "../../store/hooks";
import { useActivityLogsQuery } from "../../services/useActivityLogQueries";
import { Header } from "../components/Header";
import {
  Activity,
  User,
  FileText,
  Stethoscope,
  Package,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  TrendingUp,
} from "lucide-react";

type AuditLog = {
  id: string;
  userName?: string;
  createdBy?: string;
  entityName?: string;
  entityType: string;
  module:
    | "PATIENT"
    | "FPE"
    | "CONSULTATION"
    | "INVENTORY"
    | "DOCUMENT"
    | "SYSTEM"
    | "PATIENT_FLOW";
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  details?: string;
  timestamp?: string;
  createdAt?: string;
  documentsCount?: number;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
};

const moduleIcons = {
  PATIENT: User,
  FPE: FileText,
  CONSULTATION: Stethoscope,
  INVENTORY: Package,
  DOCUMENT: FileText,
  SYSTEM: Activity,
  PATIENT_FLOW: TrendingUp,
};

const actionColors = {
  CREATE: "bg-green-100 text-green-800 border-green-300",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-300",
  DELETE: "bg-red-100 text-red-800 border-red-300",
  VIEW: "bg-gray-100 text-gray-800 border-gray-300",
};

const actionIcons = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  VIEW: Eye,
};

export function ActivityLog() {
  const storeLogs = useAppSelector((state) => state.auditLog.logs);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState<string>("ALL");
  const [filterAction, setFilterAction] = useState<string>("ALL");

  const { data } = useActivityLogsQuery({
    search: searchQuery || undefined,
    module: filterModule === "ALL" ? undefined : filterModule,
    action: filterAction === "ALL" ? undefined : filterAction,
    page: 1,
    limit: 100,
  });

  const logs: AuditLog[] = data?.logs ?? storeLogs;
  const totalCount = data?.total ?? logs.length;

  const filteredLogs = useMemo(() => {
    if (data) return data.logs;

    return logs.filter((log) => {
      const matchesSearch =
        searchQuery === "" ||
        (log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ??
          false) ||
        (log.createdBy?.toLowerCase().includes(searchQuery.toLowerCase()) ??
          false) ||
        log.entityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModule =
        filterModule === "ALL" || log.module === filterModule;
      const matchesAction =
        filterAction === "ALL" || log.action === filterAction;

      return matchesSearch && matchesModule && matchesAction;
    });
  }, [data, logs, searchQuery, filterModule, filterAction]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Activity Log"
        subtitle="View system activity and user actions"
      />

      <div className="p-4 md:p-8">
        {/* Filters */}
        <div className="bg-white border border-gray-200 mb-6 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by user, entity, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none"
              >
                <option value="ALL">All Modules</option>
                <option value="PATIENT">Patient Registry</option>
                <option value="FPE">FPE Records</option>
                <option value="CONSULTATION">Consultations</option>
                <option value="INVENTORY">Inventory</option>
                <option value="DOCUMENT">Documents</option>
                <option value="PATIENT_FLOW">Patient Flow</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none"
              >
                <option value="ALL">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="VIEW">View</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white border border-gray-200">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">
                {logs.length === 0
                  ? "No activity logs yet. Actions will appear here as users interact with the system."
                  : "No activities found matching your filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log: AuditLog) => {
                const ModuleIcon = moduleIcons[log.module];
                const ActionIcon = actionIcons[log.action];

                return (
                  <div
                    key={log.id}
                    className="p-4 md:p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <ModuleIcon size={20} className="text-blue-600" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-gray-900">
                                {log.createdBy || log.userName}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border ${actionColors[log.action]}`}
                              >
                                <ActionIcon size={12} />
                                {log.action}
                              </span>
                              <span className="text-sm text-gray-600">
                                {log.entityType}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">
                              {log.details ||
                                `${log.action.toLowerCase()}d ${log.entityType}`}
                            </p>
                            {typeof log.documentsCount === "number" &&
                              log.documentsCount > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                  <span className="font-medium">
                                    Attachments:
                                  </span>{" "}
                                  {log.documentsCount}
                                </p>
                              )}
                            {log.entityName && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Entity:</span>{" "}
                                {log.entityName}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-xs text-gray-500">
                            {formatTimestamp(
                              log.createdAt ?? log.timestamp ?? "",
                            )}
                          </div>
                        </div>

                        {/* Changes */}
                        {log.changes && log.changes.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 text-xs">
                            <p className="font-semibold text-gray-700 mb-2">
                              Changes:
                            </p>
                            <div className="space-y-1">
                              {log.changes
                                ?.slice(0, 5)
                                .map((change, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2"
                                  >
                                    <span className="font-medium text-gray-700 min-w-[100px]">
                                      {change.field}:
                                    </span>
                                    <div className="flex-1">
                                      <span className="text-red-600 line-through">
                                        {change.oldValue || "(empty)"}
                                      </span>
                                      <span className="mx-2">→</span>
                                      <span className="text-green-600">
                                        {change.newValue || "(empty)"}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              {log.changes.length > 5 && (
                                <p className="text-gray-500 italic mt-1">
                                  +{log.changes.length - 5} more changes
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary Footer */}
          {filteredLogs.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Total Activities:</span>{" "}
                {filteredLogs.length}
                {typeof totalCount === "number" &&
                  filteredLogs.length !== totalCount && (
                    <span className="text-gray-500">
                      {" "}
                      (filtered from {totalCount} total)
                    </span>
                  )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
