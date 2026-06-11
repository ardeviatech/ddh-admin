import type { AnyAction, Middleware } from "redux";
import type { AuditLog } from "../slices/auditLogSlice";
import { addAuditLog } from "../slices/auditLogSlice";
import { createActivityLog } from "../../services/activityLogService";
import { toast } from "sonner";

type AuditLogPayload = Omit<AuditLog, "id" | "timestamp">;

export const auditLogMiddleware: Middleware =
  (_store) => (next) => async (action) => {
    const result = next(action);
    const typedAction = action as AnyAction;

    if (typedAction.type === addAuditLog.type) {
      const payload = typedAction.payload as AuditLogPayload;
      try {
        await createActivityLog({
          module: payload.module,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          entityName: payload.entityName,
          details: payload.details,
          changes: payload.changes,
          ipAddress: payload.ipAddress,
        });
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          "Unable to persist activity log to server";
        toast.error(message);
      }
    }

    return result;
  };
