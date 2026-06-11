import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import {
  useUsersQuery,
  useUpdateUserMutation,
} from "../../services/useUserQueries";
import { ChevronLeft, Save } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = [
  "Medical",
  "Obstetrics & Gynecology (OB-Gyne)",
  "Pediatrics",
  "Dental Department",
];

export function EditQueuePermissions() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { data: users, isLoading } = useUsersQuery();
  const updateMutation = useUpdateUserMutation();
  const user = users?.find((u: any) => u.id === userId);

  const [queueAccess, setQueueAccess] = useState<Record<string, boolean>>({});
  const [canModifyVoiceSettings, setCanModifyVoiceSettings] = useState(false);
  const [queueActions, setQueueActions] = useState({
    canAddPatients: false,
    canCallPatients: false,
    canEditPatients: false,
    canRemovePatients: false,
  });

  useEffect(() => {
    if (user) {
      // Initialize queueManagement if it doesn't exist
      const queueManagement = user.permissions.queueManagement || {
        Medical: false,
        "Obstetrics & Gynecology (OB-Gyne)": false,
        Pediatrics: false,
        "Dental Department": false,
      };
      setQueueAccess(queueManagement);

      // Initialize voice settings permission
      setCanModifyVoiceSettings(
        user.permissions.canModifyQueueVoiceSettings || false,
      );

      // Initialize queue actions
      setQueueActions(
        user.permissions.queueActions || {
          canAddPatients: false,
          canCallPatients: false,
          canEditPatients: false,
          canRemovePatients: false,
        },
      );
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Loading User..." />
        <div className="p-8">
          <div className="max-w-2xl mx-auto bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600">
              Loading user information, please wait.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title="User Not Found"
          subtitle="The requested user could not be found"
        />
        <div className="p-8">
          <div className="max-w-2xl mx-auto bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              The user you are trying to edit does not exist.
            </p>
            <button
              onClick={() => navigate("/settings/queue")}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to Queue Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleDepartment = (department: string) => {
    setQueueAccess((prev) => ({
      ...prev,
      [department]: !prev[department],
    }));
  };

  const handleToggleAll = () => {
    const allEnabled = DEPARTMENTS.every((dept) => queueAccess[dept]);
    const newAccess: Record<string, boolean> = {};
    DEPARTMENTS.forEach((dept) => {
      newAccess[dept] = !allEnabled;
    });
    setQueueAccess(newAccess);
  };

  const handleToggleQueueAction = (action: keyof typeof queueActions) => {
    setQueueActions((prev) => ({
      ...prev,
      [action]: !prev[action],
    }));
  };

  const handleSave = async () => {
    const payload: any = {
      permissions: {
        ...user.permissions,
        queueManagement: queueAccess,
        canModifyQueueVoiceSettings: canModifyVoiceSettings,
        queueActions: queueActions,
      },
    };

    try {
      await updateMutation.mutateAsync({ id: user.id, payload });
      toast.success("Queue permissions updated successfully");
      navigate("/settings/queue");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update queue permissions",
      );
    }
  };

  const enabledCount = DEPARTMENTS.filter((dept) => queueAccess[dept]).length;
  const allEnabled = enabledCount === DEPARTMENTS.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Edit Queue Permissions"
        subtitle={`Configure queue management access for ${user.firstName} ${user.lastName}`}
      />

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/settings/queue")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ChevronLeft size={20} />
            Back to Queue Management
          </button>

          {/* User Info Card */}
          <div className="bg-white border border-gray-200 mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              User Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="text-base font-medium text-gray-900">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-base font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-base font-medium text-gray-900">
                  {user.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="text-base font-medium text-gray-900">
                  {user.department}
                </p>
              </div>
            </div>
          </div>

          {/* Queue Access Configuration */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Queue Management Permissions
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Select which departments this user can manage queues for
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  {enabledCount} of {DEPARTMENTS.length} departments enabled
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Toggle All */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 transition-colors">
                  <input
                    type="checkbox"
                    checked={allEnabled}
                    onChange={handleToggleAll}
                    className="w-5 h-5 border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      All Departments
                    </p>
                    <p className="text-sm text-gray-600">
                      {allEnabled ? "Disable" : "Enable"} access to all
                      departments
                    </p>
                  </div>
                </label>
              </div>

              {/* Individual Departments */}
              <div className="space-y-2">
                {DEPARTMENTS.map((department) => (
                  <label
                    key={department}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={queueAccess[department] || false}
                      onChange={() => handleToggleDepartment(department)}
                      className="w-5 h-5 border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{department}</p>
                    </div>
                    {queueAccess[department] && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-300">
                        Enabled
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Queue Actions Control */}
          <div className="bg-white border border-gray-200 mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Queue Actions Permissions
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Control which queue management actions this user can perform
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {/* Add Patients */}
              <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-3 transition-colors">
                <input
                  type="checkbox"
                  checked={queueActions.canAddPatients}
                  onChange={() => handleToggleQueueAction("canAddPatients")}
                  className="w-5 h-5 border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Add Patients to Queue
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow user to add new patients to the queue
                  </p>
                </div>
                {queueActions.canAddPatients && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-300">
                    Enabled
                  </span>
                )}
              </label>

              {/* Call Patients */}
              <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-3 transition-colors">
                <input
                  type="checkbox"
                  checked={queueActions.canCallPatients}
                  onChange={() => handleToggleQueueAction("canCallPatients")}
                  className="w-5 h-5 border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Call & Manage Patients
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow user to call patients (Call Next, Call Previous,
                    Recall, Skip, Mark as Done, Undo Done)
                  </p>
                </div>
                {queueActions.canCallPatients && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-300">
                    Enabled
                  </span>
                )}
              </label>

              {/* Edit Patients */}
              <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-3 transition-colors">
                <input
                  type="checkbox"
                  checked={queueActions.canEditPatients}
                  onChange={() => handleToggleQueueAction("canEditPatients")}
                  className="w-5 h-5 border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Edit Queue Patients
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow user to edit patient information in the queue
                  </p>
                </div>
                {queueActions.canEditPatients && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-300">
                    Enabled
                  </span>
                )}
              </label>

              {/* Remove Patients */}
              <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-3 transition-colors">
                <input
                  type="checkbox"
                  checked={queueActions.canRemovePatients}
                  onChange={() => handleToggleQueueAction("canRemovePatients")}
                  className="w-5 h-5 border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Remove Patients from Queue
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow user to remove patients from the queue (requires
                    confirmation)
                  </p>
                </div>
                {queueActions.canRemovePatients && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-300">
                    Enabled
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Voice Settings Access Control */}
          <div className="bg-white border border-gray-200 mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Voice Settings Access
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Control whether this user can modify queue voice settings
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-3 transition-colors">
                <input
                  type="checkbox"
                  checked={canModifyVoiceSettings}
                  onChange={(e) => setCanModifyVoiceSettings(e.target.checked)}
                  className="w-5 h-5 border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Allow Voice Settings Modification
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    When enabled, this user can access and modify queue voice
                    settings including voice type, volume, speed, and audio
                    alerts
                  </p>
                </div>
                {canModifyVoiceSettings && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-300">
                    Enabled
                  </span>
                )}
              </label>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => navigate("/settings/queue")}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Save size={20} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
