import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addAuditLog } from "../../store/slices/auditLogSlice";
import { Header } from "../components/Header";
import { ArrowLeft, Calendar } from "lucide-react";

import { useRef } from "react";
import { useCreatePatientFlowMetricMutation } from "../../services/usePatientFlowQueries";

const schema = yup.object().shape({
  date: yup.string().required("Date is required"),
  opdPatients: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("OPD patients count is required"),
  erPatients: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("ER patients count is required"),
  admissions: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Admissions count is required"),
  discharges: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Discharges count is required"),
  incomingReferrals: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Incoming referrals count is required"),
  outgoingReferrals: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Outgoing referrals count is required"),
  deaths: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Deaths count is required"),
});

type FormData = yup.InferType<typeof schema>;

export function AddPatientFlowMetrics() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const createMetricMutation = useCreatePatientFlowMetricMutation();
  const createMutationStatus = createMetricMutation.status;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      opdPatients: 0,
      erPatients: 0,
      admissions: 0,
      discharges: 0,
      incomingReferrals: 0,
      outgoingReferrals: 0,
      deaths: 0,
    },
  });

  const { ref: dateRegisterRef, ...dateRegisterRest } = register("date");

  const onSubmit = (data: FormData) => {
    const payload = {
      date: data.date,
      opdPatients: data.opdPatients,
      erPatients: data.erPatients,
      admissions: data.admissions,
      discharges: data.discharges,
      incomingReferrals: data.incomingReferrals,
      outgoingReferrals: data.outgoingReferrals,
      deaths: data.deaths,
    };

    createMetricMutation.mutate(payload, {
      onSuccess: (newMetric) => {
        dispatch(
          addAuditLog({
            userId: user?.id || "",
            userName: user?.name || "Unknown User",
            action: "CREATE",
            module: "PATIENT_FLOW",
            entityType: "Patient Flow Metrics",
            entityId: newMetric.id,
            entityName: new Date(data.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            details: `Created patient flow metrics: OPD: ${data.opdPatients}, ER: ${data.erPatients}, Admissions: ${data.admissions}, Discharges: ${data.discharges}, Incoming Referrals: ${data.incomingReferrals}, Outgoing Referrals: ${data.outgoingReferrals}, Deaths: ${data.deaths}`,
          }),
        );
        navigate("/patient-flow");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Enter Patient Flow Metrics"
        subtitle="Record daily patient statistics"
      />

      <div className="p-8">
        <button
          onClick={() => navigate("/patient-flow")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Patient Flow
        </button>

        <div className="max-w-4xl mx-auto bg-white border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...dateRegisterRest}
                  ref={(e) => {
                    dateRegisterRef(e);
                    dateInputRef.current = e;
                  }}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  max={new Date().toISOString().split("T")[0]}
                  style={{ colorScheme: "light" }}
                />
                <Calendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.date.message}
                </p>
              )}
            </div>

            {/* OPD and ER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of OPD Patients <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("opdPatients")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.opdPatients && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.opdPatients.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of ER Patients <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("erPatients")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.erPatients && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.erPatients.message}
                  </p>
                )}
              </div>
            </div>

            {/* Admissions and Discharges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Admissions <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("admissions")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.admissions && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.admissions.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Discharges <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("discharges")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.discharges && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.discharges.message}
                  </p>
                )}
              </div>
            </div>

            {/* Referrals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Incoming Referrals{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("incomingReferrals")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.incomingReferrals && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.incomingReferrals.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Outgoing Referrals{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  {...register("outgoingReferrals")}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                {errors.outgoingReferrals && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.outgoingReferrals.message}
                  </p>
                )}
              </div>
            </div>

            {/* Deaths */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Deaths <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                {...register("deaths")}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              {errors.deaths && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.deaths.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={createMutationStatus === "pending"}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutationStatus === "pending"
                  ? "Saving..."
                  : "Save Metrics"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/patient-flow")}
                className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
