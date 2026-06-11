import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { Header } from "../components/Header";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useCreateInventoryItemMutation } from "../../services/useInventoryQueries";

const schema = yup
  .object({
    itemName: yup.string().required("Item name is required"),
    category: yup.string().required("Category is required"),
    initialStock: yup
      .number()
      .typeError("Must be a number")
      .min(0, "Must be 0 or greater")
      .required("Initial stock is required"),
    unit: yup.string().required("Unit is required"),
    reorderLevel: yup
      .number()
      .typeError("Must be a number")
      .min(0, "Must be 0 or greater")
      .required("Reorder level is required"),
  })
  .required();

type FormData = yup.InferType<typeof schema>;

export function AddInventoryItem() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const createMutation = useCreateInventoryItemMutation();

  const onSubmit = async (data: FormData) => {
    const { initialStock, reorderLevel, itemName, category, unit } = data;

    const status: "In Stock" | "Low Stock" | "Out of Stock" =
      initialStock === 0
        ? "Out of Stock"
        : initialStock <= reorderLevel
          ? "Low Stock"
          : "In Stock";

    const itemCode = `ITEM-${Date.now()}`;
    const newItem = {
      itemCode,
      itemName,
      category,
      stockLevel: initialStock,
      unit,
      reorderLevel,
      status,
      lastUpdatedBy: user?.name || "",
      lastUpdatedDate: new Date().toISOString(),
      stockMovements: [
        {
          id: `MOV-${Date.now()}`,
          date: new Date().toISOString(),
          type: "IN" as const,
          quantity: initialStock,
          updatedBy: user?.name || "",
          notes: "Initial stock",
        },
      ],
    };

    createMutation.mutate(newItem, {
      onSuccess: () => {
        navigate("/inventory");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Add New Inventory Item" subtitle="Enter item details" />

      <div className="p-8">
        <button
          onClick={() => navigate("/inventory")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Inventory
        </button>

        <div className="bg-white border border-gray-200 max-w-4xl mx-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Item Information
            </h2>
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
                    Initial Stock Quantity{" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    {...register("initialStock")}
                    className={`w-full px-4 py-3 border ${
                      errors.initialStock ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.initialStock && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.initialStock.message}
                    </p>
                  )}
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
                    <option value="box">Box</option>
                    <option value="vial">Vial</option>
                    <option value="tablet">Tablet</option>
                    <option value="bottle">Bottle</option>
                    <option value="piece">Piece</option>
                    <option value="pack">Pack</option>
                    <option value="unit">Unit</option>
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
                onClick={() => navigate("/inventory")}
                className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? "Saving..." : "Save Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
