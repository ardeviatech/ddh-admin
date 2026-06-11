import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { addConsultation } from "../../store/slices/consultationSlice";
import { updateFPE } from "../../store/slices/fpeSlice";
import { logAction } from "../../utils/auditLogger";
import { Header } from "../components/Header";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit2,
} from "lucide-react";
import type {
  Laboratory,
  Medicine,
} from "../../store/slices/consultationSlice";
import { useCreateConsultationMutation } from "../../services/useConsultationQueries";

export function NewConsultation() {
  const { caseNumber, step: stepParam } = useParams<{
    caseNumber: string;
    step: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const fpeRecord = useAppSelector((state) =>
    state.fpe.fpeRecords.find((f) => f.caseNumber === caseNumber),
  );

  const patient = useAppSelector((state) =>
    state.patients.patients.find((p) => p.patientId === fpeRecord?.patientId),
  );

  const user = useAppSelector((state) => state.auth.user);

  const currentStep = parseInt(stepParam || "0", 10);

  // Load saved form data from sessionStorage
  useEffect(() => {
    const savedData = sessionStorage.getItem(`consultation-${caseNumber}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.mainComplaint) setMainComplaint(data.mainComplaint);
      if (data.vitalSigns) setVitalSigns(data.vitalSigns);
      if (data.heent) setHeent(data.heent);
      if (data.heentOthers) setHeentOthers(data.heentOthers);
      if (data.chestBreastLungs) setChestBreastLungs(data.chestBreastLungs);
      if (data.chestBreastLungsOthers)
        setChestBreastLungsOthers(data.chestBreastLungsOthers);
      if (data.heart) setHeart(data.heart);
      if (data.heartOthers) setHeartOthers(data.heartOthers);
      if (data.abdomen) setAbdomen(data.abdomen);
      if (data.abdomenOthers) setAbdomenOthers(data.abdomenOthers);
      if (data.genitourinary) setGenitourinary(data.genitourinary);
      if (data.genitourinaryOthers)
        setGenitourinaryOthers(data.genitourinaryOthers);
      if (data.digitalRectal) setDigitalRectal(data.digitalRectal);
      if (data.digitalRectalOthers)
        setDigitalRectalOthers(data.digitalRectalOthers);
      if (data.skinExtremities) setSkinExtremities(data.skinExtremities);
      if (data.skinExtremitiesOthers)
        setSkinExtremitiesOthers(data.skinExtremitiesOthers);
      if (data.neurological) setNeurological(data.neurological);
      if (data.neurologicalOthers)
        setNeurologicalOthers(data.neurologicalOthers);
      if (data.pcu !== undefined) setPcu(data.pcu);
      if (data.diagnosis) setDiagnosis(data.diagnosis);
      if (data.plan) setPlan(data.plan);
      if (data.medicines) setMedicines(data.medicines);
      if (data.laboratories) setLaboratories(data.laboratories);
      if (data.remarks) setRemarks(data.remarks);
      if (data.doctor) setDoctor(data.doctor);
      if (data.ekasEnabled !== undefined) setEkasEnabled(data.ekasEnabled);
      if (data.ekasTests) setEkasTests(data.ekasTests);
      if (data.epressEnabled !== undefined)
        setEpressEnabled(data.epressEnabled);
      if (data.epressMedicines) setEpressMedicines(data.epressMedicines);
      if (data.eKonsulta !== undefined) setEKonsulta(data.eKonsulta);
    }
  }, [caseNumber]);

  // Validate step parameter
  useEffect(() => {
    if (isNaN(currentStep) || currentStep < 0 || currentStep > 11) {
      navigate(`/fpe/${caseNumber}/consultations/new/0`, { replace: true });
    }
  }, [currentStep, navigate, caseNumber]);

  // Form State
  const [mainComplaint, setMainComplaint] = useState("");
  const [vitalSigns, setVitalSigns] = useState({
    temperature: undefined as number | undefined,
    respiratoryRate: undefined as number | undefined,
    cardiacRate: undefined as number | undefined,
    bloodPressure: "",
    weight: undefined as number | undefined,
    height: undefined as number | undefined,
  });

  const [heent, setHeent] = useState<string[]>([]);
  const [heentOthers, setHeentOthers] = useState("");
  const [chestBreastLungs, setChestBreastLungs] = useState<string[]>([]);
  const [chestBreastLungsOthers, setChestBreastLungsOthers] = useState("");
  const [heart, setHeart] = useState<string[]>([]);
  const [heartOthers, setHeartOthers] = useState("");
  const [abdomen, setAbdomen] = useState<string[]>([]);
  const [abdomenOthers, setAbdomenOthers] = useState("");
  const [genitourinary, setGenitourinary] = useState<string[]>([]);
  const [genitourinaryOthers, setGenitourinaryOthers] = useState("");
  const [digitalRectal, setDigitalRectal] = useState<string[]>([]);
  const [digitalRectalOthers, setDigitalRectalOthers] = useState("");
  const [skinExtremities, setSkinExtremities] = useState<string[]>([]);
  const [skinExtremitiesOthers, setSkinExtremitiesOthers] = useState("");
  const [neurological, setNeurological] = useState<string[]>([]);
  const [neurologicalOthers, setNeurologicalOthers] = useState("");

  const [pcu, setPcu] = useState<"YES" | "NO" | "">("");
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [remarks, setRemarks] = useState("");
  const [doctor, setDoctor] = useState("");
  const [ekasEnabled, setEkasEnabled] = useState<boolean | null>(null);
  const [ekasTests, setEkasTests] = useState<string[]>([]);
  const [epressEnabled, setEpressEnabled] = useState<boolean | null>(null);
  const [epressMedicines, setEpressMedicines] = useState<Medicine[]>([]);
  const [eKonsulta, setEKonsulta] = useState(false);

  // Current form states for single entry
  const [currentMedicine, setCurrentMedicine] = useState<Omit<Medicine, "id">>({
    genericName: "",
    brandName: "",
    formulation: "",
    signa: "",
    quantity: "",
  });
  const [currentLaboratory, setCurrentLaboratory] = useState<
    Omit<Laboratory, "id">
  >({
    testName: "",
    testResults: "",
    summary: "",
  });
  const [currentEpressMedicine, setCurrentEpressMedicine] = useState<
    Omit<Medicine, "id">
  >({
    genericName: "",
    brandName: "",
    formulation: "",
    signa: "",
    quantity: "",
  });

  // Edit mode tracking
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(
    null,
  );
  const [editingLaboratoryId, setEditingLaboratoryId] = useState<string | null>(
    null,
  );
  const [editingEpressMedicineId, setEditingEpressMedicineId] = useState<
    string | null
  >(null);

  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    const formData = {
      mainComplaint,
      vitalSigns,
      heent,
      heentOthers,
      chestBreastLungs,
      chestBreastLungsOthers,
      heart,
      heartOthers,
      abdomen,
      abdomenOthers,
      genitourinary,
      genitourinaryOthers,
      digitalRectal,
      digitalRectalOthers,
      skinExtremities,
      skinExtremitiesOthers,
      neurological,
      neurologicalOthers,
      pcu,
      diagnosis,
      plan,
      medicines,
      laboratories,
      remarks,
      doctor,
      ekasEnabled,
      ekasTests,
      epressEnabled,
      epressMedicines,
      eKonsulta,
    };
    sessionStorage.setItem(
      `consultation-${caseNumber}`,
      JSON.stringify(formData),
    );
  }, [
    caseNumber,
    mainComplaint,
    vitalSigns,
    heent,
    heentOthers,
    chestBreastLungs,
    chestBreastLungsOthers,
    heart,
    heartOthers,
    abdomen,
    abdomenOthers,
    genitourinary,
    genitourinaryOthers,
    digitalRectal,
    digitalRectalOthers,
    skinExtremities,
    skinExtremitiesOthers,
    neurological,
    neurologicalOthers,
    pcu,
    diagnosis,
    plan,
    medicines,
    laboratories,
    remarks,
    doctor,
    ekasEnabled,
    ekasTests,
    epressEnabled,
    epressMedicines,
    eKonsulta,
  ]);

  if (!fpeRecord) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="FPE Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              The FPE record you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/fpe")}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to FPE List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleCheckboxChange = (
    category: string,
    value: string,
    checked: boolean,
  ) => {
    const setters: Record<
      string,
      React.Dispatch<React.SetStateAction<string[]>>
    > = {
      heent: setHeent,
      chestBreastLungs: setChestBreastLungs,
      heart: setHeart,
      abdomen: setAbdomen,
      genitourinary: setGenitourinary,
      digitalRectal: setDigitalRectal,
      skinExtremities: setSkinExtremities,
      neurological: setNeurological,
    };

    const setter = setters[category];
    if (setter) {
      setter((prev) => {
        if (checked) {
          return [...prev, value];
        } else {
          return prev.filter((item) => item !== value);
        }
      });
    }
  };

  const addMedicine = () => {
    if (editingMedicineId) {
      // Update existing medicine
      setMedicines(
        medicines.map((med) =>
          med.id === editingMedicineId
            ? { ...currentMedicine, id: editingMedicineId }
            : med,
        ),
      );
      setEditingMedicineId(null);
    } else {
      // Add new medicine
      const newMedicine: Medicine = {
        id: Date.now().toString(),
        ...currentMedicine,
      };
      setMedicines([...medicines, newMedicine]);
    }
    // Clear the form
    setCurrentMedicine({
      genericName: "",
      brandName: "",
      formulation: "",
      signa: "",
      quantity: "",
    });
  };

  const editMedicine = (id: string) => {
    const medicine = medicines.find((med) => med.id === id);
    if (medicine) {
      setCurrentMedicine({
        genericName: medicine.genericName,
        brandName: medicine.brandName,
        formulation: medicine.formulation,
        signa: medicine.signa,
        quantity: medicine.quantity,
      });
      setEditingMedicineId(id);
    }
  };

  const cancelEditMedicine = () => {
    setCurrentMedicine({
      genericName: "",
      brandName: "",
      formulation: "",
      signa: "",
      quantity: "",
    });
    setEditingMedicineId(null);
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter((med) => med.id !== id));
    if (editingMedicineId === id) {
      cancelEditMedicine();
    }
  };

  const addEpressMedicine = () => {
    if (editingEpressMedicineId) {
      // Update existing medicine
      setEpressMedicines(
        epressMedicines.map((med) =>
          med.id === editingEpressMedicineId
            ? { ...currentEpressMedicine, id: editingEpressMedicineId }
            : med,
        ),
      );
      setEditingEpressMedicineId(null);
    } else {
      // Add new medicine
      const newMedicine: Medicine = {
        id: Date.now().toString(),
        ...currentEpressMedicine,
      };
      setEpressMedicines([...epressMedicines, newMedicine]);
    }
    // Clear the form
    setCurrentEpressMedicine({
      genericName: "",
      brandName: "",
      formulation: "",
      signa: "",
      quantity: "",
    });
  };

  const editEpressMedicine = (id: string) => {
    const medicine = epressMedicines.find((med) => med.id === id);
    if (medicine) {
      setCurrentEpressMedicine({
        genericName: medicine.genericName,
        brandName: medicine.brandName,
        formulation: medicine.formulation,
        signa: medicine.signa,
        quantity: medicine.quantity,
      });
      setEditingEpressMedicineId(id);
    }
  };

  const cancelEditEpressMedicine = () => {
    setCurrentEpressMedicine({
      genericName: "",
      brandName: "",
      formulation: "",
      signa: "",
      quantity: "",
    });
    setEditingEpressMedicineId(null);
  };

  const removeEpressMedicine = (id: string) => {
    setEpressMedicines(epressMedicines.filter((med) => med.id !== id));
    if (editingEpressMedicineId === id) {
      cancelEditEpressMedicine();
    }
  };

  const addLaboratory = () => {
    if (editingLaboratoryId) {
      // Update existing laboratory
      setLaboratories(
        laboratories.map((lab) =>
          lab.id === editingLaboratoryId
            ? { ...currentLaboratory, id: editingLaboratoryId }
            : lab,
        ),
      );
      setEditingLaboratoryId(null);
    } else {
      // Add new laboratory
      const newLab: Laboratory = {
        id: Date.now().toString(),
        ...currentLaboratory,
      };
      setLaboratories([...laboratories, newLab]);
    }
    // Clear the form
    setCurrentLaboratory({
      testName: "",
      testResults: "",
      summary: "",
    });
  };

  const editLaboratory = (id: string) => {
    const lab = laboratories.find((l) => l.id === id);
    if (lab) {
      setCurrentLaboratory({
        testName: lab.testName,
        testResults: lab.testResults,
        summary: lab.summary,
      });
      setEditingLaboratoryId(id);
    }
  };

  const cancelEditLaboratory = () => {
    setCurrentLaboratory({
      testName: "",
      testResults: "",
      summary: "",
    });
    setEditingLaboratoryId(null);
  };

  const removeLaboratory = (id: string) => {
    setLaboratories(laboratories.filter((lab) => lab.id !== id));
    if (editingLaboratoryId === id) {
      cancelEditLaboratory();
    }
  };

  const handleNext = () => {
    if (currentStep < 11) {
      navigate(`/fpe/${caseNumber}/consultations/new/${currentStep + 1}`);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      navigate(`/fpe/${caseNumber}/consultations/new/${currentStep - 1}`);
    }
  };

  const createConsultationMutation = useCreateConsultationMutation();

  const handleSaveConsultation = () => {
    const userName = user ? `${user.name}` : "Unknown User";
    const payload = {
      caseNumber: fpeRecord.caseNumber,
      consultationDate: new Date().toISOString(),
      patientName: fpeRecord.patientName,
      patientId: fpeRecord.patientId,
      birthdate: patient?.birthdate || "",
      age: patient ? calculateAge(patient.birthdate) : 0,
      civilStatus: patient?.civilStatus || "",
      gender: patient?.gender || "",
      mainComplaint,
      vitalSigns,
      physicalExam: {
        heent,
        heentOthers,
        chestBreastLungs,
        chestBreastLungsOthers,
        heart,
        heartOthers,
        abdomen,
        abdomenOthers,
        genitourinary,
        genitourinaryOthers,
        digitalRectal,
        digitalRectalOthers,
        skinExtremities,
        skinExtremitiesOthers,
        neurological,
        neurologicalOthers,
      },
      pcu,
      diagnosis,
      plan,
      medicines,
      laboratories,
      remarks,
      doctor,
      ekas: {
        enabled: Boolean(ekasEnabled),
        tests: ekasTests,
      },
      epress: {
        enabled: Boolean(epressEnabled),
        medicines: epressMedicines,
      },
      eKonsulta,
      attachments: [],
      status: "Completed" as const,
      createdBy: userName,
      updatedBy: userName,
    };

    createConsultationMutation.mutate(payload, {
      onSuccess: (consultation) => {
        dispatch(addConsultation(consultation));

        // Log the action
        logAction({
          dispatch,
          userId: user?.id || "unknown",
          userName,
          action: "CREATE",
          module: "CONSULTATION",
          entityType: "Consultation",
          entityId: consultation.id,
          entityName: fpeRecord.patientName,
          details: `Created consultation for ${fpeRecord.patientName} - ${mainComplaint}`,
        });

        // Sync eKonsulta status to FPE record if it's enabled in the consultation
        if (eKonsulta && !fpeRecord.eKonsulta) {
          dispatch(
            updateFPE({
              ...fpeRecord,
              eKonsulta: true,
              lastUpdated: new Date().toISOString(),
            }),
          );
        }

        sessionStorage.removeItem(`consultation-${caseNumber}`);
        navigate(`/fpe/${caseNumber}/consultations/success`, {
          state: {
            consultationId: consultation.id,
            caseNumber: fpeRecord.caseNumber,
            patientName: fpeRecord.patientName,
          },
        });
      },
    });
  };

  const CheckboxGroup = ({
    title,
    options,
    category,
    selected,
    othersText,
    setOthersText,
  }: {
    title: string;
    options: string[];
    category: string;
    selected: string[];
    othersText?: string;
    setOthersText?: (value: string) => void;
  }) => (
    <div className="mb-6">
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(e) =>
                handleCheckboxChange(category, option, e.target.checked)
              }
              className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
            />
            <span className="text-sm text-gray-900">{option}</span>
          </label>
        ))}
      </div>
      {selected.includes("Others") && setOthersText !== undefined && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specify Others
          </label>
          <input
            type="text"
            value={othersText || ""}
            onChange={(e) => setOthersText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Please specify..."
          />
        </div>
      )}
    </div>
  );

  const steps = [
    "Patient Details",
    "Main Complaint & Vital Signs",
    "Physical Exam: HEENT & Chest",
    "Physical Exam: Heart & Abdomen",
    "Physical Exam: Others",
    "PCU, Diagnosis & Plan",
    "Medicine",
    "Laboratory",
    "Doctor & Remarks",
    "EKAS & EPRESS",
    "eKonsulta",
    "Review",
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Patient Details
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Patient Details
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={
                    patient
                      ? `${patient.firstName} ${patient.middleName || ""} ${patient.lastName}`.trim()
                      : fpeRecord.patientName
                  }
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birthdate
                </label>
                <input
                  type="text"
                  value={
                    patient
                      ? new Date(patient.birthdate).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : "Not available"
                  }
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="text"
                  value={
                    patient ? calculateAge(patient.birthdate) : "Not available"
                  }
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Civil Status
                </label>
                <input
                  type="text"
                  value={patient?.civilStatus || "Not available"}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <input
                  type="text"
                  value={patient?.gender || "Not available"}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        // Main Complaint & Vital Signs
        return (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                Main Complaint/Concern
              </h3>
              <textarea
                value={mainComplaint}
                onChange={(e) => setMainComplaint(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter main complaint or concern..."
              />
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                Vital Signs
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature (Celsius)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalSigns.temperature || ""}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        temperature: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 37.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Respiratory Rate (Cpm)
                  </label>
                  <input
                    type="number"
                    value={vitalSigns.respiratoryRate || ""}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        respiratoryRate: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 18"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardiac Rate (Bpm)
                  </label>
                  <input
                    type="number"
                    value={vitalSigns.cardiacRate || ""}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        cardiacRate: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 72"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Pressure (mmHg)
                  </label>
                  <input
                    type="text"
                    value={vitalSigns.bloodPressure}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        bloodPressure: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 120/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (Kgs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalSigns.weight || ""}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        weight: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 70.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (inches)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalSigns.height || ""}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        height: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 65.5"
                  />
                </div>
              </div>
            </section>
          </div>
        );

      case 2:
        // HEENT & Chest
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Pertinent Physical Examination
            </h3>

            <CheckboxGroup
              title="HEENT"
              category="heent"
              selected={heent}
              othersText={heentOthers}
              setOthersText={setHeentOthers}
              options={[
                "Essentially Normal",
                "Abnormal Pupillary Reaction",
                "Cervical Lymphadenopathy",
                "Dry Mucous Membrane",
                "Icteric Sclerae",
                "Pale Conjunctivae",
                "Sunken Eyeballs",
                "Sunken Fontanelle",
                "Others",
              ]}
            />

            <CheckboxGroup
              title="Chest, Breast and Lungs"
              category="chestBreastLungs"
              selected={chestBreastLungs}
              othersText={chestBreastLungsOthers}
              setOthersText={setChestBreastLungsOthers}
              options={[
                "Essentially Normal",
                "Asymmetrical Chest Expansion",
                "Decrease Breath Sounds",
                "Wheezes",
                "Lumps Over Breast(s)",
                "Crackles/Rales",
                "Retractions",
                "Others",
              ]}
            />
          </div>
        );

      case 3:
        // Heart & Abdomen
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Pertinent Physical Examination (Continued)
            </h3>

            <CheckboxGroup
              title="Heart"
              category="heart"
              selected={heart}
              othersText={heartOthers}
              setOthersText={setHeartOthers}
              options={[
                "Essentially Normal",
                "Displaced Apex Beat",
                "Heaves/Trills",
                "Irregular Rhythm",
                "Muffled Heart Sounds",
                "Murmurs",
                "Pericardial Bulge",
                "Others",
              ]}
            />

            <CheckboxGroup
              title="Abdomen"
              category="abdomen"
              selected={abdomen}
              othersText={abdomenOthers}
              setOthersText={setAbdomenOthers}
              options={[
                "Essentially Normal",
                "Abdominal Rigidity",
                "Abdominal Tenderness",
                "Hyperactive Bowel Sounds",
                "Palpable Mass(es)",
                "Tympanitic/Dull Abdomen",
                "Uterine Contraction",
                "Others",
              ]}
            />
          </div>
        );

      case 4:
        // Genitourinary, Digital Rectal, Skin, Neurological
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Pertinent Physical Examination (Continued)
            </h3>

            <CheckboxGroup
              title="Genitourinary"
              category="genitourinary"
              selected={genitourinary}
              othersText={genitourinaryOthers}
              setOthersText={setGenitourinaryOthers}
              options={[
                "Essentially Normal",
                "Blood Stained in Exam Finger",
                "Cervical Dilation",
                "Presence of Abnormal Discharge",
                "Others",
              ]}
            />

            <CheckboxGroup
              title="Digital Rectal Examination"
              category="digitalRectal"
              selected={digitalRectal}
              othersText={digitalRectalOthers}
              setOthersText={setDigitalRectalOthers}
              options={[
                "Essentially Normal",
                "Enlarge Prostate",
                "Mass",
                "Hemorrhoids",
                "Puss",
                "Not Applicable",
                "Others",
              ]}
            />

            <CheckboxGroup
              title="Skin/Extremities"
              category="skinExtremities"
              selected={skinExtremities}
              othersText={skinExtremitiesOthers}
              setOthersText={setSkinExtremitiesOthers}
              options={[
                "Essentially Normal",
                "Clubbing",
                "Cold Clammy",
                "Cyanosis/Mottled Skin",
                "Edema/Swelling",
                "Decreased Mobility",
                "Pale Nailbeds",
                "Poor Skin Turgor",
                "Rashes/Petechiae",
                "Weak Pulse",
                "Others",
              ]}
            />

            <CheckboxGroup
              title="Neurological Examination"
              category="neurological"
              selected={neurological}
              othersText={neurologicalOthers}
              setOthersText={setNeurologicalOthers}
              options={[
                "Essentially Normal",
                "Abnormal Gait",
                "Abnormal Position Sense",
                "Abnormal Sensation",
                "Abnormal Reflex(es)",
                "Poor/Altered Memory",
                "Poor Muscle Tone/Strength",
                "Poor Coordination",
                "Others",
              ]}
            />
          </div>
        );

      case 5:
        // PCU, Diagnosis, Plan
        return (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                PCU
              </h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pcu"
                    checked={pcu === "YES"}
                    onChange={() => setPcu("YES")}
                    className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-sm text-gray-900">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pcu"
                    checked={pcu === "NO"}
                    onChange={() => setPcu("NO")}
                    className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-sm text-gray-900">No</span>
                </label>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                Diagnosis
              </h3>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter diagnosis..."
              />
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                Plan
              </h3>
              <textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter treatment plan..."
              />
            </section>
          </div>
        );

      case 6:
        // Medicine
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Medicine
            </h3>

            {/* Single Entry Form */}
            <div className="border border-gray-300 p-4 bg-blue-50">
              <h4 className="font-medium text-gray-900 mb-4">
                {editingMedicineId ? "Edit Medicine" : "Add Medicine"}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Generic Name
                  </label>
                  <input
                    type="text"
                    value={currentMedicine.genericName}
                    onChange={(e) =>
                      setCurrentMedicine({
                        ...currentMedicine,
                        genericName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Paracetamol"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={currentMedicine.brandName}
                    onChange={(e) =>
                      setCurrentMedicine({
                        ...currentMedicine,
                        brandName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Biogesic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formulation
                  </label>
                  <input
                    type="text"
                    value={currentMedicine.formulation}
                    onChange={(e) =>
                      setCurrentMedicine({
                        ...currentMedicine,
                        formulation: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Tablet, Syrup, Capsule"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signa
                  </label>
                  <input
                    type="text"
                    value={currentMedicine.signa}
                    onChange={(e) =>
                      setCurrentMedicine({
                        ...currentMedicine,
                        signa: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1 tab TID"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="text"
                    value={currentMedicine.quantity}
                    onChange={(e) =>
                      setCurrentMedicine({
                        ...currentMedicine,
                        quantity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 30 tablets"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={addMedicine}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
                >
                  {editingMedicineId ? (
                    <>
                      <Check size={16} />
                      Update
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add to List
                    </>
                  )}
                </button>
                {editingMedicineId && (
                  <button
                    onClick={cancelEditMedicine}
                    className="px-6 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Medicine Summary Table */}
            {medicines.length > 0 && (
              <div className="border border-gray-300 overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                  <h4 className="font-semibold text-gray-900">
                    Medicine List ({medicines.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Generic Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Brand Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Formulation
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Signa
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {medicines.map((medicine, index) => (
                        <tr
                          key={medicine.id}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {medicine.genericName || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {medicine.brandName || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {medicine.formulation || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {medicine.signa || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {medicine.quantity || "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => editMedicine(medicine.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => removeMedicine(medicine.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 7:
        // Laboratory
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Laboratory
            </h3>

            {/* Single Entry Form */}
            <div className="border border-gray-300 p-4 bg-green-50">
              <h4 className="font-medium text-gray-900 mb-4">
                {editingLaboratoryId
                  ? "Edit Laboratory Test"
                  : "Add Laboratory Test"}
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Name
                  </label>
                  <input
                    type="text"
                    value={currentLaboratory.testName}
                    onChange={(e) =>
                      setCurrentLaboratory({
                        ...currentLaboratory,
                        testName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Complete Blood Count"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Results
                  </label>
                  <textarea
                    value={currentLaboratory.testResults}
                    onChange={(e) =>
                      setCurrentLaboratory({
                        ...currentLaboratory,
                        testResults: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter test results..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Summary
                  </label>
                  <textarea
                    value={currentLaboratory.summary}
                    onChange={(e) =>
                      setCurrentLaboratory({
                        ...currentLaboratory,
                        summary: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter summary or interpretation..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={addLaboratory}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
                >
                  {editingLaboratoryId ? (
                    <>
                      <Check size={16} />
                      Update
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add to List
                    </>
                  )}
                </button>
                {editingLaboratoryId && (
                  <button
                    onClick={cancelEditLaboratory}
                    className="px-6 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Laboratory Summary Table */}
            {laboratories.length > 0 && (
              <div className="border border-gray-300 overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                  <h4 className="font-semibold text-gray-900">
                    Laboratory Tests List ({laboratories.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Test Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Test Results
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Summary
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {laboratories.map((lab, index) => (
                        <tr
                          key={lab.id}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {lab.testName || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="max-w-xs overflow-hidden text-ellipsis">
                              {lab.testResults || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="max-w-xs overflow-hidden text-ellipsis">
                              {lab.summary || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => editLaboratory(lab.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => removeLaboratory(lab.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 8:
        // Doctor & Remarks
        return (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                Doctor
              </h3>
              <select
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Doctor</option>
                <option value="Dr. Juan Dela Cruz">Dr. Juan Dela Cruz</option>
                <option value="Dr. Maria Santos">Dr. Maria Santos</option>
                <option value="Dr. Pedro Reyes">Dr. Pedro Reyes</option>
                <option value="Dr. Ana Garcia">Dr. Ana Garcia</option>
              </select>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                Remarks
              </h3>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional remarks..."
              />
            </section>
          </div>
        );

      case 9:
        // EKAS & EPRESS
        return (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                EKAS
              </h3>
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ekas"
                    checked={ekasEnabled === true}
                    onChange={() => setEkasEnabled(true)}
                    className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-sm text-gray-900">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ekas"
                    checked={ekasEnabled === false}
                    onChange={() => setEkasEnabled(false)}
                    className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-sm text-gray-900">No</span>
                </label>
              </div>

              {ekasEnabled === true && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    "Complete Blood Count (CBC) with Platelet count",
                    "Lipid Profile (Total Cholesterol)",
                    "Fasting Blood Sugar (FBS)",
                    "Oral Glucose Tolerance Test",
                    "Glycosylated Hemoglobin (HbA1c)",
                    "Creatinine",
                    "Chest X-ray",
                    "Sputum Microscopy",
                    "Electrocardiogram (ECG)",
                    "Urinalysis",
                    "Smear",
                    "Fecalysis",
                    "Fecal Occult Blood Test",
                  ].map((test) => (
                    <label
                      key={test}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={ekasTests.includes(test)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEkasTests([...ekasTests, test]);
                          } else {
                            setEkasTests(ekasTests.filter((t) => t !== test));
                          }
                        }}
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm text-gray-900">{test}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                EPRESS
              </h3>
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="epress"
                    checked={epressEnabled === true}
                    onChange={() => setEpressEnabled(true)}
                    className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-sm text-gray-900">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="epress"
                    checked={epressEnabled === false}
                    onChange={() => setEpressEnabled(false)}
                    className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-sm text-gray-900">No</span>
                </label>
              </div>

              {epressEnabled === true && (
                <>
                  {/* Single Entry Form */}
                  <div className="border border-gray-300 p-4 bg-purple-50 mt-4">
                    <h4 className="font-medium text-gray-900 mb-4">
                      {editingEpressMedicineId
                        ? "Edit EPRESS Medicine"
                        : "Add EPRESS Medicine"}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Generic Name
                        </label>
                        <input
                          type="text"
                          value={currentEpressMedicine.genericName}
                          onChange={(e) =>
                            setCurrentEpressMedicine({
                              ...currentEpressMedicine,
                              genericName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Metformin"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brand Name
                        </label>
                        <input
                          type="text"
                          value={currentEpressMedicine.brandName}
                          onChange={(e) =>
                            setCurrentEpressMedicine({
                              ...currentEpressMedicine,
                              brandName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Glucophage"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Formulation
                        </label>
                        <input
                          type="text"
                          value={currentEpressMedicine.formulation}
                          onChange={(e) =>
                            setCurrentEpressMedicine({
                              ...currentEpressMedicine,
                              formulation: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Tablet"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Signa
                        </label>
                        <input
                          type="text"
                          value={currentEpressMedicine.signa}
                          onChange={(e) =>
                            setCurrentEpressMedicine({
                              ...currentEpressMedicine,
                              signa: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 1 tab BID"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="text"
                          value={currentEpressMedicine.quantity}
                          onChange={(e) =>
                            setCurrentEpressMedicine({
                              ...currentEpressMedicine,
                              quantity: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 60 tablets"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={addEpressMedicine}
                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm"
                      >
                        {editingEpressMedicineId ? (
                          <>
                            <Check size={16} />
                            Update
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            Add to List
                          </>
                        )}
                      </button>
                      {editingEpressMedicineId && (
                        <button
                          onClick={cancelEditEpressMedicine}
                          className="px-6 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* EPRESS Medicine Summary Table */}
                  {epressMedicines.length > 0 && (
                    <div className="border border-gray-300 overflow-hidden mt-6">
                      <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                        <h4 className="font-semibold text-gray-900">
                          EPRESS Medicine List ({epressMedicines.length})
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-300">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                Generic Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                Brand Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                Formulation
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                Signa
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                Quantity
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {epressMedicines.map((medicine, index) => (
                              <tr
                                key={medicine.id}
                                className={
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {medicine.genericName || "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {medicine.brandName || "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {medicine.formulation || "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {medicine.signa || "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {medicine.quantity || "-"}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() =>
                                        editEpressMedicine(medicine.id)
                                      }
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Edit"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        removeEpressMedicine(medicine.id)
                                      }
                                      className="text-red-600 hover:text-red-800"
                                      title="Remove"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        );

      case 10:
        // eKonsulta
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              eKonsulta
            </h3>
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={eKonsulta}
                onChange={(e) => setEKonsulta(e.target.checked)}
                className="w-5 h-5 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
              />
              <span className="text-sm font-medium text-gray-900">
                eKonsulta Patient
              </span>
            </label>
          </div>
        );

      case 11:
        // Review
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
              <p className="text-sm text-blue-900 font-medium">
                Please review all consultation information below before
                submitting. You can use the "Previous" button to go back and
                make changes if needed.
              </p>
            </div>

            {/* Patient Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Patient Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Patient Name</p>
                  <p className="font-medium text-gray-900">
                    {patient
                      ? `${patient.firstName} ${patient.middleName || ""} ${patient.lastName}`.trim()
                      : fpeRecord.patientName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Birthdate</p>
                  <p className="font-medium text-gray-900">
                    {patient
                      ? new Date(patient.birthdate).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="font-medium text-gray-900">
                    {patient
                      ? `${calculateAge(patient.birthdate)} years old`
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="font-medium text-gray-900">
                    {patient?.gender || "Not available"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Civil Status</p>
                  <p className="font-medium text-gray-900">
                    {patient?.civilStatus || "Not available"}
                  </p>
                </div>
              </div>
            </section>

            {/* Main Complaint */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Main Complaint
              </h3>
              <p className="text-gray-900">{mainComplaint || "N/A"}</p>
            </section>

            {/* Vital Signs */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Vital Signs
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Temperature (°C)</p>
                  <p className="font-medium text-gray-900">
                    {vitalSigns.temperature || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Respiratory Rate</p>
                  <p className="font-medium text-gray-900">
                    {vitalSigns.respiratoryRate || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cardiac Rate</p>
                  <p className="font-medium text-gray-900">
                    {vitalSigns.cardiacRate || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Blood Pressure</p>
                  <p className="font-medium text-gray-900">
                    {vitalSigns.bloodPressure || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Weight (kg)</p>
                  <p className="font-medium text-gray-900">
                    {vitalSigns.weight || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Height (cm)</p>
                  <p className="font-medium text-gray-900">
                    {vitalSigns.height || "N/A"}
                  </p>
                </div>
              </div>
            </section>

            {/* Physical Examination */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Pertinent Physical Examination
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    HEENT
                  </p>
                  <p className="text-gray-900">
                    {heent.length > 0 ? heent.join(", ") : "None"}
                  </p>
                  {heent.includes("Others") && heentOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {heentOthers}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Chest/Breast/Lungs
                  </p>
                  <p className="text-gray-900">
                    {chestBreastLungs.length > 0
                      ? chestBreastLungs.join(", ")
                      : "None"}
                  </p>
                  {chestBreastLungs.includes("Others") &&
                    chestBreastLungsOthers && (
                      <p className="text-sm text-gray-600 mt-1">
                        Others: {chestBreastLungsOthers}
                      </p>
                    )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Heart
                  </p>
                  <p className="text-gray-900">
                    {heart.length > 0 ? heart.join(", ") : "None"}
                  </p>
                  {heart.includes("Others") && heartOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {heartOthers}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Abdomen
                  </p>
                  <p className="text-gray-900">
                    {abdomen.length > 0 ? abdomen.join(", ") : "None"}
                  </p>
                  {abdomen.includes("Others") && abdomenOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {abdomenOthers}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Genitourinary
                  </p>
                  <p className="text-gray-900">
                    {genitourinary.length > 0
                      ? genitourinary.join(", ")
                      : "None"}
                  </p>
                  {genitourinary.includes("Others") && genitourinaryOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {genitourinaryOthers}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Digital Rectal
                  </p>
                  <p className="text-gray-900">
                    {digitalRectal.length > 0
                      ? digitalRectal.join(", ")
                      : "None"}
                  </p>
                  {digitalRectal.includes("Others") && digitalRectalOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {digitalRectalOthers}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Skin/Extremities
                  </p>
                  <p className="text-gray-900">
                    {skinExtremities.length > 0
                      ? skinExtremities.join(", ")
                      : "None"}
                  </p>
                  {skinExtremities.includes("Others") &&
                    skinExtremitiesOthers && (
                      <p className="text-sm text-gray-600 mt-1">
                        Others: {skinExtremitiesOthers}
                      </p>
                    )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Neurological
                  </p>
                  <p className="text-gray-900">
                    {neurological.length > 0 ? neurological.join(", ") : "None"}
                  </p>
                  {neurological.includes("Others") && neurologicalOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {neurologicalOthers}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* PCU */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                PCU
              </h3>
              <p className="font-medium text-gray-900">
                {pcu || "Not specified"}
              </p>
            </section>

            {/* Diagnosis */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Diagnosis
              </h3>
              <p className="text-gray-900">{diagnosis || "N/A"}</p>
            </section>

            {/* Plan */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Plan
              </h3>
              <p className="text-gray-900">{plan || "N/A"}</p>
            </section>

            {/* Medicines */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Medicines
              </h3>
              {medicines.length > 0 ? (
                <div className="space-y-4">
                  {medicines.map((medicine, index) => (
                    <div
                      key={medicine.id}
                      className="bg-gray-50 border border-gray-200 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Medicine {index + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Generic Name:</span>{" "}
                          <span className="text-gray-900">
                            {medicine.genericName || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Brand Name:</span>{" "}
                          <span className="text-gray-900">
                            {medicine.brandName || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Formulation:</span>{" "}
                          <span className="text-gray-900">
                            {medicine.formulation || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Signa:</span>{" "}
                          <span className="text-gray-900">
                            {medicine.signa || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Quantity:</span>{" "}
                          <span className="text-gray-900">
                            {medicine.quantity || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No medicines prescribed</p>
              )}
            </section>

            {/* Laboratory */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Laboratory Tests
              </h3>
              {laboratories.length > 0 ? (
                <div className="space-y-4">
                  {laboratories.map((lab, index) => (
                    <div
                      key={lab.id}
                      className="bg-gray-50 border border-gray-200 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Test {index + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Test Name:</span>{" "}
                          <span className="text-gray-900">
                            {lab.testName || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Test Results:</span>{" "}
                          <span className="text-gray-900">
                            {lab.testResults || "N/A"}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Summary:</span>{" "}
                          <span className="text-gray-900">
                            {lab.summary || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No laboratory tests ordered</p>
              )}
            </section>

            {/* Doctor & Remarks */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Doctor & Remarks
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Doctor</p>
                  <p className="font-medium text-gray-900">{doctor || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Remarks</p>
                  <p className="text-gray-900">{remarks || "N/A"}</p>
                </div>
              </div>
            </section>

            {/* EKAS */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                EKAS
              </h3>
              <p className="text-gray-900 mb-2">
                {ekasEnabled === true
                  ? "Enabled"
                  : ekasEnabled === false
                    ? "Not enabled"
                    : "Not specified"}
              </p>
              {ekasEnabled === true && ekasTests.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Tests Ordered:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-900 space-y-1">
                    {ekasTests.map((test, index) => (
                      <li key={index}>{test}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* EPRESS */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                EPRESS
              </h3>
              <p className="text-gray-900 mb-2">
                {epressEnabled === true
                  ? "Enabled"
                  : epressEnabled === false
                    ? "Not enabled"
                    : "Not specified"}
              </p>
              {epressEnabled === true && epressMedicines.length > 0 ? (
                <div className="space-y-4">
                  {epressMedicines.map((medicine, index) => (
                    <div
                      key={medicine.id}
                      className="bg-purple-50 border border-purple-200 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        EPRESS Medicine {index + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Generic Name:</span>{" "}
                          <span className="text-gray-900">
                            {medicine.genericName || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Brand Name:</span>{" "}
                          <span className="text-gray-900">
                            {medicine.brandName || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Formulation:</span>{" "}
                          <span className="text-gray-900">
                            {medicine.formulation || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Signa:</span>{" "}
                          <span className="text-gray-900">
                            {medicine.signa || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Quantity:</span>{" "}
                          <span className="text-gray-900">
                            {medicine.quantity || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : epressEnabled === true ? (
                <p className="text-gray-500">No EPRESS medicines prescribed</p>
              ) : null}
            </section>

            {/* eKonsulta */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                eKonsulta
              </h3>
              <p className="font-medium text-gray-900">
                {eKonsulta ? "Yes" : "No"}
              </p>
            </section>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="New Consultation"
        subtitle={`Patient: ${fpeRecord.patientName} • Case: ${fpeRecord.caseNumber} • Step ${currentStep + 1} of ${steps.length}`}
      />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              sessionStorage.removeItem(`consultation-${caseNumber}`);
              navigate(`/fpe/${caseNumber}/consultations`);
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Consultations
          </button>
        </div>

        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={index} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < currentStep
                        ? "bg-green-600 text-white"
                        : index === currentStep
                          ? "bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {index < currentStep ? <Check size={16} /> : index + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs text-center ${
                      index === currentStep
                        ? "text-blue-600 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 ${
                      index < currentStep ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white border border-gray-200 p-6 min-h-[500px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSaveConsultation}
              disabled={createConsultationMutation.isPending}
              className="flex items-center gap-2 px-8 py-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={20} />
              {createConsultationMutation.isPending
                ? "Saving..."
                : "Save Consultation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
