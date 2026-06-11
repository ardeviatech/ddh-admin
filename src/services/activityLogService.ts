import axiosInstance from "../api/axiosInstance";

export interface ActivityLogChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export type ActivityLogModule =
  | "PATIENT"
  | "FPE"
  | "CONSULTATION"
  | "INVENTORY"
  | "DOCUMENT"
  | "SYSTEM"
  | "PATIENT_FLOW";

export interface ActivityLogEntry {
  id: string;
  module: ActivityLogModule;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: string;
  changes?: ActivityLogChange[];
  createdBy?: string;
  createdAt: string;
  documentsCount?: number;
  ipAddress?: string;
}

export interface ActivityLogQueryResponse {
  logs: ActivityLogEntry[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateActivityLogPayload {
  module: ActivityLogModule;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: string;
  changes?: ActivityLogChange[];
  ipAddress?: string;
}

export const fetchActivityLogs = async (
  params: {
    search?: string;
    module?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
    includeDocumentCount?: boolean;
  } = {},
): Promise<ActivityLogQueryResponse> => {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.module) queryParams.append("module", params.module);
  if (params.action) queryParams.append("action", params.action);
  if (params.entityType) queryParams.append("entityType", params.entityType);
  if (params.entityId) queryParams.append("entityId", params.entityId);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.includeDocumentCount)
    queryParams.append("includeDocumentCount", "true");

  const response = await axiosInstance.get(
    `/activity-log?${queryParams.toString()}`,
  );
  return response.data.data as ActivityLogQueryResponse;
};

export const createActivityLog = async (
  payload: CreateActivityLogPayload,
): Promise<ActivityLogEntry> => {
  const response = await axiosInstance.post("/activity-log", payload);
  return response.data.data as ActivityLogEntry;
};
