import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  patientSchema,
  type PatientFormData,
} from "../../schemas/patientSchema";
import { Header } from "../components/Header";
import { FormSkeletonLoader } from "../components/SkeletonLoader";
import { useAppSelector } from "../../store/hooks";
import { calculateAge } from "../../utils/patientValidation";

export function PatientEdit() {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const patient = useAppSelector((state) =>
    state.patients.patients.find((p) => p.patientId === patientId),
  );
  const [isFormLoading, setIsFormLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PatientFormData>({
    resolver: yupResolver(
      patientSchema,
    ) as unknown as Resolver<PatientFormData>,
  });

  // Pre-fill form with patient data
  useEffect(() => {
    if (patient) {
      setValue("lastName", patient.lastName);
      setValue("firstName", patient.firstName);
      setValue("middleName", patient.middleName || "");
      setValue("gender", patient.gender);
      setValue("birthdate", new Date(patient.birthdate) as any);
      setValue("birthPlace", patient.birthPlace);
      setValue("occupation", patient.occupation);
      setValue("civilStatus", patient.civilStatus);
      setValue("street", patient.street);
      setValue("barangay", patient.barangay);
      setValue("town", patient.town);
      setValue("provinceCity", patient.provinceCity);
      setValue("zipCode", patient.zipCode);
      setValue("country", patient.country);
      setValue("mobileNumber", patient.mobileNumber);
      setValue("email", patient.email);
      setValue("fatherName", patient.fatherName || "");
      setValue("motherName", patient.motherName || "");
      setIsFormLoading(false);
    }
  }, [patient, setValue]);

  const birthdate = watch("birthdate");

  const getAge = (birthdate: Date) => {
    if (!birthdate) return "";
    return calculateAge(birthdate);
  };

  const onSubmit = async (data: PatientFormData) => {
    // Navigate to edit preview page
    navigate(`/patients/${patientId}/edit/preview`, {
      state: { patientData: data, patientId },
    });
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Patient Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              The patient you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/patients")}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to Patient List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Edit Patient"
        subtitle={`Update information for ${patient.firstName} ${patient.lastName} (${patient.patientId})`}
      />

      <div className="p-8">
        <div className="max-w-6xl mx-auto bg-white border border-gray-200 p-8">
          {isFormLoading ? (
            <FormSkeletonLoader />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Patient Information
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("lastName")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("firstName")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Name
                    </label>
                    <input
                      {...register("middleName")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("gender")}
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Birthdate <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("birthdate")}
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.birthdate && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.birthdate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    <input
                      type="text"
                      value={birthdate ? getAge(new Date(birthdate)) : ""}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Birth Place <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("birthPlace")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.birthPlace && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.birthPlace.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Occupation <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("occupation")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.occupation && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.occupation.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Civil Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("civilStatus")}
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                    {errors.civilStatus && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.civilStatus.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Address Information
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("street")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.street && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.street.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barangay <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("barangay")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.barangay && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.barangay.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Town <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("town")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.town && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.town.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province/City <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("provinceCity")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.provinceCity && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.provinceCity.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zip Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("zipCode")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.zipCode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.zipCode.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("country")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.country.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Contact Information
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("mobileNumber")}
                      type="text"
                      placeholder="09XXXXXXXXX"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.mobileNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.mobileNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Other Information
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's Name (Optional)
                    </label>
                    <input
                      {...register("fatherName")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mother's Name (Optional)
                    </label>
                    <input
                      {...register("motherName")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate(`/patients/${patientId}`)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Review Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
