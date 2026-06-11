import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useUserQuery,
  useUpdateUserMutation,
} from "../../services/useUserQueries";
import { Header } from "../components/Header";
import type { UserPermissions } from "../../store/slices/usersSlice";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationModal } from "../components/ConfirmationModal";

type UserRole = "Administrator" | "Doctor" | "Nurse" | "Staff";

const isValidRole = (value: string): value is UserRole => {
  return ["Administrator", "Doctor", "Nurse", "Staff"].includes(value);
};

const normalizeRole = (role: string | undefined): UserRole => {
  if (!role || !isValidRole(role)) {
    return "Staff";
  }
  return role;
};

// Define permissions for each module based on actual functionality
const moduleConfig = {
  dashboard: {
    label: "Dashboard",
    permissions: [{ key: "view", label: "View" }],
  },
  patientRegistry: {
    label: "Patient Registry",
    permissions: [
      { key: "view", label: "View" },
      { key: "registerNewPatient", label: "Register New Patient" },
      { key: "editPatient", label: "Edit Patient" },
    ],
  },
  fpe: {
    label: "First Patient Encounter",
    permissions: [
      { key: "view", label: "View" },
      { key: "registerNewFPE", label: "Register New FPE" },
      { key: "edit", label: "Edit" },
      { key: "uploadDocuments", label: "Upload Documents" },
      { key: "viewDocuments", label: "View Documents" },
      { key: "downloadDocuments", label: "Download Documents" },
      { key: "deleteDocuments", label: "Delete Documents" },
      { key: "downloadFPEData", label: "Download FPE Data" },
      { key: "viewConsultationRecord", label: "View Consultation Record" },
      { key: "createConsultation", label: "Create Consultation" },
      { key: "editConsultation", label: "Edit Consultation" },
      {
        key: "uploadConsultationDocuments",
        label: "Upload Consultation Documents",
      },
      { key: "downloadConsultation", label: "Download Consultation" },
    ],
  },
  inventory: {
    label: "Inventory",
    permissions: [
      { key: "viewInventory", label: "View Inventory" },
      { key: "addInventoryItem", label: "Add Inventory Item" },
      { key: "editInventory", label: "Edit Inventory" },
      { key: "viewStockMovements", label: "View Stock Movements" },
    ],
  },
  activityLog: {
    label: "Activity Log",
    permissions: [{ key: "view", label: "View" }],
  },
  patientSurveys: {
    label: "Patient Surveys",
    permissions: [{ key: "view", label: "View" }],
  },
  patientFlowMetrics: {
    label: "Patient Flow Metrics",
    permissions: [
      { key: "view", label: "View" },
      { key: "add", label: "Add" },
      { key: "edit", label: "Edit" },
    ],
  },
  queueManagement: {
    label: "Queueing Management",
    permissions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
  },
  settings: {
    label: "Settings",
    permissions: [
      { key: "view", label: "View" },
      { key: "add", label: "Add" },
      { key: "edit", label: "Edit" },
    ],
  },
};

export function EditUser() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useUserQuery(userId || "");
  const updateMutation = useUpdateUserMutation();

  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("Staff");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [permissions, setPermissions] = useState<UserPermissions>(
    {} as UserPermissions,
  );

  useEffect(() => {
    if (!user) return;

    setName(user.name || "");
    setRole(normalizeRole(user.role));
    setStatus(user.status === "Inactive" ? "Inactive" : "Active");
    setPermissions(user.permissions || ({} as UserPermissions));
  }, [user]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<
    "Active" | "Inactive" | null
  >(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Edit User" />
        <div className="p-8 text-center">
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="User Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center max-w-2xl mx-auto">
            <p className="text-gray-600 mb-4">
              The user you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/settings/users")}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to User Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  const togglePermission = (
    module: keyof UserPermissions,
    permission: string,
  ) => {
    const modulePerm = (permissions[module] as any) || {};
    const current = !!modulePerm[permission];
    setPermissions({
      ...permissions,
      [module]: {
        ...modulePerm,
        [permission]: !current,
      },
    } as UserPermissions);
  };

  // Helper: derive module permissions (handles legacy queue shapes)
  const deriveModulePermissions = (
    moduleKey: string,
    perms: UserPermissions,
    configPerms: any[],
  ) => {
    const raw = (perms as any)[moduleKey] || {};
    const queueActions = (perms as any)["queueActions"] || {};
    const mapping: Record<string, string> = {
      create: "canAddPatients",
      edit: "canEditPatients",
      delete: "canRemovePatients",
    };

    const result: Record<string, boolean> = {};
    configPerms.forEach((p) => {
      const key = p.key;
      if (raw[key] !== undefined) {
        result[key] = !!raw[key];
        return;
      }

      if (moduleKey === "queueManagement") {
        if (key === "view") {
          const deptMap = raw.departments || raw;
          if (deptMap && typeof deptMap === "object") {
            result.view = Object.values(deptMap).some((v: any) => v === true);
            return;
          }
        }

        const mappedKey = mapping[key];
        if (mappedKey && queueActions[mappedKey] === true) {
          result[key] = true;
          return;
        }
      }

      result[key] = false;
    });

    // Preserve nested departments if present
    if (raw && raw.departments) result.departments = raw.departments;

    return result;
  };

  const confirmStatusChange = () => {
    if (pendingStatus) {
      setStatus(pendingStatus);
      setShowStatusModal(false);
      setPendingStatus(null);
    }
  };

  const toggleFullModuleAccess = (moduleKey: keyof UserPermissions) => {
    const modulePermissions = permissions[moduleKey] || {};
    const topLevelKeys = Object.keys(modulePermissions).filter(
      (k) => k !== "departments",
    );

    if (topLevelKeys.length === 0) {
      // derive keys from config — preserve departments if present
      const cfgKeys =
        (moduleConfig as any)[moduleKey]?.permissions?.map((p: any) => p.key) ||
        [];
      const allEnabled = cfgKeys.every(
        (key: string) => (modulePermissions as any)[key] === true,
      );
      const updated: any = {};
      cfgKeys.forEach((k: string) => (updated[k] = !allEnabled));
      if ((modulePermissions as any).departments)
        updated.departments = (modulePermissions as any).departments;
      setPermissions({
        ...permissions,
        [moduleKey]: updated,
      } as UserPermissions);
      return;
    }

    const allEnabled = topLevelKeys.every(
      (key) => (modulePermissions as any)[key] === true,
    );
    const updatedModulePermissions = { ...modulePermissions } as any;
    topLevelKeys.forEach((key) => {
      updatedModulePermissions[key] = !allEnabled;
    });

    setPermissions({
      ...permissions,
      [moduleKey]: updatedModulePermissions,
    } as UserPermissions);
  };

  const isModuleFullyEnabled = (moduleKey: keyof UserPermissions) => {
    const cfgPerms = (moduleConfig as any)[moduleKey]?.permissions || [];
    const modulePermissions = deriveModulePermissions(
      moduleKey,
      permissions,
      cfgPerms,
    );
    const topLevelKeys = Object.keys(modulePermissions).filter(
      (k) => k !== "departments",
    );
    if (topLevelKeys.length === 0) return false;
    return topLevelKeys.every((k) => (modulePermissions as any)[k] === true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      name,
      role,
      status,
      permissions,
    };

    try {
      await updateMutation.mutateAsync({ id: userId as string, payload });
      navigate("/settings/users");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to update user",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Edit User"
        subtitle="Update user account and permissions"
      />

      <div className="p-8">
        <button
          onClick={() => navigate("/settings/users")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to User Management
        </button>

        <form onSubmit={handleSaveUser} className="max-w-6xl mx-auto">
          <div className="bg-white border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                User Information
              </h2>
              <p className="text-sm text-gray-600 mt-1">User ID: {user.id}</p>
              {user.registeredBy?.name && (
                <p className="text-sm text-gray-600 mt-1">
                  Registered by: {user.registeredBy.name}
                </p>
              )}
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex items-center gap-3 h-10">
                    <button
                      type="button"
                      onClick={() => {
                        const newStatus =
                          status === "Active" ? "Inactive" : "Active";
                        setPendingStatus(newStatus);
                        setShowStatusModal(true);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        status === "Active" ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          status === "Active"
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-700">{status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Module Access Control
              </h2>
            </div>

            <div className="p-6 space-y-3">
              {Object.entries(moduleConfig).map(([moduleKey, config]) => {
                const modulePermissions = deriveModulePermissions(
                  moduleKey,
                  permissions,
                  config.permissions || [],
                );

                return (
                  <div
                    key={moduleKey}
                    className="bg-gray-50 border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-sm text-gray-900">
                        {config.label}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          toggleFullModuleAccess(
                            moduleKey as keyof UserPermissions,
                          )
                        }
                        className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-600 transition-colors"
                      >
                        {isModuleFullyEnabled(
                          moduleKey as keyof UserPermissions,
                        )
                          ? "Revoke All"
                          : "Grant Full Access"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {config.permissions.map((perm) => (
                        <div key={perm.key} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              togglePermission(
                                moduleKey as keyof UserPermissions,
                                perm.key,
                              )
                            }
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              modulePermissions[perm.key]
                                ? "bg-blue-600"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                modulePermissions[perm.key]
                                  ? "translate-x-5"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span className="text-xs text-gray-700">
                            {perm.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/settings/users")}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setPendingStatus(null);
        }}
        onConfirm={confirmStatusChange}
        title={status === "Active" ? "Deactivate User" : "Activate User"}
        message={
          status === "Active"
            ? "Are you sure you want to deactivate this user? The user will no longer be able to access the system."
            : "Are you sure you want to activate this user? The user will be able to access the system."
        }
        confirmText={status === "Active" ? "Deactivate" : "Activate"}
        type={status === "Active" ? "danger" : "success"}
      />
    </div>
  );
}
