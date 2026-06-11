import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { SkeletonTable } from "../components/loading/SkeletonTable";
import { Search, Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useInventoryItemsQuery } from "../../services/useInventoryQueries";
import { useHasPermission } from "../../hooks/usePermissions";

const ITEMS_PER_PAGE = 10;

export function InventoryList() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const {
    data: items = [],
    isLoading,
    isFetching,
  } = useInventoryItemsQuery({
    search: searchQuery,
    category: categoryFilter,
    status: statusFilter,
  });

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setCurrentPage(1);
    }, 300);

    return () => window.clearTimeout(id);
  }, [searchInput]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(totalPages, 1));
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusColor = (status: string) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Medical Inventory"
        subtitle="Monitor stock levels and transactions"
      />

      <div className="p-4 md:p-8">
        <div className="bg-white border border-gray-200">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 mb-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by product name or code..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {useHasPermission("inventory", "addInventoryItem") && (
                <button
                  onClick={() => navigate("/inventory/new")}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Add Item</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Medical Supplies">Medical Supplies</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Personal Protective Equipment">
                    Personal Protective Equipment
                  </option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {(searchInput || searchQuery || categoryFilter || statusFilter) && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                    setCategoryFilter("");
                    setStatusFilter("");
                    setCurrentPage(1);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Clear All Filters
                </button>
                {isFetching && !isLoading ? (
                  <span className="text-sm text-gray-500">
                    Updating results...
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {isLoading ? (
            <SkeletonTable rows={10} columns={11} />
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery || categoryFilter || statusFilter
                  ? "No items found matching your filters."
                  : "No inventory items yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Item Code
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Item Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Stock Level
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Unit
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-200 hover:bg-blue-100 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-100"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.itemCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.itemName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.stockLevel}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.unit}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold ${getStatusColor(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => navigate(`/inventory/${item.id}`)}
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

              <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 text-center sm:text-left">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, items.length)} of{" "}
                  {items.length} item
                  {items.length !== 1 ? "s" : ""}
                  {(searchQuery || categoryFilter || statusFilter) &&
                    ` (filtered results)`}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
