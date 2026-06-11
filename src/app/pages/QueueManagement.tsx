import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import type { QueuePatient, QueueStatus } from "../../store/slices/queueSlice";
import {
  useQueueEntriesQuery,
  useCallNextMutation,
  useUpdateQueueEntryMutation,
  useRecallQueuePatientMutation,
  useDeleteQueueEntryMutation,
} from "../../services/useQueueQueries";
import { useUsersQuery } from "../../services/useUserQueries";
import { useQueueRealtime } from "../../services/useQueueRealtime";
import { Header } from "../components/Header";
import {
  Search,
  Plus,
  Play,
  SkipForward,
  Check,
  RotateCcw,
  ChevronLeft,
  Edit,
  Trash2,
  Volume2,
  Bell,
  Settings,
  PlayCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = [
  { id: "all", name: "All Departments" },
  { id: "medical", name: "Medical" },
  { id: "ob-gyne", name: "Obstetrics & Gynecology (OB-Gyne)" },
  { id: "pediatrics", name: "Pediatrics" },
  { id: "dental", name: "Dental Department" },
];

const DEPARTMENT_NAME_TO_ID = new Map(
  DEPARTMENTS.map((dept) => [dept.name, dept.id]),
);

const DEPARTMENT_ID_TO_NAME = new Map(
  DEPARTMENTS.filter((dept) => dept.id !== "all").map((dept) => [
    dept.id,
    dept.name,
  ]),
);

const getPatientDepartmentLabel = (
  departmentId: string,
  departmentName?: string,
) => departmentName || DEPARTMENT_ID_TO_NAME.get(departmentId) || departmentId;

const getDisplayQueueStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "waiting":
      return "Waiting";
    case "serving":
      return "Serving";
    case "completed":
      return "Done";
    default:
      return status;
  }
};

export function QueueManagement() {
  // no local queue dispatch — server is source of truth
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const entriesQuery = useQueueEntriesQuery();
  const usersQuery = useUsersQuery();
  const patients = (entriesQuery.data || []) as unknown as Array<
    QueuePatient & { departmentName?: string }
  >;
  useQueueRealtime();

  // calledHistory removed; server-driven board handles current/previous state
  const authUser = useAppSelector((state) => state.auth.user);
  const reduxUsers = useAppSelector((state) => state.users.users);
  const allUsers = usersQuery.data ?? reduxUsers;
  // Look up full user with permissions from users slice; admin fallback uses auth role only
  const permissionUser = allUsers.find(
    (u) => authUser?.id && u.id === authUser.id,
  );

  const isCurrentUserAdmin = useMemo(() => {
    if (!authUser?.role) return false;
    return ["administrator", "admin"].includes(authUser.role.toLowerCase());
  }, [authUser?.role]);

  const hasQueueAccessToDepartment = (department: string) =>
    isCurrentUserAdmin ||
    Boolean(permissionUser?.permissions?.queueManagement?.[department]);

  const accessibleDepartments = useMemo(() => {
    const departments = DEPARTMENTS.filter(
      (dept) =>
        dept.name === "All Departments" ||
        hasQueueAccessToDepartment(dept.name),
    ).map((dept) => dept.name);
    if (departments.length === 0) {
      return ["All Departments"];
    }
    return departments;
  }, [permissionUser, authUser]);

  const accessibleDepartmentNames = useMemo(
    () => accessibleDepartments.filter((dept) => dept !== "All Departments"),
    [accessibleDepartments],
  );

  // Read from URL parameters
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [filterDepartment, setFilterDepartment] = useState(
    searchParams.get("department") || "All Departments",
  );
  const [filterStatus, setFilterStatus] = useState<"All" | QueueStatus>(
    (searchParams.get("status") as "All" | QueueStatus) || "All",
  );

  useEffect(() => {
    if (
      filterDepartment !== "All Departments" &&
      !accessibleDepartments.includes(filterDepartment)
    ) {
      setFilterDepartment(
        accessibleDepartments.includes("All Departments")
          ? "All Departments"
          : accessibleDepartmentNames[0] || "All Departments",
      );
    }
  }, [accessibleDepartments, filterDepartment, accessibleDepartmentNames]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<QueuePatient | null>(
    null,
  );
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Load voice settings from localStorage
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
  const [availableSynthesisVoices, setAvailableSynthesisVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  // Daily reset is managed on the server; client reflects server state via react-query

  // Load speech synthesis voices on component mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices() || [];
        setAvailableSynthesisVoices(voices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Reload voice settings when returning to this page
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = localStorage.getItem("queueVoiceSettings");
        if (saved) {
          setVoiceSettings(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error("Error reloading voice settings:", error);
    }
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (filterDepartment !== "All Departments")
      params.set("department", filterDepartment);
    if (filterStatus !== "All") params.set("status", filterStatus);

    setSearchParams(params, { replace: true });
  }, [searchQuery, filterDepartment, filterStatus, setSearchParams]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        searchQuery === "" ||
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.queueNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const patientDepartmentLabel = getPatientDepartmentLabel(
        patient.department,
        patient.departmentName,
      );
      const matchesDepartment =
        filterDepartment === "All Departments"
          ? accessibleDepartmentNames.includes(patientDepartmentLabel)
          : patientDepartmentLabel === filterDepartment;

      const matchesStatus =
        filterStatus === "All" ||
        patient.status.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [
    patients,
    searchQuery,
    filterDepartment,
    filterStatus,
    accessibleDepartmentNames,
  ]);

  // Get next waiting patient
  const nextPatient = useMemo(() => {
    return patients
      .filter(
        (p) =>
          p.status.toLowerCase() === "waiting" &&
          (filterDepartment === "All Departments"
            ? accessibleDepartmentNames.includes(
                getPatientDepartmentLabel(p.department, p.departmentName),
              )
            : getPatientDepartmentLabel(p.department, p.departmentName) ===
              filterDepartment),
      )
      .sort(
        (a, b) =>
          new Date(a.timeAdded).getTime() - new Date(b.timeAdded).getTime(),
      )[0];
  }, [patients, filterDepartment, accessibleDepartmentNames]);

  // Get current serving patient
  const servingPatient = useMemo(() => {
    return patients
      .filter(
        (p) =>
          p.status.toLowerCase() === "serving" &&
          (filterDepartment === "All Departments"
            ? accessibleDepartmentNames.includes(
                getPatientDepartmentLabel(p.department, p.departmentName),
              )
            : getPatientDepartmentLabel(p.department, p.departmentName) ===
              filterDepartment),
      )
      .sort(
        (a, b) =>
          new Date(b.calledAt || b.timeAdded).getTime() -
          new Date(a.calledAt || a.timeAdded).getTime(),
      )[0];
  }, [patients, filterDepartment, accessibleDepartmentNames]);

  // Department data for All Departments view
  const departmentData = useMemo(() => {
    return DEPARTMENTS.filter(
      (dept) =>
        dept.name !== "All Departments" &&
        accessibleDepartmentNames.includes(dept.name),
    ).map((department) => {
      const deptPatients = patients.filter(
        (p) =>
          getPatientDepartmentLabel(p.department, p.departmentName) ===
          department.name,
      );
      const waiting = deptPatients
        .filter((p) => p.status.toLowerCase() === "waiting")
        .sort(
          (a, b) =>
            new Date(a.timeAdded).getTime() - new Date(b.timeAdded).getTime(),
        );
      const serving = deptPatients
        .filter((p) => p.status.toLowerCase() === "serving")
        .sort(
          (a, b) =>
            new Date(b.calledAt || b.timeAdded).getTime() -
            new Date(a.calledAt || a.timeAdded).getTime(),
        );
      const done = deptPatients.filter(
        (p) => p.status.toLowerCase() === "completed",
      ).length;

      return {
        name: department.name,
        waiting,
        serving: serving[0] || null,
        doneCount: done,
        total: deptPatients.length,
      };
    });
  }, [patients]);

  const updateMutation = useUpdateQueueEntryMutation();
  const recallMutation = useRecallQueuePatientMutation();
  const callNextMutation = useCallNextMutation();
  const deleteMutation = useDeleteQueueEntryMutation();

  const handleCallPatient = async (patient: QueuePatient) => {
    try {
      await updateMutation.mutateAsync({
        id: patient.id,
        payload: { status: "serving" as any },
      });

      // Play sound alert if enabled
      if (voiceSettings.soundAlertEnabled) {
        playNotificationSound();
      }

      // Play voice announcement if enabled
      if (voiceSettings.voiceEnabled) {
        await playVoiceAnnouncement(patient);
      }

      toast.success(`Calling ${patient.fullName}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to call patient");
    }
  };

  const handleRecall = async () => {
    if (!servingPatient) {
      toast.error("No serving patient to recall");
      return;
    }

    try {
      await recallMutation.mutateAsync(servingPatient.id);

      if (voiceSettings.soundAlertEnabled) {
        playNotificationSound();
      }

      if (voiceSettings.voiceEnabled) {
        await playVoiceAnnouncement(servingPatient);
      }

      toast.success(`Recalled ${servingPatient.fullName}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to recall patient");
    }
  };

  const handleCallNext = async () => {
    if (!filterDepartment || filterDepartment === "All Departments") {
      toast.error("Please select a department to call next");
      return;
    }

    const departmentId = DEPARTMENT_NAME_TO_ID.get(filterDepartment);
    if (!departmentId) {
      toast.error("Please select a valid department");
      return;
    }

    try {
      const result = await callNextMutation.mutateAsync(departmentId);

      if (voiceSettings.soundAlertEnabled) {
        playNotificationSound();
      }

      if (voiceSettings.voiceEnabled) {
        const departmentBoard = result?.board?.departments?.find(
          (dept: any) => dept.id === departmentId,
        );
        const nextServingPatient = departmentBoard?.nowServing;
        if (nextServingPatient) {
          await playVoiceAnnouncement(nextServingPatient as any);
        }
      }

      toast.success("Called next patient");
    } catch (err: any) {
      toast.error(err?.message || "Failed to call next patient");
    }
  };

  const handleCallPrevious = async () => {
    toast.info("Call previous is not available in server-driven mode");
  };

  const playNotificationSound = () => {
    try {
      if (typeof window === "undefined") return;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("AudioContext not supported");
        return;
      }

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(
        voiceSettings.volume / 100,
        audioContext.currentTime,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  };

  const playVoiceAnnouncement = async (
    patient: (QueuePatient & { departmentName?: string }) | any,
  ) => {
    try {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        console.warn("Speech synthesis not supported");
        return;
      }

      if (voiceSettings.soundAlertEnabled) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const script = `Now serving, ${patient.fullName}. Please proceed to ${getPatientDepartmentLabel(
        patient.department,
        patient.departmentName,
      )}.`;

      const utterance = new SpeechSynthesisUtterance(script);
      utterance.lang = "en-US";
      utterance.rate = voiceSettings.speed;
      utterance.volume = voiceSettings.volume / 100;

      const voices =
        window.speechSynthesis.getVoices().length > 0
          ? window.speechSynthesis.getVoices()
          : availableSynthesisVoices;

      if (voices.length > 0) {
        const preferredVoice = voices.find((voice) => {
          return voiceSettings.voiceType === "Female Calm"
            ? voice.name.includes("Female") || voice.name.includes("Zira")
            : voice.name.includes("Male") || voice.name.includes("David");
        });

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        } else {
          utterance.voice = voices[0];
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error playing voice announcement:", error);
    }
  };

  const handleSkipPatient = async (patientId: string) => {
    try {
      await updateMutation.mutateAsync({
        id: patientId,
        payload: { status: "waiting" as any },
      });
      toast.success("Patient skipped");
    } catch (err: any) {
      toast.error(err?.message || "Failed to skip patient");
    }
  };

  const handleMarkDone = (patientId: string) => {
    (async () => {
      try {
        await updateMutation.mutateAsync({
          id: patientId,
          payload: { status: "completed" as any },
        });
        toast.success("Patient marked as done");
      } catch (err: any) {
        toast.error(err?.message || "Failed to mark done");
      }
    })();
  };

  const handleUndoDone = async (patient: QueuePatient) => {
    // Revert Done → Serving and re-announce
    try {
      await updateMutation.mutateAsync({
        id: patient.id,
        payload: { status: "serving" as any },
      });
      if (voiceSettings.soundAlertEnabled) playNotificationSound();
      if (voiceSettings.voiceEnabled) await playVoiceAnnouncement(patient);
      toast.success(`${patient.fullName} restored to Serving — re-announcing`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to restore patient");
    }
  };

  const handleRemove = (patient: QueuePatient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
    setDeleteConfirmText("");
  };

  const confirmRemove = () => {
    if (!patientToDelete) return;
    if (deleteConfirmText !== patientToDelete.id) {
      toast.error(
        "Confirmation text does not match. Please copy and paste the ID correctly.",
      );
      return;
    }
    (async () => {
      try {
        await deleteMutation.mutateAsync(patientToDelete.id);
        toast.success("Patient removed from queue");
        setDeleteDialogOpen(false);
        setPatientToDelete(null);
        setDeleteConfirmText("");
      } catch (err: any) {
        toast.error(err?.message || "Failed to remove patient");
      }
    })();
  };

  const cancelRemove = () => {
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
    setDeleteConfirmText("");
  };

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case "Waiting":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "Serving":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Done":
        return "bg-green-100 text-green-800 border-green-300";
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleBackToDashboard = () => {
    setFilterDepartment("All Departments");
    setFilterStatus("All");
    setSearchQuery("");
    navigate("/queue");
  };

  const handleViewDepartmentDetails = (departmentName: string) => {
    setFilterDepartment(departmentName);
    setFilterStatus("All");
    setSearchQuery("");
  };

  // Queue action permissions
  const canAddPatients =
    isCurrentUserAdmin ||
    permissionUser?.permissions?.queueActions?.canAddPatients ||
    false;
  const canCallPatients =
    isCurrentUserAdmin ||
    permissionUser?.permissions?.queueActions?.canCallPatients ||
    false;
  const canEditPatients =
    isCurrentUserAdmin ||
    permissionUser?.permissions?.queueActions?.canEditPatients ||
    false;
  const canRemovePatients =
    isCurrentUserAdmin ||
    permissionUser?.permissions?.queueActions?.canRemovePatients ||
    false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Queue Management"
        subtitle="Manage patient queue and announcements"
      />

      <div className="p-8">
        {/* Back to Dashboard Button - Only show when viewing specific department */}
        {filterDepartment !== "All Departments" && (
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ChevronLeft size={20} />
            Back to All Departments Dashboard
          </button>
        )}

        {/* Top Controls */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              {/* Left: title + status badges */}
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <h2 className="text-xl font-semibold text-gray-900 whitespace-nowrap">
                  Queue Dashboard
                </h2>
                {voiceSettings.voiceEnabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium border border-blue-200 whitespace-nowrap">
                    <Volume2 size={12} />
                    Voice ON
                  </span>
                )}
                {voiceSettings.soundAlertEnabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-xs font-medium border border-green-200 whitespace-nowrap">
                    <Bell size={12} />
                    Alert ON
                  </span>
                )}
              </div>

              {/* Right: fixed-position action buttons — always in the same slots */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {canCallPatients && (
                  <>
                    <button
                      onClick={handleCallPrevious}
                      disabled={true}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors whitespace-nowrap bg-amber-100 text-amber-300 cursor-not-allowed`}
                      title="Call previous is not available in server-driven mode"
                    >
                      <ChevronLeft size={16} />
                      Call Previous
                    </button>
                    <button
                      onClick={handleCallNext}
                      disabled={!nextPatient}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors whitespace-nowrap ${
                        nextPatient
                          ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                          : "bg-green-100 text-green-300 cursor-not-allowed"
                      }`}
                    >
                      <PlayCircle size={16} />
                      Call Next Patient
                    </button>
                    <button
                      onClick={() => servingPatient && handleRecall()}
                      disabled={!servingPatient}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors whitespace-nowrap ${
                        servingPatient
                          ? "bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"
                          : "bg-purple-100 text-purple-300 cursor-not-allowed"
                      }`}
                      title="Recall - Patient didn't hear"
                    >
                      <RotateCcw size={16} />
                      Recall Patient
                    </button>
                  </>
                )}
                {(isCurrentUserAdmin ||
                  permissionUser?.permissions?.canModifyQueueVoiceSettings) && (
                  <button
                    onClick={() => navigate("/queue/settings")}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
                    title="Voice Settings"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                )}
                {canAddPatients && (
                  <button
                    onClick={() => navigate("/queue/add")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <Plus size={16} />
                    Add Patient
                  </button>
                )}
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
                  placeholder="Search full name or queue number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {accessibleDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as "All" | QueueStatus)
                }
                className="px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Waiting">Waiting</option>
                <option value="Serving">Serving</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>

          {/* Department Dashboard or Queue Table */}
          {filterDepartment === "All Departments" &&
          filterStatus === "All" &&
          searchQuery === "" ? (
            // Dashboard View - All Departments Overview
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                All Departments Queue Board
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {departmentData.map((dept) => (
                  <div
                    key={dept.name}
                    className="bg-white border-2 border-gray-300 flex flex-col"
                  >
                    {/* Department Header */}
                    <div className="bg-gray-900 text-white px-4 py-3 border-b-2 border-gray-300">
                      <h4 className="font-semibold text-sm leading-tight">
                        {dept.name}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className="text-gray-300">
                          Waiting:{" "}
                          <span className="font-bold text-white">
                            {dept.waiting.length}
                          </span>
                        </span>
                        <span className="text-gray-300">
                          Done:{" "}
                          <span className="font-bold text-green-400">
                            {dept.doneCount}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Now Serving Section */}
                    <div className="bg-blue-50 border-b-2 border-gray-300 px-4 py-3">
                      <div className="text-xs font-semibold text-blue-900 mb-1">
                        NOW SERVING
                      </div>
                      {dept.serving ? (
                        <div className="bg-blue-600 text-white px-4 py-3 border border-blue-700">
                          <div className="text-xl font-bold leading-tight">
                            {dept.serving.fullName}
                          </div>
                          <div className="text-sm mt-1 text-blue-100">
                            {dept.serving.queueNumber}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-500 px-3 py-2 border border-gray-300 text-center text-sm">
                          No patient currently serving
                        </div>
                      )}
                    </div>

                    {/* Waiting List Section */}
                    <div className="flex-1 px-4 py-3 min-h-[200px]">
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        WAITING LIST
                      </div>
                      {dept.waiting.length === 0 ? (
                        <div className="text-center py-8 text-sm text-gray-400">
                          No patients waiting
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {dept.waiting.map((patient, _index) => (
                            <div
                              key={patient.id}
                              className="bg-gray-50 border border-gray-300 px-3 py-2.5 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-base text-gray-900 leading-tight">
                                    {patient.fullName}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {patient.queueNumber}
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {formatTime(patient.timeAdded)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer - Quick Actions */}
                    <div className="border-t-2 border-gray-300 bg-gray-50 px-4 py-2">
                      <button
                        onClick={() => handleViewDepartmentDetails(dept.name)}
                        className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        View Full Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Table View - Specific Department or Filtered
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr className="border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Queue No.
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Full Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Department
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Time Added
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-gray-500"
                      >
                        No patients in queue
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient, index) => (
                      <tr
                        key={patient.id}
                        className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {patient.queueNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {patient.fullName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getPatientDepartmentLabel(
                            patient.department,
                            patient.departmentName,
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold border ${getStatusColor(
                              patient.status,
                            )}`}
                          >
                            {getDisplayQueueStatus(patient.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {formatTime(patient.timeAdded)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {canCallPatients &&
                              patient.status.toLowerCase() === "waiting" && (
                                <button
                                  onClick={() => handleCallPatient(patient)}
                                  className="p-2 text-green-600 hover:bg-green-50 transition-colors"
                                  title="Call Patient"
                                >
                                  <Play size={16} />
                                </button>
                              )}

                            {canCallPatients &&
                              patient.status.toLowerCase() === "serving" && (
                                <>
                                  <button
                                    onClick={() => handleCallPatient(patient)}
                                    className="p-2 text-purple-600 hover:bg-purple-50 transition-colors"
                                    title="Recall - Patient didn't hear"
                                  >
                                    <RotateCcw size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSkipPatient(patient.id)
                                    }
                                    className="p-2 text-orange-600 hover:bg-orange-50 transition-colors"
                                    title="Skip"
                                  >
                                    <SkipForward size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleMarkDone(patient.id)}
                                    className="p-2 text-green-600 hover:bg-green-50 transition-colors"
                                    title="Mark as Done"
                                  >
                                    <Check size={16} />
                                  </button>
                                </>
                              )}

                            {canCallPatients &&
                              patient.status.toLowerCase() === "completed" && (
                                <button
                                  onClick={() => handleUndoDone(patient)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-amber-700 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors"
                                  title="Undo Done — restore to Serving and re-announce"
                                >
                                  <RotateCcw size={13} />
                                  Undo Done
                                </button>
                              )}

                            {canEditPatients && (
                              <button
                                onClick={() =>
                                  navigate(`/queue/${patient.id}/edit`)
                                }
                                className="p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canRemovePatients && (
                              <button
                                onClick={() => handleRemove(patient)}
                                className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                                title="Remove"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {filteredPatients.length} of {patients.length} patients
              {servingPatient && (
                <span className="ml-4 text-purple-600 font-medium">
                  Now Serving: {servingPatient.queueNumber} -{" "}
                  {servingPatient.fullName}
                </span>
              )}
              {nextPatient && (
                <span className="ml-4 text-green-600 font-medium">
                  Next: {nextPatient.queueNumber} - {nextPatient.fullName}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {deleteDialogOpen && patientToDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-6 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDDH%20Yakap%2FCheck%20this.jpg?alt=media&token=fc787d13-8674-4386-8b1f-f517af49e433')`,
          }}
        >
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-black/40"></div>

          <div className="bg-white max-w-2xl w-full mx-4 border-2 border-gray-300 shadow-lg relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
              <h3 className="text-xl font-semibold text-red-900">
                Confirm Deletion
              </h3>
              <button
                onClick={cancelRemove}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">
                You are about to remove the following patient from the queue:
              </p>

              {/* Details Box */}
              <div className="bg-gray-50 border border-gray-300 p-4 space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">
                      Queue No.:
                    </span>{" "}
                    <span className="text-gray-900">
                      {patientToDelete.queueNumber}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Patient Name:
                    </span>{" "}
                    <span className="text-gray-900">
                      {patientToDelete.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Department:
                    </span>{" "}
                    <span className="text-gray-900">
                      {patientToDelete.department}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Status:</span>{" "}
                    <span className="text-gray-900">
                      {patientToDelete.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmation Instructions */}
              <div className="bg-yellow-50 border border-yellow-300 p-4">
                <p className="text-sm font-semibold text-yellow-900 mb-2">
                  To confirm deletion, copy and paste the following ID:
                </p>
                <div className="bg-white border border-gray-300 p-2 font-mono text-sm text-gray-900 select-all">
                  {patientToDelete.id}
                </div>
              </div>

              {/* Confirmation Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paste the ID here to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Paste ID here"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={cancelRemove}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={deleteConfirmText !== patientToDelete.id}
                className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
