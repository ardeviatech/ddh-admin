import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { SkeletonTable } from "../components/loading/SkeletonTable";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useInventoryItemQuery } from "../../services/useInventoryQueries";
import type { StockMovement } from "../../store/slices/inventorySlice";

const ITEMS_PER_PAGE = 10;

export function StockMovements() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const {
    data: item,
    isLoading,
    isError,
  } = useInventoryItemQuery(itemId ?? "", {
    enabled: !!itemId,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    "ALL" | "TODAY" | "LAST_WEEK" | "LAST_MONTH" | "LAST_YEAR" | "CUSTOM"
  >("ALL");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [userFilter, setUserFilter] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Stock Movements" />
        <div className="p-8">
          <SkeletonTable rows={6} columns={4} />
        </div>
      </div>
    );
  }

  if (!item || isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Item Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              The inventory item you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/inventory")}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to Inventory
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredMovements = useMemo(() => {
    let filtered = [...item.stockMovements];

    // Type filter
    if (typeFilter !== "ALL") {
      filtered = filtered.filter((m) => m.type === typeFilter);
    }

    // Date filter
    if (dateRangeFilter !== "ALL") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((m) => {
        const movementDate = new Date(m.date);

        if (dateRangeFilter === "TODAY") {
          return movementDate >= today;
        } else if (dateRangeFilter === "LAST_WEEK") {
          const lastWeek = new Date(today);
          lastWeek.setDate(lastWeek.getDate() - 7);
          return movementDate >= lastWeek;
        } else if (dateRangeFilter === "LAST_MONTH") {
          const lastMonth = new Date(today);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          return movementDate >= lastMonth;
        } else if (dateRangeFilter === "LAST_YEAR") {
          const lastYear = new Date(today);
          lastYear.setFullYear(lastYear.getFullYear() - 1);
          return movementDate >= lastYear;
        } else if (dateRangeFilter === "CUSTOM") {
          if (customDateFrom && customDateTo) {
            const fromDate = new Date(customDateFrom);
            fromDate.setHours(0, 0, 0, 0);
            const toDate = new Date(customDateTo);
            toDate.setHours(23, 59, 59, 999); // Include the entire "to" date
            return movementDate >= fromDate && movementDate <= toDate;
          } else if (customDateFrom) {
            const fromDate = new Date(customDateFrom);
            fromDate.setHours(0, 0, 0, 0);
            return movementDate >= fromDate;
          } else if (customDateTo) {
            const toDate = new Date(customDateTo);
            toDate.setHours(23, 59, 59, 999);
            return movementDate <= toDate;
          }
        }

        return true;
      });
    }

    // User filter
    if (userFilter) {
      filtered = filtered.filter((m) =>
        m.updatedBy.toLowerCase().includes(userFilter.toLowerCase()),
      );
    }

    return filtered;
  }, [
    item.stockMovements,
    typeFilter,
    dateRangeFilter,
    customDateFrom,
    customDateTo,
    userFilter,
  ]);

  const totalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);

  const paginatedMovements = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredMovements.slice(startIndex, endIndex);
  }, [filteredMovements, currentPage]);

  // Calculate stock after each movement (using full movement history, not filtered)
  const calculateStockAfter = (movement: StockMovement) => {
    let stock = item.stockLevel;

    // Find this movement in the full history
    const fullIndex = item.stockMovements.findIndex(
      (m: { id: string }) => m.id === movement.id,
    );

    if (fullIndex === -1) return stock;

    // Go backwards from current stock to this movement
    for (let i = 0; i < fullIndex; i++) {
      const mov = item.stockMovements[i];
      if (mov.type === "IN") {
        stock -= mov.quantity;
      } else {
        stock += mov.quantity;
      }
    }

    return stock;
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= item.reorderLevel) return "Low Stock";
    return "In Stock";
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-800 border border-green-300";
      case "Low Stock":
        return "bg-orange-100 text-orange-800 border border-orange-300";
      case "Out of Stock":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.charAt(0);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-600",
      "bg-green-600",
      "bg-purple-600",
      "bg-orange-600",
      "bg-pink-600",
      "bg-indigo-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Stock Movements"
        subtitle={`${item.itemName} (${item.itemCode})`}
      />

      <div className="p-8">
        <button
          onClick={() => navigate(`/inventory/${itemId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Item Details
        </button>

        <div className="bg-white border border-gray-200">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Transaction Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as "ALL" | "IN" | "OUT");
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Types</option>
                  <option value="IN">Stock IN</option>
                  <option value="OUT">Stock OUT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => {
                    setDateRangeFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Dates</option>
                  <option value="TODAY">Today</option>
                  <option value="LAST_WEEK">Last Week</option>
                  <option value="LAST_MONTH">Last Month</option>
                  <option value="LAST_YEAR">Last Year</option>
                  <option value="CUSTOM">Custom Date Range</option>
                </select>
                {dateRangeFilter === "CUSTOM" && (
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => {
                          setCustomDateFrom(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={customDateTo}
                        onChange={(e) => {
                          setCustomDateTo(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Updated By
                </label>
                <input
                  type="text"
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name..."
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {(typeFilter !== "ALL" ||
              dateRangeFilter !== "ALL" ||
              userFilter) && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setTypeFilter("ALL");
                    setDateRangeFilter("ALL");
                    setCustomDateFrom("");
                    setCustomDateTo("");
                    setUserFilter("");
                    setCurrentPage(1);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <SkeletonTable rows={10} columns={7} />
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {typeFilter !== "ALL" || dateRangeFilter !== "ALL" || userFilter
                  ? "No movements found matching your filters."
                  : "No stock movements recorded yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        DATE & TIME
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        ACCOUNT
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        TYPE
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        QUANTITY
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        STOCK AFTER
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        STATUS
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        NOTES
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMovements.map((movement, index) => {
                      const stockAfter = calculateStockAfter(movement);
                      const status = getStockStatus(stockAfter);

                      return (
                        <tr
                          key={movement.id}
                          className={`border-b border-gray-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-700">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {new Date(movement.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(movement.date).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 ${getAvatarColor(
                                  movement.updatedBy,
                                )} text-white flex items-center justify-center text-sm font-semibold`}
                              >
                                {getInitials(movement.updatedBy)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {movement.updatedBy}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {movement.updatedBy
                                    .toLowerCase()
                                    .replace(/\s+/g, "")}
                                  @hospital.com
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold ${
                                movement.type === "IN"
                                  ? "bg-green-100 text-green-800 border border-green-300"
                                  : "bg-red-100 text-red-800 border border-red-300"
                              }`}
                            >
                              {movement.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {movement.type === "IN" ? "+" : "-"}
                            {movement.quantity} {item.unit}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">
                            {stockAfter} {item.unit}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold ${getStockStatusColor(
                                status,
                              )}`}
                            >
                              {status}
                            </span>
                            {status === "Out of Stock" && (
                              <div className="text-xs text-red-600 font-semibold mt-1">
                                ⚠️ Critical
                              </div>
                            )}
                            {status === "Low Stock" && (
                              <div className="text-xs text-orange-600 font-semibold mt-1">
                                ⚠️ Reorder Level
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {movement.notes || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredMovements.length,
                  )}{" "}
                  of {filteredMovements.length} movement
                  {filteredMovements.length !== 1 ? "s" : ""}
                  {(typeFilter !== "ALL" ||
                    dateRangeFilter !== "ALL" ||
                    userFilter) &&
                    ` (filtered from ${item.stockMovements.length} total)`}
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
