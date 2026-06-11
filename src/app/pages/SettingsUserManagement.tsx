import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useUsersQuery,
  useUpdateUserMutation,
} from "../../services/useUserQueries";
import type { User, UserPermissions } from "../../store/slices/usersSlice";
import type { UserBrief } from "../../services/userService";
import { Search, Plus, Edit, UserX } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationModal } from "../components/ConfirmationModal";

type QueueUser = User | UserBrief;

export function SettingsUserManagement() {
  const navigate = useNavigate();
  const updateMutation = useUpdateUserMutation();
  const { data: queryUsers } = useUsersQuery();
  const users: QueueUser[] = queryUsers ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    status: string;
  } | null>(null);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
      const matchesSearch =
        searchQuery === "" ||
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = filterRole === "ALL" || user.role === filterRole;
      const matchesStatus =
        filterStatus === "ALL" || user.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  const handleToggleStatus = (userId: string, currentStatus: string) => {
    setSelectedUser({ id: userId, status: currentStatus });
    setShowStatusModal(true);
  };

  const confirmToggleStatus = async () => {
    if (selectedUser) {
      try {
        await updateMutation.mutateAsync({
          id: selectedUser.id,
          payload: {
            status: selectedUser.status === "Active" ? "Inactive" : "Active",
          },
        });
        toast.success("User status updated");
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to update status",
        );
      }

      setShowStatusModal(false);
      setSelectedUser(null);
    }
  };

  const getAccessLevel = (userPermissions?: UserPermissions) => {
    if (!userPermissions) {
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
    <>
      <div className="bg-white border border-gray-200 -mx-8 -mt-8 mb-6">
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
              onClick={() => navigate("/settings/users/new")}
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
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
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
                      {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.role ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.department ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-gray-100 text-gray-800 border border-gray-300"
                        }`}
                      >
                        {user.status ?? "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {getAccessLevel(user.permissions)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/settings/users/${user.id}/edit`)
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit User"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            user.status &&
                            handleToggleStatus(user.id, user.status)
                          }
                          disabled={!user.status}
                          className="p-2 text-orange-600 hover:bg-orange-50 transition-colors disabled:cursor-not-allowed disabled:text-gray-400"
                          title={
                            user.status
                              ? user.status === "Active"
                                ? "Deactivate User"
                                : "Activate User"
                              : "Status unavailable"
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

      <ConfirmationModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmToggleStatus}
        title={
          selectedUser?.status === "Active"
            ? "Deactivate User"
            : "Activate User"
        }
        message={
          selectedUser?.status === "Active"
            ? "Are you sure you want to deactivate this user? The user will no longer be able to access the system."
            : "Are you sure you want to activate this user? The user will be able to access the system."
        }
        confirmText={
          selectedUser?.status === "Active" ? "Deactivate" : "Activate"
        }
        type={selectedUser?.status === "Active" ? "danger" : "success"}
      />
    </>
  );
}
