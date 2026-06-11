import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { updateFPE as updateFPEService } from "../../services/fpeService";
import { toast } from "sonner";
import type { Patient } from "../../store/slices/patientsSlice";
import { logAction, detectChanges } from "../../utils/auditLogger";
import { Header } from "../components/Header";
import { ChevronLeft, ChevronRight, Check, Search } from "lucide-react";
import { fetchFPEByCaseNumber } from "../../services/fpeService";

// Local helper to avoid importing types from fpeSlice (which may cause module resolution/type errors)
function calculateBMI(weight?: number, height?: number): number | undefined {
  if (!weight || !height || height === 0) return undefined;
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
}

export function FPEEdit() {
  const navigate = useNavigate();
  const { caseNumber, step: stepParam } = useParams<{
    caseNumber: string;
    step: string;
  }>();
  const dispatch = useDispatch();
  const patients = useSelector((state: any) => state.patients?.patients ?? []);
  const user = useSelector((state: any) => state.auth?.user);

  const existingFPE = useSelector((state: any) =>
    state.fpe?.fpeRecords?.find(
      (f: { caseNumber: string | undefined }) => f.caseNumber === caseNumber,
    ),
  );

  const resolvedCaseNumber = caseNumber ?? "";
  const fpeQuery = useQuery<any, Error>({
    queryKey: ["fpe", resolvedCaseNumber],
    queryFn: () => fetchFPEByCaseNumber(resolvedCaseNumber),
    enabled: !!resolvedCaseNumber && !existingFPE,
  });

  const editableFPE = existingFPE ?? fpeQuery.data;

  const queryClient = useQueryClient();

  const updateFPEMutation = useMutation<any, Error, { caseNumber: string; payload: any }>({
    mutationFn: ({ caseNumber, payload }: { caseNumber: string; payload: any }) => updateFPEService(caseNumber, payload),
    onSuccess: (updated: any) => {
      // Keep Redux store in sync if possible (avoid importing slice to prevent module resolution issues)
      (dispatch as any)({ type: "fpe/updateFPE", payload: updated });
      queryClient.invalidateQueries({ queryKey: ["fpe"], exact: false });
      // update specific queries to reduce refetch windows
      queryClient.setQueryData(["fpe", updated.caseNumber], updated);
      if (updated.patientId) {
        queryClient.invalidateQueries({ queryKey: ["fpe", "history", updated.patientId], exact: false });
      }
      // Notify the user of successful update
      try {
        toast.success("FPE updated", { description: `Updated FPE ${updated.caseNumber} for ${updated.patientName}` });
      } catch (e) {
        // ignore toast errors
      }
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unable to update FPE record.";
      toast.error("FPE update failed", { description: message });
    },
  });

  const currentStep = parseInt(stepParam || "0", 10);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Load existing FPE data for editing
  useEffect(() => {
    if (editableFPE) {
      const patient = patients.find(
        (p: { patientId: any }) => p.patientId === editableFPE.patientId,
      );
      if (patient) setSelectedPatient(patient);

      setEKonsulta(editableFPE.eKonsulta);
      setPhilhealthNumber(editableFPE.philhealthNumber);
      setPhilhealthType(editableFPE.philhealthType);

      // Past Medical History
      setPastMedical(editableFPE.pastMedicalHistory.conditions as any);
      setPastMedicalSpecify({
        allergy: editableFPE.pastMedicalHistory.specifiedAllergy || "",
        cancerOrgan:
          editableFPE.pastMedicalHistory.specifiedCancerOrgan || "",
        hepatitisType:
          editableFPE.pastMedicalHistory.specifiedHepatitisType || "",
        bloodPressure:
          editableFPE.pastMedicalHistory.highestBloodPressure || "",
        pulmonaryTBCategory:
          editableFPE.pastMedicalHistory.pulmonaryTBCategory || "",
        extraPulmonaryTBCategory:
          editableFPE.pastMedicalHistory.extraPulmonaryTBCategory || "",
        others: editableFPE.pastMedicalHistory.others || "",
      });

      // Past Surgical History
      setSurgicalHistory({
        none: editableFPE.pastSurgicalHistory.none || false,
        operation: editableFPE.pastSurgicalHistory.operation || "",
        date: editableFPE.pastSurgicalHistory.date || "",
      });

      // Family History
      setFamilyHistory(editableFPE.familyHistory.conditions as any);
      setFamilyHistorySpecify({
        allergy: editableFPE.familyHistory.specifiedAllergy || "",
        cancerOrgan: editableFPE.familyHistory.specifiedCancerOrgan || "",
        hepatitisType:
          editableFPE.familyHistory.specifiedHepatitisType || "",
        bloodPressure: editableFPE.familyHistory.highestBloodPressure || "",
        pulmonaryTBCategory:
          editableFPE.familyHistory.pulmonaryTBCategory || "",
        extraPulmonaryTBCategory:
          editableFPE.familyHistory.extraPulmonaryTBCategory || "",
        others: editableFPE.familyHistory.others || "",
      });

      // Personal History
      setPersonalHistory(editableFPE.personalHistory as any);

      // Immunization
      setImmunization(editableFPE.immunization as any);

      // Family Planning
      setFamilyPlanning(editableFPE.familyPlanning.hasAccess || "");

      // Menstrual History
      if (editableFPE.menstrualHistory) {
        setMenstrualHistory({
          menarche: editableFPE.menstrualHistory.menarche?.toString() || "",
          onsetSexualIntercourse:
            editableFPE.menstrualHistory.onsetSexualIntercourse?.toString() ||
            "",
          menopaused: editableFPE.menstrualHistory.menopaused || "",
          menopauseAge:
            editableFPE.menstrualHistory.menopauseAge?.toString() || "",
          lmp: editableFPE.menstrualHistory.lmp || "",
          periodDuration:
            editableFPE.menstrualHistory.periodDuration?.toString() || "",
          intervalCycle:
            editableFPE.menstrualHistory.intervalCycle?.toString() || "",
          padsPerDay:
            editableFPE.menstrualHistory.padsPerDay?.toString() || "",
          birthControlMethod:
            editableFPE.menstrualHistory.birthControlMethod || "",
        });
      }

      // Pregnancy History
      if (editableFPE.pregnancyHistory) {
        setPregnancyHistory({
          gravidity: editableFPE.pregnancyHistory.gravidity?.toString() || "",
          parity: editableFPE.pregnancyHistory.parity?.toString() || "",
          typeOfDelivery:
            editableFPE.pregnancyHistory.typeOfDelivery || "",
          fullTerm:
            editableFPE.pregnancyHistory.fullTerm?.toString() || "",
          premature:
            editableFPE.pregnancyHistory.premature?.toString() || "",
          abortion:
            editableFPE.pregnancyHistory.abortion?.toString() || "",
          livingChildren:
            editableFPE.pregnancyHistory.livingChildren?.toString() || "",
          pregnancyInducedHypertension:
            editableFPE.pregnancyHistory.pregnancyInducedHypertension || "",
        });
      }

      // Physical Exam
      setPhysicalExam(editableFPE.physicalExamination as any);

      // Pertinent Findings
      const findings: any = {};
      Object.keys(editableFPE.pertinentFindings).forEach((key) => {
        findings[key] =
          editableFPE.pertinentFindings[
            key as keyof typeof editableFPE.pertinentFindings
          ];
      });
      setPertinentFindings(findings);

      // NCD Assessment
      setNcdAssessment(editableFPE.ncdAssessment as any);

      // Final Diagnosis and Remarks
      setFinalDiagnosis(editableFPE.finalDiagnosis || "");
      setRemarks(editableFPE.remarks || "");
    }
  }, [editableFPE, patients]);

  // Validate step parameter
  useEffect(() => {
    if (isNaN(currentStep) || currentStep < 0 || currentStep > 12) {
      navigate(`/fpe/${caseNumber}/edit/0`, { replace: true });
    }
  }, [currentStep, navigate, caseNumber]);

  // Form Data State
  const [eKonsulta, setEKonsulta] = useState(false);
  const [philhealthNumber, setPhilhealthNumber] = useState("");
  const [philhealthType, setPhilhealthType] = useState<"Member" | "Dependent">(
    "Member",
  );

  // Past Medical History
  const [pastMedical, setPastMedical] = useState({
    allergy: false,
    asthma: false,
    cancer: false,
    cerebrovascular: false,
    coronaryArtery: false,
    diabetesMellitus: false,
    emphysema: false,
    epilepsy: false,
    hepatitis: false,
    hyperlipidemia: false,
    hypertension: false,
    pepticUlcer: false,
    pneumonia: false,
    thyroidDisease: false,
    pulmonaryTB: false,
    extraPulmonaryTB: false,
    urinaryTractInfection: false,
    mentalIllness: false,
    others: false,
    none: false,
  });
  const [pastMedicalSpecify, setPastMedicalSpecify] = useState({
    allergy: "",
    cancerOrgan: "",
    hepatitisType: "",
    bloodPressure: "",
    pulmonaryTBCategory: "",
    extraPulmonaryTBCategory: "",
    others: "",
  });

  // Past Surgical History
  const [surgicalHistory, setSurgicalHistory] = useState({
    none: false,
    operation: "",
    date: "",
  });

  // Family History
  const [familyHistory, setFamilyHistory] = useState({
    allergy: false,
    asthma: false,
    cancer: false,
    cerebrovascular: false,
    coronaryArtery: false,
    diabetesMellitus: false,
    emphysema: false,
    epilepsy: false,
    hepatitis: false,
    hyperlipidemia: false,
    hypertension: false,
    pepticUlcer: false,
    pneumonia: false,
    thyroidDisease: false,
    pulmonaryTB: false,
    extraPulmonaryTB: false,
    urinaryTractInfection: false,
    mentalIllness: false,
    others: false,
    none: false,
  });
  const [familyHistorySpecify, setFamilyHistorySpecify] = useState({
    allergy: "",
    cancerOrgan: "",
    hepatitisType: "",
    bloodPressure: "",
    pulmonaryTBCategory: "",
    extraPulmonaryTBCategory: "",
    others: "",
  });

  // Personal/Social History
  const [personalHistory, setPersonalHistory] = useState({
    smoking: "" as "YES" | "NO" | "QUIT" | "",
    packsPerYear: "",
    alcohol: "" as "YES" | "NO" | "QUIT" | "",
    bottlesPerDay: "",
    illicitDrugs: "" as "YES" | "NO" | "",
    sexuallyActive: "" as "YES" | "NO" | "",
  });

  // Immunization
  const [immunization, setImmunization] = useState({
    // Children
    opv1: false,
    opv2: false,
    opv3: false,
    bcg: false,
    dpt1: false,
    dpt2: false,
    dpt3: false,
    measles: false,
    hepB1: false,
    hepB2: false,
    hepB3: false,
    hepA: false,
    varicellaChickenPox: false,
    noneChildren: false,
    // Adult
    hpv: false,
    mmr: false,
    noneAdult: false,
    // Pregnant Women
    tetanusToxoidPregnant: false,
    nonePregnant: false,
    // Elderly and Immunocompromised
    pneumoElderly: false,
    tetanusToxoidElderly: false,
    noneElderly: false,
    // Others
    othersSpecify: "",
  });

  // Family Planning
  const [familyPlanning, setFamilyPlanning] = useState<"YES" | "NO" | "">("");

  // Menstrual History
  const [menstrualHistory, setMenstrualHistory] = useState({
    menarche: "",
    onsetSexualIntercourse: "",
    menopaused: "" as "YES" | "NO" | "",
    menopauseAge: "",
    lmp: "",
    periodDuration: "",
    intervalCycle: "",
    padsPerDay: "",
    birthControlMethod: "",
  });

  // Pregnancy History
  const [pregnancyHistory, setPregnancyHistory] = useState({
    gravidity: "",
    parity: "",
    typeOfDelivery: "",
    fullTerm: "",
    premature: "",
    abortion: "",
    livingChildren: "",
    pregnancyInducedHypertension: "" as "YES" | "NO" | "",
  });

  // Physical Examination
  const [physicalExam, setPhysicalExam] = useState({
    bloodPressure: "",
    heartRate: "",
    respiratoryRate: "",
    visualAcuity: "",
    height: "",
    weight: "",
    bmi: "",
    temperature: "",
    length: "",
    headCircumference: "",
    skinfoldThickness: "",
    waist: "",
    hip: "",
    limbs: "",
    muac: "",
    bloodType: "",
    generalSurvey: "",
  });

  // Pertinent Findings
  const [pertinentFindings, setPertinentFindings] = useState({
    heent: [] as string[],
    chestBreastLungs: [] as string[],
    heart: [] as string[],
    abdomen: [] as string[],
    genitourinary: [] as string[],
    digitalRectal: [] as string[],
    skinExtremities: [] as string[],
    neurological: [] as string[],
  });

  // Pertinent Findings "Others" text
  const [pertinentFindingsOthers, setPertinentFindingsOthers] = useState({
    heent: "",
    chestBreastLungs: "",
    heart: "",
    abdomen: "",
    genitourinary: "",
    digitalRectal: "",
    skinExtremities: "",
    neurological: "",
  });

  // NCD Assessment
  const [ncdAssessment, setNcdAssessment] = useState({
    highFatSaltIntake: "" as "YES" | "NO" | "",
    vegetablesDaily: "" as "YES" | "NO" | "",
    fruitsDaily: "" as "YES" | "NO" | "",
    physicalActivity: "" as "YES" | "NO" | "",
    diabetesDiagnosed: "" as "YES" | "NO" | "",
    diabetesWithMedication: "" as "YES" | "NO" | "",
    diabetesMedicationDetails: "",
    polyphagia: "" as "YES" | "NO" | "",
    polydipsia: "" as "YES" | "NO" | "",
    polyuria: "" as "YES" | "NO" | "",
    raisedBloodGlucose: "" as "YES" | "NO" | "",
    fbsRbs: "",
    glucoseDate: "",
    raisedBloodLipids: "" as "YES" | "NO" | "",
    totalCholesterol: "",
    lipidsDate: "",
    urineKetones: "" as "YES" | "NO" | "",
    urineKetonesValue: "",
    ketonesDate: "",
    urineProtein: "" as "YES" | "NO" | "",
    urineProteinValue: "",
    proteinDate: "",
    angina1: "" as "YES" | "NO" | "",
    angina2: "" as "YES" | "NO" | "",
    angina3: "" as "YES" | "NO" | "",
    angina4: "" as "YES" | "NO" | "",
    angina5: "" as "YES" | "NO" | "",
    angina6: "" as "YES" | "NO" | "",
    angina7: "" as "YES" | "NO" | "",
    strokeQuestion: "" as "YES" | "NO" | "",
    riskLevel: "",
  });

  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [remarks, setRemarks] = useState("");

  const steps = [
    "Patient Selection",
    "Past Medical History",
    "Past Surgical History",
    "Family History",
    "Personal/Social History",
    "Immunization",
    "Family Planning",
    "Menstrual History",
    "Pregnancy History",
    "Physical Examination",
    "Pertinent Findings",
    "NCD Assessment",
    "Final Diagnosis",
  ];

  const handlePatientSelect = (_patient: Patient) => {
    // Patient selection is disabled in edit mode - patient cannot be changed
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      navigate(`/fpe/${caseNumber}/edit/${currentStep + 1}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      navigate(`/fpe/${caseNumber}/edit/${currentStep - 1}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    if (!selectedPatient || !editableFPE) return;

    const userName = user ? `${user.name}` : "Unknown User";

    const updatedFPE: any = {
      ...editableFPE,
      patientId: selectedPatient.patientId,
      patientName:
        `${selectedPatient.firstName} ${selectedPatient.middleName || ""} ${selectedPatient.lastName}`.trim(),
      eKonsulta,
      philhealthNumber,
      philhealthType,
      lastUpdated: new Date().toISOString(),
      updatedBy: userName,

      pastMedicalHistory: {
        conditions: pastMedical,
        specifiedAllergy: pastMedicalSpecify.allergy,
        specifiedCancerOrgan: pastMedicalSpecify.cancerOrgan,
        specifiedHepatitisType: pastMedicalSpecify.hepatitisType,
        highestBloodPressure: pastMedicalSpecify.bloodPressure,
        pulmonaryTBCategory: pastMedicalSpecify.pulmonaryTBCategory,
        extraPulmonaryTBCategory: pastMedicalSpecify.extraPulmonaryTBCategory,
        others: pastMedicalSpecify.others,
      },

      pastSurgicalHistory: surgicalHistory,

      familyHistory: {
        conditions: familyHistory,
        specifiedAllergy: familyHistorySpecify.allergy,
        specifiedCancerOrgan: familyHistorySpecify.cancerOrgan,
        specifiedHepatitisType: familyHistorySpecify.hepatitisType,
        highestBloodPressure: familyHistorySpecify.bloodPressure,
        pulmonaryTBCategory: familyHistorySpecify.pulmonaryTBCategory,
        extraPulmonaryTBCategory: familyHistorySpecify.extraPulmonaryTBCategory,
        others: familyHistorySpecify.others,
      },

      personalHistory: {
        smoking: personalHistory.smoking,
        packsPerYear: personalHistory.packsPerYear
          ? Number(personalHistory.packsPerYear)
          : undefined,
        alcohol: personalHistory.alcohol,
        bottlesPerDay: personalHistory.bottlesPerDay
          ? Number(personalHistory.bottlesPerDay)
          : undefined,
        illicitDrugs: personalHistory.illicitDrugs,
        sexuallyActive: personalHistory.sexuallyActive,
      },

      immunization: {
        children: Object.entries(immunization)
          .filter(
            ([key, value]) =>
              value &&
              [
                "opv1",
                "opv2",
                "opv3",
                "bcg",
                "dpt1",
                "dpt2",
                "dpt3",
                "measles",
                "hepB1",
                "hepB2",
                "hepB3",
                "hepA",
                "varicellaChickenPox",
                "noneChildren",
              ].includes(key),
          )
          .map(([key]) =>
            key === "noneChildren" ? "NONE" : key.toUpperCase(),
          ),
        adult: Object.entries(immunization)
          .filter(
            ([key, value]) =>
              value && ["hpv", "mmr", "noneAdult"].includes(key),
          )
          .map(([key]) => (key === "noneAdult" ? "NONE" : key.toUpperCase())),
        pregnant: Object.entries(immunization)
          .filter(
            ([key, value]) =>
              value && ["tetanusToxoidPregnant", "nonePregnant"].includes(key),
          )
          .map(([key]) =>
            key === "tetanusToxoidPregnant" ? "TETANUS TOXOID" : "NONE",
          ),
        elderly: Object.entries(immunization)
          .filter(
            ([key, value]) =>
              value &&
              ["pneumoElderly", "tetanusToxoidElderly", "noneElderly"].includes(
                key,
              ),
          )
          .map(([key]) =>
            key === "pneumoElderly"
              ? "PNEUMO"
              : key === "tetanusToxoidElderly"
                ? "TETANUS TOXOID"
                : "NONE",
          ),
        othersSpecify: immunization.othersSpecify,
      },

      familyPlanning: {
        hasAccess: familyPlanning,
      },

      menstrualHistory:
        selectedPatient.gender === "Female"
          ? {
              menarche: menstrualHistory.menarche
                ? Number(menstrualHistory.menarche)
                : undefined,
              onsetSexualIntercourse: menstrualHistory.onsetSexualIntercourse
                ? Number(menstrualHistory.onsetSexualIntercourse)
                : undefined,
              menopaused: menstrualHistory.menopaused,
              menopauseAge: menstrualHistory.menopauseAge
                ? Number(menstrualHistory.menopauseAge)
                : undefined,
              lmp: menstrualHistory.lmp,
              periodDuration: menstrualHistory.periodDuration
                ? Number(menstrualHistory.periodDuration)
                : undefined,
              intervalCycle: menstrualHistory.intervalCycle
                ? Number(menstrualHistory.intervalCycle)
                : undefined,
              padsPerDay: menstrualHistory.padsPerDay
                ? Number(menstrualHistory.padsPerDay)
                : undefined,
              birthControlMethod: menstrualHistory.birthControlMethod,
            }
          : undefined,

      pregnancyHistory:
        selectedPatient.gender === "Female"
          ? {
              gravidity: pregnancyHistory.gravidity
                ? Number(pregnancyHistory.gravidity)
                : undefined,
              parity: pregnancyHistory.parity
                ? Number(pregnancyHistory.parity)
                : undefined,
              typeOfDelivery: pregnancyHistory.typeOfDelivery,
              fullTerm: pregnancyHistory.fullTerm
                ? Number(pregnancyHistory.fullTerm)
                : undefined,
              premature: pregnancyHistory.premature
                ? Number(pregnancyHistory.premature)
                : undefined,
              abortion: pregnancyHistory.abortion
                ? Number(pregnancyHistory.abortion)
                : undefined,
              livingChildren: pregnancyHistory.livingChildren
                ? Number(pregnancyHistory.livingChildren)
                : undefined,
              pregnancyInducedHypertension:
                pregnancyHistory.pregnancyInducedHypertension,
            }
          : undefined,

      physicalExamination: {
        bloodPressure: physicalExam.bloodPressure,
        heartRate: physicalExam.heartRate
          ? Number(physicalExam.heartRate)
          : undefined,
        respiratoryRate: physicalExam.respiratoryRate
          ? Number(physicalExam.respiratoryRate)
          : undefined,
        visualAcuity: physicalExam.visualAcuity,
        height: physicalExam.height ? Number(physicalExam.height) : undefined,
        weight: physicalExam.weight ? Number(physicalExam.weight) : undefined,
        bmi: physicalExam.bmi ? Number(physicalExam.bmi) : undefined,
        temperature: physicalExam.temperature
          ? Number(physicalExam.temperature)
          : undefined,
        length: physicalExam.length ? Number(physicalExam.length) : undefined,
        headCircumference: physicalExam.headCircumference
          ? Number(physicalExam.headCircumference)
          : undefined,
        skinfoldThickness: physicalExam.skinfoldThickness
          ? Number(physicalExam.skinfoldThickness)
          : undefined,
        waist: physicalExam.waist ? Number(physicalExam.waist) : undefined,
        hip: physicalExam.hip ? Number(physicalExam.hip) : undefined,
        limbs: physicalExam.limbs ? Number(physicalExam.limbs) : undefined,
        muac: physicalExam.muac ? Number(physicalExam.muac) : undefined,
        bloodType: physicalExam.bloodType,
        generalSurvey: physicalExam.generalSurvey,
      },

      pertinentFindings,

      ncdAssessment:
        selectedPatient.age >= 25
          ? {
              highFatSaltIntake: ncdAssessment.highFatSaltIntake,
              vegetablesDaily: ncdAssessment.vegetablesDaily,
              fruitsDaily: ncdAssessment.fruitsDaily,
              physicalActivity: ncdAssessment.physicalActivity,
              diabetesDiagnosed: ncdAssessment.diabetesDiagnosed,
              diabetesWithMedication: ncdAssessment.diabetesWithMedication,
              diabetesMedicationDetails:
                ncdAssessment.diabetesMedicationDetails,
              symptoms: {
                polyphagia: ncdAssessment.polyphagia,
                polydipsia: ncdAssessment.polydipsia,
                polyuria: ncdAssessment.polyuria,
              },
              raisedBloodGlucose: ncdAssessment.raisedBloodGlucose,
              fbsRbs: ncdAssessment.fbsRbs,
              glucoseDate: ncdAssessment.glucoseDate,
              raisedBloodLipids: ncdAssessment.raisedBloodLipids,
              totalCholesterol: ncdAssessment.totalCholesterol,
              lipidsDate: ncdAssessment.lipidsDate,
              urineKetones: ncdAssessment.urineKetones,
              urineKetonesValue: ncdAssessment.urineKetonesValue,
              ketonesDate: ncdAssessment.ketonesDate,
              urineProtein: ncdAssessment.urineProtein,
              urineProteinValue: ncdAssessment.urineProteinValue,
              proteinDate: ncdAssessment.proteinDate,
              anginaQuestions: {
                "1": ncdAssessment.angina1,
                "2": ncdAssessment.angina2,
                "3": ncdAssessment.angina3,
                "4": ncdAssessment.angina4,
                "5": ncdAssessment.angina5,
                "6": ncdAssessment.angina6,
                "7": ncdAssessment.angina7,
              },
              strokeQuestion: ncdAssessment.strokeQuestion,
              riskLevel: ncdAssessment.riskLevel,
            }
          : undefined,

      finalDiagnosis,
      remarks,
    };

    const changes = detectChanges(editableFPE, updatedFPE);

    updateFPEMutation.mutate(
      { caseNumber: resolvedCaseNumber, payload: updatedFPE as any },
      {
        onSuccess: () => {
          logAction({
            dispatch,
            userId: user?.id || "unknown",
            userName,
            action: "UPDATE",
            module: "FPE",
            entityType: "FPE Record",
            entityId: caseNumber || "",
            entityName: updatedFPE.patientName,
            details: `Updated FPE record for ${updatedFPE.patientName} (Year ${updatedFPE.year})`,
            changes,
          });

          navigate(`/fpe/${caseNumber}`);
        },
      },
    );
  };

  // Auto-calculate BMI
  const handleWeightHeightChange = (
    field: "weight" | "height",
    value: string,
  ) => {
    const newPhysicalExam = { ...physicalExam, [field]: value };

    if (newPhysicalExam.weight && newPhysicalExam.height) {
      const bmi = calculateBMI(
        Number(newPhysicalExam.weight),
        Number(newPhysicalExam.height),
      );
      if (bmi) {
        newPhysicalExam.bmi = bmi.toString();
      }
    }

    setPhysicalExam(newPhysicalExam);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Patient Selection
        const filteredPatients = patients.filter(
          (patient: {
            patientId: string;
            firstName: string;
            lastName: string;
            email: string;
            mobileNumber: string | string[];
          }) =>
            patient.patientId
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            patient.firstName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            patient.lastName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.mobileNumber.includes(searchQuery),
        );

        const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

        const handleSearch = (query: string) => {
          setSearchQuery(query);
          setCurrentPage(1);
        };

        const handlePageChange = (page: number) => {
          setCurrentPage(page);
        };

        return (
          <div className="space-y-6">
            {!selectedPatient ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Select a Patient
                  </h3>
                  <div className="relative">
                    <Search
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search by Patient ID, Name, Email, or Mobile Number..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="border border-gray-200">
                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        {searchQuery
                          ? "No patients found matching your search."
                          : "No patients registered yet."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100 border-b-2 border-gray-300">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Patient ID
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Full Name
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Gender
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Age
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Date of Birth
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Contact Number
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Address
                              </th>
                              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedPatients.map(
                              (patient: Patient, index: number) => (
                                <tr
                                  key={`${patient.patientId}-${patient.createdAt}`}
                                  className={`border-b border-gray-200 hover:bg-blue-100 transition-colors ${
                                    index % 2 === 0 ? "bg-white" : "bg-gray-100"
                                  }`}
                                >
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {patient.patientId}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {patient.lastName}, {patient.firstName}{" "}
                                    {patient.middleName}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {patient.gender}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {patient.age}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {new Date(
                                      patient.birthdate,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {patient.mobileNumber}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {patient.barangay}, {patient.town}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() =>
                                        handlePatientSelect(patient)
                                      }
                                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                                    >
                                      Select
                                    </button>
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>

                      {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                            {Math.min(
                              currentPage * ITEMS_PER_PAGE,
                              filteredPatients.length,
                            )}{" "}
                            of {filteredPatients.length} patient
                            {filteredPatients.length !== 1 ? "s" : ""}
                            {searchQuery &&
                              ` (filtered from ${patients.length} total)`}
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
                              {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1,
                              ).map((page) => {
                                if (
                                  page === 1 ||
                                  page === totalPages ||
                                  (page >= currentPage - 1 &&
                                    page <= currentPage + 1)
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
                                    <span
                                      key={page}
                                      className="px-2 text-gray-500"
                                    >
                                      ...
                                    </span>
                                  );
                                }
                                return null;
                              })}
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
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                    Selected Patient Information
                  </h2>
                  <div className="bg-gray-50 border border-gray-200 p-6 mb-4">
                    <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
                      <div>
                        <span className="text-gray-600">Patient ID:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedPatient.patientId}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedPatient.firstName}{" "}
                          {selectedPatient.middleName}{" "}
                          {selectedPatient.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Age:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedPatient.age} years old
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Gender:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedPatient.gender}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Birthdate:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(
                            selectedPatient.birthdate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setSearchQuery("");
                    }}
                    className="px-6 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Change Patient
                  </button>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                    Case Information
                  </h2>

                  <div className="mb-6">
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
                    <p className="mt-1 text-xs text-gray-500 ml-8">
                      Mark if this patient is registered through eKonsulta
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Case Number
                      </label>
                      <input
                        type="text"
                        value={caseNumber}
                        readOnly
                        className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Auto-generated
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        PhilHealth Number{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={philhealthNumber}
                        onChange={(e) => setPhilhealthNumber(e.target.value)}
                        placeholder="00-000000000-0"
                        className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Client Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={philhealthType}
                        onChange={(e) =>
                          setPhilhealthType(
                            e.target.value as "Member" | "Dependent",
                          )
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Member">Member</option>
                        <option value="Dependent">Dependent</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 1: // Past Medical History
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Past Medical History
            </h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Medical Conditions
                </h3>
                <div className="space-y-2.5">
                  {Object.keys(pastMedical).map((condition) => (
                    <label
                      key={condition}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          pastMedical[condition as keyof typeof pastMedical]
                        }
                        onChange={(e) =>
                          setPastMedical({
                            ...pastMedical,
                            [condition]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {condition.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Additional Details
                </h3>

                {pastMedical.allergy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Specify Allergy
                    </label>
                    <input
                      type="text"
                      value={pastMedicalSpecify.allergy}
                      onChange={(e) =>
                        setPastMedicalSpecify({
                          ...pastMedicalSpecify,
                          allergy: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {pastMedical.cancer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Specify Organ with Cancer
                    </label>
                    <input
                      type="text"
                      value={pastMedicalSpecify.cancerOrgan}
                      onChange={(e) =>
                        setPastMedicalSpecify({
                          ...pastMedicalSpecify,
                          cancerOrgan: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {pastMedical.hepatitis && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Hepatitis Type
                    </label>
                    <input
                      type="text"
                      value={pastMedicalSpecify.hepatitisType}
                      onChange={(e) =>
                        setPastMedicalSpecify({
                          ...pastMedicalSpecify,
                          hepatitisType: e.target.value,
                        })
                      }
                      placeholder="A, B, C, etc."
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {pastMedical.hypertension && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Highest Blood Pressure
                    </label>
                    <input
                      type="text"
                      value={pastMedicalSpecify.bloodPressure}
                      onChange={(e) =>
                        setPastMedicalSpecify({
                          ...pastMedicalSpecify,
                          bloodPressure: e.target.value,
                        })
                      }
                      placeholder="e.g., 140/90"
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {pastMedical.pulmonaryTB && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Pulmonary TB Category
                    </label>
                    <input
                      type="text"
                      value={pastMedicalSpecify.pulmonaryTBCategory}
                      onChange={(e) =>
                        setPastMedicalSpecify({
                          ...pastMedicalSpecify,
                          pulmonaryTBCategory: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {pastMedical.extraPulmonaryTB && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Extra Pulmonary TB Category
                    </label>
                    <input
                      type="text"
                      value={pastMedicalSpecify.extraPulmonaryTBCategory}
                      onChange={(e) =>
                        setPastMedicalSpecify({
                          ...pastMedicalSpecify,
                          extraPulmonaryTBCategory: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {pastMedical.others && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Others, Specify
                    </label>
                    <textarea
                      value={pastMedicalSpecify.others}
                      onChange={(e) =>
                        setPastMedicalSpecify({
                          ...pastMedicalSpecify,
                          others: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2: // Past Surgical History
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Past Surgical History
            </h2>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={surgicalHistory.none}
                    onChange={(e) =>
                      setSurgicalHistory({
                        ...surgicalHistory,
                        none: e.target.checked,
                        operation: e.target.checked
                          ? ""
                          : surgicalHistory.operation,
                        date: e.target.checked ? "" : surgicalHistory.date,
                      })
                    }
                    className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    None (No Surgical History)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Operation
                  </label>
                  <input
                    type="text"
                    value={surgicalHistory.operation}
                    onChange={(e) =>
                      setSurgicalHistory({
                        ...surgicalHistory,
                        operation: e.target.value,
                      })
                    }
                    placeholder="Enter operation details"
                    disabled={surgicalHistory.none}
                    className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={surgicalHistory.date}
                    onChange={(e) =>
                      setSurgicalHistory({
                        ...surgicalHistory,
                        date: e.target.value,
                      })
                    }
                    disabled={surgicalHistory.none}
                    className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Family History
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Family History
            </h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Family Medical Conditions
                </h3>
                <div className="space-y-2.5">
                  {Object.keys(familyHistory).map((condition) => (
                    <label
                      key={condition}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          familyHistory[condition as keyof typeof familyHistory]
                        }
                        onChange={(e) =>
                          setFamilyHistory({
                            ...familyHistory,
                            [condition]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {condition.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Additional Details
                </h3>

                {familyHistory.allergy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Specify Allergy
                    </label>
                    <input
                      type="text"
                      value={familyHistorySpecify.allergy}
                      onChange={(e) =>
                        setFamilyHistorySpecify({
                          ...familyHistorySpecify,
                          allergy: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {familyHistory.cancer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Specify Organ with Cancer
                    </label>
                    <input
                      type="text"
                      value={familyHistorySpecify.cancerOrgan}
                      onChange={(e) =>
                        setFamilyHistorySpecify({
                          ...familyHistorySpecify,
                          cancerOrgan: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {familyHistory.hepatitis && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Hepatitis Type
                    </label>
                    <input
                      type="text"
                      value={familyHistorySpecify.hepatitisType}
                      onChange={(e) =>
                        setFamilyHistorySpecify({
                          ...familyHistorySpecify,
                          hepatitisType: e.target.value,
                        })
                      }
                      placeholder="A, B, C, etc."
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {familyHistory.hypertension && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Highest Blood Pressure
                    </label>
                    <input
                      type="text"
                      value={familyHistorySpecify.bloodPressure}
                      onChange={(e) =>
                        setFamilyHistorySpecify({
                          ...familyHistorySpecify,
                          bloodPressure: e.target.value,
                        })
                      }
                      placeholder="e.g., 140/90"
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {familyHistory.pulmonaryTB && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Pulmonary TB Category
                    </label>
                    <input
                      type="text"
                      value={familyHistorySpecify.pulmonaryTBCategory}
                      onChange={(e) =>
                        setFamilyHistorySpecify({
                          ...familyHistorySpecify,
                          pulmonaryTBCategory: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {familyHistory.extraPulmonaryTB && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Extra Pulmonary TB Category
                    </label>
                    <input
                      type="text"
                      value={familyHistorySpecify.extraPulmonaryTBCategory}
                      onChange={(e) =>
                        setFamilyHistorySpecify({
                          ...familyHistorySpecify,
                          extraPulmonaryTBCategory: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {familyHistory.others && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Others, Specify
                    </label>
                    <textarea
                      value={familyHistorySpecify.others}
                      onChange={(e) =>
                        setFamilyHistorySpecify({
                          ...familyHistorySpecify,
                          others: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4: // Personal/Social History
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Personal and Social History
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Smoking
                </label>
                <select
                  value={personalHistory.smoking}
                  onChange={(e) =>
                    setPersonalHistory({
                      ...personalHistory,
                      smoking: e.target.value as "YES" | "NO" | "QUIT" | "",
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                  <option value="QUIT">Quit</option>
                </select>
              </div>

              {(personalHistory.smoking === "YES" ||
                personalHistory.smoking === "QUIT") && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Packs per Year
                  </label>
                  <input
                    type="number"
                    value={personalHistory.packsPerYear}
                    onChange={(e) =>
                      setPersonalHistory({
                        ...personalHistory,
                        packsPerYear: e.target.value,
                      })
                    }
                    placeholder="Enter packs per year"
                    className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Alcohol Drinking
                </label>
                <select
                  value={personalHistory.alcohol}
                  onChange={(e) =>
                    setPersonalHistory({
                      ...personalHistory,
                      alcohol: e.target.value as "YES" | "NO" | "QUIT" | "",
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                  <option value="QUIT">Quit</option>
                </select>
              </div>

              {(personalHistory.alcohol === "YES" ||
                personalHistory.alcohol === "QUIT") && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Bottles per Day
                  </label>
                  <input
                    type="number"
                    value={personalHistory.bottlesPerDay}
                    onChange={(e) =>
                      setPersonalHistory({
                        ...personalHistory,
                        bottlesPerDay: e.target.value,
                      })
                    }
                    placeholder="Enter bottles per day"
                    className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Illicit Drug Use
                </label>
                <select
                  value={personalHistory.illicitDrugs}
                  onChange={(e) =>
                    setPersonalHistory({
                      ...personalHistory,
                      illicitDrugs: e.target.value as "YES" | "NO" | "",
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Sexually Active
                </label>
                <select
                  value={personalHistory.sexuallyActive}
                  onChange={(e) =>
                    setPersonalHistory({
                      ...personalHistory,
                      sexuallyActive: e.target.value as "YES" | "NO" | "",
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 5: // Immunization
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Immunization History
            </h2>

            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Children Vaccines
                </h3>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.opv1}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          opv1: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">OPV 1</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.opv2}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          opv2: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">OPV 2</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.opv3}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          opv3: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">OPV 3</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.bcg}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          bcg: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">BCG</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.dpt1}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          dpt1: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">DPT 1</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.dpt2}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          dpt2: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">DPT 2</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.dpt3}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          dpt3: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">DPT 3</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.measles}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          measles: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">Measles</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.hepB1}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          hepB1: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">Hepatitis B1</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.hepB2}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          hepB2: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">Hepatitis B2</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.hepB3}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          hepB3: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">Hepatitis B3</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.hepA}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          hepA: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">Hepatitis A</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.varicellaChickenPox}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          varicellaChickenPox: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Varicella (Chicken Pox)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.noneChildren}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          noneChildren: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">None</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  For Adult
                </h3>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.hpv}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          hpv: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">HPV</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.mmr}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          mmr: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">MMR</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.noneAdult}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          noneAdult: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">None</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  For Pregnant Women
                </h3>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.tetanusToxoidPregnant}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          tetanusToxoidPregnant: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Tetanus Toxoid
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.nonePregnant}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          nonePregnant: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">None</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  For Elderly and Immunocompromised
                </h3>
                <div className="space-y-2.5 mb-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.tetanusToxoidElderly}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          tetanusToxoidElderly: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Tetanus Toxoid
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immunization.noneElderly}
                      onChange={(e) =>
                        setImmunization({
                          ...immunization,
                          noneElderly: e.target.checked,
                        })
                      }
                      className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">None</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Others, Specify
                  </label>
                  <input
                    type="text"
                    value={immunization.othersSpecify}
                    onChange={(e) =>
                      setImmunization({
                        ...immunization,
                        othersSpecify: e.target.value,
                      })
                    }
                    placeholder="Enter other vaccines"
                    className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6: // Family Planning
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Family Planning
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Do you have access to family planning counseling or services?
              </label>
              <select
                value={familyPlanning}
                onChange={(e) =>
                  setFamilyPlanning(e.target.value as "YES" | "NO" | "")
                }
                className="w-full max-w-md px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </div>
          </div>
        );

      case 7: // Menstrual History
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
              Menstrual History{" "}
              {selectedPatient?.gender !== "Female" && "(Not Applicable)"}
            </h3>

            {selectedPatient?.gender === "Female" ? (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Menarche (age)
                  </label>
                  <input
                    type="number"
                    value={menstrualHistory.menarche}
                    onChange={(e) =>
                      setMenstrualHistory({
                        ...menstrualHistory,
                        menarche: e.target.value,
                      })
                    }
                    placeholder="Enter age"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Onset of Sexual Intercourse (age)
                  </label>
                  <input
                    type="number"
                    value={menstrualHistory.onsetSexualIntercourse}
                    onChange={(e) =>
                      setMenstrualHistory({
                        ...menstrualHistory,
                        onsetSexualIntercourse: e.target.value,
                      })
                    }
                    placeholder="Enter age"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Menopaused
                  </label>
                  <select
                    value={menstrualHistory.menopaused}
                    onChange={(e) =>
                      setMenstrualHistory({
                        ...menstrualHistory,
                        menopaused: e.target.value as "YES" | "NO" | "",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </div>

                {menstrualHistory.menopaused === "YES" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Menopause Age
                    </label>
                    <input
                      type="number"
                      value={menstrualHistory.menopauseAge}
                      onChange={(e) =>
                        setMenstrualHistory({
                          ...menstrualHistory,
                          menopauseAge: e.target.value,
                        })
                      }
                      placeholder="Enter age"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Menstrual Period (LMP)
                  </label>
                  <input
                    type="date"
                    value={menstrualHistory.lmp}
                    onChange={(e) =>
                      setMenstrualHistory({
                        ...menstrualHistory,
                        lmp: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Duration (days)
                  </label>
                  <input
                    type="number"
                    value={menstrualHistory.periodDuration}
                    onChange={(e) =>
                      setMenstrualHistory({
                        ...menstrualHistory,
                        periodDuration: e.target.value,
                      })
                    }
                    placeholder="Enter number of days"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interval/Cycle (days)
                  </label>
                  <input
                    type="number"
                    value={menstrualHistory.intervalCycle}
                    onChange={(e) =>
                      setMenstrualHistory({
                        ...menstrualHistory,
                        intervalCycle: e.target.value,
                      })
                    }
                    placeholder="Enter cycle length"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pads per Day
                  </label>
                  <input
                    type="number"
                    value={menstrualHistory.padsPerDay}
                    onChange={(e) =>
                      setMenstrualHistory({
                        ...menstrualHistory,
                        padsPerDay: e.target.value,
                      })
                    }
                    placeholder="Enter number"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Control Method
                  </label>
                  <input
                    type="text"
                    value={menstrualHistory.birthControlMethod}
                    onChange={(e) =>
                      setMenstrualHistory({
                        ...menstrualHistory,
                        birthControlMethod: e.target.value,
                      })
                    }
                    placeholder="Enter method or 'None'"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                This section is only applicable for female patients.
              </p>
            )}
          </div>
        );

      case 8: // Pregnancy History
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
              Pregnancy History{" "}
              {selectedPatient?.gender !== "Female" && "(Not Applicable)"}
            </h3>

            {selectedPatient?.gender === "Female" ? (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gravidity (G)
                  </label>
                  <input
                    type="number"
                    value={pregnancyHistory.gravidity}
                    onChange={(e) =>
                      setPregnancyHistory({
                        ...pregnancyHistory,
                        gravidity: e.target.value,
                      })
                    }
                    placeholder="Total number of pregnancies"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parity (P)
                  </label>
                  <input
                    type="number"
                    value={pregnancyHistory.parity}
                    onChange={(e) =>
                      setPregnancyHistory({
                        ...pregnancyHistory,
                        parity: e.target.value,
                      })
                    }
                    placeholder="Number of deliveries"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type of Delivery
                  </label>
                  <input
                    type="text"
                    value={pregnancyHistory.typeOfDelivery}
                    onChange={(e) =>
                      setPregnancyHistory({
                        ...pregnancyHistory,
                        typeOfDelivery: e.target.value,
                      })
                    }
                    placeholder="e.g., Normal, C-Section"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Term
                  </label>
                  <input
                    type="number"
                    value={pregnancyHistory.fullTerm}
                    onChange={(e) =>
                      setPregnancyHistory({
                        ...pregnancyHistory,
                        fullTerm: e.target.value,
                      })
                    }
                    placeholder="Number of full-term births"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Premature
                  </label>
                  <input
                    type="number"
                    value={pregnancyHistory.premature}
                    onChange={(e) =>
                      setPregnancyHistory({
                        ...pregnancyHistory,
                        premature: e.target.value,
                      })
                    }
                    placeholder="Number of premature births"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Abortion
                  </label>
                  <input
                    type="number"
                    value={pregnancyHistory.abortion}
                    onChange={(e) =>
                      setPregnancyHistory({
                        ...pregnancyHistory,
                        abortion: e.target.value,
                      })
                    }
                    placeholder="Number of abortions"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Living Children
                  </label>
                  <input
                    type="number"
                    value={pregnancyHistory.livingChildren}
                    onChange={(e) =>
                      setPregnancyHistory({
                        ...pregnancyHistory,
                        livingChildren: e.target.value,
                      })
                    }
                    placeholder="Number of living children"
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pregnancy-Induced Hypertension
                  </label>
                  <select
                    value={pregnancyHistory.pregnancyInducedHypertension}
                    onChange={(e) =>
                      setPregnancyHistory({
                        ...pregnancyHistory,
                        pregnancyInducedHypertension: e.target.value as
                          | "YES"
                          | "NO"
                          | "",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                This section is only applicable for female patients.
              </p>
            )}
          </div>
        );

      case 9: // Physical Examination
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
              Physical Examination
            </h3>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  value={physicalExam.bloodPressure}
                  onChange={(e) =>
                    setPhysicalExam({
                      ...physicalExam,
                      bloodPressure: e.target.value,
                    })
                  }
                  placeholder="e.g., 120/80"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={physicalExam.heartRate}
                  onChange={(e) =>
                    setPhysicalExam({
                      ...physicalExam,
                      heartRate: e.target.value,
                    })
                  }
                  placeholder="Enter rate"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Respiratory Rate (per min)
                </label>
                <input
                  type="number"
                  value={physicalExam.respiratoryRate}
                  onChange={(e) =>
                    setPhysicalExam({
                      ...physicalExam,
                      respiratoryRate: e.target.value,
                    })
                  }
                  placeholder="Enter rate"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={physicalExam.temperature}
                  onChange={(e) =>
                    setPhysicalExam({
                      ...physicalExam,
                      temperature: e.target.value,
                    })
                  }
                  placeholder="e.g., 36.5"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={physicalExam.height}
                  onChange={(e) =>
                    handleWeightHeightChange("height", e.target.value)
                  }
                  placeholder="Enter height"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={physicalExam.weight}
                  onChange={(e) =>
                    handleWeightHeightChange("weight", e.target.value)
                  }
                  placeholder="Enter weight"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BMI (Auto-Calculated)
                </label>
                <input
                  type="text"
                  value={physicalExam.bmi}
                  readOnly
                  placeholder="Auto-calculated"
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visual Acuity
                </label>
                <input
                  type="text"
                  value={physicalExam.visualAcuity}
                  onChange={(e) =>
                    setPhysicalExam({
                      ...physicalExam,
                      visualAcuity: e.target.value,
                    })
                  }
                  placeholder="e.g., 20/20"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type
                </label>
                <input
                  type="text"
                  value={physicalExam.bloodType}
                  onChange={(e) =>
                    setPhysicalExam({
                      ...physicalExam,
                      bloodType: e.target.value,
                    })
                  }
                  placeholder="e.g., O+"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Pediatric Measurements - Only for 0-24 months */}
            {selectedPatient && selectedPatient.age <= 2 && (
              <>
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Pediatric Client (0-24 months)
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={physicalExam.length}
                      onChange={(e) =>
                        setPhysicalExam({
                          ...physicalExam,
                          length: e.target.value,
                        })
                      }
                      placeholder="Enter length"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Head Circumference (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={physicalExam.headCircumference}
                      onChange={(e) =>
                        setPhysicalExam({
                          ...physicalExam,
                          headCircumference: e.target.value,
                        })
                      }
                      placeholder="Enter circumference"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skinfold Thickness (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={physicalExam.skinfoldThickness}
                      onChange={(e) =>
                        setPhysicalExam({
                          ...physicalExam,
                          skinfoldThickness: e.target.value,
                        })
                      }
                      placeholder="Enter thickness"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    Body Circumference
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Waist (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={physicalExam.waist}
                        onChange={(e) =>
                          setPhysicalExam({
                            ...physicalExam,
                            waist: e.target.value,
                          })
                        }
                        placeholder="Waist circumference"
                        className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hip (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={physicalExam.hip}
                        onChange={(e) =>
                          setPhysicalExam({
                            ...physicalExam,
                            hip: e.target.value,
                          })
                        }
                        placeholder="Hip circumference"
                        className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Limbs (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={physicalExam.limbs}
                        onChange={(e) =>
                          setPhysicalExam({
                            ...physicalExam,
                            limbs: e.target.value,
                          })
                        }
                        placeholder="Enter measurement"
                        className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Upper Arm Circumference (MUAC) - cm
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={physicalExam.muac}
                      onChange={(e) =>
                        setPhysicalExam({
                          ...physicalExam,
                          muac: e.target.value,
                        })
                      }
                      placeholder="MUAC"
                      className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Survey
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="generalSurvey"
                    value="Awake and alert"
                    checked={physicalExam.generalSurvey === "Awake and alert"}
                    onChange={(e) =>
                      setPhysicalExam({
                        ...physicalExam,
                        generalSurvey: e.target.value,
                      })
                    }
                    className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">Awake and alert</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="generalSurvey"
                    value="Altered Sensorium"
                    checked={physicalExam.generalSurvey === "Altered Sensorium"}
                    onChange={(e) =>
                      setPhysicalExam({
                        ...physicalExam,
                        generalSurvey: e.target.value,
                      })
                    }
                    className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    Altered Sensorium
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      case 10: // Pertinent Findings
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
              Pertinent Findings
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3">HEENT</h4>
                <div className="space-y-2">
                  {[
                    "Esentially Normal",
                    "Abnormal Pupillary Reaction",
                    "Cervical Lymphadenophaty",
                    "Dry Mucuous Membrane",
                    "Icteric Sclerae",
                    "Pale Conjunctivae",
                    "Sunken Eyeballs",
                    "Sunken Fontanelle",
                    "Others",
                  ].map((finding) => (
                    <label key={finding} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pertinentFindings.heent.includes(finding)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPertinentFindings({
                              ...pertinentFindings,
                              heent: [...pertinentFindings.heent, finding],
                            });
                          } else {
                            setPertinentFindings({
                              ...pertinentFindings,
                              heent: pertinentFindings.heent.filter(
                                (f) => f !== finding,
                              ),
                            });
                            if (finding === "Others") {
                              setPertinentFindingsOthers({
                                ...pertinentFindingsOthers,
                                heent: "",
                              });
                            }
                          }
                        }}
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm">{finding}</span>
                    </label>
                  ))}
                  {pertinentFindings.heent.includes("Others") && (
                    <input
                      type="text"
                      value={pertinentFindingsOthers.heent}
                      onChange={(e) =>
                        setPertinentFindingsOthers({
                          ...pertinentFindingsOthers,
                          heent: e.target.value,
                        })
                      }
                      placeholder="Specify others..."
                      className="w-full mt-2 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div className="border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Chest, Breast and Lungs
                </h4>
                <div className="space-y-2">
                  {[
                    "Essentially Normal",
                    "Assymetrical Chest Expansion",
                    "Decrease Breathe Sounds",
                    "Wheezes",
                    "Lumps Over Breast(s)",
                    "Crackles/Rales",
                    "Retractions",
                    "Others",
                  ].map((finding) => (
                    <label key={finding} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pertinentFindings.chestBreastLungs.includes(
                          finding,
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPertinentFindings({
                              ...pertinentFindings,
                              chestBreastLungs: [
                                ...pertinentFindings.chestBreastLungs,
                                finding,
                              ],
                            });
                          } else {
                            setPertinentFindings({
                              ...pertinentFindings,
                              chestBreastLungs:
                                pertinentFindings.chestBreastLungs.filter(
                                  (f) => f !== finding,
                                ),
                            });
                            if (finding === "Others") {
                              setPertinentFindingsOthers({
                                ...pertinentFindingsOthers,
                                chestBreastLungs: "",
                              });
                            }
                          }
                        }}
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm">{finding}</span>
                    </label>
                  ))}
                  {pertinentFindings.chestBreastLungs.includes("Others") && (
                    <input
                      type="text"
                      value={pertinentFindingsOthers.chestBreastLungs}
                      onChange={(e) =>
                        setPertinentFindingsOthers({
                          ...pertinentFindingsOthers,
                          chestBreastLungs: e.target.value,
                        })
                      }
                      placeholder="Specify others..."
                      className="w-full mt-2 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div className="border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3">Heart</h4>
                <div className="space-y-2">
                  {[
                    "Essentially Normal",
                    "Displaced Apex Beat",
                    "Heaves/Trills",
                    "Irregular Rhythm",
                    "Muffled Heart Sounds",
                    "Murmurs",
                    "Pericardial Bulge",
                    "Others",
                  ].map((finding) => (
                    <label key={finding} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pertinentFindings.heart.includes(finding)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPertinentFindings({
                              ...pertinentFindings,
                              heart: [...pertinentFindings.heart, finding],
                            });
                          } else {
                            setPertinentFindings({
                              ...pertinentFindings,
                              heart: pertinentFindings.heart.filter(
                                (f) => f !== finding,
                              ),
                            });
                            if (finding === "Others") {
                              setPertinentFindingsOthers({
                                ...pertinentFindingsOthers,
                                heart: "",
                              });
                            }
                          }
                        }}
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm">{finding}</span>
                    </label>
                  ))}
                  {pertinentFindings.heart.includes("Others") && (
                    <input
                      type="text"
                      value={pertinentFindingsOthers.heart}
                      onChange={(e) =>
                        setPertinentFindingsOthers({
                          ...pertinentFindingsOthers,
                          heart: e.target.value,
                        })
                      }
                      placeholder="Specify others..."
                      className="w-full mt-2 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div className="border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3">Abdomen</h4>
                <div className="space-y-2">
                  {[
                    "Essentially Normal",
                    "Abdominal Rigidity",
                    "Abdominal Tenderness",
                    "Hyperactive Bowel Sounds",
                    "Palpable Mass(es)",
                    "Tympanitic/Dull Abdomen",
                    "Uterine Contraction",
                    "Others",
                  ].map((finding) => (
                    <label key={finding} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pertinentFindings.abdomen.includes(finding)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPertinentFindings({
                              ...pertinentFindings,
                              abdomen: [...pertinentFindings.abdomen, finding],
                            });
                          } else {
                            setPertinentFindings({
                              ...pertinentFindings,
                              abdomen: pertinentFindings.abdomen.filter(
                                (f) => f !== finding,
                              ),
                            });
                            if (finding === "Others") {
                              setPertinentFindingsOthers({
                                ...pertinentFindingsOthers,
                                abdomen: "",
                              });
                            }
                          }
                        }}
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm">{finding}</span>
                    </label>
                  ))}
                  {pertinentFindings.abdomen.includes("Others") && (
                    <input
                      type="text"
                      value={pertinentFindingsOthers.abdomen}
                      onChange={(e) =>
                        setPertinentFindingsOthers({
                          ...pertinentFindingsOthers,
                          abdomen: e.target.value,
                        })
                      }
                      placeholder="Specify others..."
                      className="w-full mt-2 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div className="border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Genitourinary
                </h4>
                <div className="space-y-2">
                  {[
                    "Essentially Normal",
                    "Blood Stained in Exam Finger",
                    "Cervical Dilation",
                    "Presence of Abnormal Discharge",
                    "Others",
                  ].map((finding) => (
                    <label key={finding} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pertinentFindings.genitourinary.includes(
                          finding,
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPertinentFindings({
                              ...pertinentFindings,
                              genitourinary: [
                                ...pertinentFindings.genitourinary,
                                finding,
                              ],
                            });
                          } else {
                            setPertinentFindings({
                              ...pertinentFindings,
                              genitourinary:
                                pertinentFindings.genitourinary.filter(
                                  (f) => f !== finding,
                                ),
                            });
                            if (finding === "Others") {
                              setPertinentFindingsOthers({
                                ...pertinentFindingsOthers,
                                genitourinary: "",
                              });
                            }
                          }
                        }}
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm">{finding}</span>
                    </label>
                  ))}
                  {pertinentFindings.genitourinary.includes("Others") && (
                    <input
                      type="text"
                      value={pertinentFindingsOthers.genitourinary}
                      onChange={(e) =>
                        setPertinentFindingsOthers({
                          ...pertinentFindingsOthers,
                          genitourinary: e.target.value,
                        })
                      }
                      placeholder="Specify others..."
                      className="w-full mt-2 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div className="border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Digital Rectal Examination
                </h4>
                <div className="space-y-2">
                  {[
                    "Essentially Normal",
                    "Enlarge Prostate",
                    "Mass",
                    "Hemorrhoids",
                    "Puss",
                    "Not Applicable",
                    "Others",
                  ].map((finding) => (
                    <label key={finding} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pertinentFindings.digitalRectal.includes(
                          finding,
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPertinentFindings({
                              ...pertinentFindings,
                              digitalRectal: [
                                ...pertinentFindings.digitalRectal,
                                finding,
                              ],
                            });
                          } else {
                            setPertinentFindings({
                              ...pertinentFindings,
                              digitalRectal:
                                pertinentFindings.digitalRectal.filter(
                                  (f) => f !== finding,
                                ),
                            });
                            if (finding === "Others") {
                              setPertinentFindingsOthers({
                                ...pertinentFindingsOthers,
                                digitalRectal: "",
                              });
                            }
                          }
                        }}
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm">{finding}</span>
                    </label>
                  ))}
                  {pertinentFindings.digitalRectal.includes("Others") && (
                    <input
                      type="text"
                      value={pertinentFindingsOthers.digitalRectal}
                      onChange={(e) =>
                        setPertinentFindingsOthers({
                          ...pertinentFindingsOthers,
                          digitalRectal: e.target.value,
                        })
                      }
                      placeholder="Specify others..."
                      className="w-full mt-2 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div className="border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Skin/Extremities
                </h4>
                <div className="space-y-2">
                  {[
                    "Essentially Normal",
                    "Clubbing",
                    "Cold Clammy",
                    "Cyanosis/Mottled Skin",
                    "Edema/Swelling",
                    "Decreased Mobility",
                    "Pale Nailbeds",
                    "Poor Skin Turgor",
                    "Rashes/Petichiae",
                    "Weak Pulse",
                    "Others",
                  ].map((finding) => (
                    <label key={finding} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pertinentFindings.skinExtremities.includes(
                          finding,
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPertinentFindings({
                              ...pertinentFindings,
                              skinExtremities: [
                                ...pertinentFindings.skinExtremities,
                                finding,
                              ],
                            });
                          } else {
                            setPertinentFindings({
                              ...pertinentFindings,
                              skinExtremities:
                                pertinentFindings.skinExtremities.filter(
                                  (f) => f !== finding,
                                ),
                            });
                            if (finding === "Others") {
                              setPertinentFindingsOthers({
                                ...pertinentFindingsOthers,
                                skinExtremities: "",
                              });
                            }
                          }
                        }}
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm">{finding}</span>
                    </label>
                  ))}
                  {pertinentFindings.skinExtremities.includes("Others") && (
                    <input
                      type="text"
                      value={pertinentFindingsOthers.skinExtremities}
                      onChange={(e) =>
                        setPertinentFindingsOthers({
                          ...pertinentFindingsOthers,
                          skinExtremities: e.target.value,
                        })
                      }
                      placeholder="Specify others..."
                      className="w-full mt-2 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div className="border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Neurological Examination
                </h4>
                <div className="space-y-2">
                  {[
                    "Essentially Normal",
                    "Abnormal Gait",
                    "Abnormal Position Sense",
                    "Abnormal Sensation",
                    "Abnormal Reflex(es)",
                    "Poor/Altered Memory",
                    "Poor Muscle Tone/Strength",
                    "Poor Coordination",
                    "Others",
                  ].map((finding) => (
                    <label key={finding} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pertinentFindings.neurological.includes(
                          finding,
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPertinentFindings({
                              ...pertinentFindings,
                              neurological: [
                                ...pertinentFindings.neurological,
                                finding,
                              ],
                            });
                          } else {
                            setPertinentFindings({
                              ...pertinentFindings,
                              neurological:
                                pertinentFindings.neurological.filter(
                                  (f) => f !== finding,
                                ),
                            });
                            if (finding === "Others") {
                              setPertinentFindingsOthers({
                                ...pertinentFindingsOthers,
                                neurological: "",
                              });
                            }
                          }
                        }}
                        className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="text-sm">{finding}</span>
                    </label>
                  ))}
                  {pertinentFindings.neurological.includes("Others") && (
                    <input
                      type="text"
                      value={pertinentFindingsOthers.neurological}
                      onChange={(e) =>
                        setPertinentFindingsOthers({
                          ...pertinentFindingsOthers,
                          neurological: e.target.value,
                        })
                      }
                      placeholder="Specify others..."
                      className="w-full mt-2 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 11: // NCD Assessment
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
              NCD High-Risk Assessment (For 25 Years Old and Above)
            </h3>

            {selectedPatient && selectedPatient.age >= 25 ? (
              <div className="space-y-6">
                <div className="border border-gray-200 p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        High Fat/High Salt Food Intake
                      </label>
                      <label className="block text-sm text-gray-700 mb-3">
                        Eats Processed Fast Foods (e.g Instant Noodles,
                        Hamburgers, Fries, Fried Chicken Skin, etc) and
                        Ihaw-Ihaw (e.g. Adidas, etc) Weekly
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="highFatSaltIntake"
                            value="YES"
                            checked={ncdAssessment.highFatSaltIntake === "YES"}
                            onChange={(e) =>
                              setNcdAssessment({
                                ...ncdAssessment,
                                highFatSaltIntake: e.target.value as "YES",
                              })
                            }
                            className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                          />
                          <span className="text-sm text-gray-700">YES</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="highFatSaltIntake"
                            value="NO"
                            checked={ncdAssessment.highFatSaltIntake === "NO"}
                            onChange={(e) =>
                              setNcdAssessment({
                                ...ncdAssessment,
                                highFatSaltIntake: e.target.value as "NO",
                              })
                            }
                            className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                          />
                          <span className="text-sm text-gray-700">NO</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        Dietary Fiber Intake
                      </label>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">
                            3 Servings Vegetables Daily
                          </label>
                          <div className="flex gap-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="vegetablesDaily"
                                value="YES"
                                checked={
                                  ncdAssessment.vegetablesDaily === "YES"
                                }
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    vegetablesDaily: e.target.value as "YES",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">YES</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="vegetablesDaily"
                                value="NO"
                                checked={ncdAssessment.vegetablesDaily === "NO"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    vegetablesDaily: e.target.value as "NO",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">NO</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-700 mb-2">
                            2-3 Servings of Fruits Daily
                          </label>
                          <div className="flex gap-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="fruitsDaily"
                                value="YES"
                                checked={ncdAssessment.fruitsDaily === "YES"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    fruitsDaily: e.target.value as "YES",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">YES</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="fruitsDaily"
                                value="NO"
                                checked={ncdAssessment.fruitsDaily === "NO"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    fruitsDaily: e.target.value as "NO",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">NO</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Physical Activities
                      </label>
                      <label className="block text-sm text-gray-700 mb-3">
                        Does Alteast 2-5 hours a week of moderate-intensity
                        physical activity
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="physicalActivity"
                            value="YES"
                            checked={ncdAssessment.physicalActivity === "YES"}
                            onChange={(e) =>
                              setNcdAssessment({
                                ...ncdAssessment,
                                physicalActivity: e.target.value as "YES",
                              })
                            }
                            className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                          />
                          <span className="text-sm text-gray-700">YES</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="physicalActivity"
                            value="NO"
                            checked={ncdAssessment.physicalActivity === "NO"}
                            onChange={(e) =>
                              setNcdAssessment({
                                ...ncdAssessment,
                                physicalActivity: e.target.value as "NO",
                              })
                            }
                            className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                          />
                          <span className="text-sm text-gray-700">NO</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        Presence or absence of Diabetes
                      </label>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">
                            1. Was Patient Diagnosed as having Diabetes?
                          </label>
                          <div className="flex gap-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="diabetesDiagnosed"
                                value="YES"
                                checked={
                                  ncdAssessment.diabetesDiagnosed === "YES"
                                }
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    diabetesDiagnosed: e.target.value as "YES",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">YES</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="diabetesDiagnosed"
                                value="NO"
                                checked={
                                  ncdAssessment.diabetesDiagnosed === "NO"
                                }
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    diabetesDiagnosed: e.target.value as "NO",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">NO</span>
                            </label>
                          </div>
                        </div>

                        {ncdAssessment.diabetesDiagnosed === "YES" && (
                          <div className="ml-6 pl-4 border-l-2 border-gray-300 space-y-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              If Yes
                            </label>
                            <div className="space-y-2">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="diabetesWithMedication"
                                  value="YES"
                                  checked={
                                    ncdAssessment.diabetesWithMedication ===
                                    "YES"
                                  }
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      diabetesWithMedication: e.target
                                        .value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  With Medication
                                </span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="diabetesWithMedication"
                                  value="NO"
                                  checked={
                                    ncdAssessment.diabetesWithMedication ===
                                    "NO"
                                  }
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      diabetesWithMedication: e.target
                                        .value as "NO",
                                      diabetesMedicationDetails: "",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  Without Medication
                                </span>
                              </label>
                            </div>

                            {ncdAssessment.diabetesWithMedication === "YES" && (
                              <div className="mt-3">
                                <label className="block text-sm text-gray-600 mb-2">
                                  Medication Details
                                </label>
                                <input
                                  type="text"
                                  value={
                                    ncdAssessment.diabetesMedicationDetails
                                  }
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      diabetesMedicationDetails: e.target.value,
                                    })
                                  }
                                  placeholder="Enter medication names..."
                                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Symptoms Section */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        2. DOES PATIENT HAS THE FOLLOWING SYMPTOMS?
                      </h4>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            POLYPHAGIA
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="polyphagia"
                                value="YES"
                                checked={ncdAssessment.polyphagia === "YES"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    polyphagia: e.target.value as "YES",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">YES</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="polyphagia"
                                value="NO"
                                checked={ncdAssessment.polyphagia === "NO"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    polyphagia: e.target.value as "NO",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">NO</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            POLYDIPSIA
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="polydipsia"
                                value="YES"
                                checked={ncdAssessment.polydipsia === "YES"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    polydipsia: e.target.value as "YES",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">YES</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="polydipsia"
                                value="NO"
                                checked={ncdAssessment.polydipsia === "NO"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    polydipsia: e.target.value as "NO",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">NO</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            POLYURIA
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="polyuria"
                                value="YES"
                                checked={ncdAssessment.polyuria === "YES"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    polyuria: e.target.value as "YES",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">YES</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="polyuria"
                                value="NO"
                                checked={ncdAssessment.polyuria === "NO"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    polyuria: e.target.value as "NO",
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">NO</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Alert when 2 or more symptoms are YES */}
                      {(() => {
                        const symptomsCount = [
                          ncdAssessment.polyphagia === "YES",
                          ncdAssessment.polydipsia === "YES",
                          ncdAssessment.polyuria === "YES",
                        ].filter(Boolean).length;

                        return symptomsCount >= 2 ? (
                          <div className="mb-3 p-4 bg-amber-50 border-l-4 border-amber-500">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5 text-amber-600"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-semibold text-amber-800">
                                  Action Required
                                </h3>
                                <p className="text-sm text-amber-700 mt-1">
                                  Two or more symptoms detected. Please perform
                                  a blood glucose test.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      <p className="text-sm text-gray-700 italic">
                        IF TWO OR MORE OF THE ABOVE SYMPTOMS ARE PRESENT,
                        PERFORM A BLOOD GLUCOSE TEST.
                      </p>
                    </div>

                    {/* Laboratory Results Section */}
                    <div className="pt-6 border-t border-gray-200">
                      <div className="space-y-4">
                        <div className="border border-gray-300 p-4">
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            RAISED BLOOD GLUCOSE
                          </label>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="raisedBloodGlucose"
                                  value="YES"
                                  checked={
                                    ncdAssessment.raisedBloodGlucose === "YES"
                                  }
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      raisedBloodGlucose: e.target
                                        .value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  YES
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="raisedBloodGlucose"
                                  value="NO"
                                  checked={
                                    ncdAssessment.raisedBloodGlucose === "NO"
                                  }
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      raisedBloodGlucose: e.target
                                        .value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  NO
                                </span>
                              </label>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                FBS/RBS: _____ mg/dl
                              </label>
                              <input
                                type="text"
                                value={ncdAssessment.fbsRbs || ""}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    fbsRbs: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                DATE TAKEN:
                              </label>
                              <input
                                type="date"
                                value={ncdAssessment.glucoseDate || ""}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    glucoseDate: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-300 p-4">
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            RAISED BLOOD LIPIDS
                          </label>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="raisedBloodLipids"
                                  value="YES"
                                  checked={
                                    ncdAssessment.raisedBloodLipids === "YES"
                                  }
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      raisedBloodLipids: e.target
                                        .value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  YES
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="raisedBloodLipids"
                                  value="NO"
                                  checked={
                                    ncdAssessment.raisedBloodLipids === "NO"
                                  }
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      raisedBloodLipids: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  NO
                                </span>
                              </label>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                TOTAL CHOLESTEROL:
                              </label>
                              <input
                                type="text"
                                value={ncdAssessment.totalCholesterol || ""}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    totalCholesterol: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                DATE TAKEN:
                              </label>
                              <input
                                type="date"
                                value={ncdAssessment.lipidsDate || ""}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    lipidsDate: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-300 p-4">
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            PRESENCE OF URINE KETONES
                          </label>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="urineKetones"
                                  value="YES"
                                  checked={ncdAssessment.urineKetones === "YES"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      urineKetones: e.target.value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  YES
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="urineKetones"
                                  value="NO"
                                  checked={ncdAssessment.urineKetones === "NO"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      urineKetones: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  NO
                                </span>
                              </label>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                URINE KETONE:
                              </label>
                              <input
                                type="text"
                                value={ncdAssessment.urineKetonesValue || ""}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    urineKetonesValue: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                DATE TAKEN:
                              </label>
                              <input
                                type="date"
                                value={ncdAssessment.ketonesDate || ""}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    ketonesDate: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-300 p-4">
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            PRESENCE OF URINE PROTEIN
                          </label>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="urineProtein"
                                  value="YES"
                                  checked={ncdAssessment.urineProtein === "YES"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      urineProtein: e.target.value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  YES
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="urineProtein"
                                  value="NO"
                                  checked={ncdAssessment.urineProtein === "NO"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      urineProtein: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                  NO
                                </span>
                              </label>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                URINE PROTEIN:
                              </label>
                              <input
                                type="text"
                                value={ncdAssessment.urineProteinValue || ""}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    urineProteinValue: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                DATE TAKEN:
                              </label>
                              <input
                                type="date"
                                value={ncdAssessment.proteinDate || ""}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    proteinDate: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Angina Assessment */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        QUESTIONNAIRE TO DETERMINE PROBABLE ANGINA, HERAT
                        ATTACK, STROKE OR TRANSIENT ISCHEMIC ATTACK.
                      </h4>
                      <div className="border border-gray-300">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-900">
                            ANGINA OR HEART ATTACK
                          </span>
                          <div className="flex gap-8">
                            <span className="text-sm font-semibold text-gray-900">
                              YES
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              NO
                            </span>
                          </div>
                        </div>

                        <table className="w-full">
                          <tbody>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                1. HAVE YOU HAD ANY PAIN OR DISCOMFORT OR ANY
                                PRESSURE OR HEAVINESS IN YOUR CHEST?
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina1"
                                  value="YES"
                                  checked={ncdAssessment.angina1 === "YES"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina1: e.target.value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina1"
                                  value="NO"
                                  checked={ncdAssessment.angina1 === "NO"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina1: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                2. DO YOU GET THE PAIN IN THE CENTER OF THE
                                CHEST OR LEFT ARM?
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina2"
                                  value="YES"
                                  checked={ncdAssessment.angina2 === "YES"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina2: e.target.value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina2"
                                  value="NO"
                                  checked={ncdAssessment.angina2 === "NO"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina2: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                3. DO YOU GET IT WHENN YOU WALK UPHILL OR HURRY?
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina3"
                                  value="YES"
                                  checked={ncdAssessment.angina3 === "YES"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina3: e.target.value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina3"
                                  value="NO"
                                  checked={ncdAssessment.angina3 === "NO"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina3: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                4. DO YOU SLOWDOWN IF YOU GET THE PAIN WHILE
                                WALKING?
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina4"
                                  value="YES"
                                  checked={ncdAssessment.angina4 === "YES"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina4: e.target.value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina4"
                                  value="NO"
                                  checked={ncdAssessment.angina4 === "NO"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina4: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                5. DOES THE PAIN GO AWAY IF YOU STAND STILL OR
                                IF YOU TAKE A TABLET UNDER THE TONGUE?
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina5"
                                  value="YES"
                                  checked={ncdAssessment.angina5 === "YES"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina5: e.target.value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina5"
                                  value="NO"
                                  checked={ncdAssessment.angina5 === "NO"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina5: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                6. DOES THE PAIN AWAY IN LESS THAN 10 MINUTES?
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina6"
                                  value="YES"
                                  checked={ncdAssessment.angina6 === "YES"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina6: e.target.value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina6"
                                  value="NO"
                                  checked={ncdAssessment.angina6 === "NO"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina6: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                7. HAVE YOU EVER HAD A SECERE CHEST PAIN ACROSS
                                THE FRONT OF YOUR CHEST LASTING FOR HALF AN HOUR
                                OR MORE?
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina7"
                                  value="YES"
                                  checked={ncdAssessment.angina7 === "YES"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina7: e.target.value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="angina7"
                                  value="NO"
                                  checked={ncdAssessment.angina7 === "NO"}
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      angina7: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-300">
                          <p className="text-xs text-gray-700 italic">
                            IF THE ANSWER TO QUESTIONS 3,4,5,6,7 IS YES, PATIENT
                            HAVE ANGINA OR HEART ATTACK AND NEEDS TO SEE THE
                            DOCTOR.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stroke Assessment */}
                    <div className="pt-6 border-t border-gray-200">
                      <div className="border border-gray-300">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-900">
                            STROKE AND TIA (TRANSIENT ISCHEMIC ATTACK)
                          </span>
                          <div className="flex gap-8">
                            <span className="text-sm font-semibold text-gray-900">
                              YES
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              NO
                            </span>
                          </div>
                        </div>
                        <table className="w-full">
                          <tbody>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                8. HAVE YOU EVER HAD ANY OF THE FOLLOWING:
                                DIFFICULTY IN TALKING, WEAKNESS OF ARMS/OR LEG
                                ON ONE SIDE OF THE BODY OR NUMBNESS ON ONE SIDE
                                OF THE BODY?
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="strokeQuestion"
                                  value="YES"
                                  checked={
                                    ncdAssessment.strokeQuestion === "YES"
                                  }
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      strokeQuestion: e.target.value as "YES",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                              <td className="px-4 py-2 text-center border-l border-gray-300">
                                <input
                                  type="radio"
                                  name="strokeQuestion"
                                  value="NO"
                                  checked={
                                    ncdAssessment.strokeQuestion === "NO"
                                  }
                                  onChange={(e) =>
                                    setNcdAssessment({
                                      ...ncdAssessment,
                                      strokeQuestion: e.target.value as "NO",
                                    })
                                  }
                                  className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Alert when stroke question is YES */}
                        {ncdAssessment.strokeQuestion === "YES" && (
                          <div className="mx-4 my-3 p-4 bg-red-50 border-l-4 border-red-500">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5 text-red-600"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-semibold text-red-800">
                                  Medical Attention Required
                                </h3>
                                <p className="text-sm text-red-700 mt-1">
                                  Patient may have had a TIA or stroke and needs
                                  to see the doctor immediately.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-300">
                          <p className="text-xs text-gray-700 italic">
                            IF THE ANSWER TO QUESTION 8 IS YES, THE PATIENT MAY
                            HAVE HAD A TIA OR STROKE AND NEEDS TO SEE THE
                            DOCTOR.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div className="pt-6 border-t border-gray-200">
                      <div className="border border-gray-300">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                          <span className="text-sm font-semibold text-gray-900">
                            RISK LEVEL
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="flex gap-6 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="riskLevel"
                                value="<10%"
                                checked={ncdAssessment.riskLevel === "<10%"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    riskLevel: e.target.value,
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">
                                &lt;10%
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="riskLevel"
                                value="10% TO <20%"
                                checked={
                                  ncdAssessment.riskLevel === "10% TO <20%"
                                }
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    riskLevel: e.target.value,
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">
                                10% TO &lt;20%
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="riskLevel"
                                value="20% TO <30%"
                                checked={
                                  ncdAssessment.riskLevel === "20% TO <30%"
                                }
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    riskLevel: e.target.value,
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">
                                20% TO &lt;30%
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="riskLevel"
                                value="30% TO <40%"
                                checked={
                                  ncdAssessment.riskLevel === "30% TO <40%"
                                }
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    riskLevel: e.target.value,
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">
                                30% TO &lt;40%
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="riskLevel"
                                value="≥40%"
                                checked={ncdAssessment.riskLevel === "≥40%"}
                                onChange={(e) =>
                                  setNcdAssessment({
                                    ...ncdAssessment,
                                    riskLevel: e.target.value,
                                  })
                                }
                                className="w-4 h-4 border-gray-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600"
                              />
                              <span className="text-sm text-gray-700">
                                ≥40%
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                NCD High-Risk Assessment is only for patients aged 25 years and
                above.
              </p>
            )}
          </div>
        );

      case 12: // Final Diagnosis
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
              Final Diagnosis and Remarks
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Diagnosis
                </label>
                <textarea
                  value={finalDiagnosis}
                  onChange={(e) => setFinalDiagnosis(e.target.value)}
                  rows={4}
                  placeholder="Enter final diagnosis..."
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks / Additional Notes
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={6}
                  placeholder="Enter any additional remarks, treatment plans, or follow-up instructions..."
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      default:
        return <div>Step {currentStep + 1} content</div>;
    }
  };

  if (!editableFPE) {
    if (fpeQuery.isLoading) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header title="Loading FPE..." />
          <div className="p-8">
            <div className="bg-white border border-gray-200 p-8 text-center">
              <p className="text-gray-600 mb-4">
                Loading FPE record for editing...
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="FPE Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              {fpeQuery.isError
                ? `Unable to load the FPE record: ${fpeQuery.error?.message ?? ""}`
                : "The FPE record you're trying to edit doesn't exist."}
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

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Header
          title="Edit First Patient Encounter"
          subtitle={`Case Number: ${caseNumber}`}
        />

        <div className="bg-blue-50 border-b border-blue-100 px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-blue-900">
              This assessment is valid for {new Date().getFullYear()} only. A
              new FPE must be completed manually each year.
            </p>
            <button
              onClick={handleSubmit}
              disabled={!selectedPatient || !philhealthNumber}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600"
            >
              <Check size={16} />
              Update Changes
            </button>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(((currentStep + 1) / steps.length) * 100)}%
                  Complete
                </span>
                <span className="text-sm text-gray-600">
                  {steps[currentStep]}
                </span>
              </div>
              <div className="w-full bg-gray-100 h-1.5">
                <div
                  className="bg-blue-600 h-1.5 transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white border border-gray-200 p-12 mb-6">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between bg-white border border-gray-200 p-6">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-8 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedPatient || !philhealthNumber}
                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600"
              >
                <Check size={18} />
                Save Changes
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={
                  currentStep === 0
                    ? !selectedPatient || !philhealthNumber
                    : false
                }
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                Next
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
