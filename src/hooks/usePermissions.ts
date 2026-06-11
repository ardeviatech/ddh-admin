import { useAppSelector } from "../store/hooks";

export const useHasPermission = (moduleKey: string, permissionKey = "view") => {
  const authUser = useAppSelector((s) => s.auth.user as any | null);
  const users = useAppSelector((s) => (s as any).users?.users || []);

  // Use permissions object only — do NOT treat the whole user object as permissions
  const permissions = authUser?.permissions || {};

  // prefer auth user permissions if present
  const modulePerms = permissions?.[moduleKey];
  if (modulePerms !== undefined) {
    if (typeof modulePerms === "boolean") return !!modulePerms;

    // queueManagement legacy: departments map
    if (moduleKey === "queueManagement") {
      // If explicit flag present
      if (modulePerms[permissionKey] !== undefined) {
        const r = !!modulePerms[permissionKey];
        // Debug
        // eslint-disable-next-line no-console
        console.debug("useHasPermission: queueManagement explicit flag", {
          moduleKey,
          permissionKey,
          result: r,
          modulePerms,
        });
        return r;
      }

      // If departments map present and checking view, allow if any dept true
      const deptMap = modulePerms.departments || modulePerms;
      if (permissionKey === "view" && typeof deptMap === "object") {
        const r = Object.values(deptMap).some((v: any) => v === true);
        // eslint-disable-next-line no-console
        console.debug("useHasPermission: queueManagement deptMap view", {
          moduleKey,
          permissionKey,
          result: r,
          deptMap,
        });
        return r;
      }

      // Fallback: map create/edit/delete to queueActions
      const queueActions = permissions["queueActions"] || {};
      const mapping: Record<string, string> = {
        create: "canAddPatients",
        edit: "canEditPatients",
        delete: "canRemovePatients",
      };
      const mappedKey = mapping[permissionKey];
      if (mappedKey && queueActions[mappedKey] === true) {
        // eslint-disable-next-line no-console
        console.debug("useHasPermission: queueActions fallback allowed", {
          moduleKey,
          permissionKey,
          mappedKey,
          queueActions,
        });
        return true;
      }

      const r = !!modulePerms[permissionKey];
      // eslint-disable-next-line no-console
      console.debug("useHasPermission: queueManagement final check", {
        moduleKey,
        permissionKey,
        result: r,
        modulePerms,
        queueActions,
      });
      return r;
    }

    return !!modulePerms[permissionKey];
  }

  // fallback: find full user from users list
  const stored = users.find(
    (u: any) => u.id === authUser?.id || u.email === authUser?.email,
  );
  if (stored && stored.permissions) {
    const m = (stored.permissions || {})[moduleKey];
    if (m === undefined) return false;
    if (typeof m === "boolean") return !!m;
    return !!m[permissionKey];
  }

  return false;
};
