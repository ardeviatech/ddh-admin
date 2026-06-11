import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
// local helper instead of importing from the slice to avoid module resolution issues
import { Header } from "../components/Header";
import { SkeletonTable } from "../components/loading/SkeletonTable";
import {
  Search,
  Plus,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useHasPermission } from "../../hooks/usePermissions";
import {
  fetchFPEs,
  type PaginatedFPEResponse,
} from "../../services/fpeService";

const ITEMS_PER_PAGE = 15;

export function FPEList() {
  const navigate = useNavigate();
  // current year used for marking records
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery<
    PaginatedFPEResponse,
    Error
  >({
    queryKey: ["fpe", "latest", debouncedSearch, currentPage] as const,
    queryFn: () =>
      fetchFPEs({
        search: debouncedSearch,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        latest: true,
      }),
    staleTime: 1000 * 60 * 2,
  });

  const fpeRecords: PaginatedFPEResponse["data"] = data?.data ?? [];
  const totalItems = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isError) {
      const message =
        error instanceof Error ? error.message : "Unable to load FPE registry.";
      toast.error("Could not load FPE records", {
        description: message,
      });
    }
  }, [isError, error]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="First Patient Encounter (FPE) Registry"
        subtitle="Showing most recent FPE per patient • View details for complete history"
      />

      <div className="p-4 md:p-8">
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
                  placeholder="Search by Case Number, Patient Name, or Patient ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {useHasPermission("fpe", "registerNewFPE") && (
                <button
                  onClick={() => {
                    sessionStorage.removeItem("fpeFormData");
                    navigate("/fpe/new/0");
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  Register New FPE
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <SkeletonTable rows={15} columns={9} />
          ) : fpeRecords.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">
                {searchQuery
                  ? "No FPE records found matching your search."
                  : 'No FPE records yet. Click "Register New FPE" to get started.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Case Number
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Year
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Patient
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        PhilHealth
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        eKonsulta
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fpeRecords.map((record, index) => (
                      <tr
                        key={record.caseNumber}
                        className={`border-b border-gray-200 hover:bg-blue-100 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-100"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {record.caseNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold ${
                              record.year === new Date().getFullYear()
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : "bg-red-100 text-red-800 border border-red-300"
                            }`}
                          >
                            {record.year}
                            {record.year === new Date().getFullYear()
                              ? " ✓"
                              : " ⚠️"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">
                            {record.patientName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.patientId}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {record.philhealthNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                            {record.philhealthType === "Member"
                              ? "Member"
                              : "Dependent"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {record.eKonsulta ? (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(record.dateCreated).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold ${
                              record.status === "Completed"
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              navigate(`/fpe/${record.caseNumber}`)
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

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 text-center sm:text-left">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
                    {totalItems} record{totalItems !== 1 ? "s" : ""}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto">
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
