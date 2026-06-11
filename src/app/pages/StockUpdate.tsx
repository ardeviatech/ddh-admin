import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAppSelector } from "../../store/hooks";
import { Header } from "../components/Header";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  useInventoryItemQuery,
  useUpdateInventoryItemMutation,
} from "../../services/useInventoryQueries";

export function StockUpdate() {
  const { itemId } = useParams<{ itemId: string }>();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get("type") as "IN" | "OUT") || "IN";
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const {
    data: item,
    isLoading,
    isError,
  } = useInventoryItemQuery(itemId ?? "", {
    enabled: !!itemId,
  });

  const updateMutation = useUpdateInventoryItemMutation();

  // Validation schema
  const stockUpdateSchema = yup.object({
    quantity: yup
      .number()
      .typeError("Quantity must be a number")
      .positive("Quantity must be greater than 0")
      .integer("Quantity must be a whole number")
      .required("Quantity is required")
      .test(
        "max-stock",
        `Cannot remove more than ${item?.stockLevel || 0} ${item?.unit || "units"}`,
        function (value) {
          if (type === "OUT" && item && value) {
            return value <= item.stockLevel;
          }
          return true;
        },
      ),
    notes: yup.string(),
  });

  type StockUpdateFormData = yup.InferType<typeof stockUpdateSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StockUpdateFormData>({
    resolver: yupResolver(stockUpdateSchema) as Resolver<StockUpdateFormData>,
    defaultValues: {
      quantity: undefined,
      notes: "",
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title={type === "IN" ? "Add Stock" : "Remove Stock"} />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center max-w-2xl mx-auto">
            <p className="text-gray-600">Loading inventory item...</p>
          </div>
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

  const onSubmit: SubmitHandler<StockUpdateFormData> = (data) => {
    if (!item) return;

    const movement = {
      id: `MOV-${Date.now()}`,
      date: new Date().toISOString(),
      type: type,
      quantity: data.quantity,
      updatedBy: user?.name || "",
      notes: data.notes || "",
    };

    const updatedStockLevel =
      type === "IN"
        ? item.stockLevel + data.quantity
        : item.stockLevel - data.quantity;

    const status: "In Stock" | "Low Stock" | "Out of Stock" =
      updatedStockLevel === 0
        ? "Out of Stock"
        : updatedStockLevel <= item.reorderLevel
          ? "Low Stock"
          : "In Stock";

    const payload = {
      stockLevel: updatedStockLevel,
      status,
      lastUpdatedBy: user?.name || "",
      lastUpdatedDate: new Date().toISOString(),
      stockMovements: [...item.stockMovements, movement],
    };

    updateMutation.mutate(
      { itemId: itemId ?? "", payload },
      {
        onSuccess: () => {
          toast.success(
            `Stock ${type === "IN" ? "added" : "removed"} successfully`,
          );
          navigate(`/inventory/${item.id}/movements`);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={type === "IN" ? "Add Stock" : "Remove Stock"}
        subtitle={`Update stock level for ${item.itemName}`}
      />

      <div className="p-8">
        <button
          onClick={() => navigate(`/inventory/${item.id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Item Details
        </button>

        <div className="bg-white border border-gray-200 max-w-4xl mx-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Stock Transaction
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-300 p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Item Name</p>
                    <p className="font-semibold text-gray-900">
                      {item.itemName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Item Code</p>
                    <p className="font-semibold text-gray-900">
                      {item.itemCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {item.stockLevel} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Category</p>
                    <p className="font-semibold text-gray-900">
                      {item.category}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Transaction Type
                </label>
                <div
                  className={`px-4 py-3 border font-semibold text-base ${
                    type === "IN"
                      ? "bg-green-50 border-green-300 text-green-800"
                      : "bg-red-50 border-red-300 text-red-800"
                  }`}
                >
                  {type === "IN" ? "Stock IN (Add)" : "Stock OUT (Remove)"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Quantity <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("quantity")}
                  className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.quantity ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter quantity"
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.quantity.message}
                  </p>
                )}
                {type === "OUT" && !errors.quantity && (
                  <p className="text-sm text-gray-600 mt-2">
                    Maximum available: {item.stockLevel} {item.unit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  {...register("notes")}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add notes about this transaction..."
                />
              </div>

              <div className="bg-gray-50 border border-gray-300 p-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Transaction will be recorded as:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 w-32">
                      Date:
                    </span>
                    <span className="text-gray-900">
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 w-32">
                      Updated By:
                    </span>
                    <span className="text-gray-900">{user?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/inventory/${item.id}`)}
                className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  type === "IN"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isSubmitting
                  ? "Processing..."
                  : `Confirm ${type === "IN" ? "Add" : "Remove"}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
