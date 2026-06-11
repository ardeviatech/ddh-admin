import { useState, useEffect, type Key } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { Header } from "../components/Header";
import { ArrowLeft, Download, Edit, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import { addFPE } from "../../store/slices/fpeSlice";
import { fetchFPEByCaseNumber } from "../../services/fpeService";
import { useConsultationQuery } from "../../services/useConsultationQueries";

export function ConsultationDetail() {
  const { caseNumber, consultationId } = useParams<{
    caseNumber: string;
    consultationId: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isLoadingFPE, setIsLoadingFPE] = useState(false);

  const consultationFromState = useAppSelector((state) =>
    state.consultation.consultations.find(
      (c: { id: string | undefined }) => c.id === consultationId,
    ),
  );

  const consultationQuery = useConsultationQuery(consultationId ?? "", {
    enabled: !!consultationId,
  });

  const consultation = consultationQuery.data || consultationFromState;

  const fpeRecord = useAppSelector((state) =>
    state.fpe.fpeRecords.find(
      (f: { caseNumber: string | undefined }) => f.caseNumber === caseNumber,
    ),
  );

  useEffect(() => {
    if (!caseNumber || fpeRecord) return;

    setIsLoadingFPE(true);
    fetchFPEByCaseNumber(caseNumber)
      .then((record) => dispatch(addFPE(record)))
      .catch((error) => {
        if (error.response?.status !== 404) {
          console.error("Unable to load FPE record:", error);
        }
      })
      .finally(() => setIsLoadingFPE(false));
  }, [caseNumber, fpeRecord, dispatch]);

  // Logo URLs for PDF generation
  const logos = {
    ddh: "https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDDH_Logo-removebg-preview.png?alt=media&token=de7727c9-19c4-4d92-acf9-f4f8cbc51ab6",
    doh: "https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDOH_logo-removebg-preview.png?alt=media&token=382d0ab0-f203-40fd-b06d-d4d649dcfa72",
    nv: "https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FNueva_Vizcaya_Seal-removebg-preview.png?alt=media&token=71c32e0e-5ce3-495d-b056-8eb062f13668",
  };

  const isLoadingConsultation =
    !consultationFromState && consultationQuery.isLoading;

  if (
    (!consultation && isLoadingConsultation) ||
    (!fpeRecord && isLoadingFPE)
  ) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Loading Consultation..." />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600">
              Loading consultation and FPE record...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!consultation || !fpeRecord) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Consultation Not Found" />
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              The consultation record you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate(`/fpe/${caseNumber}/consultations`)}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to Consultation Records
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDownloadConsultation = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    const lineHeight = 5;
    const margin = 15;

    try {
      // ── Header text ──────────────────────────────────────────────
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

      // ── Add logos beside the header (left and right) ──────────────
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

      // ── Title bar ─────────────────────────────────────────────────
      yPos = 40;
      doc.setFillColor(0, 102, 51);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("CONSULTATION RECORD", pageWidth / 2, yPos + 5.5, {
        align: "center",
      });

      yPos = 53;
      doc.setTextColor(0, 0, 0);

      // ── Helpers ───────────────────────────────────────────────────
      const checkPage = (needed = 20) => {
        if (yPos > pageHeight - needed) {
          doc.addPage();
          yPos = 20;
        }
      };

      const addSectionHeader = (title: string) => {
        checkPage(30);
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

      const addField = (label: string, value: string, fullWidth = false) => {
        checkPage();
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

      const addTwoCol = (
        f1: { label: string; value: string },
        f2: { label: string; value: string },
      ) => {
        checkPage();
        const mid = pageWidth / 2;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(f1.label + ":", margin + 2, yPos);
        doc.text(f2.label + ":", mid + 2, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(
          f1.value || "N/A",
          margin + 2 + doc.getTextWidth(f1.label + ": "),
          yPos,
        );
        doc.text(
          f2.value || "N/A",
          mid + 2 + doc.getTextWidth(f2.label + ": "),
          yPos,
        );
        yPos += lineHeight + 1;
      };

      // ── I. Patient & Consultation Information ─────────────────────
      addSectionHeader("I. Patient & Consultation Information");
      addTwoCol(
        { label: "Consultation ID", value: consultation.id },
        { label: "Case Number", value: consultation.caseNumber },
      );
      addTwoCol(
        {
          label: "Patient Name",
          value: consultation.patientName.toUpperCase(),
        },
        {
          label: "Date",
          value: new Date(consultation.consultationDate).toLocaleDateString(
            "en-US",
            {
              month: "long",
              day: "numeric",
              year: "numeric",
            },
          ),
        },
      );
      addTwoCol(
        {
          label: "Age",
          value: consultation.age ? consultation.age + " years old" : "N/A",
        },
        { label: "Gender", value: consultation.gender || "N/A" },
      );
      addTwoCol(
        { label: "eKonsulta", value: consultation.eKonsulta ? "Yes" : "No" },
        { label: "Status", value: consultation.status || "N/A" },
      );
      yPos += 3;

      // ── II. Main Complaint ────────────────────────────────────────
      addSectionHeader("II. Main Complaint");
      addField("Chief Complaint", consultation.mainComplaint || "N/A", true);
      yPos += 3;

      // ── III. Vital Signs (Table) ──────────────────────────────────
      addSectionHeader("III. Vital Signs");
      checkPage(30);

      const vitalSignsData = [
        ["Vital Sign", "Value", "Vital Sign", "Value"],
        [
          "Temperature",
          consultation.vitalSigns.temperature
            ? consultation.vitalSigns.temperature + " °C"
            : "N/A",
          "Respiratory Rate",
          consultation.vitalSigns.respiratoryRate
            ? consultation.vitalSigns.respiratoryRate + " /min"
            : "N/A",
        ],
        [
          "Cardiac Rate",
          consultation.vitalSigns.cardiacRate
            ? consultation.vitalSigns.cardiacRate + " bpm"
            : "N/A",
          "Blood Pressure",
          consultation.vitalSigns.bloodPressure || "N/A",
        ],
        [
          "Weight",
          consultation.vitalSigns.weight
            ? consultation.vitalSigns.weight + " kg"
            : "N/A",
          "Height",
          consultation.vitalSigns.height
            ? consultation.vitalSigns.height + " cm"
            : "N/A",
        ],
      ];

      const tableWidth = pageWidth - 2 * margin;
      const colWidths = [
        tableWidth * 0.25,
        tableWidth * 0.25,
        tableWidth * 0.25,
        tableWidth * 0.25,
      ];
      const rowHeight = 6;

      vitalSignsData.forEach((row, rowIndex) => {
        let xPos = margin;
        row.forEach((cell, colIndex) => {
          doc.setDrawColor(100, 100, 100);
          doc.rect(xPos, yPos, colWidths[colIndex], rowHeight);

          if (rowIndex === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(xPos, yPos, colWidths[colIndex], rowHeight, "F");
            doc.setFont("helvetica", "bold");
          } else if (colIndex === 0 || colIndex === 2) {
            doc.setFont("helvetica", "bold");
          } else {
            doc.setFont("helvetica", "normal");
          }

          doc.setFontSize(8);
          doc.text(cell, xPos + 1, yPos + 4);
          xPos += colWidths[colIndex];
        });
        yPos += rowHeight;
      });

      yPos += 3;

      // ── IV. Pertinent Physical Examination (Table) ────────────────
      addSectionHeader("IV. Pertinent Physical Examination");
      checkPage(60);

      const examAreas: {
        label: string;
        key: keyof typeof consultation.physicalExam;
        othersKey?: keyof typeof consultation.physicalExam;
      }[] = [
        { label: "HEENT", key: "heent", othersKey: "heentOthers" },
        {
          label: "Chest/Breast/Lungs",
          key: "chestBreastLungs",
          othersKey: "chestBreastLungsOthers",
        },
        { label: "Heart", key: "heart", othersKey: "heartOthers" },
        { label: "Abdomen", key: "abdomen", othersKey: "abdomenOthers" },
        {
          label: "Genitourinary",
          key: "genitourinary",
          othersKey: "genitourinaryOthers",
        },
        {
          label: "Digital Rectal",
          key: "digitalRectal",
          othersKey: "digitalRectalOthers",
        },
        {
          label: "Skin/Extremities",
          key: "skinExtremities",
          othersKey: "skinExtremitiesOthers",
        },
        {
          label: "Neurological",
          key: "neurological",
          othersKey: "neurologicalOthers",
        },
      ];

      const examTableWidth = pageWidth - 2 * margin;
      const examColWidths = [examTableWidth * 0.25, examTableWidth * 0.75];

      // Table header
      doc.setDrawColor(100, 100, 100);
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, examColWidths[0], rowHeight, "FD");
      doc.rect(
        margin + examColWidths[0],
        yPos,
        examColWidths[1],
        rowHeight,
        "FD",
      );
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Examination Area", margin + 1, yPos + 4);
      doc.text("Findings", margin + examColWidths[0] + 1, yPos + 4);
      yPos += rowHeight;

      // Table rows
      examAreas.forEach(({ label, key, othersKey }) => {
        checkPage(20);
        const arr = consultation.physicalExam[key] as string[];
        let val = arr.length > 0 ? arr.join(", ") : "None";

        if (arr.includes("Others") && othersKey) {
          const ov = consultation.physicalExam[othersKey] as string;
          if (ov) val += " (Others: " + ov + ")";
        }

        const valueLines = doc.splitTextToSize(val, examColWidths[1] - 2);
        const cellHeight = Math.max(rowHeight, valueLines.length * 4 + 2);

        doc.setDrawColor(100, 100, 100);
        doc.rect(margin, yPos, examColWidths[0], cellHeight);
        doc.rect(margin + examColWidths[0], yPos, examColWidths[1], cellHeight);

        doc.setFont("helvetica", "bold");
        doc.text(label, margin + 1, yPos + 4);

        doc.setFont("helvetica", "normal");
        valueLines.forEach((line: string, idx: number) => {
          doc.text(line, margin + examColWidths[0] + 1, yPos + 4 + idx * 4);
        });

        yPos += cellHeight;
      });

      yPos += 3;

      // ── V. Clinical Assessment ────────────────────────────────────
      addSectionHeader("V. Clinical Assessment");
      addField("PCU", consultation.pcu || "Not specified", true);
      addField("Diagnosis", consultation.diagnosis || "N/A", true);
      addField("Plan / Management", consultation.plan || "N/A", true);
      yPos += 3;

      // ── VI. Medicines Prescribed (Table) ──────────────────────────
      if (consultation.medicines.length > 0) {
        addSectionHeader("VI. Medicines Prescribed");
        checkPage(40);

        const medTableWidth = pageWidth - 2 * margin;
        const medColWidths = [
          medTableWidth * 0.05,
          medTableWidth * 0.23,
          medTableWidth * 0.23,
          medTableWidth * 0.18,
          medTableWidth * 0.21,
          medTableWidth * 0.1,
        ];

        // Table header
        const medHeaders = [
          "#",
          "Generic Name",
          "Brand Name",
          "Formulation",
          "Signa",
          "Quantity",
        ];
        let xPos = margin;
        doc.setDrawColor(100, 100, 100);
        doc.setFillColor(240, 240, 240);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        medHeaders.forEach((header, idx) => {
          doc.rect(xPos, yPos, medColWidths[idx], rowHeight, "FD");
          doc.text(header, xPos + 1, yPos + 4);
          xPos += medColWidths[idx];
        });
        yPos += rowHeight;

        // Table rows
        consultation.medicines.forEach(
          (
            med: {
              genericName: any;
              brandName: any;
              formulation: any;
              signa: any;
              quantity: any;
            },
            idx: number,
          ) => {
            checkPage(15);
            const rowData = [
              (idx + 1).toString(),
              med.genericName || "N/A",
              med.brandName || "N/A",
              med.formulation || "N/A",
              med.signa || "N/A",
              med.quantity || "N/A",
            ];

            xPos = margin;
            doc.setFont("helvetica", "normal");
            doc.setDrawColor(100, 100, 100);

            const maxLines = Math.max(
              ...rowData.map(
                (cell, cellIdx) =>
                  doc.splitTextToSize(cell, medColWidths[cellIdx] - 2).length,
              ),
            );
            const cellHeight = Math.max(rowHeight, maxLines * 4 + 2);

            rowData.forEach((cell, cellIdx) => {
              doc.rect(xPos, yPos, medColWidths[cellIdx], cellHeight);
              const lines = doc.splitTextToSize(
                cell,
                medColWidths[cellIdx] - 2,
              );
              lines.forEach((line: string, lineIdx: number) => {
                doc.text(line, xPos + 1, yPos + 4 + lineIdx * 4);
              });
              xPos += medColWidths[cellIdx];
            });

            yPos += cellHeight;
          },
        );
        yPos += 3;
      }

      // ── VII. Laboratory Tests (Table) ─────────────────────────────
      if (consultation.laboratories.length > 0) {
        addSectionHeader("VII. Laboratory Tests");
        checkPage(40);

        const labTableWidth = pageWidth - 2 * margin;
        const labColWidths = [
          labTableWidth * 0.05,
          labTableWidth * 0.25,
          labTableWidth * 0.3,
          labTableWidth * 0.4,
        ];

        // Table header
        const labHeaders = ["#", "Test Name", "Test Results", "Summary"];
        let xPos = margin;
        doc.setDrawColor(100, 100, 100);
        doc.setFillColor(240, 240, 240);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        labHeaders.forEach((header, idx) => {
          doc.rect(xPos, yPos, labColWidths[idx], rowHeight, "FD");
          doc.text(header, xPos + 1, yPos + 4);
          xPos += labColWidths[idx];
        });
        yPos += rowHeight;

        // Table rows
        consultation.laboratories.forEach(
          (
            lab: { testName: any; testResults: any; summary: any },
            idx: number,
          ) => {
            checkPage(20);
            const rowData = [
              (idx + 1).toString(),
              lab.testName || "N/A",
              lab.testResults || "N/A",
              lab.summary || "N/A",
            ];

            xPos = margin;
            doc.setFont("helvetica", "normal");
            doc.setDrawColor(100, 100, 100);

            const maxLines = Math.max(
              ...rowData.map(
                (cell, cellIdx) =>
                  doc.splitTextToSize(cell, labColWidths[cellIdx] - 2).length,
              ),
            );
            const cellHeight = Math.max(rowHeight, maxLines * 4 + 2);

            rowData.forEach((cell, cellIdx) => {
              doc.rect(xPos, yPos, labColWidths[cellIdx], cellHeight);
              const lines = doc.splitTextToSize(
                cell,
                labColWidths[cellIdx] - 2,
              );
              lines.forEach((line: string, lineIdx: number) => {
                doc.text(line, xPos + 1, yPos + 4 + lineIdx * 4);
              });
              xPos += labColWidths[cellIdx];
            });

            yPos += cellHeight;
          },
        );
        yPos += 3;
      }

      // ── VIII. EKAS ────────────────────────────────────────────────
      addSectionHeader(
        "VIII. EKAS (Essential Knapsack for Ambulatory Services)",
      );
      addField(
        "Status",
        consultation.ekas.enabled === true
          ? "Enabled"
          : consultation.ekas.enabled === false
            ? "Not Enabled"
            : "Not Specified",
      );

      if (consultation.ekas.enabled && consultation.ekas.tests.length > 0) {
        yPos += 2;
        checkPage(20);

        const ekasTableWidth = pageWidth - 2 * margin;
        const ekasColWidths = [ekasTableWidth * 0.1, ekasTableWidth * 0.9];

        // Table header
        doc.setDrawColor(100, 100, 100);
        doc.setFillColor(240, 240, 240);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.rect(margin, yPos, ekasColWidths[0], rowHeight, "FD");
        doc.rect(
          margin + ekasColWidths[0],
          yPos,
          ekasColWidths[1],
          rowHeight,
          "FD",
        );
        doc.text("#", margin + 1, yPos + 4);
        doc.text("Test Name", margin + ekasColWidths[0] + 1, yPos + 4);
        yPos += rowHeight;

        // Table rows
        consultation.ekas.tests.forEach(
          (test: string | string[], idx: number) => {
            checkPage(10);
            doc.setFont("helvetica", "normal");
            doc.setDrawColor(100, 100, 100);
            doc.rect(margin, yPos, ekasColWidths[0], rowHeight);
            doc.rect(
              margin + ekasColWidths[0],
              yPos,
              ekasColWidths[1],
              rowHeight,
            );
            doc.text((idx + 1).toString(), margin + 1, yPos + 4);
            doc.text(test, margin + ekasColWidths[0] + 1, yPos + 4);
            yPos += rowHeight;
          },
        );
      }

      yPos += 3;

      // ── IX. EPRESS ────────────────────────────────────────────────
      addSectionHeader(
        "IX. EPRESS (Essential Package for Referral & Extended Services)",
      );
      addField(
        "Status",
        consultation.epress.enabled === true
          ? "Enabled"
          : consultation.epress.enabled === false
            ? "Not Enabled"
            : "Not Specified",
      );

      if (
        consultation.epress.enabled &&
        consultation.epress.medicines.length > 0
      ) {
        yPos += 2;
        checkPage(40);

        const epressTableWidth = pageWidth - 2 * margin;
        const epressColWidths = [
          epressTableWidth * 0.05,
          epressTableWidth * 0.23,
          epressTableWidth * 0.23,
          epressTableWidth * 0.18,
          epressTableWidth * 0.21,
          epressTableWidth * 0.1,
        ];

        // Table header
        const epressHeaders = [
          "#",
          "Generic Name",
          "Brand Name",
          "Formulation",
          "Signa",
          "Quantity",
        ];
        let xPos = margin;
        doc.setDrawColor(100, 100, 100);
        doc.setFillColor(240, 240, 240);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        epressHeaders.forEach((header, idx) => {
          doc.rect(xPos, yPos, epressColWidths[idx], rowHeight, "FD");
          doc.text(header, xPos + 1, yPos + 4);
          xPos += epressColWidths[idx];
        });
        yPos += rowHeight;

        // Table rows
        consultation.epress.medicines.forEach(
          (
            med: {
              genericName: any;
              brandName: any;
              formulation: any;
              signa: any;
              quantity: any;
            },
            idx: number,
          ) => {
            checkPage(15);
            const rowData = [
              (idx + 1).toString(),
              med.genericName || "N/A",
              med.brandName || "N/A",
              med.formulation || "N/A",
              med.signa || "N/A",
              med.quantity || "N/A",
            ];

            xPos = margin;
            doc.setFont("helvetica", "normal");
            doc.setDrawColor(100, 100, 100);

            const maxLines = Math.max(
              ...rowData.map(
                (cell, cellIdx) =>
                  doc.splitTextToSize(cell, epressColWidths[cellIdx] - 2)
                    .length,
              ),
            );
            const cellHeight = Math.max(rowHeight, maxLines * 4 + 2);

            rowData.forEach((cell, cellIdx) => {
              doc.rect(xPos, yPos, epressColWidths[cellIdx], cellHeight);
              const lines = doc.splitTextToSize(
                cell,
                epressColWidths[cellIdx] - 2,
              );
              lines.forEach((line: string, lineIdx: number) => {
                doc.text(line, xPos + 1, yPos + 4 + lineIdx * 4);
              });
              xPos += epressColWidths[cellIdx];
            });

            yPos += cellHeight;
          },
        );
      }

      yPos += 3;

      // ── X. Doctor & Remarks ───────────────────────────────────────
      addSectionHeader("X. Attending Physician & Remarks");
      addField("Attending Physician", consultation.doctor || "N/A", true);
      addField("Remarks", consultation.remarks || "N/A", true);
      yPos += 3;

      // ── Signature block ───────────────────────────────────────────
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
      doc.text("License No.: _______________", margin + 10, yPos + 9);
      doc.text("Date: _______________", margin + 10, yPos + 14);

      doc.line(pageWidth - margin - 70, yPos, pageWidth - margin - 10, yPos);
      doc.text(
        "Patient / Guardian Signature",
        pageWidth - margin - 70,
        yPos + 4,
      );
      doc.text("Date: _______________", pageWidth - margin - 70, yPos + 9);

      // ── Footer on every page ──────────────────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
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
          `Consultation: ${consultation.id}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" },
        );
      }

      doc.save(
        `Consultation_${consultation.id}_${consultation.patientName.replace(/\s/g, "_")}.pdf`,
      );
    } catch (error) {
      console.error("Error generating consultation PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`Consultation Details - ${consultation.id}`}
        subtitle={`Patient: ${consultation.patientName} • Date: ${new Date(consultation.consultationDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
      />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/fpe/${caseNumber}/consultations`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Consultation Records
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                navigate(
                  `/fpe/${caseNumber}/consultations/${consultationId}/edit/0`,
                )
              }
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              <Edit size={20} />
              Edit Consultation
            </button>
            <button
              onClick={() =>
                navigate(
                  `/fpe/${caseNumber}/consultations/${consultationId}/documents`,
                )
              }
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <FileText size={20} />
              Consultation Files
            </button>
            <button
              onClick={handleDownloadConsultation}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Download size={20} />
              Download Consultation
            </button>
          </div>
        </div>

        {/* Consultation Header */}
        <div className="bg-white border-2 border-gray-900 mb-6">
          <div className="border-b-2 border-gray-900 bg-gray-50 px-8 py-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                CONSULTATION RECORD
              </h1>
              <p className="text-sm text-gray-600">
                Medical Consultation Details
              </p>
            </div>
          </div>

          <div className="px-8 py-6 grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Consultation ID:
              </span>
              <span className="text-gray-900 font-medium">
                {consultation.id}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Case Number:
              </span>
              <span className="text-gray-900 font-medium">
                {consultation.caseNumber}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">
                Patient Name:
              </span>
              <span className="text-gray-900 font-medium uppercase">
                {consultation.patientName}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">Date:</span>
              <span className="text-gray-900 font-medium">
                {new Date(consultation.consultationDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">Age:</span>
              <span className="text-gray-900 font-medium">
                {consultation.age} years old
              </span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-40">Gender:</span>
              <span className="text-gray-900 font-medium">
                {consultation.gender}
              </span>
            </div>
          </div>
        </div>

        {/* Consultation Details */}
        <div className="bg-white border-2 border-gray-900 p-8 space-y-8">
          {/* Main Complaint */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
              Main Complaint
            </h2>
            <p className="text-gray-900">
              {consultation.mainComplaint || "N/A"}
            </p>
          </section>

          {/* Vital Signs */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
              Vital Signs
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Temperature (°C)</p>
                <p className="font-semibold text-gray-900">
                  {consultation.vitalSigns.temperature || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Respiratory Rate</p>
                <p className="font-semibold text-gray-900">
                  {consultation.vitalSigns.respiratoryRate || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cardiac Rate</p>
                <p className="font-semibold text-gray-900">
                  {consultation.vitalSigns.cardiacRate || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Blood Pressure</p>
                <p className="font-semibold text-gray-900">
                  {consultation.vitalSigns.bloodPressure || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Weight (kg)</p>
                <p className="font-semibold text-gray-900">
                  {consultation.vitalSigns.weight || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Height (cm)</p>
                <p className="font-semibold text-gray-900">
                  {consultation.vitalSigns.height || "N/A"}
                </p>
              </div>
            </div>
          </section>

          {/* Physical Examination */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
              Pertinent Physical Examination
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  HEENT
                </p>
                <p className="text-gray-900">
                  {consultation.physicalExam.heent.length > 0
                    ? consultation.physicalExam.heent.join(", ")
                    : "None"}
                </p>
                {consultation.physicalExam.heent.includes("Others") &&
                  consultation.physicalExam.heentOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {consultation.physicalExam.heentOthers}
                    </p>
                  )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Chest/Breast/Lungs
                </p>
                <p className="text-gray-900">
                  {consultation.physicalExam.chestBreastLungs.length > 0
                    ? consultation.physicalExam.chestBreastLungs.join(", ")
                    : "None"}
                </p>
                {consultation.physicalExam.chestBreastLungs.includes(
                  "Others",
                ) &&
                  consultation.physicalExam.chestBreastLungsOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {consultation.physicalExam.chestBreastLungsOthers}
                    </p>
                  )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Heart
                </p>
                <p className="text-gray-900">
                  {consultation.physicalExam.heart.length > 0
                    ? consultation.physicalExam.heart.join(", ")
                    : "None"}
                </p>
                {consultation.physicalExam.heart.includes("Others") &&
                  consultation.physicalExam.heartOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {consultation.physicalExam.heartOthers}
                    </p>
                  )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Abdomen
                </p>
                <p className="text-gray-900">
                  {consultation.physicalExam.abdomen.length > 0
                    ? consultation.physicalExam.abdomen.join(", ")
                    : "None"}
                </p>
                {consultation.physicalExam.abdomen.includes("Others") &&
                  consultation.physicalExam.abdomenOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {consultation.physicalExam.abdomenOthers}
                    </p>
                  )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Genitourinary
                </p>
                <p className="text-gray-900">
                  {consultation.physicalExam.genitourinary.length > 0
                    ? consultation.physicalExam.genitourinary.join(", ")
                    : "None"}
                </p>
                {consultation.physicalExam.genitourinary.includes("Others") &&
                  consultation.physicalExam.genitourinaryOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {consultation.physicalExam.genitourinaryOthers}
                    </p>
                  )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Digital Rectal
                </p>
                <p className="text-gray-900">
                  {consultation.physicalExam.digitalRectal.length > 0
                    ? consultation.physicalExam.digitalRectal.join(", ")
                    : "None"}
                </p>
                {consultation.physicalExam.digitalRectal.includes("Others") &&
                  consultation.physicalExam.digitalRectalOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {consultation.physicalExam.digitalRectalOthers}
                    </p>
                  )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Skin/Extremities
                </p>
                <p className="text-gray-900">
                  {consultation.physicalExam.skinExtremities.length > 0
                    ? consultation.physicalExam.skinExtremities.join(", ")
                    : "None"}
                </p>
                {consultation.physicalExam.skinExtremities.includes("Others") &&
                  consultation.physicalExam.skinExtremitiesOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {consultation.physicalExam.skinExtremitiesOthers}
                    </p>
                  )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Neurological
                </p>
                <p className="text-gray-900">
                  {consultation.physicalExam.neurological.length > 0
                    ? consultation.physicalExam.neurological.join(", ")
                    : "None"}
                </p>
                {consultation.physicalExam.neurological.includes("Others") &&
                  consultation.physicalExam.neurologicalOthers && (
                    <p className="text-sm text-gray-600 mt-1">
                      Others: {consultation.physicalExam.neurologicalOthers}
                    </p>
                  )}
              </div>
            </div>
          </section>

          {/* PCU */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
              PCU
            </h2>
            <p className="text-gray-900 font-semibold">
              {consultation.pcu || "Not specified"}
            </p>
          </section>

          {/* Diagnosis */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
              Diagnosis
            </h2>
            <p className="text-gray-900">{consultation.diagnosis || "N/A"}</p>
          </section>

          {/* Plan */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
              Plan
            </h2>
            <p className="text-gray-900">{consultation.plan || "N/A"}</p>
          </section>

          {/* Medicines */}
          {consultation.medicines.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
                Medicines Prescribed
              </h2>
              <div className="space-y-4">
                {consultation.medicines.map(
                  (
                    medicine: {
                      id: Key | null | undefined;
                      genericName: any;
                      brandName: any;
                      formulation: any;
                      signa: any;
                      quantity: any;
                    },
                    index: number,
                  ) => (
                    <div
                      key={medicine.id}
                      className="bg-gray-50 border border-gray-300 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Medicine {index + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-600">Generic Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {medicine.genericName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Brand Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {medicine.brandName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Formulation</p>
                          <p className="text-sm font-medium text-gray-900">
                            {medicine.formulation || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Signa</p>
                          <p className="text-sm font-medium text-gray-900">
                            {medicine.signa || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Quantity</p>
                          <p className="text-sm font-medium text-gray-900">
                            {medicine.quantity || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {/* Laboratory Tests */}
          {consultation.laboratories.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
                Laboratory Tests
              </h2>
              <div className="space-y-4">
                {consultation.laboratories.map(
                  (
                    lab: {
                      id: Key | null | undefined;
                      testName: any;
                      testResults: any;
                      summary: any;
                    },
                    index: number,
                  ) => (
                    <div
                      key={lab.id}
                      className="bg-gray-50 border border-gray-300 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Test {index + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-600">Test Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {lab.testName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Test Results</p>
                          <p className="text-sm font-medium text-gray-900">
                            {lab.testResults || "N/A"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-600">Summary</p>
                          <p className="text-sm font-medium text-gray-900">
                            {lab.summary || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {/* Doctor & Remarks */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
              Doctor & Remarks
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Attending Physician</p>
                <p className="font-semibold text-gray-900">
                  {consultation.doctor || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remarks</p>
                <p className="text-gray-900">{consultation.remarks || "N/A"}</p>
              </div>
            </div>
          </section>

          {/* EKAS & EPRESS */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
              EKAS & EPRESS
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">EKAS</p>
                <p className="text-gray-900">
                  {consultation.ekas.enabled === true
                    ? "Enabled"
                    : consultation.ekas.enabled === false
                      ? "Not Enabled"
                      : "Not Specified"}
                </p>
                {consultation.ekas.enabled &&
                  consultation.ekas.tests.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Tests: {consultation.ekas.tests.join(", ")}
                    </p>
                  )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  EPRESS
                </p>
                <p className="text-gray-900">
                  {consultation.epress.enabled === true
                    ? "Enabled"
                    : consultation.epress.enabled === false
                      ? "Not Enabled"
                      : "Not Specified"}
                </p>
                {consultation.epress.enabled &&
                  consultation.epress.medicines.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {consultation.epress.medicines.length} medicine(s)
                      prescribed
                    </p>
                  )}
              </div>
            </div>
          </section>

          {/* eKonsulta */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
              eKonsulta
            </h2>
            <p className="text-gray-900 font-semibold">
              {consultation.eKonsulta ? "Yes" : "No"}
            </p>
          </section>

          {/* Status */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
              Status
            </h2>
            <span
              className={`inline-flex px-4 py-2 text-sm font-semibold ${
                consultation.status === "Completed"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-yellow-100 text-yellow-800 border border-yellow-300"
              }`}
            >
              {consultation.status}
            </span>
          </section>
        </div>
      </div>
    </div>
  );
}
