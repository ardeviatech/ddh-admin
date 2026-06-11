import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import type { Patient } from "../../store/slices/patientsSlice";
import { Header } from "../components/Header";
import { useHasPermission } from "../../hooks/usePermissions";
import { Search, Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchPatients,
  type PaginatedPatientsResponse,
} from "../../services/patientService";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

export function PatientList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery<
    PaginatedPatientsResponse,
    Error,
    PaginatedPatientsResponse,
    readonly ["patients", string, number]
  >({
    queryKey: ["patients", debouncedSearch, currentPage] as const,
    queryFn: () =>
      fetchPatients({
        search: debouncedSearch,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }),
    staleTime: 1000 * 60 * 5,
  });

  const pagePatients = data?.data ?? [];
  const totalPatients = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalPatients / ITEMS_PER_PAGE));

  const getRegisteredByLabel = (
    createdBy?:
      | string
      | { firstName?: string; lastName?: string; name?: string },
  ) => {
    if (!createdBy) return "-";
    if (typeof createdBy === "string") return createdBy;
    if (createdBy.name) return createdBy.name;
    return (
      [createdBy.firstName, createdBy.lastName].filter(Boolean).join(" ") || "-"
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isError) {
      const message =
        error instanceof Error ? error.message : "Unable to load patients.";
      toast.error("Could not load patient registry", {
        description: message,
      });
    }
  }, [isError, error]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:5000", {
      transports: ["websocket"],
    });

    const refreshPatients = () => {
      queryClient.invalidateQueries({ queryKey: ["patients"], exact: false });
    };

    socket.on("patientCreated", refreshPatients);
    socket.on("patientUpdated", refreshPatients);

    return () => {
      socket.off("patientCreated", refreshPatients);
      socket.off("patientUpdated", refreshPatients);
      socket.disconnect();
    };
  }, [queryClient]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canRegister = useHasPermission("patientRegistry", "registerNewPatient");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Patient Registry"
        subtitle="Manage and view all registered patients"
      />

      <div className="p-8">
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by Patient ID, Name, Email, or Mobile Number..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {canRegister && (
                <button
                  onClick={() => navigate("/patients/new")}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  Register New Patient
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-gray-200"></div>
                ))}
              </div>
            </div>
          ) : pagePatients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery
                  ? "No patients found matching your search."
                  : "No patients registered yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Patient ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Full Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Gender
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Age
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Date of Birth
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Contact Number
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Registered By
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Address
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagePatients.map((patient: Patient, index: number) => (
                      <tr
                        key={`${patient.patientId}-${patient.createdAt}`}
                        className={`border-b border-gray-200 hover:bg-blue-100 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-100"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {patient.patientId}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {patient.lastName}, {patient.firstName}{" "}
                          {patient.middleName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {patient.gender}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {patient.age}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(patient.birthdate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {patient.mobileNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {getRegisteredByLabel(patient.createdBy)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {patient.barangay}, {patient.town}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              navigate(`/patients/${patient.patientId}`)
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalPatients)} of{" "}
                  {totalPatients} patient
                  {totalPatients !== 1 ? "s" : ""}
                  {searchQuery ? ` matching "${searchQuery}"` : ""}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`min-w-10 px-3 py-2 text-sm transition-colors ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      },
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
