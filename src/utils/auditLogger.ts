import { type AppDispatch } from '../store/store';
import { addAuditLog } from '../store/slices/auditLogSlice';

interface LogActionParams {
  dispatch: AppDispatch;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  module: 'PATIENT' | 'FPE' | 'CONSULTATION' | 'INVENTORY' | 'DOCUMENT' | 'SYSTEM';
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}

export const logAction = (params: LogActionParams) => {
  const {
    dispatch,
    userId,
    userName,
    action,
    module,
    entityType,
    entityId,
    entityName,
    details,
    changes,
  } = params;

  dispatch(
    addAuditLog({
      userId,
      userName,
      action,
      module,
      entityType,
      entityId,
      entityName,
      details,
      changes,
    })
  );
};

// Helper to detect changes between old and new objects
export const detectChanges = (
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  fieldsToTrack?: string[]
): { field: string; oldValue: string; newValue: string }[] => {
  const changes: { field: string; oldValue: string; newValue: string }[] = [];
  const keysToCheck = fieldsToTrack || Object.keys(newObj);

  keysToCheck.forEach((key) => {
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (oldValue !== newValue) {
      changes.push({
        field: key,
        oldValue: String(oldValue ?? ''),
        newValue: String(newValue ?? ''),
      });
    }
  });

  return changes;
};
