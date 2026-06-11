import { useAppSelector } from "../../store/hooks";

export function SettingsProfile() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name
        </label>
        <input
          type="text"
          value={user?.name || ""}
          readOnly
          className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role
        </label>
        <input
          type="text"
          value={user?.role || ""}
          readOnly
          className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed capitalize"
        />
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Note:</span> Your user credentials are
          managed by the system administrator. To update your information,
          please contact the hospital IT department.
        </p>
      </div>
    </div>
  );
}
