import { useState, useMemo } from "react";
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../../services/useUserQueries";
import { defaultPermissions } from "../../store/slices/usersSlice";
import type { User, UserPermissions } from "../../store/slices/usersSlice";
import type { UserBrief } from "../../services/userService";
import { Header } from "../components/Header";
import { Search, Plus, Edit, Shield, UserX, X } from "lucide-react";
import { toast } from "sonner";

type QueueUser = User | UserBrief;

const isUser = (user: QueueUser): user is User =>
  typeof user === "object" && user !== null && "password" in user;

export function UserManagement() {
  const { data: queryUsers } = useUsersQuery();
  const users: QueueUser[] = queryUsers ?? [];
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<QueueUser | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<
    "Administrator" | "Doctor" | "Nurse" | "Staff"
  >("Staff");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [permissions, setPermissions] =
    useState<UserPermissions>(defaultPermissions);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
      const matchesSearch =
        searchQuery === "" ||
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = filterRole === "ALL" || user.role === filterRole;
      const matchesStatus =
        filterStatus === "ALL" || user.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setDepartment("");
    setRole("Staff");
    setStatus("Active");
    setPermissions(defaultPermissions);
    setModalOpen(true);
  };

  const handleOpenEditModal = (user: QueueUser) => {
    setEditingUser(user);
    setFullName(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
    setEmail(user.email ?? "");
    setPassword(isUser(user) ? user.password : "");
    setDepartment(user.department ?? "");

    const normalizedRole =
      user.role === "Administrator" ||
      user.role === "Doctor" ||
      user.role === "Nurse" ||
      user.role === "Staff"
        ? user.role
        : "Staff";
    setRole(normalizedRole);

    const normalizedStatus =
      user.status === "Active" || user.status === "Inactive"
        ? user.status
        : "Active";
    setStatus(normalizedStatus);

    setPermissions(user.permissions ?? defaultPermissions);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async () => {
    if (!fullName || !email || !password || !department) {
      toast.error("Please fill in all required fields");
      return;
    }

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ") || "";

    const payload = {
      firstName,
      lastName,
      email,
      password,
      department,
      role,
      status,
      permissions,
    };

    try {
      if (editingUser) {
        await updateMutation.mutateAsync({ id: editingUser.id, payload });
        toast.success("User updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("User added successfully");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to save user",
      );
    }

    handleCloseModal();
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      await updateMutation.mutateAsync({
        id: userId,
        payload: { status: currentStatus === "Active" ? "Inactive" : "Active" },
      });
      toast.success("User status updated");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update status",
      );
    }
  };

  const accessModules = [
    { key: "dashboard", label: "Dashboard", permissions: ["view"] as const },
    {
      key: "patientRegistry",
      label: "Patient Registry",
      permissions: ["view", "registerNewPatient", "editPatient"] as const,
    },
    {
      key: "fpe",
      label: "First Patient Encounter",
      permissions: [
        "view",
        "registerNewFPE",
        "edit",
        "uploadDocuments",
        "viewDocuments",
        "downloadDocuments",
        "deleteDocuments",
        "downloadFPEData",
        "viewConsultationRecord",
        "createConsultation",
        "editConsultation",
        "uploadConsultationDocuments",
        "downloadConsultation",
      ] as const,
    },
    {
      key: "inventory",
      label: "Inventory",
      permissions: [
        "viewInventory",
        "addInventoryItem",
        "editInventory",
        "viewStockMovements",
      ] as const,
    },
    {
      key: "activityLog",
      label: "Activity Log",
      permissions: ["view"] as const,
    },
    {
      key: "patientSurveys",
      label: "Patient Surveys",
      permissions: ["view"] as const,
    },
    {
      key: "patientFlowMetrics",
      label: "Patient Flow Metrics",
      permissions: ["view", "add", "edit"] as const,
    },
    {
      key: "settings",
      label: "Settings",
      permissions: ["view", "add", "edit"] as const,
    },
  ] as const;

  type AccessModule = (typeof accessModules)[number];
  type ModuleKey = AccessModule["key"];
  type PermissionKeyFor<T extends ModuleKey> = Extract<
    AccessModule,
    { key: T }
  >["permissions"][number];

  const togglePermission = <T extends ModuleKey>(
    module: T,
    permission: PermissionKeyFor<T>,
  ) => {
    setPermissions((prev) => {
      const modulePermissions = prev[module] as Record<string, boolean>;
      const currentValue = modulePermissions[permission as string] ?? false;
      return {
        ...prev,
        [module]: {
          ...prev[module],
          [permission]: !currentValue,
        },
      };
    });
  };

  const isPermissionEnabled = <T extends ModuleKey>(
    module: T,
    permission: PermissionKeyFor<T>,
  ) => {
    return Boolean((permissions[module] as any)[permission]);
  };

  const getAccessLevel = (userPermissions?: UserPermissions | any) => {
    if (!userPermissions || typeof userPermissions !== "object") {
      return "Limited Access";
    }

    let count = 0;
    Object.values(userPermissions).forEach((module) => {
      if (typeof module !== "object" || module === null) {
        return;
      }
      Object.values(module).forEach((perm) => {
        if (perm) count++;
      });
    });
    if (count > 24) return "Full Access";
    if (count > 12) return "High Access";
    if (count > 4) return "Medium Access";
    return "Limited Access";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="User Management"
        subtitle="Manage users and module access"
      />

      <div className="p-8">
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  User Management
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage users and module access
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add User
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Roles</option>
                <option value="Administrator">Administrator</option>
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Staff">Staff</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr className="border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    User ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Full Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Email Address
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Access Level
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index: number) => (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.role}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.department}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold ${
                            user.status === "Active"
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-gray-100 text-gray-800 border border-gray-300"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {getAccessLevel(user.permissions)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-2 text-green-600 hover:bg-green-50 transition-colors"
                            title="Manage Access"
                          >
                            <Shield size={16} />
                          </button>
                          <button
                            onClick={() =>
                              user.status &&
                              handleToggleStatus(user.id, user.status)
                            }
                            className="p-2 text-orange-600 hover:bg-orange-50 transition-colors"
                            title={
                              user.status === "Active"
                                ? "Disable User"
                                : "Enable User"
                            }
                          >
                            <UserX size={16} />
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
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>

        {/* Add/Edit User Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white max-w-4xl w-full mx-4 my-8 border-2 border-gray-300 shadow-lg max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingUser ? "Edit User" : "Add New User"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* User Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    User Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="user@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter department"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
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
                          onClick={() =>
                            setStatus(
                              status === "Active" ? "Inactive" : "Active",
                            )
                          }
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

                {/* Access Control */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Module Access Control
                  </h4>
                  <div className="space-y-3">
                    {accessModules.map(
                      ({ key, label, permissions: modulePermissions }) => (
                        <div
                          key={key}
                          className="bg-gray-50 border border-gray-200 p-4"
                        >
                          <div className="font-medium text-sm text-gray-900 mb-3">
                            {label}
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            {modulePermissions.map((perm) => (
                              <div
                                key={String(perm)}
                                className="flex items-center gap-2"
                              >
                                <button
                                  type="button"
                                  onClick={() => togglePermission(key, perm)}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    isPermissionEnabled(key, perm)
                                      ? "bg-blue-600"
                                      : "bg-gray-300"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                      isPermissionEnabled(key, perm)
                                        ? "translate-x-5"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                                <span className="text-xs text-gray-700 capitalize">
                                  {String(perm)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? "Save Changes" : "Add User"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
