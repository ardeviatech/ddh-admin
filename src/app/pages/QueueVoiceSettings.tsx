import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { useUsersQuery } from "../../services/useUserQueries";
import { Header } from "../components/Header";
import { ArrowLeft, Volume2, Bell, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export function QueueVoiceSettings() {
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const usersQuery = useUsersQuery();
  const allUsers =
    usersQuery.data ?? useAppSelector((state) => state.users.users);
  // Look up full user with permissions from users slice; admin fallback uses auth role only
  const permissionUser = allUsers.find(
    (u) => authUser?.id && u.id === authUser.id,
  );
  const isAdmin = Boolean(
    authUser?.role &&
    ["administrator", "admin"].includes(authUser.role.toLowerCase()),
  );

  // Load settings from localStorage
  const [voiceSettings, setVoiceSettings] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = localStorage.getItem("queueVoiceSettings");
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (error) {
      console.error("Error loading voice settings:", error);
    }
    return {
      voiceEnabled: true,
      soundAlertEnabled: true,
      voiceType: "Female Calm",
      volume: 80,
      speed: 1.0,
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(
          "queueVoiceSettings",
          JSON.stringify(voiceSettings),
        );
      }
    } catch (error) {
      console.error("Error saving voice settings:", error);
    }
  }, [voiceSettings]);

  const updateSetting = (key: string, value: any) => {
    setVoiceSettings({
      ...voiceSettings,
      [key]: value,
    });
  };

  const handleSave = () => {
    toast.success("Voice settings saved");
    navigate("/queue");
  };

  // Check if user has permission to modify voice settings
  const hasPermission =
    isAdmin ||
    permissionUser?.permissions?.canModifyQueueVoiceSettings ||
    false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Voice & Audio Settings"
        subtitle="Configure queue announcement settings"
      />

      <div className="p-8">
        <button
          onClick={() => navigate("/queue")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Queue Management
        </button>

        {!hasPermission ? (
          // Access Denied Message
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-red-200">
              <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="text-red-600" size={24} />
                  <h2 className="text-xl font-semibold text-red-900">
                    Access Denied
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  You do not have permission to modify queue voice settings.
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Please contact your system administrator to request access to
                  voice settings configuration.
                </p>

                <div className="bg-gray-50 border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Required Permission:
                  </p>
                  <p className="text-sm text-gray-600">
                    Queue Voice Settings Modification
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => navigate("/queue")}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Back to Queue Management
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Audio Configuration
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Enable Voice */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 size={20} className="text-gray-600" />
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Enable Voice Announcements
                      </label>
                      <p className="text-xs text-gray-500">
                        Text-to-speech for patient calls
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSetting("voiceEnabled", !voiceSettings.voiceEnabled)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      voiceSettings.voiceEnabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        voiceSettings.voiceEnabled
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Enable Sound Alert */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-gray-600" />
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Enable Sound Alert
                      </label>
                      <p className="text-xs text-gray-500">
                        Chime before voice announcement
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSetting(
                        "soundAlertEnabled",
                        !voiceSettings.soundAlertEnabled,
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      voiceSettings.soundAlertEnabled
                        ? "bg-blue-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        voiceSettings.soundAlertEnabled
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Voice Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Type
                  </label>
                  <select
                    value={voiceSettings.voiceType}
                    onChange={(e) => updateSetting("voiceType", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!voiceSettings.voiceEnabled}
                  >
                    <option value="Female Calm">Female Calm</option>
                    <option value="Male Professional">Male Professional</option>
                  </select>
                </div>

                {/* Volume */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume: {voiceSettings.volume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={voiceSettings.volume}
                    onChange={(e) =>
                      updateSetting("volume", parseInt(e.target.value))
                    }
                    className="w-full"
                    disabled={
                      !voiceSettings.voiceEnabled &&
                      !voiceSettings.soundAlertEnabled
                    }
                  />
                </div>

                {/* Speed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speed: {voiceSettings.speed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={voiceSettings.speed}
                    onChange={(e) =>
                      updateSetting("speed", parseFloat(e.target.value))
                    }
                    className="w-full"
                    disabled={!voiceSettings.voiceEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/queue")}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
