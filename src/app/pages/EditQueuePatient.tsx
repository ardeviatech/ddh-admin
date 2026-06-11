import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useUsersQuery } from "../../services/useUserQueries";
import { updateQueuePatient } from "../../store/slices/queueSlice";
import { Header } from "../components/Header";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = [
  "Medical",
  "Obstetrics & Gynecology (OB-Gyne)",
  "Pediatrics",
  "Dental Department",
];

export function EditQueuePatient() {
  const { patientId } = useParams<{ patientId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const usersQuery = useUsersQuery();
  const allUsers =
    usersQuery.data ?? useAppSelector((state) => state.users.users);
  const currentUser = allUsers.find(
    (u) => authUser?.id && u.id === authUser.id,
  );
  const isAdmin = Boolean(
    authUser?.role &&
    ["administrator", "admin"].includes(authUser.role.toLowerCase()),
  );

  const patient = useAppSelector((state) =>
    state.queue?.patients?.find((p) => p.id === patientId),
  );

  const [fullName, setFullName] = useState(patient?.fullName || "");
  const [department, setDepartment] = useState(patient?.department || "");
  const [notes, setNotes] = useState(patient?.notes || "");

  // Check permission
  const canEditPatients =
    isAdmin || currentUser?.permissions?.queueActions?.canEditPatients || false;

  if (!canEditPatients) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Edit Queue Patient" subtitle="Access Denied" />
        <div className="p-8">
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
                  You do not have permission to edit queue patients.
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Please contact your system administrator to request access to
                  edit queue patients.
                </p>

                <div className="bg-gray-50 border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Required Permission:
                  </p>
                  <p className="text-sm text-gray-600">Edit Queue Patients</p>
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
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Patient Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center max-w-2xl mx-auto">
            <p className="text-gray-600 mb-4">
              The patient you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/queue")}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to Queue Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!fullName.trim() || !department) {
      toast.error("Please fill in all required fields");
      return;
    }

    dispatch(
      updateQueuePatient({
        ...patient,
        fullName: fullName.trim(),
        department,
        notes: notes.trim() || undefined,
      }),
    );

    toast.success("Patient information updated");
    navigate("/queue");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Edit Patient Information"
        subtitle={`Queue Number: ${patient.queueNumber}`}
      />

      <div className="p-8">
        <button
          onClick={() => navigate("/queue")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Queue Management
        </button>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Patient Information
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Queue Number: {patient.queueNumber}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter patient full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-600">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Add any additional notes"
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
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
