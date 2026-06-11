import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { useUsersQuery } from "../../services/useUserQueries";
import { type User } from "../../store/slices/usersSlice";
import { type UserBrief } from "../../services/userService";
import { Search, Settings } from "lucide-react";

const DEPARTMENTS = [
  "Medical",
  "Obstetrics & Gynecology (OB-Gyne)",
  "Pediatrics",
  "Dental Department",
];

type QueueUser = User | UserBrief;

export function SettingsQueueManagement() {
  const navigate = useNavigate();
  const localUsers = useAppSelector((state) => state.users.users);
  const usersQuery = useUsersQuery();
  const users: QueueUser[] = usersQuery.data ?? localUsers;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");
  const [filterRole, setFilterRole] = useState<string>("ALL");

  // Filtered users - only show users that could have queue access (Admin, Nurse, Staff)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`;
      const matchesSearch =
        searchQuery === "" ||
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = filterRole === "ALL" || user.role === filterRole;

      // Filter by department - show users who have access to at least one queue in that department
      const matchesDepartment =
        filterDepartment === "ALL" ||
        Boolean(
          user.permissions?.queueManagement?.departments?.[filterDepartment],
        );

      return matchesSearch && matchesRole && matchesDepartment;
    });
  }, [users, searchQuery, filterRole, filterDepartment]);

  const getAccessibleDepartments = (user: QueueUser): string[] => {
    const departments = user.permissions?.queueManagement?.departments;
    if (!departments) {
      return [];
    }

    return DEPARTMENTS.filter((dept) => departments[dept] || false);
  };

  return (
    <div className="bg-white border border-gray-200 -mx-8 -mt-8 mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Queue Management Access
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure department-based queue management permissions for users
            </p>
          </div>
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
            <option value="Nurse">Nurse</option>
            <option value="Staff">Staff</option>
          </select>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
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
                Queue Access (Departments)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Queue Actions
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                Voice Settings
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
              filteredUsers.map((user, index) => {
                const accessibleDepts = getAccessibleDepartments(user);
                return (
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
                    <td className="px-4 py-3">
                      {accessibleDepts.length === 0 ? (
                        <span className="text-sm text-gray-500">No access</span>
                      ) : accessibleDepts.length === DEPARTMENTS.length ? (
                        <span className="inline-flex px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                          All Departments ({DEPARTMENTS.length})
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {accessibleDepts.slice(0, 2).map((dept) => (
                            <span
                              key={dept}
                              className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300"
                            >
                              {dept}
                            </span>
                          ))}
                          {accessibleDepts.length > 2 && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                              +{accessibleDepts.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.permissions?.queueActions ? (
                        <div className="flex gap-1">
                          {user.permissions.queueActions.canAddPatients && (
                            <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                              Add
                            </span>
                          )}
                          {user.permissions.queueActions.canCallPatients && (
                            <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                              Call
                            </span>
                          )}
                          {user.permissions.queueActions.canEditPatients && (
                            <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                              Edit
                            </span>
                          )}
                          {user.permissions.queueActions.canRemovePatients && (
                            <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                              Remove
                            </span>
                          )}
                          {!user.permissions.queueActions.canAddPatients &&
                            !user.permissions.queueActions.canCallPatients &&
                            !user.permissions.queueActions.canEditPatients &&
                            !user.permissions.queueActions
                              .canRemovePatients && (
                              <span className="text-sm text-gray-500">
                                No actions
                              </span>
                            )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.permissions?.canModifyQueueVoiceSettings ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                          Allowed
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                          Restricted
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          navigate(`/settings/queue/${user.id}/edit`)
                        }
                        className="p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Queue Permissions"
                      >
                        <Settings size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users with queue
          management permissions
        </p>
      </div>
    </div>
  );
}
