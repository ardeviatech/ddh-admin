import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addAuditLog } from "../../store/slices/auditLogSlice";
import { Header } from "../components/Header";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  useInventoryItemQuery,
  useUpdateInventoryItemMutation,
} from "../../services/useInventoryQueries";

const schema = yup
  .object({
    itemName: yup.string().required("Item name is required"),
    category: yup.string().required("Category is required"),
    unit: yup.string().required("Unit is required"),
    reorderLevel: yup
      .number()
      .typeError("Must be a number")
      .min(0, "Must be 0 or greater")
      .required("Reorder level is required"),
  })
  .required();

type FormData = yup.InferType<typeof schema>;

export function EditInventoryItem() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const { data: item, isLoading } = useInventoryItemQuery(itemId ?? "", {
    enabled: !!itemId,
  });

  const updateMutation = useUpdateInventoryItemMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (item) {
      reset({
        itemName: item.itemName,
        category: item.category,
        unit: item.unit,
        reorderLevel: item.reorderLevel,
      });
    }
  }, [item, reset]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Edit Inventory Item" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center max-w-2xl mx-auto">
            <p className="text-gray-600">Loading inventory item...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Item Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center max-w-2xl mx-auto">
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

  const onSubmit = async (data: FormData) => {
    const { reorderLevel, itemName, category, unit } = data;

    // Track changes for audit log
    const changes: string[] = [];
    if (item.itemName !== itemName) {
      changes.push(`Item Name: "${item.itemName}" → "${itemName}"`);
    }
    if (item.category !== category) {
      changes.push(`Category: "${item.category}" → "${category}"`);
    }
    if (item.unit !== unit) {
      changes.push(`Unit: "${item.unit}" → "${unit}"`);
    }
    if (item.reorderLevel !== reorderLevel) {
      changes.push(`Reorder Level: ${item.reorderLevel} → ${reorderLevel}`);
    }

    if (changes.length === 0) {
      toast.info("No changes detected");
      navigate(`/inventory/${itemId}`);
      return;
    }

    const status: "In Stock" | "Low Stock" | "Out of Stock" =
      item.stockLevel === 0
        ? "Out of Stock"
        : item.stockLevel <= reorderLevel
          ? "Low Stock"
          : "In Stock";

    const payload = {
      itemName,
      category,
      unit,
      reorderLevel,
      status,
      lastUpdatedBy: user?.name || "",
      lastUpdatedDate: new Date().toISOString(),
    };

    updateMutation.mutate(
      { itemId: itemId ?? "", payload },
      {
        onSuccess: () => {
          dispatch(
            addAuditLog({
              userId: user?.id || "",
              userName: user?.name || "",
              action: "UPDATE",
              module: "INVENTORY",
              entityType: "Inventory Item",
              entityId: item.id || "",
              entityName: item.itemName,
              details: `Updated inventory item: ${item.itemCode} - ${item.itemName}`,
              changes: changes.map((change) => ({
                field: "Inventory Item",
                oldValue: "",
                newValue: change,
              })),
              ipAddress: "192.168.1.100",
            }),
          );
          navigate(`/inventory/${itemId}`);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Edit Inventory Item" subtitle="Update item details" />

      <div className="p-8">
        <button
          onClick={() => navigate(`/inventory/${itemId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Item Details
        </button>

        <div className="bg-white border border-gray-200 max-w-4xl mx-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Item Information
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Item Code: {item.itemCode}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Item Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register("itemName")}
                  className={`w-full px-4 py-3 border ${
                    errors.itemName ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.itemName && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.itemName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  {...register("category")}
                  className={`w-full px-4 py-3 border ${
                    errors.category ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select Category</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Medical Supplies">Medical Supplies</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Personal Protective Equipment">
                    Personal Protective Equipment
                  </option>
                  <option value="Others">Others</option>
                </select>
                {errors.category && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Current Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={item.stockLevel}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Stock quantity cannot be edited here. Use Add/Remove Stock
                    instead.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Unit <span className="text-red-600">*</span>
                  </label>
                  <select
                    {...register("unit")}
                    className={`w-full px-4 py-3 border ${
                      errors.unit ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Select Unit</option>
                    <option value="boxes">Boxes</option>
                    <option value="vials">Vials</option>
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="bottles">Bottles</option>
                    <option value="pieces">Pieces</option>
                    <option value="packs">Packs</option>
                    <option value="units">Units</option>
                  </select>
                  {errors.unit && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.unit.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reorder Level <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("reorderLevel")}
                  className={`w-full px-4 py-3 border ${
                    errors.reorderLevel ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.reorderLevel && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.reorderLevel.message}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  Stock level threshold for low stock alert
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/inventory/${itemId}`)}
                className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
