import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { SkeletonDetail } from "../components/loading/SkeletonDetail";
import { ArrowLeft, Plus, Minus, History, Edit } from "lucide-react";
import { InventoryDocumentUpload } from "../components/InventoryDocumentUpload";
import {
  useDeleteInventoryDocumentMutation,
  useInventoryDocumentsQuery,
} from "../../services/useInventoryDocumentQueries";
import { useInventoryItemQuery } from "../../services/useInventoryQueries";

export function InventoryDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();

  const {
    data: item,
    isLoading,
    isError,
  } = useInventoryItemQuery(itemId ?? "", {
    enabled: !!itemId,
  });

  const {
    data: documents = [],
    isLoading: isDocumentsLoading,
    error: documentsError,
  } = useInventoryDocumentsQuery(itemId ?? "", {
    enabled: !!itemId,
  });

  const deleteMutation = useDeleteInventoryDocumentMutation(itemId ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Inventory Details" />
        <div className="p-8">
          <SkeletonDetail />
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

  const handleAddStock = () => {
    navigate(`/inventory/${itemId}/update?type=IN`);
  };

  const handleRemoveStock = () => {
    navigate(`/inventory/${itemId}/update?type=OUT`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`Inventory Details - ${item.itemName}`}
        subtitle={`Item Code: ${item.itemCode}`}
      />

      <div className="p-4 md:p-8">
        {isLoading ? (
          <SkeletonDetail />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
              <button
                onClick={() => navigate("/inventory")}
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Inventory</span>
              </button>

              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <button
                  onClick={() => navigate(`/inventory/${itemId}/edit`)}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Edit size={20} />
                  <span className="hidden sm:inline">Edit Item</span>
                  <span className="sm:hidden">Edit</span>
                </button>
                <button
                  onClick={() => navigate(`/inventory/${itemId}/movements`)}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors whitespace-nowrap"
                >
                  <History size={20} />
                  <span className="hidden sm:inline">Stock Movements</span>
                  <span className="sm:hidden">Movements</span>
                </button>
                <button
                  onClick={handleAddStock}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Add Stock</span>
                  <span className="sm:hidden">Add</span>
                </button>
                <button
                  onClick={handleRemoveStock}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                  <Minus size={20} />
                  <span className="hidden sm:inline">Remove Stock</span>
                  <span className="sm:hidden">Remove</span>
                </button>
              </div>
            </div>

            {/* Item Info */}
            <div className="bg-white border-2 border-gray-900 mb-6">
              <div className="border-b-2 border-gray-900 bg-gray-50 px-8 py-4">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    ITEM INFORMATION
                  </h1>
                  <p className="text-sm text-gray-600">Current Stock Details</p>
                </div>
              </div>

              <div className="px-8 py-6 grid grid-cols-2 gap-x-12 gap-y-3">
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-40">
                    Item Code:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {item.itemCode}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-40">
                    Item Name:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {item.itemName}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-40">
                    Category:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {item.category}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-40">
                    Unit:
                  </span>
                  <span className="text-gray-900 font-medium">{item.unit}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-40">
                    Current Stock:
                  </span>
                  <span className="text-gray-900 font-medium text-lg">
                    {item.stockLevel} {item.unit}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-40">
                    Reorder Level:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {item.reorderLevel} {item.unit}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-40">
                    Status:
                  </span>
                  <span
                    className={`inline-flex px-4 py-1 text-sm font-semibold ${getStatusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-40">
                    Last Updated:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {new Date(item.lastUpdatedDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
                <div className="flex col-span-2">
                  <span className="font-semibold text-gray-700 w-40">
                    Last Updated By:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {item.lastUpdatedBy}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Inventory Documents
                  </h2>
                  <p className="text-sm text-gray-500">
                    Add and manage files related to this inventory item.
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  {documents?.length ?? 0} file
                  {documents?.length === 1 ? "" : "s"}
                </div>
              </div>

              <InventoryDocumentUpload
                itemId={itemId ?? ""}
                itemCode={item.itemCode}
                documents={documents}
                onDocumentDeleted={(documentId) =>
                  deleteMutation.mutate(documentId)
                }
                isLoading={deleteMutation.isPending || isDocumentsLoading}
              />

              {documentsError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {documentsError.message ||
                    "Unable to load inventory documents."}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
