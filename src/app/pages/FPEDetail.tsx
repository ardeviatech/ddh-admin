import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Header } from "../components/Header";
import {
  ArrowLeft,
  Download,
  FolderOpen,
  ClipboardList,
  Edit,
  Clock,
  Eye,
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  fetchFPEByCaseNumber,
  fetchFPEs,
  type PaginatedFPEResponse,
} from "../../services/fpeService";

export function FPEDetail() {
  const { caseNumber } = useParams<{ caseNumber: string }>();
  const navigate = useNavigate();
  const localFPERecord = useSelector((state: any) =>
    state.fpe?.fpeRecords?.find(
      (f: { caseNumber: string | undefined }) => f.caseNumber === caseNumber,
    ),
  );

  const resolvedCaseNumber = caseNumber ?? "";

  const fpeQuery = useQuery<any, Error>({
    queryKey: ["fpe", resolvedCaseNumber],
    queryFn: () => fetchFPEByCaseNumber(resolvedCaseNumber),
    enabled: !!resolvedCaseNumber && !localFPERecord,
  });

  const fpeRecord = localFPERecord ?? fpeQuery.data;

  const patientHistoryQuery = useQuery<PaginatedFPEResponse, Error>({
    queryKey: ["fpe", "history", fpeRecord?.patientId],
    queryFn: () => fetchFPEs({ patientId: fpeRecord?.patientId }),
    enabled: !!fpeRecord?.patientId,
  });

  // Get all FPE history for this patient
  const patientFPEHistory = useMemo(() => {
    if (!fpeRecord) return [];
    const all = patientHistoryQuery.data?.data ?? [];
    // Filter and sort patient's history by dateCreated desc
    return all
      .filter((r: any) => r.patientId === fpeRecord.patientId)
      .sort(
        (a: any, b: any) =>
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
      );
  }, [fpeRecord, patientHistoryQuery.data]);

  const currentYear = new Date().getFullYear();

  // Logo URLs for PDF generation
  const logos = {
    ddh: "https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDDH_Logo-removebg-preview.png?alt=media&token=de7727c9-19c4-4d92-acf9-f4f8cbc51ab6",
    doh: "https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDOH_logo-removebg-preview.png?alt=media&token=382d0ab0-f203-40fd-b06d-d4d649dcfa72",
    nv: "https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FNueva_Vizcaya_Seal-removebg-preview.png?alt=media&token=71c32e0e-5ce3-495d-b056-8eb062f13668",
  };

  if (!fpeRecord) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title={fpeQuery.isLoading ? "Loading FPE..." : "FPE Not Found"}
        />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            {fpeQuery.isLoading ? (
              <p className="text-gray-600 mb-4">Loading FPE record...</p>
            ) : fpeQuery.isError ? (
              <p className="text-gray-600 mb-4">
                Unable to load the FPE record.
                {fpeQuery.error instanceof Error
                  ? ` ${fpeQuery.error.message}`
                  : ""}
              </p>
            ) : (
              <p className="text-gray-600 mb-4">
                The FPE record you're looking for doesn't exist.
              </p>
            )}
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

  const handleDownloadFPE = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    const lineHeight = 5;
    const margin = 15;

    try {
      // Header text (centered)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Republic of the Philippines", pageWidth / 2, 12, {
        align: "center",
      });
      doc.text("Department of Health - Region II", pageWidth / 2, 17, {
        align: "center",
      });

      doc.setTextColor(0, 102, 51);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DUPAX DISTRICT HOSPITAL", pageWidth / 2, 24, {
        align: "center",
      });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Dupax del Norte, Nueva Vizcaya", pageWidth / 2, 29, {
        align: "center",
      });
      doc.text("Yakap System", pageWidth / 2, 33, { align: "center" });

      // Add logos beside the header (left and right)
      const logoSize = 22;
      const logoY = 12; // Align with header text
      const leftMargin = 15;
      const spacing = 2; // Space between logos

      // Left side: DDH logo (far left)
      if (logos.ddh) {
        try {
          doc.addImage(logos.ddh, "PNG", leftMargin, logoY, logoSize, logoSize);
        } catch (e) {
          // Logo not available, skip silently
        }
      }

      // Left side: DOH logo (next to DDH)
      if (logos.doh) {
        try {
          const dohX = leftMargin + logoSize + spacing;
          doc.addImage(logos.doh, "PNG", dohX, logoY, logoSize, logoSize);
        } catch (e) {
          // Logo not available, skip silently
        }
      }

      // Right side: NV seal
      if (logos.nv) {
        try {
          doc.addImage(
            logos.nv,
            "PNG",
            pageWidth - leftMargin - logoSize,
            logoY,
            logoSize,
            logoSize,
          );
        } catch (e) {
          // Logo not available, skip silently
        }
      }

      // Form title box
      yPos = 40;
      doc.setFillColor(0, 102, 51);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        "FIRST PATIENT ENCOUNTER (FPE) FORM",
        pageWidth / 2,
        yPos + 5.5,
        { align: "center" },
      );

      yPos = 53;
      doc.setTextColor(0, 0, 0);

      // Helper function to add section header
      const addSectionHeader = (title: string) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(220, 220, 220);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, "F");
        doc.setDrawColor(100, 100, 100);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, "S");

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(title.toUpperCase(), margin + 2, yPos + 5);
        yPos += 10;
      };

      // Helper function to add field
      const addField = (
        label: string,
        value: string,
        fullWidth: boolean = false,
      ) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", margin + 2, yPos);

        doc.setFont("helvetica", "normal");
        const valueX = margin + 2 + doc.getTextWidth(label + ": ");
        const maxWidth = fullWidth ? pageWidth - margin - valueX - 2 : 80;
        const lines = doc.splitTextToSize(value || "N/A", maxWidth);
        lines.forEach((line: string, idx: number) => {
          doc.text(line, valueX, yPos + idx * lineHeight);
        });

        yPos += Math.max(lineHeight, lines.length * lineHeight) + 1;
      };

      // Helper function to add multi-column field
      const addTwoColumnFields = (
        field1: { label: string; value: string },
        field2: { label: string; value: string },
      ) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }

        const midPoint = pageWidth / 2;

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(field1.label + ":", margin + 2, yPos);
        doc.text(field2.label + ":", midPoint + 2, yPos);

        doc.setFont("helvetica", "normal");
        doc.text(
          field1.value || "N/A",
          margin + 2 + doc.getTextWidth(field1.label + ": "),
          yPos,
        );
        doc.text(
          field2.value || "N/A",
          midPoint + 2 + doc.getTextWidth(field2.label + ": "),
          yPos,
        );

        yPos += lineHeight + 1;
      };

      // Case Information
      addSectionHeader("I. PATIENT & CASE INFORMATION");
      addTwoColumnFields(
        { label: "Case Number", value: fpeRecord.caseNumber },
        { label: "Year", value: fpeRecord.year.toString() },
      );
      addTwoColumnFields(
        { label: "Patient Name", value: fpeRecord.patientName.toUpperCase() },
        { label: "Patient ID", value: fpeRecord.patientId },
      );
      addTwoColumnFields(
        { label: "PhilHealth Number", value: fpeRecord.philhealthNumber },
        { label: "Client Type", value: fpeRecord.philhealthType },
      );
      addTwoColumnFields(
        {
          label: "eKonsulta Patient",
          value: fpeRecord.eKonsulta ? "Yes" : "No",
        },
        {
          label: "Date Created",
          value: new Date(fpeRecord.dateCreated).toLocaleDateString(),
        },
      );
      addField("Status", fpeRecord.status);
      yPos += 3;

      // Past Medical History
      addSectionHeader("II. PAST MEDICAL HISTORY");
      const medicalConditions = Object.entries(
        fpeRecord.pastMedicalHistory.conditions,
      )
        .filter(([_, value]) => value)
        .map(([key]) => key.replace(/([A-Z])/g, " $1").trim());

      addField(
        "Medical Conditions",
        medicalConditions.length > 0
          ? medicalConditions.join(", ")
          : "None reported",
        true,
      );
      if (fpeRecord.pastMedicalHistory.specifiedAllergy) {
        addField(
          "Allergy Specification",
          fpeRecord.pastMedicalHistory.specifiedAllergy,
          true,
        );
      }
      if (fpeRecord.pastMedicalHistory.specifiedCancerOrgan) {
        addField(
          "Cancer Organ",
          fpeRecord.pastMedicalHistory.specifiedCancerOrgan,
        );
      }
      if (fpeRecord.pastMedicalHistory.specifiedHepatitisType) {
        addField(
          "Hepatitis Type",
          fpeRecord.pastMedicalHistory.specifiedHepatitisType,
        );
      }
      if (fpeRecord.pastMedicalHistory.highestBloodPressure) {
        addField(
          "Highest Blood Pressure",
          fpeRecord.pastMedicalHistory.highestBloodPressure,
        );
      }
      if (fpeRecord.pastMedicalHistory.pulmonaryTBCategory) {
        addField(
          "Pulmonary TB Category",
          fpeRecord.pastMedicalHistory.pulmonaryTBCategory,
        );
      }
      if (fpeRecord.pastMedicalHistory.extraPulmonaryTBCategory) {
        addField(
          "Extra-Pulmonary TB Category",
          fpeRecord.pastMedicalHistory.extraPulmonaryTBCategory,
        );
      }
      if (fpeRecord.pastMedicalHistory.others) {
        addField("Other Conditions", fpeRecord.pastMedicalHistory.others, true);
      }
      yPos += 3;

      // Past Surgical History
      addSectionHeader("III. PAST SURGICAL HISTORY");
      if (fpeRecord.pastSurgicalHistory.none) {
        addField("Operation", "None");
      } else {
        addField(
          "Operation",
          fpeRecord.pastSurgicalHistory.operation || "None",
          true,
        );
        if (fpeRecord.pastSurgicalHistory.date) {
          addField("Date", fpeRecord.pastSurgicalHistory.date);
        }
      }
      yPos += 3;

      // Family History
      addSectionHeader("IV. FAMILY HISTORY");
      const familyConditions = Object.entries(
        fpeRecord.familyHistory.conditions,
      )
        .filter(([_, value]) => value)
        .map(([key]) => key.replace(/([A-Z])/g, " $1").trim());

      addField(
        "Family Medical Conditions",
        familyConditions.length > 0
          ? familyConditions.join(", ")
          : "None reported",
        true,
      );
      if (fpeRecord.familyHistory.specifiedAllergy) {
        addField(
          "Allergy Specification",
          fpeRecord.familyHistory.specifiedAllergy,
          true,
        );
      }
      if (fpeRecord.familyHistory.others) {
        addField("Other Conditions", fpeRecord.familyHistory.others, true);
      }
      yPos += 3;

      // Personal/Social History
      addSectionHeader("V. PERSONAL & SOCIAL HISTORY");
      addTwoColumnFields(
        {
          label: "Smoking",
          value: fpeRecord.personalHistory.smoking || "Not specified",
        },
        {
          label: "Packs/Year",
          value: fpeRecord.personalHistory.packsPerYear?.toString() || "N/A",
        },
      );
      addTwoColumnFields(
        {
          label: "Alcohol",
          value: fpeRecord.personalHistory.alcohol || "Not specified",
        },
        {
          label: "Bottles/Day",
          value: fpeRecord.personalHistory.bottlesPerDay?.toString() || "N/A",
        },
      );
      addTwoColumnFields(
        {
          label: "Illicit Drugs",
          value: fpeRecord.personalHistory.illicitDrugs || "Not specified",
        },
        {
          label: "Sexually Active",
          value: fpeRecord.personalHistory.sexuallyActive || "Not specified",
        },
      );
      yPos += 3;

      // Immunization
      addSectionHeader("VI. IMMUNIZATION HISTORY");
      const childVaccines = fpeRecord.immunization.children || [];
      const adultVaccines = fpeRecord.immunization.adult || [];
      const pregnantVaccines = fpeRecord.immunization.pregnant || [];
      const elderlyVaccines = fpeRecord.immunization.elderly || [];

      if (childVaccines.length > 0) {
        addField("Children Vaccines", childVaccines.join(", "), true);
      }
      if (adultVaccines.length > 0) {
        addField("Adult Vaccines", adultVaccines.join(", "), true);
      }
      if (pregnantVaccines.length > 0) {
        addField("Pregnant Vaccines", pregnantVaccines.join(", "), true);
      }
      if (elderlyVaccines.length > 0) {
        addField("Elderly Vaccines", elderlyVaccines.join(", "), true);
      }
      if (fpeRecord.immunization.othersSpecify) {
        addField("Other Vaccines", fpeRecord.immunization.othersSpecify, true);
      }
      if (
        childVaccines.length === 0 &&
        adultVaccines.length === 0 &&
        pregnantVaccines.length === 0 &&
        elderlyVaccines.length === 0
      ) {
        addField("Vaccines", "No immunization records");
      }
      yPos += 3;

      // Family Planning
      addSectionHeader("VII. FAMILY PLANNING");
      addField(
        "Has Access to Family Planning",
        fpeRecord.familyPlanning.hasAccess || "Not specified",
      );
      yPos += 3;

      // Menstrual History (if applicable)
      if (fpeRecord.menstrualHistory) {
        addSectionHeader("VIII. MENSTRUAL HISTORY");
        if (fpeRecord.menstrualHistory.menarche) {
          addField(
            "Age at Menarche",
            fpeRecord.menstrualHistory.menarche.toString() + " years",
          );
        }
        if (fpeRecord.menstrualHistory.onsetSexualIntercourse) {
          addField(
            "Age at Onset of Sexual Intercourse",
            fpeRecord.menstrualHistory.onsetSexualIntercourse.toString() +
              " years",
          );
        }
        addTwoColumnFields(
          {
            label: "Menopaused",
            value: fpeRecord.menstrualHistory.menopaused || "Not specified",
          },
          {
            label: "Age at Menopause",
            value: fpeRecord.menstrualHistory.menopauseAge?.toString() || "N/A",
          },
        );
        if (fpeRecord.menstrualHistory.lmp) {
          addField(
            "Last Menstrual Period (LMP)",
            fpeRecord.menstrualHistory.lmp,
          );
        }
        addTwoColumnFields(
          {
            label: "Period Duration",
            value: fpeRecord.menstrualHistory.periodDuration
              ? fpeRecord.menstrualHistory.periodDuration + " days"
              : "N/A",
          },
          {
            label: "Interval Cycle",
            value: fpeRecord.menstrualHistory.intervalCycle
              ? fpeRecord.menstrualHistory.intervalCycle + " days"
              : "N/A",
          },
        );
        addTwoColumnFields(
          {
            label: "Pads per Day",
            value: fpeRecord.menstrualHistory.padsPerDay?.toString() || "N/A",
          },
          {
            label: "Birth Control Method",
            value: fpeRecord.menstrualHistory.birthControlMethod || "None",
          },
        );
        yPos += 3;
      }

      // Pregnancy History (if applicable)
      if (fpeRecord.pregnancyHistory) {
        addSectionHeader("IX. PREGNANCY HISTORY");
        addTwoColumnFields(
          {
            label: "Gravidity (G)",
            value: fpeRecord.pregnancyHistory.gravidity?.toString() || "N/A",
          },
          {
            label: "Parity (P)",
            value: fpeRecord.pregnancyHistory.parity?.toString() || "N/A",
          },
        );
        if (fpeRecord.pregnancyHistory.typeOfDelivery) {
          addField(
            "Type of Delivery",
            fpeRecord.pregnancyHistory.typeOfDelivery,
          );
        }
        addTwoColumnFields(
          {
            label: "Full Term",
            value: fpeRecord.pregnancyHistory.fullTerm?.toString() || "N/A",
          },
          {
            label: "Premature",
            value: fpeRecord.pregnancyHistory.premature?.toString() || "N/A",
          },
        );
        addTwoColumnFields(
          {
            label: "Abortion",
            value: fpeRecord.pregnancyHistory.abortion?.toString() || "N/A",
          },
          {
            label: "Living Children",
            value:
              fpeRecord.pregnancyHistory.livingChildren?.toString() || "N/A",
          },
        );
        addField(
          "Pregnancy-Induced Hypertension",
          fpeRecord.pregnancyHistory.pregnancyInducedHypertension ||
            "Not specified",
        );
        yPos += 3;
      }

      // Physical Examination
      addSectionHeader("X. PHYSICAL EXAMINATION");
      addTwoColumnFields(
        {
          label: "Blood Pressure",
          value: fpeRecord.physicalExamination.bloodPressure || "N/A",
        },
        {
          label: "Heart Rate",
          value: fpeRecord.physicalExamination.heartRate
            ? fpeRecord.physicalExamination.heartRate + " bpm"
            : "N/A",
        },
      );
      addTwoColumnFields(
        {
          label: "Respiratory Rate",
          value: fpeRecord.physicalExamination.respiratoryRate
            ? fpeRecord.physicalExamination.respiratoryRate + " /min"
            : "N/A",
        },
        {
          label: "Temperature",
          value: fpeRecord.physicalExamination.temperature
            ? fpeRecord.physicalExamination.temperature + " °C"
            : "N/A",
        },
      );
      addTwoColumnFields(
        {
          label: "Height",
          value: fpeRecord.physicalExamination.height
            ? fpeRecord.physicalExamination.height + " cm"
            : "N/A",
        },
        {
          label: "Weight",
          value: fpeRecord.physicalExamination.weight
            ? fpeRecord.physicalExamination.weight + " kg"
            : "N/A",
        },
      );
      addTwoColumnFields(
        {
          label: "BMI",
          value: fpeRecord.physicalExamination.bmi?.toString() || "N/A",
        },
        {
          label: "Blood Type",
          value: fpeRecord.physicalExamination.bloodType || "N/A",
        },
      );
      if (fpeRecord.physicalExamination.visualAcuity) {
        addField("Visual Acuity", fpeRecord.physicalExamination.visualAcuity);
      }
      if (fpeRecord.physicalExamination.generalSurvey) {
        addField(
          "General Survey",
          fpeRecord.physicalExamination.generalSurvey,
          true,
        );
      }
      yPos += 3;

      // Pertinent Findings
      addSectionHeader("XI. PERTINENT FINDINGS");
      if (fpeRecord.pertinentFindings.heent.length > 0) {
        addField("HEENT", fpeRecord.pertinentFindings.heent.join(", "), true);
      }
      if (fpeRecord.pertinentFindings.chestBreastLungs.length > 0) {
        addField(
          "Chest/Breast/Lungs",
          fpeRecord.pertinentFindings.chestBreastLungs.join(", "),
          true,
        );
      }
      if (fpeRecord.pertinentFindings.heart.length > 0) {
        addField("Heart", fpeRecord.pertinentFindings.heart.join(", "), true);
      }
      if (fpeRecord.pertinentFindings.abdomen.length > 0) {
        addField(
          "Abdomen",
          fpeRecord.pertinentFindings.abdomen.join(", "),
          true,
        );
      }
      if (fpeRecord.pertinentFindings.genitourinary.length > 0) {
        addField(
          "Genitourinary",
          fpeRecord.pertinentFindings.genitourinary.join(", "),
          true,
        );
      }
      if (fpeRecord.pertinentFindings.skinExtremities.length > 0) {
        addField(
          "Skin/Extremities",
          fpeRecord.pertinentFindings.skinExtremities.join(", "),
          true,
        );
      }
      if (fpeRecord.pertinentFindings.neurological.length > 0) {
        addField(
          "Neurological",
          fpeRecord.pertinentFindings.neurological.join(", "),
          true,
        );
      }
      yPos += 3;

      // NCD Assessment (if applicable)
      if (fpeRecord.ncdAssessment) {
        addSectionHeader("XII. NCD RISK ASSESSMENT (for patients 25+ years)");
        addTwoColumnFields(
          {
            label: "High Fat/Salt Intake",
            value: fpeRecord.ncdAssessment.highFatSaltIntake || "Not specified",
          },
          {
            label: "Vegetables Daily",
            value: fpeRecord.ncdAssessment.vegetablesDaily || "Not specified",
          },
        );
        addTwoColumnFields(
          {
            label: "Fruits Daily",
            value: fpeRecord.ncdAssessment.fruitsDaily || "Not specified",
          },
          {
            label: "Physical Activity",
            value: fpeRecord.ncdAssessment.physicalActivity || "Not specified",
          },
        );
        if (fpeRecord.ncdAssessment.diabetesDiagnosed === "YES") {
          addField("Diabetes Diagnosed", "Yes");
          if (fpeRecord.ncdAssessment.diabetesWithMedication) {
            addField(
              "On Diabetes Medication",
              fpeRecord.ncdAssessment.diabetesWithMedication,
            );
            if (fpeRecord.ncdAssessment.diabetesMedicationDetails) {
              addField(
                "Medication Details",
                fpeRecord.ncdAssessment.diabetesMedicationDetails,
                true,
              );
            }
          }
        }
        if (fpeRecord.ncdAssessment.raisedBloodGlucose === "YES") {
          addField("Raised Blood Glucose", "Yes");
          if (fpeRecord.ncdAssessment.fbsRbs) {
            addField("FBS/RBS", fpeRecord.ncdAssessment.fbsRbs);
          }
        }
        if (fpeRecord.ncdAssessment.riskLevel) {
          addField("Overall NCD Risk Level", fpeRecord.ncdAssessment.riskLevel);
        }
        yPos += 3;
      }

      // Final Diagnosis
      addSectionHeader("XIII. FINAL DIAGNOSIS & REMARKS");
      addField(
        "Diagnosis",
        fpeRecord.finalDiagnosis || "No diagnosis provided",
        true,
      );
      if (fpeRecord.remarks) {
        addField("Remarks", fpeRecord.remarks, true);
      }
      yPos += 3;

      // Signature section
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 10;
      doc.setDrawColor(0, 0, 0);
      doc.line(margin + 10, yPos, margin + 70, yPos);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Attending Physician Signature", margin + 10, yPos + 4);
      doc.text("Date: _______________", margin + 10, yPos + 9);

      doc.line(pageWidth - margin - 70, yPos, pageWidth - margin - 10, yPos);
      doc.text("Patient/Guardian Signature", pageWidth - margin - 70, yPos + 4);
      doc.text("Date: _______________", pageWidth - margin - 70, yPos + 9);

      // Footer with page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer border
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(
          "Dupax District Hospital - Confidential Medical Record",
          margin,
          pageHeight - 10,
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" },
        );
        doc.text(
          `Case No: ${fpeRecord.caseNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" },
        );
      }

      doc.save(
        `FPE_${fpeRecord.caseNumber}_${fpeRecord.patientName.replace(/\s/g, "_")}.pdf`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`FPE Record - ${fpeRecord.caseNumber}`}
        subtitle={`Patient: ${fpeRecord.patientName} • Year: ${fpeRecord.year}`}
      />

      <div className="p-8 bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/fpe")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to FPE List
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/fpe/${caseNumber}/edit/0`)}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              <Edit size={20} />
              Edit FPE
            </button>
            <button
              onClick={() => navigate(`/fpe/${caseNumber}/documents`)}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              <FolderOpen size={20} />
              View Supporting Documents
            </button>
            <button
              onClick={() => navigate(`/fpe/${caseNumber}/consultations`)}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <ClipboardList size={20} />
              Consultation Record
            </button>
            <button
              onClick={handleDownloadFPE}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Download size={20} />
              Download FPE Data
            </button>
          </div>
        </div>

        {/* Medical Document Header */}
        <div className="bg-white border-2 border-gray-900 mb-6 print:border-black">
          <div className="border-b-2 border-gray-900 bg-gray-50 px-8 py-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                FIRST PATIENT ENCOUNTER (FPE) FORM
              </h1>
              <p className="text-sm text-gray-600">
                Annual Health Assessment Record
              </p>
            </div>
          </div>

          <div className="px-8 py-6 grid grid-cols-2 gap-x-12 gap-y-3 border-b border-gray-300">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Case Number:
              </span>
              <span className="text-gray-900 font-medium">
                {fpeRecord.caseNumber}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">Year:</span>
              <span className="text-gray-900 font-medium">
                {fpeRecord.year}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Patient Name:
              </span>
              <span className="text-gray-900 font-medium uppercase">
                {fpeRecord.patientName}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Patient ID:
              </span>
              <span className="text-gray-900 font-medium">
                {fpeRecord.patientId}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                PhilHealth No.:
              </span>
              <span className="text-gray-900 font-medium">
                {fpeRecord.philhealthNumber}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Client Type:
              </span>
              <span className="text-gray-900 font-medium">
                {fpeRecord.philhealthType}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                eKonsulta:
              </span>
              {fpeRecord.eKonsulta ? (
                <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 font-medium text-xs">
                  Yes
                </span>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Date Created:
              </span>
              <span className="text-gray-900 font-medium">
                {new Date(fpeRecord.dateCreated).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">Status:</span>
              <span
                className={`font-semibold ${
                  fpeRecord.status === "Completed"
                    ? "text-green-700"
                    : "text-yellow-700"
                }`}
              >
                {fpeRecord.status}
              </span>
            </div>
          </div>
        </div>

        {/* Main Medical Record Document */}
        <div className="bg-white border-2 border-gray-900">
          <div className="divide-y-2 divide-gray-300">
            {/* Past Medical History */}
            <div className="px-8 py-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                I. Past Medical History
              </h3>
              <div className="pl-4">
                <div className="mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Conditions:
                  </span>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(fpeRecord.pastMedicalHistory.conditions)
                      .filter(([_, value]) => value)
                      .map(([key]) => (
                        <span key={key} className="text-sm text-gray-900">
                          ☑ {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      ))}
                    {Object.values(
                      fpeRecord.pastMedicalHistory.conditions,
                    ).every((v) => !v) && (
                      <span className="text-sm text-gray-600 italic">
                        None reported
                      </span>
                    )}
                  </div>
                </div>
                {fpeRecord.pastMedicalHistory.specifiedAllergy && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[140px]">
                      Allergy Details:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.pastMedicalHistory.specifiedAllergy}
                    </span>
                  </div>
                )}
                {fpeRecord.pastMedicalHistory.specifiedCancerOrgan && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Cancer Organ:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.pastMedicalHistory.specifiedCancerOrgan}
                    </span>
                  </div>
                )}
                {fpeRecord.pastMedicalHistory.specifiedHepatitisType && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Hepatitis Type:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.pastMedicalHistory.specifiedHepatitisType}
                    </span>
                  </div>
                )}
                {fpeRecord.pastMedicalHistory.highestBloodPressure && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Highest BP:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.pastMedicalHistory.highestBloodPressure}
                    </span>
                  </div>
                )}
                {fpeRecord.pastMedicalHistory.pulmonaryTBCategory && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Pulmonary TB Category:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.pastMedicalHistory.pulmonaryTBCategory}
                    </span>
                  </div>
                )}
                {fpeRecord.pastMedicalHistory.extraPulmonaryTBCategory && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Extra-Pulmonary TB:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.pastMedicalHistory.extraPulmonaryTBCategory}
                    </span>
                  </div>
                )}
                {fpeRecord.pastMedicalHistory.others && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Others:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.pastMedicalHistory.others}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Past Surgical History */}
            <div className="px-8 py-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                II. Past Surgical History
              </h3>
              <div className="pl-4 grid grid-cols-2 gap-x-8">
                <div className="flex gap-2">
                  <span className="text-sm font-semibold text-gray-700 min-w-[100px]">
                    Operation:
                  </span>
                  <span className="text-sm text-gray-900">
                    {fpeRecord.pastSurgicalHistory.operation || "None"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-semibold text-gray-700 min-w-[60px]">
                    Date:
                  </span>
                  <span className="text-sm text-gray-900">
                    {fpeRecord.pastSurgicalHistory.date || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Family History */}
            <div className="px-8 py-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                III. Family History
              </h3>
              <div className="pl-4">
                <div className="mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Family Medical Conditions:
                  </span>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(fpeRecord.familyHistory.conditions)
                      .filter(([_, value]) => value)
                      .map(([key]) => (
                        <span key={key} className="text-sm text-gray-900">
                          ☑ {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      ))}
                    {Object.values(fpeRecord.familyHistory.conditions).every(
                      (v) => !v,
                    ) && (
                      <span className="text-sm text-gray-600 italic">
                        None reported
                      </span>
                    )}
                  </div>
                </div>
                {fpeRecord.familyHistory.specifiedAllergy && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[140px]">
                      Allergy Details:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.familyHistory.specifiedAllergy}
                    </span>
                  </div>
                )}
                {fpeRecord.familyHistory.specifiedCancerOrgan && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Cancer Organ:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.familyHistory.specifiedCancerOrgan}
                    </span>
                  </div>
                )}
                {fpeRecord.familyHistory.specifiedHepatitisType && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Hepatitis Type:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.familyHistory.specifiedHepatitisType}
                    </span>
                  </div>
                )}
                {fpeRecord.familyHistory.highestBloodPressure && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Highest BP:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.familyHistory.highestBloodPressure}
                    </span>
                  </div>
                )}
                {fpeRecord.familyHistory.pulmonaryTBCategory && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Pulmonary TB Category:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.familyHistory.pulmonaryTBCategory}
                    </span>
                  </div>
                )}
                {fpeRecord.familyHistory.extraPulmonaryTBCategory && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                      Extra-Pulmonary TB:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.familyHistory.extraPulmonaryTBCategory}
                    </span>
                  </div>
                )}
                {fpeRecord.familyHistory.others && (
                  <div className="mb-2 flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[140px]">
                      Others:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.familyHistory.others}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Personal & Social History */}
            <div className="px-8 py-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                IV. Personal & Social History
              </h3>
              <div className="pl-4 grid grid-cols-2 gap-x-8 gap-y-2">
                <div className="flex gap-2">
                  <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                    Smoking:
                  </span>
                  <span className="text-sm text-gray-900">
                    {fpeRecord.personalHistory.smoking || "Not specified"}
                  </span>
                </div>
                {fpeRecord.personalHistory.packsPerYear && (
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      Packs/Year:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.personalHistory.packsPerYear}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                    Alcohol:
                  </span>
                  <span className="text-sm text-gray-900">
                    {fpeRecord.personalHistory.alcohol || "Not specified"}
                  </span>
                </div>
                {fpeRecord.personalHistory.bottlesPerDay && (
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      Bottles/Day:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.personalHistory.bottlesPerDay}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                    Illicit Drugs:
                  </span>
                  <span className="text-sm text-gray-900">
                    {fpeRecord.personalHistory.illicitDrugs || "Not specified"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                    Sexually Active:
                  </span>
                  <span className="text-sm text-gray-900">
                    {fpeRecord.personalHistory.sexuallyActive ||
                      "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Immunization History */}
            <div className="px-8 py-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                V. Immunization History
              </h3>
              <div className="pl-4 space-y-3">
                {fpeRecord.immunization.children &&
                  fpeRecord.immunization.children.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Children:
                      </span>
                      <span className="text-sm text-gray-900 ml-2">
                        {fpeRecord.immunization.children.join(", ")}
                      </span>
                    </div>
                  )}
                {fpeRecord.immunization.adult &&
                  fpeRecord.immunization.adult.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Adult:
                      </span>
                      <span className="text-sm text-gray-900 ml-2">
                        {fpeRecord.immunization.adult.join(", ")}
                      </span>
                    </div>
                  )}
                {fpeRecord.immunization.pregnant &&
                  fpeRecord.immunization.pregnant.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Pregnant Women:
                      </span>
                      <span className="text-sm text-gray-900 ml-2">
                        {fpeRecord.immunization.pregnant.join(", ")}
                      </span>
                    </div>
                  )}
                {fpeRecord.immunization.elderly &&
                  fpeRecord.immunization.elderly.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Elderly/Immunocompromised:
                      </span>
                      <span className="text-sm text-gray-900 ml-2">
                        {fpeRecord.immunization.elderly.join(", ")}
                      </span>
                    </div>
                  )}
                {fpeRecord.immunization.othersSpecify && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Others:
                    </span>
                    <span className="text-sm text-gray-900 ml-2">
                      {fpeRecord.immunization.othersSpecify}
                    </span>
                  </div>
                )}
                {!fpeRecord.immunization.children?.length &&
                  !fpeRecord.immunization.adult?.length &&
                  !fpeRecord.immunization.pregnant?.length &&
                  !fpeRecord.immunization.elderly?.length && (
                    <span className="text-sm text-gray-600 italic">
                      No immunization records
                    </span>
                  )}
              </div>
            </div>

            {/* Family Planning */}
            <div className="px-8 py-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                VI. Family Planning
              </h3>
              <div className="pl-4">
                <div className="flex gap-2">
                  <span className="text-sm font-semibold text-gray-700 min-w-[200px]">
                    Access to Family Planning:
                  </span>
                  <span className="text-sm text-gray-900">
                    {fpeRecord.familyPlanning.hasAccess || "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Menstrual History */}
            {fpeRecord.menstrualHistory && (
              <div className="px-8 py-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                  VII. Menstrual History
                </h3>
                <div className="pl-4 grid grid-cols-2 gap-x-8 gap-y-2">
                  {fpeRecord.menstrualHistory.menarche && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Menarche Age:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.menstrualHistory.menarche} years
                      </span>
                    </div>
                  )}
                  {fpeRecord.menstrualHistory.onsetSexualIntercourse && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Onset Sexual Intercourse:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.menstrualHistory.onsetSexualIntercourse}{" "}
                        years
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                      Menopaused:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.menstrualHistory.menopaused || "Not specified"}
                    </span>
                  </div>
                  {fpeRecord.menstrualHistory.menopauseAge && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Menopause Age:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.menstrualHistory.menopauseAge} years
                      </span>
                    </div>
                  )}
                  {fpeRecord.menstrualHistory.lmp && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Last Menstrual Period:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.menstrualHistory.lmp}
                      </span>
                    </div>
                  )}
                  {fpeRecord.menstrualHistory.periodDuration && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Period Duration:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.menstrualHistory.periodDuration} days
                      </span>
                    </div>
                  )}
                  {fpeRecord.menstrualHistory.intervalCycle && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Interval Cycle:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.menstrualHistory.intervalCycle} days
                      </span>
                    </div>
                  )}
                  {fpeRecord.menstrualHistory.padsPerDay && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Pads per Day:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.menstrualHistory.padsPerDay}
                      </span>
                    </div>
                  )}
                  {fpeRecord.menstrualHistory.birthControlMethod && (
                    <div className="col-span-2 flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Birth Control Method:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.menstrualHistory.birthControlMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pregnancy History */}
            {fpeRecord.pregnancyHistory && (
              <div className="px-8 py-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                  VIII. Pregnancy History
                </h3>
                <div className="pl-4 grid grid-cols-2 gap-x-8 gap-y-2">
                  {fpeRecord.pregnancyHistory.gravidity !== undefined && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Gravidity:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.pregnancyHistory.gravidity}
                      </span>
                    </div>
                  )}
                  {fpeRecord.pregnancyHistory.parity !== undefined && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Parity:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.pregnancyHistory.parity}
                      </span>
                    </div>
                  )}
                  {fpeRecord.pregnancyHistory.typeOfDelivery && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Type of Delivery:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.pregnancyHistory.typeOfDelivery}
                      </span>
                    </div>
                  )}
                  {fpeRecord.pregnancyHistory.fullTerm !== undefined && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Full Term:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.pregnancyHistory.fullTerm}
                      </span>
                    </div>
                  )}
                  {fpeRecord.pregnancyHistory.premature !== undefined && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Premature:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.pregnancyHistory.premature}
                      </span>
                    </div>
                  )}
                  {fpeRecord.pregnancyHistory.abortion !== undefined && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Abortion:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.pregnancyHistory.abortion}
                      </span>
                    </div>
                  )}
                  {fpeRecord.pregnancyHistory.livingChildren !== undefined && (
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                        Living Children:
                      </span>
                      <span className="text-sm text-gray-900">
                        {fpeRecord.pregnancyHistory.livingChildren}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                      Pregnancy Induced HTN:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.pregnancyHistory
                        .pregnancyInducedHypertension || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Physical Examination */}
            <div className="px-8 py-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                IX. Physical Examination
              </h3>
              <div className="pl-4">
                <div className="grid grid-cols-3 gap-x-8 gap-y-2 mb-4">
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      Blood Pressure:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.physicalExamination.bloodPressure || "N/A"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      Heart Rate:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.physicalExamination.heartRate || "N/A"} bpm
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      Respiratory Rate:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.physicalExamination.respiratoryRate || "N/A"}{" "}
                      /min
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      Temperature:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.physicalExamination.temperature || "N/A"} °C
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      Height:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.physicalExamination.height || "N/A"} cm
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      Weight:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.physicalExamination.weight || "N/A"} kg
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      BMI:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.physicalExamination.bmi || "N/A"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      Blood Type:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.physicalExamination.bloodType || "N/A"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                      Visual Acuity:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.physicalExamination.visualAcuity || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Pediatric Measurements */}
                {(fpeRecord.physicalExamination.length ||
                  fpeRecord.physicalExamination.headCircumference ||
                  fpeRecord.physicalExamination.skinfoldThickness ||
                  fpeRecord.physicalExamination.waist ||
                  fpeRecord.physicalExamination.hip ||
                  fpeRecord.physicalExamination.limbs ||
                  fpeRecord.physicalExamination.muac) && (
                  <div className="border-t border-gray-200 pt-3 mb-3">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Pediatric / Additional Measurements:
                    </span>
                    <div className="grid grid-cols-3 gap-x-8 gap-y-2">
                      {fpeRecord.physicalExamination.length && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                            Length:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.physicalExamination.length} cm
                          </span>
                        </div>
                      )}
                      {fpeRecord.physicalExamination.headCircumference && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                            Head Circumference:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.physicalExamination.headCircumference} cm
                          </span>
                        </div>
                      )}
                      {fpeRecord.physicalExamination.skinfoldThickness && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                            Skinfold Thickness:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.physicalExamination.skinfoldThickness} mm
                          </span>
                        </div>
                      )}
                      {fpeRecord.physicalExamination.waist && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                            Waist:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.physicalExamination.waist} cm
                          </span>
                        </div>
                      )}
                      {fpeRecord.physicalExamination.hip && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                            Hip:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.physicalExamination.hip} cm
                          </span>
                        </div>
                      )}
                      {fpeRecord.physicalExamination.limbs && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                            Limbs:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.physicalExamination.limbs} cm
                          </span>
                        </div>
                      )}
                      {fpeRecord.physicalExamination.muac && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                            MUAC:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.physicalExamination.muac} cm
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {fpeRecord.physicalExamination.generalSurvey && (
                  <div className="flex gap-2 border-t border-gray-200 pt-3">
                    <span className="text-sm font-semibold text-gray-700 min-w-[140px]">
                      General Survey:
                    </span>
                    <span className="text-sm text-gray-900">
                      {fpeRecord.physicalExamination.generalSurvey}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pertinent Findings */}
            <div className="px-8 py-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                X. Pertinent Findings
              </h3>
              <div className="pl-4 space-y-3">
                {fpeRecord.pertinentFindings.heent.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      HEENT:
                    </span>
                    <span className="text-sm text-gray-900 ml-2">
                      {fpeRecord.pertinentFindings.heent.join(", ")}
                    </span>
                  </div>
                )}
                {fpeRecord.pertinentFindings.chestBreastLungs.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Chest/Breast/Lungs:
                    </span>
                    <span className="text-sm text-gray-900 ml-2">
                      {fpeRecord.pertinentFindings.chestBreastLungs.join(", ")}
                    </span>
                  </div>
                )}
                {fpeRecord.pertinentFindings.heart.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Heart:
                    </span>
                    <span className="text-sm text-gray-900 ml-2">
                      {fpeRecord.pertinentFindings.heart.join(", ")}
                    </span>
                  </div>
                )}
                {fpeRecord.pertinentFindings.abdomen.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Abdomen:
                    </span>
                    <span className="text-sm text-gray-900 ml-2">
                      {fpeRecord.pertinentFindings.abdomen.join(", ")}
                    </span>
                  </div>
                )}
                {fpeRecord.pertinentFindings.genitourinary.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Genitourinary:
                    </span>
                    <span className="text-sm text-gray-900 ml-2">
                      {fpeRecord.pertinentFindings.genitourinary.join(", ")}
                    </span>
                  </div>
                )}
                {fpeRecord.pertinentFindings.digitalRectal.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Digital Rectal:
                    </span>
                    <span className="text-sm text-gray-900 ml-2">
                      {fpeRecord.pertinentFindings.digitalRectal.join(", ")}
                    </span>
                  </div>
                )}
                {fpeRecord.pertinentFindings.skinExtremities.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Skin/Extremities:
                    </span>
                    <span className="text-sm text-gray-900 ml-2">
                      {fpeRecord.pertinentFindings.skinExtremities.join(", ")}
                    </span>
                  </div>
                )}
                {fpeRecord.pertinentFindings.neurological.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Neurological:
                    </span>
                    <span className="text-sm text-gray-900 ml-2">
                      {fpeRecord.pertinentFindings.neurological.join(", ")}
                    </span>
                  </div>
                )}
                {Object.values(fpeRecord.pertinentFindings).every(
                  (arr) => Array.isArray(arr) && arr.length === 0,
                ) && (
                  <span className="text-sm text-gray-600 italic">
                    No pertinent findings reported
                  </span>
                )}
              </div>
            </div>

            {/* NCD Assessment */}
            {fpeRecord.ncdAssessment && (
              <div className="px-8 py-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                  XI. NCD High-Risk Assessment (For 25+ Years)
                </h3>
                <div className="pl-4 space-y-4">
                  {/* 1. Risk Factors */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      1. RISK FACTORS:
                    </h4>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 pl-3">
                      <div className="flex gap-2">
                        <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                          High Fat/Salt Intake:
                        </span>
                        <span className="text-sm text-gray-900">
                          {fpeRecord.ncdAssessment.highFatSaltIntake ||
                            "Not specified"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                          Vegetables Daily:
                        </span>
                        <span className="text-sm text-gray-900">
                          {fpeRecord.ncdAssessment.vegetablesDaily ||
                            "Not specified"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                          Fruits Daily:
                        </span>
                        <span className="text-sm text-gray-900">
                          {fpeRecord.ncdAssessment.fruitsDaily ||
                            "Not specified"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                          Physical Activity:
                        </span>
                        <span className="text-sm text-gray-900">
                          {fpeRecord.ncdAssessment.physicalActivity ||
                            "Not specified"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                          Diabetes Diagnosed:
                        </span>
                        <span className="text-sm text-gray-900">
                          {fpeRecord.ncdAssessment.diabetesDiagnosed ||
                            "Not specified"}
                        </span>
                      </div>
                      {fpeRecord.ncdAssessment.diabetesDiagnosed === "YES" && (
                        <>
                          <div className="flex gap-2">
                            <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                              Medication Status:
                            </span>
                            <span className="text-sm text-gray-900">
                              {fpeRecord.ncdAssessment
                                .diabetesWithMedication === "YES"
                                ? "With Medication"
                                : fpeRecord.ncdAssessment
                                      .diabetesWithMedication === "NO"
                                  ? "Without Medication"
                                  : "Not specified"}
                            </span>
                          </div>
                          {fpeRecord.ncdAssessment.diabetesWithMedication ===
                            "YES" &&
                            fpeRecord.ncdAssessment
                              .diabetesMedicationDetails && (
                              <div className="col-span-2 flex gap-2">
                                <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                                  Medication Details:
                                </span>
                                <span className="text-sm text-gray-900">
                                  {
                                    fpeRecord.ncdAssessment
                                      .diabetesMedicationDetails
                                  }
                                </span>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* 2. Symptoms */}
                  {fpeRecord.ncdAssessment.symptoms && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        2. SYMPTOMS:
                      </h4>
                      <div className="grid grid-cols-3 gap-x-8 gap-y-2 pl-3">
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[100px]">
                            Polyphagia:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.symptoms.polyphagia ||
                              "Not specified"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[100px]">
                            Polydipsia:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.symptoms.polydipsia ||
                              "Not specified"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[100px]">
                            Polyuria:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.symptoms.polyuria ||
                              "Not specified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Laboratory Results */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      3. LABORATORY RESULTS:
                    </h4>
                    <div className="pl-3 space-y-2">
                      <div className="grid grid-cols-2 gap-x-8">
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                            Raised Blood Glucose:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.raisedBloodGlucose ||
                              "Not specified"}
                          </span>
                        </div>
                        {fpeRecord.ncdAssessment.fbsRbs && (
                          <div className="flex gap-2">
                            <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                              FBS/RBS:
                            </span>
                            <span className="text-sm text-gray-900">
                              {fpeRecord.ncdAssessment.fbsRbs}
                            </span>
                          </div>
                        )}
                      </div>
                      {fpeRecord.ncdAssessment.glucoseDate && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                            Date Taken:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.glucoseDate}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-x-8 mt-3">
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                            Raised Blood Lipids:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.raisedBloodLipids ||
                              "Not specified"}
                          </span>
                        </div>
                        {fpeRecord.ncdAssessment.totalCholesterol && (
                          <div className="flex gap-2">
                            <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                              Total Cholesterol:
                            </span>
                            <span className="text-sm text-gray-900">
                              {fpeRecord.ncdAssessment.totalCholesterol}
                            </span>
                          </div>
                        )}
                      </div>
                      {fpeRecord.ncdAssessment.lipidsDate && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                            Date Taken:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.lipidsDate}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-x-8 mt-3">
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                            Urine Ketones:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.urineKetones ||
                              "Not specified"}
                          </span>
                        </div>
                        {fpeRecord.ncdAssessment.urineKetonesValue && (
                          <div className="flex gap-2">
                            <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                              Value:
                            </span>
                            <span className="text-sm text-gray-900">
                              {fpeRecord.ncdAssessment.urineKetonesValue}
                            </span>
                          </div>
                        )}
                      </div>
                      {fpeRecord.ncdAssessment.ketonesDate && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                            Date Taken:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.ketonesDate}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-x-8 mt-3">
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                            Urine Protein:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.urineProtein ||
                              "Not specified"}
                          </span>
                        </div>
                        {fpeRecord.ncdAssessment.urineProteinValue && (
                          <div className="flex gap-2">
                            <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                              Value:
                            </span>
                            <span className="text-sm text-gray-900">
                              {fpeRecord.ncdAssessment.urineProteinValue}
                            </span>
                          </div>
                        )}
                      </div>
                      {fpeRecord.ncdAssessment.proteinDate && (
                        <div className="flex gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[160px]">
                            Date Taken:
                          </span>
                          <span className="text-sm text-gray-900">
                            {fpeRecord.ncdAssessment.proteinDate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Angina Assessment */}
                  {fpeRecord.ncdAssessment.anginaQuestions &&
                    Object.keys(fpeRecord.ncdAssessment.anginaQuestions)
                      .length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          4. ANGINA OR HEART ATTACK ASSESSMENT:
                        </h4>
                        <div className="pl-3 space-y-2">
                          <div>
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-semibold text-gray-700 min-w-[30px]">
                                1.
                              </span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">
                                  Have you had any pain or discomfort or any
                                  pressure or heaviness in your chest?
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                  Answer:{" "}
                                  {fpeRecord.ncdAssessment.anginaQuestions[
                                    "1"
                                  ] || "Not answered"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-semibold text-gray-700 min-w-[30px]">
                                2.
                              </span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">
                                  Do you get the pain in the center of the chest
                                  or left arm?
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                  Answer:{" "}
                                  {fpeRecord.ncdAssessment.anginaQuestions[
                                    "2"
                                  ] || "Not answered"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-semibold text-gray-700 min-w-[30px]">
                                3.
                              </span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">
                                  Do you get it when you walk uphill or hurry?
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                  Answer:{" "}
                                  {fpeRecord.ncdAssessment.anginaQuestions[
                                    "3"
                                  ] || "Not answered"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-semibold text-gray-700 min-w-[30px]">
                                4.
                              </span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">
                                  Do you slow down if you get the pain while
                                  walking?
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                  Answer:{" "}
                                  {fpeRecord.ncdAssessment.anginaQuestions[
                                    "4"
                                  ] || "Not answered"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-semibold text-gray-700 min-w-[30px]">
                                5.
                              </span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">
                                  Does the pain go away if you stand still or if
                                  you take a tablet under the tongue?
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                  Answer:{" "}
                                  {fpeRecord.ncdAssessment.anginaQuestions[
                                    "5"
                                  ] || "Not answered"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-semibold text-gray-700 min-w-[30px]">
                                6.
                              </span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">
                                  Does the pain go away in less than 10 minutes?
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                  Answer:{" "}
                                  {fpeRecord.ncdAssessment.anginaQuestions[
                                    "6"
                                  ] || "Not answered"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-semibold text-gray-700 min-w-[30px]">
                                7.
                              </span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">
                                  Have you ever had a severe chest pain across
                                  the front of your chest lasting for half an
                                  hour or more?
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                  Answer:{" "}
                                  {fpeRecord.ncdAssessment.anginaQuestions[
                                    "7"
                                  ] || "Not answered"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* 5. Stroke Assessment */}
                  {fpeRecord.ncdAssessment.strokeQuestion && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        5. STROKE OR TRANSIENT ISCHEMIC ATTACK ASSESSMENT:
                      </h4>
                      <div className="pl-3">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-semibold text-gray-700 min-w-[30px]">
                            8.
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">
                              Have you ever had sudden weakness or numbness of
                              face, arm, or leg, or sudden difficulty speaking
                              or sudden dimness or loss of vision?
                            </p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                              Answer: {fpeRecord.ncdAssessment.strokeQuestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Level */}
                  {fpeRecord.ncdAssessment.riskLevel && (
                    <div className="border-t-2 border-gray-300 pt-4 mt-4">
                      <div className="flex gap-2">
                        <span className="text-sm font-semibold text-gray-700 min-w-[180px]">
                          OVERALL RISK LEVEL:
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            fpeRecord.ncdAssessment.riskLevel.includes("40") ||
                            fpeRecord.ncdAssessment.riskLevel.includes("30")
                              ? "text-red-700"
                              : fpeRecord.ncdAssessment.riskLevel.includes("20")
                                ? "text-yellow-700"
                                : "text-green-700"
                          }`}
                        >
                          {fpeRecord.ncdAssessment.riskLevel}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Final Diagnosis */}
            <div className="px-8 py-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                XII. Final Diagnosis
              </h3>
              <div className="pl-4">
                <p className="text-sm text-gray-900 leading-relaxed">
                  {fpeRecord.finalDiagnosis || "No diagnosis provided"}
                </p>
              </div>
            </div>

            {/* Remarks */}
            {fpeRecord.remarks && (
              <div className="px-8 py-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-gray-900">
                  XIII. Remarks / Additional Notes
                </h3>
                <div className="pl-4">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {fpeRecord.remarks}
                  </p>
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="px-8 py-6 border-t-2 border-gray-900 bg-gray-50">
              <div className="text-xs text-gray-600 text-center">
                <p>
                  This is an official medical record. All information contained
                  herein is confidential.
                </p>
                <p className="mt-1">
                  Last Updated:{" "}
                  {new Date(fpeRecord.lastUpdated).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* FPE History Section - Always visible */}
          <div className="bg-white border-2 border-gray-900 mt-6">
            <div className="border-b-2 border-gray-900 bg-gray-100 px-8 py-4">
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-gray-700" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    FPE History
                  </h2>
                  <p className="text-sm text-gray-600">
                    All FPE records for {fpeRecord.patientName} (
                    {patientFPEHistory.length} record
                    {patientFPEHistory.length !== 1 ? "s" : ""})
                  </p>
                </div>
              </div>
            </div>

            {patientFPEHistory.length === 0 ? (
              <div className="px-8 py-12 text-center">
                <p className="text-gray-500">
                  No FPE history found for this patient.
                </p>
              </div>
            ) : (
              <div className="px-8 py-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Case Number
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Year
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Created Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Validity
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientFPEHistory.map((record: any, index: number) => {
                        const isCurrentRecord =
                          record.caseNumber === fpeRecord.caseNumber;
                        const isCurrentYear = record.year === currentYear;
                        const isExpired = record.year < currentYear;

                        return (
                          <tr
                            key={record.caseNumber}
                            className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                              isCurrentRecord
                                ? "bg-blue-50"
                                : index % 2 === 0
                                  ? "bg-white"
                                  : "bg-gray-100"
                            }`}
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {record.caseNumber}
                              {isCurrentRecord && (
                                <span className="ml-2 text-xs text-blue-600 font-semibold">
                                  (Viewing)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-semibold ${
                                  isCurrentYear
                                    ? "bg-green-100 text-green-800 border border-green-300"
                                    : "bg-gray-100 text-gray-800 border border-gray-300"
                                }`}
                              >
                                {record.year}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {new Date(record.dateCreated).toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-semibold ${
                                  record.status === "Completed"
                                    ? "bg-green-100 text-green-800 border border-green-300"
                                    : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {isExpired ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                                    EXPIRED
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    (Dec 31, {record.year})
                                  </span>
                                </div>
                              ) : isCurrentYear ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                                    VALID
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    (Until Dec 31, {record.year})
                                  </span>
                                </div>
                              ) : null}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {!isCurrentRecord && (
                                <button
                                  onClick={() =>
                                    navigate(`/fpe/${record.caseNumber}`)
                                  }
                                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                                >
                                  <Eye size={16} />
                                  View
                                </button>
                              )}
                              {isCurrentRecord && (
                                <span className="text-sm text-gray-500 italic">
                                  Current
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {patientFPEHistory.length > 1 ? (
                  <div className="mt-4 px-6 py-4 bg-blue-50 border border-blue-300 rounded">
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Note:</span> FPE records
                      expire at the end of each calendar year (December 31).
                      Patients must renew their FPE annually to continue
                      consultations.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 px-6 py-4 bg-yellow-50 border border-yellow-300 rounded">
                    <p className="text-sm text-yellow-900">
                      <span className="font-semibold">Single Record:</span> This
                      patient currently has only one FPE record. When the year{" "}
                      {fpeRecord.year} ends (December 31, {fpeRecord.year}),
                      this FPE will expire and a new {fpeRecord.year + 1} FPE
                      must be created.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
