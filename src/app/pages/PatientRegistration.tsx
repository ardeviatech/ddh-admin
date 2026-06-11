import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  patientSchema,
  type PatientFormData,
} from "../../schemas/patientSchema";
import { Header } from "../components/Header";
import { FileUpload } from "../components/FileUpload";
import { FormSkeletonLoader } from "../components/SkeletonLoader";
import {
  AutoPopulatedInput,
  AutoPopulatedSelect,
} from "../components/AutoPopulatedInput";
import { toast } from "sonner";
import { useAppSelector } from "../../store/hooks";
import { type Patient } from "../../store/slices/patientsSlice";
import {
  checkDuplicatePatient,
  calculateAge,
} from "../../utils/patientValidation";
import { extractDataFromID } from "../../services/ocrService";
import { AlertTriangle, Wand2, Loader } from "lucide-react";

export function PatientRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const patients = useAppSelector((state) => state.patients.patients);
  const [isFormLoading] = useState(false);
  const [validIdFile, setValidIdFile] = useState<File | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(
    new Set(),
  );
  const [, setOcrDebugData] = useState<{ text: string; data: any }>({
    text: "",
    data: {},
  });
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean;
    patient?: Patient;
    reason?: string;
  }>({ show: false });
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PatientFormData>({
    resolver: yupResolver(patientSchema) as any,
  });

  // Restore form data when coming back from preview
  useEffect(() => {
    const savedData = location.state?.patientData as
      | PatientFormData
      | undefined;
    if (savedData) {
      Object.entries(savedData).forEach(([key, value]) => {
        if (key !== "validIdFile") {
          setValue(key as keyof PatientFormData, value);
        }
      });
    }
  }, [location.state, setValue]);

  useEffect(() => {
    const processIDImage = async () => {
      if (validIdFile && validIdFile.type.startsWith("image/")) {
        setIsProcessingOCR(true);
        setAutoPopulatedFields(new Set());

        try {
          toast.info("Processing ID...", {
            description: "Extracting information from uploaded ID",
          });

          const { data: extractedData, rawText } =
            await extractDataFromID(validIdFile);
          const fieldsPopulated = new Set<string>();

          // Store debug data
          setOcrDebugData({ text: rawText, data: extractedData });

          console.log("Form will populate these fields:", extractedData);

          if (extractedData.firstName) {
            setValue("firstName", extractedData.firstName);
            fieldsPopulated.add("firstName");
          }
          if (extractedData.lastName) {
            setValue("lastName", extractedData.lastName);
            fieldsPopulated.add("lastName");
          }
          if (extractedData.middleName) {
            setValue("middleName", extractedData.middleName);
            fieldsPopulated.add("middleName");
          }
          if (extractedData.birthdate) {
            setValue("birthdate", extractedData.birthdate as any);
            fieldsPopulated.add("birthdate");
          }
          if (extractedData.gender) {
            setValue("gender", extractedData.gender);
            fieldsPopulated.add("gender");
          }
          if (extractedData.street) {
            setValue("street", extractedData.street);
            fieldsPopulated.add("street");
          }
          if (extractedData.barangay) {
            setValue("barangay", extractedData.barangay);
            fieldsPopulated.add("barangay");
          }
          if (extractedData.town) {
            setValue("town", extractedData.town);
            fieldsPopulated.add("town");
          }
          if (extractedData.provinceCity) {
            setValue("provinceCity", extractedData.provinceCity);
            fieldsPopulated.add("provinceCity");
          }
          if (extractedData.zipCode) {
            setValue("zipCode", extractedData.zipCode);
            fieldsPopulated.add("zipCode");
          }
          if (extractedData.country) {
            setValue("country", extractedData.country);
            fieldsPopulated.add("country");
          }
          if (extractedData.birthPlace) {
            setValue("birthPlace", extractedData.birthPlace);
            fieldsPopulated.add("birthPlace");
          }

          setAutoPopulatedFields(fieldsPopulated);

          if (fieldsPopulated.size > 0) {
            toast.success("ID processed successfully!", {
              description: `${fieldsPopulated.size} field${fieldsPopulated.size !== 1 ? "s" : ""} auto-populated. Please review and edit if needed.`,
            });
          } else {
            toast.warning("Could not extract data from ID", {
              description: "Please fill in the form manually.",
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          toast.error("Failed to process ID", {
            description: errorMessage,
          });
          console.error("OCR Error:", error);
        } finally {
          setIsProcessingOCR(false);
        }
      }
    };

    processIDImage();
  }, [validIdFile, setValue]);

  const birthdate = watch("birthdate");
  const firstName = watch("firstName");
  const lastName = watch("lastName");

  const getAge = (birthdate: Date) => {
    if (!birthdate) return "";
    return calculateAge(birthdate);
  };

  // Clear duplicate warning when critical fields change
  useEffect(() => {
    if (duplicateWarning.show) {
      setDuplicateWarning({ show: false });
      setDuplicateAcknowledged(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, birthdate]);

  const onSubmit: SubmitHandler<PatientFormData> = async (data) => {
    // Format birthdate as YYYY-MM-DD for comparison
    const birthdateObj =
      data.birthdate instanceof Date
        ? data.birthdate
        : new Date(data.birthdate);
    const birthdateString = `${birthdateObj.getFullYear()}-${String(birthdateObj.getMonth() + 1).padStart(2, "0")}-${String(birthdateObj.getDate()).padStart(2, "0")}`;

    const duplicateCheck = checkDuplicatePatient(patients, {
      firstName: data.firstName,
      lastName: data.lastName,
      birthdate: birthdateString,
      gender: data.gender,
    });

    console.log("Duplicate check result:", duplicateCheck);
    console.log("Acknowledged:", duplicateAcknowledged);

    // Show warning but don't block if duplicate found and not yet acknowledged
    if (duplicateCheck.isDuplicate && !duplicateAcknowledged) {
      setDuplicateWarning({
        show: true,
        patient: duplicateCheck.matchedPatient,
        reason: duplicateCheck.matchReason,
      });
      // Scroll to top to show the warning
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Navigate to preview page (either no duplicate or user acknowledged)
    navigate("/patients/new/preview", { state: { patientData: data } });
  };

  const handleUseExisting = () => {
    if (duplicateWarning.patient) {
      navigate(`/patients/${duplicateWarning.patient.patientId}`);
    }
  };

  const handleContinueAsNew = () => {
    setDuplicateAcknowledged(true);
    setDuplicateWarning({ show: false });
    // User can now submit the form again
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Patient Registration"
        subtitle="Register a new patient to the Yakap System"
      />

      <div className="p-8">
        <div className="max-w-6xl mx-auto bg-white border border-gray-200 p-8">
          {isProcessingOCR && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 flex items-center gap-3">
              <Loader className="animate-spin text-blue-600" size={20} />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Processing ID Image...
                </p>
                <p className="text-xs text-blue-700">
                  Extracting information to auto-populate the form
                </p>
              </div>
            </div>
          )}

          {autoPopulatedFields.size > 0 && !isProcessingOCR && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 flex items-center gap-3">
              <Wand2 className="text-green-600" size={20} />
              <div>
                <p className="text-sm font-medium text-green-900">
                  {autoPopulatedFields.size} field
                  {autoPopulatedFields.size !== 1 ? "s" : ""} auto-populated
                  from ID
                </p>
                <p className="text-xs text-green-700">
                  Please review the highlighted fields and edit if needed
                </p>
              </div>
            </div>
          )}

          {duplicateWarning.show && (
            <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <AlertTriangle className="text-yellow-600" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 mb-1">
                        {duplicateWarning.reason}
                      </p>
                      <p className="text-xs text-yellow-800">
                        Review the existing record below or continue registering
                        as a new patient
                      </p>
                    </div>
                  </div>

                  {duplicateWarning.patient && (
                    <div className="bg-white border border-yellow-300 p-4 mb-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                        Existing Patient Record
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Patient ID</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {duplicateWarning.patient.patientId}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {duplicateWarning.patient.firstName}{" "}
                            {duplicateWarning.patient.middleName}{" "}
                            {duplicateWarning.patient.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Birthdate</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(
                              duplicateWarning.patient.birthdate,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleUseExisting}
                      className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Use Existing Record
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueAsNew}
                      className="px-5 py-2 border-2 border-gray-700 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                      Continue as New Patient
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isFormLoading ? (
            <FormSkeletonLoader />
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit as any)}
              className="space-y-8"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Upload Valid ID (Optional - Auto-fills form)
                </h3>
                <div className="mb-2">
                  <p className="text-sm text-gray-600 mb-2">
                    Upload a clear photo of the patient's valid ID (e.g.,
                    Philippine Passport, National ID, Driver's License,
                    PhilHealth ID) to automatically extract and populate the
                    form fields below.
                  </p>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <strong>Tip:</strong> The system automatically detects
                      orientation (horizontal/portrait/rotated). For best
                      results, ensure the ID is well-lit, flat, and all text is
                      clearly visible. The system will only populate fields
                      where it can confidently read the information.
                    </p>
                  </div>
                  <FileUpload
                    onFileSelect={setValidIdFile}
                    error={errors.validId?.message as string}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Patient Information
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <AutoPopulatedInput
                    {...register("lastName")}
                    label="Last Name"
                    type="text"
                    required
                    isAutoPopulated={autoPopulatedFields.has("lastName")}
                    error={errors.lastName?.message}
                  />

                  <AutoPopulatedInput
                    {...register("firstName")}
                    label="First Name"
                    type="text"
                    required
                    isAutoPopulated={autoPopulatedFields.has("firstName")}
                    error={errors.firstName?.message}
                  />

                  <AutoPopulatedInput
                    {...register("middleName")}
                    label="Middle Name"
                    type="text"
                    isAutoPopulated={autoPopulatedFields.has("middleName")}
                  />

                  <AutoPopulatedSelect
                    {...register("gender")}
                    label="Gender"
                    required
                    isAutoPopulated={autoPopulatedFields.has("gender")}
                    error={errors.gender?.message}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </AutoPopulatedSelect>

                  <AutoPopulatedInput
                    {...register("birthdate")}
                    label="Birthdate"
                    type="date"
                    required
                    isAutoPopulated={autoPopulatedFields.has("birthdate")}
                    error={errors.birthdate?.message}
                  />

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

                  <AutoPopulatedInput
                    {...register("birthPlace")}
                    label="Birth Place"
                    type="text"
                    required
                    isAutoPopulated={autoPopulatedFields.has("birthPlace")}
                    error={errors.birthPlace?.message}
                  />

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
                  <AutoPopulatedInput
                    {...register("street")}
                    label="Street"
                    type="text"
                    required
                    isAutoPopulated={autoPopulatedFields.has("street")}
                    error={errors.street?.message}
                  />

                  <AutoPopulatedInput
                    {...register("barangay")}
                    label="Barangay"
                    type="text"
                    required
                    isAutoPopulated={autoPopulatedFields.has("barangay")}
                    error={errors.barangay?.message}
                  />

                  <AutoPopulatedInput
                    {...register("town")}
                    label="Town"
                    type="text"
                    required
                    isAutoPopulated={autoPopulatedFields.has("town")}
                    error={errors.town?.message}
                  />

                  <AutoPopulatedInput
                    {...register("provinceCity")}
                    label="Province/City"
                    type="text"
                    required
                    isAutoPopulated={autoPopulatedFields.has("provinceCity")}
                    error={errors.provinceCity?.message}
                  />

                  <AutoPopulatedInput
                    {...register("zipCode")}
                    label="Zip Code"
                    type="text"
                    required
                    isAutoPopulated={autoPopulatedFields.has("zipCode")}
                    error={errors.zipCode?.message}
                  />

                  <AutoPopulatedInput
                    {...register("country")}
                    label="Country"
                    type="text"
                    required
                    defaultValue="Philippines"
                    isAutoPopulated={autoPopulatedFields.has("country")}
                    error={errors.country?.message}
                  />
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
                  onClick={() => navigate("/patients")}
                  className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingOCR}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingOCR ? "Processing ID..." : "Review and Register"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
