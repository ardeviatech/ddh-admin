import { createWorker } from "tesseract.js";

export interface ExtractedData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  birthdate?: string;
  gender?: string;
  birthPlace?: string;
  street?: string;
  barangay?: string;
  town?: string;
  provinceCity?: string;
  zipCode?: string;
  country?: string;
}

export interface OCRResult {
  data: ExtractedData;
  rawText: string;
}

function parseDate(text: string): string | null {
  // Date patterns including various formats
  const datePatterns = [
    // DD Mon YYYY (e.g., 15 Jan 1990, 20 NOV 1988)
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
    // Mon DD, YYYY (e.g., Jan 15, 1990)
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
    // DD/MM/YYYY or DD-MM-YYYY
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/,
    // YYYY/MM/DD or YYYY-MM-DD
    /(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/,
  ];

  const months: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Month name patterns
      if (pattern.source.includes("Jan|Feb")) {
        let month: string;
        let day: string;
        let year: string;

        if (isNaN(Number(match[1]))) {
          // Format: Mon DD, YYYY
          month = months[match[1].toLowerCase().slice(0, 3)];
          day = match[2].padStart(2, "0");
          year = match[3];
        } else {
          // Format: DD Mon YYYY
          day = match[1].padStart(2, "0");
          month = months[match[2].toLowerCase().slice(0, 3)];
          year = match[3];
        }

        return `${year}-${month}-${day}`;
      }
      // YYYY-MM-DD format
      else if (match[1].length === 4) {
        return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
      }
      // DD-MM-YYYY format
      else {
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        const year = match[3];
        return `${year}-${month}-${day}`;
      }
    }
  }
  return null;
}

function extractGender(text: string): string | null {
  const normalizedText = text.toUpperCase().trim();

  console.log(`Checking gender in text: "${text}"`);

  // Check for explicit gender labels with values
  const malePatterns = [
    /SEX[:\s/]+M($|\s|\/)/i,
    /GENDER[:\s/]+M($|\s|\/)/i,
    /SEX[:\s/]+MALE/i,
    /GENDER[:\s/]+MALE/i,
    /KASARIAN[:\s/]+M($|\s|\/)/i,
    /KASARIAN[:\s/]+LALAKI/i,
    /\bM\b\s*$/, // Just "M" at end of line
    /^M\b/, // Just "M" at start of line
  ];

  const femalePatterns = [
    /SEX[:\s/]+F($|\s|\/)/i,
    /GENDER[:\s/]+F($|\s|\/)/i,
    /SEX[:\s/]+FEMALE/i,
    /GENDER[:\s/]+FEMALE/i,
    /KASARIAN[:\s/]+F($|\s|\/)/i,
    /KASARIAN[:\s/]+BABAE/i,
    /\bF\b\s*$/, // Just "F" at end of line
    /^F\b/, // Just "F" at start of line
  ];

  for (const pattern of malePatterns) {
    if (pattern.test(normalizedText)) {
      console.log(`Matched male pattern: ${pattern}`);
      return "Male";
    }
  }

  for (const pattern of femalePatterns) {
    if (pattern.test(normalizedText)) {
      console.log(`Matched female pattern: ${pattern}`);
      return "Female";
    }
  }

  // Fallback: Check if line is exactly "M" or "F" (common in passports)
  if (normalizedText === "M") {
    console.log("Found standalone M");
    return "Male";
  }
  if (normalizedText === "F") {
    console.log("Found standalone F");
    return "Female";
  }

  return null;
}

function extractName(lines: string[]): {
  firstName?: string;
  lastName?: string;
  middleName?: string;
} {
  const result: { firstName?: string; lastName?: string; middleName?: string } =
    {};

  // Keywords for last name (with aliases)
  const lastNameKeywords = [
    "last name",
    "surname",
    "family name",
    "apellido",
    "apelyido",
    "apelyido/surname",
    "surname/apelyido",
  ];

  // Keywords for first name (with aliases)
  const firstNameKeywords = [
    "first name",
    "given name",
    "given names",
    "forename",
    "nombre",
    "pangalan",
    "pangalan/given name",
    "given name/pangalan",
    "pangalan/given names",
  ];

  // Keywords for middle name
  const middleNameKeywords = [
    "middle name",
    "middle initial",
    "gitnang pangalan",
    "gitnang pangalan/middle name",
    "middle name/gitnang pangalan",
  ];

  console.log("=== EXTRACTING NAMES ===");

  // For Philippine passports, look for specific patterns
  // Passport format:
  // Apelyido/Surname: LAST_NAME
  // Pangalan/Given Names: FIRST_NAME MIDDLE_NAME

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";

    // Extract Last Name / Surname
    if (!result.lastName) {
      for (const keyword of lastNameKeywords) {
        if (lowerLine.includes(keyword)) {
          console.log(
            `Found last name keyword: "${keyword}" in line: "${line}"`,
          );

          // For Philippine passports, the format is usually:
          // Apelyido/Surname
          // ACTUAL_SURNAME
          // So we should ALWAYS check the next line for the actual value

          let nameMatch: string | null = null;

          // First, try to get value from same line (after colon)
          const sameLine = line.split(/[:]/)[1]?.trim();

          if (sameLine && sameLine.length >= 2) {
            const sameLower = sameLine.toLowerCase();
            // Check if it's actually a value, not another label
            const isLabel =
              lastNameKeywords.some(
                (kw) => sameLower === kw || sameLower.includes(kw),
              ) ||
              sameLower === "surname" ||
              sameLower === "apelyido" ||
              sameLower.includes("/surname") ||
              sameLower.includes("/apelyido") ||
              sameLower.includes("name");

            if (!isLabel) {
              nameMatch = sameLine;
              console.log(`Found last name on same line: "${nameMatch}"`);
            } else {
              console.log(`Rejected same line (is a label): "${sameLine}"`);
            }
          }

          // If no valid match on same line, use next line
          if (!nameMatch && nextLine) {
            const nextLower = nextLine.toLowerCase();
            // Validate next line is not a label
            const isLabel =
              lastNameKeywords.some((kw) => nextLower.includes(kw)) ||
              firstNameKeywords.some((kw) => nextLower.includes(kw)) ||
              nextLower.includes("pangalan") ||
              nextLower.includes("name") ||
              nextLower.includes("given");

            if (!isLabel) {
              nameMatch = nextLine;
              console.log(`Using next line for last name: "${nameMatch}"`);
            } else {
              console.log(`Rejected next line (is a label): "${nextLine}"`);
            }
          }

          // Clean and validate the name
          if (nameMatch && nameMatch.length > 1) {
            // Remove special characters but keep letters, spaces, hyphens, apostrophes
            const cleaned = nameMatch.replace(/[^A-Za-z\s\-'.]/g, "").trim();

            // Validate it looks like a name (at least 2 characters, mostly letters)
            if (
              cleaned.length >= 2 &&
              /^[A-Za-z][A-Za-z\s\-'.]*$/.test(cleaned)
            ) {
              result.lastName = cleaned
                .split(/\s+/)
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                )
                .join(" ");
              console.log(`✓ Extracted last name: "${result.lastName}"`);
              break;
            }
          }
        }
      }
    }

    // Extract First Name / Given Name
    // Philippine passports have "Pangalan/Given Names" which is the first name
    // Middle name is separate as "Gitnang Pangalan/Middle Name"
    if (!result.firstName) {
      for (const keyword of firstNameKeywords) {
        if (lowerLine.includes(keyword)) {
          console.log(
            `Found first name keyword: "${keyword}" in line: "${line}"`,
          );

          let nameMatch: string | null = null;

          // Try same line first (after colon)
          const sameLine = line.split(/[:]/)[1]?.trim();

          if (sameLine && sameLine.length >= 2) {
            const sameLower = sameLine.toLowerCase();
            const isLabel =
              firstNameKeywords.some(
                (kw) => sameLower === kw || sameLower.includes(kw),
              ) ||
              sameLower === "given" ||
              sameLower === "pangalan" ||
              sameLower.includes("/given") ||
              sameLower.includes("/pangalan") ||
              sameLower.includes("name");

            if (!isLabel) {
              nameMatch = sameLine;
              console.log(`Found first name on same line: "${nameMatch}"`);
            } else {
              console.log(`Rejected same line (is a label): "${sameLine}"`);
            }
          }

          // If no valid match, use next line
          if (!nameMatch && nextLine) {
            const nextLower = nextLine.toLowerCase();
            const isLabel =
              lastNameKeywords.some((kw) => nextLower.includes(kw)) ||
              firstNameKeywords.some((kw) => nextLower.includes(kw)) ||
              middleNameKeywords.some((kw) => nextLower.includes(kw)) ||
              nextLower.includes("pangalan") ||
              nextLower.includes("name") ||
              nextLower.includes("surname");

            if (!isLabel) {
              nameMatch = nextLine;
              console.log(`Using next line for first name: "${nameMatch}"`);
            } else {
              console.log(`Rejected next line (is a label): "${nextLine}"`);
            }
          }

          if (nameMatch && nameMatch.length > 1) {
            const cleaned = nameMatch.replace(/[^A-Za-z\s\-'.]/g, "").trim();

            if (
              cleaned.length >= 2 &&
              /^[A-Za-z][A-Za-z\s\-'.]*$/.test(cleaned)
            ) {
              result.firstName = cleaned
                .split(/\s+/)
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                )
                .join(" ");

              console.log(`✓ Extracted first name: "${result.firstName}"`);
              break;
            }
          }
        }
      }
    }

    // Extract Middle Name
    if (!result.middleName) {
      for (const keyword of middleNameKeywords) {
        if (lowerLine.includes(keyword)) {
          console.log(
            `Found middle name keyword: "${keyword}" in line: "${line}"`,
          );

          let nameMatch: string | null = null;

          // Try same line first
          const sameLine = line.split(/[:]/)[1]?.trim();

          if (sameLine && sameLine.length >= 1) {
            const sameLower = sameLine.toLowerCase();
            const isLabel =
              middleNameKeywords.some(
                (kw) => sameLower === kw || sameLower.includes(kw),
              ) ||
              sameLower === "middle" ||
              sameLower === "gitnang" ||
              sameLower.includes("/middle") ||
              sameLower.includes("/gitnang") ||
              sameLower.includes("name") ||
              sameLower.includes("pangalan");

            if (!isLabel) {
              nameMatch = sameLine;
              console.log(`Found middle name on same line: "${nameMatch}"`);
            } else {
              console.log(`Rejected same line (is a label): "${sameLine}"`);
            }
          }

          // If no valid match, use next line
          if (!nameMatch && nextLine) {
            const nextLower = nextLine.toLowerCase();
            const isLabel =
              lastNameKeywords.some((kw) => nextLower.includes(kw)) ||
              firstNameKeywords.some((kw) => nextLower.includes(kw)) ||
              middleNameKeywords.some((kw) => nextLower.includes(kw)) ||
              nextLower.includes("pangalan") ||
              nextLower.includes("name") ||
              nextLower.includes("surname") ||
              nextLower.includes("given");

            if (!isLabel) {
              nameMatch = nextLine;
              console.log(`Using next line for middle name: "${nameMatch}"`);
            } else {
              console.log(`Rejected next line (is a label): "${nextLine}"`);
            }
          }

          if (nameMatch && nameMatch.length >= 1) {
            const cleaned = nameMatch.replace(/[^A-Za-z\s\-'.]/g, "").trim();

            if (
              cleaned.length >= 1 &&
              /^[A-Za-z][A-Za-z\s\-'.]*$/.test(cleaned)
            ) {
              result.middleName = cleaned
                .split(/\s+/)
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                )
                .join(" ");
              console.log(`✓ Extracted middle name: "${result.middleName}"`);
              break;
            }
          }
        }
      }
    }

    // Fallback: Detect "LASTNAME, FIRSTNAME MIDDLENAME" format (NOT for passports)
    // Skip this for passport formats as they have separate fields
    const hasPassportFormat = lines.some(
      (l) =>
        l.toLowerCase().includes("pangalan") ||
        l.toLowerCase().includes("apelyido") ||
        l.toLowerCase().includes("gitnang"),
    );

    if (
      !hasPassportFormat &&
      !result.firstName &&
      !result.lastName &&
      /^[A-Z][A-Z\s]+,\s*[A-Z][A-Z\s]+/.test(line)
    ) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        result.lastName = parts[0]
          .split(/\s+/)
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ");

        const givenNames = parts[1].split(/\s+/);
        result.firstName = givenNames
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ");
      }
    }
  }

  console.log("=== NAME EXTRACTION RESULT ===");
  console.log("Last Name:", result.lastName || "Not found");
  console.log("First Name:", result.firstName || "Not found");
  console.log("Middle Name:", result.middleName || "Not found");
  console.log("=== END NAME EXTRACTION ===");

  return result;
}

function extractAddress(lines: string[]): {
  street?: string;
  barangay?: string;
  town?: string;
  provinceCity?: string;
  zipCode?: string;
  country?: string;
} {
  const result: any = {};

  const addressKeywords = [
    "address",
    "residence",
    "permanent address",
    "residential address",
    "tirahan",
  ];
  const barangayKeywords = ["barangay", "brgy", "brgy."];
  const townKeywords = ["municipality", "city", "town", "bayan", "lungsod"];
  const provinceKeywords = ["province", "lalawigan"];
  const countryKeywords = [
    "nationality",
    "country",
    "nation",
    "bansa",
    "philippines",
    "phil.",
    "phl",
    "ph",
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();

    // Extract Address
    if (!result.street) {
      for (const keyword of addressKeywords) {
        if (lowerLine.includes(keyword)) {
          const addressMatch = line.split(/[:]/)[1]?.trim();
          if (addressMatch) {
            const parts = addressMatch.split(",").map((p) => p.trim());
            if (parts.length > 0 && parts[0].length > 2)
              result.street = parts[0];
            if (parts.length > 1 && parts[1].length > 2)
              result.barangay = parts[1];
            if (parts.length > 2 && parts[2].length > 2) result.town = parts[2];
            if (parts.length > 3 && parts[3].length > 2)
              result.provinceCity = parts[3];
            break;
          }
        }
      }
    }

    // Extract Barangay
    if (!result.barangay) {
      for (const keyword of barangayKeywords) {
        if (lowerLine.includes(keyword)) {
          const match =
            line.split(/[:]/)[1]?.trim() ||
            line.replace(new RegExp(keyword, "gi"), "").trim();
          if (match && match.length > 2) {
            result.barangay = match;
            break;
          }
        }
      }
    }

    // Extract Town/City
    if (!result.town) {
      for (const keyword of townKeywords) {
        if (lowerLine.includes(keyword)) {
          const match = line.split(/[:]/)[1]?.trim();
          if (match && match.length > 2) {
            result.town = match;
            break;
          }
        }
      }
    }

    // Extract Province
    if (!result.provinceCity) {
      for (const keyword of provinceKeywords) {
        if (lowerLine.includes(keyword)) {
          const match = line.split(/[:]/)[1]?.trim();
          if (match && match.length > 2) {
            result.provinceCity = match;
            break;
          }
        }
      }
    }

    // Extract Zip Code
    const zipMatch = line.match(/\b\d{4}\b/);
    if (zipMatch && !result.zipCode) {
      result.zipCode = zipMatch[0];
    }

    // Extract Country/Nationality
    if (!result.country) {
      for (const keyword of countryKeywords) {
        if (lowerLine.includes(keyword)) {
          // For "Philippines" or variants, standardize to "Philippines"
          if (
            lowerLine.includes("philippines") ||
            lowerLine.includes("phil") ||
            lowerLine.includes("phl") ||
            lowerLine.includes("filipino")
          ) {
            result.country = "Philippines";
            break;
          }

          // For other countries, extract the value
          const match = line.split(/[:]/)[1]?.trim();
          if (match && match.length > 2) {
            result.country = match;
            break;
          }
        }
      }
    }
  }

  return result;
}

export async function extractDataFromID(file: File): Promise<OCRResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type. Please upload an image.");
  }

  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  try {
    // Configure Tesseract for better accuracy with automatic orientation detection
    await worker.setParameters({
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,/-:()",
      tessedit_pageseg_mode: 1 as any, // Automatic page segmentation with OSD (Orientation and Script Detection)
      tessedit_ocr_engine_mode: 1, // LSTM OCR Engine Mode (better for modern documents)
    });

    // First attempt: Try to recognize with automatic orientation detection
    let result = await worker.recognize(file);
    let text = result.data.text;
    const rotation =
      (result.data as any).rotateRadians ??
      (result.data as any).rotate_radians ??
      0;

    console.log(`=== OCR METADATA ===`);
    console.log(
      `Detected rotation: ${rotation} radians (${((rotation * 180) / Math.PI).toFixed(2)} degrees)`,
    );
    console.log(`Confidence: ${result.data.confidence}%`);

    // If confidence is low, try with different page segmentation modes
    if (result.data.confidence < 60) {
      console.log("Low confidence detected, trying alternative PSM mode...");
      await worker.setParameters({
        tessedit_pageseg_mode: 3 as any, // Fully automatic page segmentation
      });
      result = await worker.recognize(file);
      text = result.data.text;
      console.log(`Retry confidence: ${result.data.confidence}%`);
    }

    console.log("=== OCR RAW EXTRACTED TEXT ===");
    console.log(text);
    console.log("=== END RAW TEXT ===");

    await worker.terminate();

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    console.log("=== PROCESSED LINES ===");
    lines.forEach((line, index) => console.log(`Line ${index + 1}: ${line}`));
    console.log("=== END LINES ===");

    const extractedData: ExtractedData = {};

    const names = extractName(lines);
    if (names.firstName) extractedData.firstName = names.firstName;
    if (names.lastName) extractedData.lastName = names.lastName;
    if (names.middleName) extractedData.middleName = names.middleName;

    // Keywords for birthdate
    const birthdateKeywords = [
      "date of birth",
      "birth date",
      "birthdate",
      "dob",
      "born",
      "date birth",
      "petsa ng kapanganakan",
      "petsa ng kapanganakan/date of birth",
    ];

    console.log("=== EXTRACTING BIRTHDATE ===");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";

      // Extract birthdate with context
      if (!extractedData.birthdate) {
        for (const keyword of birthdateKeywords) {
          if (lowerLine.includes(keyword)) {
            console.log(
              `Found birthdate keyword: "${keyword}" in line: "${line}"`,
            );

            // Try to extract date from same line after colon or slash
            let dateText: string | null = line.split(/[:/]/)[1]?.trim() || null;

            // Validate it's not another label
            if (dateText) {
              const dateTextLower = dateText.toLowerCase();
              const hasLabelKeywords =
                birthdateKeywords.some((kw) => dateTextLower.includes(kw)) ||
                dateTextLower.includes("place") ||
                dateTextLower.includes("lugar") ||
                dateTextLower.includes("sex") ||
                dateTextLower.includes("kasarian");

              if (hasLabelKeywords) {
                console.log(
                  `Rejected - contains label keywords: "${dateText}"`,
                );
                dateText = null;
              }
            }

            // If no colon separator or rejected, check next line
            if (!dateText) {
              dateText = nextLine;
              console.log(`Checking next line for birthdate: "${dateText}"`);

              // Validate next line is not a label
              if (dateText) {
                const dateTextLower = dateText.toLowerCase();
                const hasLabelKeywords =
                  birthdateKeywords.some((kw) => dateTextLower.includes(kw)) ||
                  dateTextLower.includes("place") ||
                  dateTextLower.includes("lugar") ||
                  dateTextLower.includes("sex") ||
                  dateTextLower.includes("kasarian");

                if (hasLabelKeywords) {
                  console.log(
                    `Rejected next line - contains label keywords: "${dateText}"`,
                  );
                  dateText = null;
                }
              }
            }

            if (dateText) {
              console.log(`Attempting to parse date from: "${dateText}"`);
              const date = parseDate(dateText);
              if (date) {
                const year = parseInt(date.split("-")[0]);
                console.log(`Parsed date: ${date}, year: ${year}`);
                if (year >= 1900 && year <= new Date().getFullYear()) {
                  extractedData.birthdate = date;
                  console.log(`Extracted birthdate: ${date}`);
                  break;
                }
              } else {
                console.log(`Could not parse date from: "${dateText}"`);
              }
            }
          }
        }

        // Fallback: search for dates in all lines if not found with keywords
        if (!extractedData.birthdate) {
          const date = parseDate(line);
          if (date) {
            const year = parseInt(date.split("-")[0]);
            if (year >= 1900 && year <= new Date().getFullYear() - 10) {
              // At least 10 years old
              console.log(`Found date in line without keyword: ${date}`);
              extractedData.birthdate = date;
            }
          }
        }
      }

      // Extract gender - check current line and adjacent lines
      if (!extractedData.gender) {
        const gender = extractGender(line);
        if (gender) {
          console.log(`Extracted gender: ${gender} from line: "${line}"`);
          extractedData.gender = gender;
        }

        // Also check if this line contains "sex" or "kasarian" and next line has M/F
        if (
          !extractedData.gender &&
          (lowerLine.includes("sex") || lowerLine.includes("kasarian"))
        ) {
          const nextGender = extractGender(nextLine);
          if (nextGender) {
            console.log(
              `Extracted gender: ${nextGender} from next line after sex keyword: "${nextLine}"`,
            );
            extractedData.gender = nextGender;
          }
        }
      }
    }

    console.log(
      "Birthdate extraction result:",
      extractedData.birthdate || "Not found",
    );
    console.log(
      "Gender extraction result:",
      extractedData.gender || "Not found",
    );

    // Extract birth place
    const birthPlaceKeywords = [
      "place of birth",
      "birth place",
      "birthplace",
      "pob",
      "lugar ng kapanganakan",
    ];

    console.log("=== EXTRACTING BIRTH PLACE ===");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";

      if (!extractedData.birthPlace) {
        for (const keyword of birthPlaceKeywords) {
          if (lowerLine.includes(keyword)) {
            console.log(
              `Found birth place keyword: "${keyword}" in line: "${line}"`,
            );

            let placeMatch: string | null = null;

            // Try same line first (after colon)
            const sameLine = line.split(/[:]/)[1]?.trim();

            if (sameLine && sameLine.length >= 2) {
              const sameLower = sameLine.toLowerCase();
              const isLabel =
                birthPlaceKeywords.some(
                  (kw) => sameLower === kw || sameLower.includes(kw),
                ) ||
                sameLower.includes("sex") ||
                sameLower.includes("kasarian") ||
                sameLower.includes("gender") ||
                sameLower.includes("name") ||
                sameLower.includes("pangalan") ||
                sameLower.includes("place") ||
                sameLower.includes("lugar") ||
                sameLower.includes("/place") ||
                sameLower.includes("/lugar");

              if (!isLabel) {
                placeMatch = sameLine;
                console.log(`Found birth place on same line: "${placeMatch}"`);
              } else {
                console.log(`Rejected same line (is a label): "${sameLine}"`);
              }
            }

            // If no valid value, use next line
            if (!placeMatch && nextLine) {
              const nextLower = nextLine.toLowerCase();
              const isLabel =
                birthPlaceKeywords.some((kw) => nextLower.includes(kw)) ||
                birthdateKeywords.some((kw) => nextLower.includes(kw)) ||
                nextLower.includes("sex") ||
                nextLower.includes("kasarian") ||
                nextLower.includes("gender") ||
                nextLower.includes("date") ||
                nextLower.includes("petsa") ||
                nextLower.includes("name") ||
                nextLower.includes("pangalan");

              if (!isLabel) {
                placeMatch = nextLine;
                console.log(`Using next line for birth place: "${placeMatch}"`);
              } else {
                console.log(`Rejected next line (is a label): "${nextLine}"`);
              }
            }

            if (placeMatch && placeMatch.length >= 2) {
              // Clean the birth place value - remove special chars but keep letters, spaces, commas, hyphens
              const cleaned = placeMatch.replace(/[^A-Za-z\s,\-.]/g, "").trim();

              if (cleaned.length >= 2) {
                // Expand common abbreviations and fix OCR errors
                let expanded = cleaned
                  // Nueva Vizcaya variations
                  .replace(/\bN\s+VIZ\b/gi, ", Nueva Vizcaya")
                  .replace(/\bN\.?\s*VIZ\.?\b/gi, ", Nueva Vizcaya")
                  .replace(/\bNUEVA\s+VIZ\b/gi, ", Nueva Vizcaya")
                  .replace(/\bNVA\s+VIZ\b/gi, ", Nueva Vizcaya")
                  // Bambang variations (should come before province)
                  .replace(/\bBANBANG\b/gi, "Bambang")
                  .replace(/\bBANHANG\b/gi, "Bambang")
                  .replace(/\bBAMBANG\b/gi, "Bambang")
                  .replace(/\bBANBAHG\b/gi, "Bambang")
                  // Common city abbreviations
                  .replace(/\bMNL\b/gi, "Manila")
                  .replace(/\bQC\b/gi, "Quezon City")
                  .replace(/\bCEB\b/gi, "Cebu")
                  .replace(/\bDAV\b/gi, "Davao")
                  .replace(/\bILO\b/gi, "Iloilo")
                  // Common province abbreviations
                  .replace(/\bCAV\b/gi, "Cavite")
                  .replace(/\bLAG\b/gi, "Laguna")
                  .replace(/\bBUL\b/gi, "Bulacan")
                  .replace(/\bPAMP\b/gi, "Pampanga")
                  // Clean up extra commas
                  .replace(/,\s*,/g, ",")
                  .replace(/^,\s*/, "");

                extractedData.birthPlace = expanded
                  .split(/\s+/)
                  .map((word) => {
                    // Keep special handling for province names
                    if (
                      word.toLowerCase() === "vizcaya" ||
                      word.toLowerCase() === "nueva"
                    ) {
                      return (
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                      );
                    }
                    return (
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    );
                  })
                  .join(" ");

                console.log(
                  `Extracted birth place: "${extractedData.birthPlace}"`,
                );
                break;
              }
            }
          }
        }
      }
    }

    console.log(
      "Birth place extraction result:",
      extractedData.birthPlace || "Not found",
    );

    const address = extractAddress(lines);
    if (address.street) extractedData.street = address.street;
    if (address.barangay) extractedData.barangay = address.barangay;
    if (address.town) extractedData.town = address.town;
    if (address.provinceCity) extractedData.provinceCity = address.provinceCity;
    if (address.zipCode) extractedData.zipCode = address.zipCode;
    if (address.country) extractedData.country = address.country;

    console.log("OCR Extracted Data:", extractedData);

    return {
      data: extractedData,
      rawText: text,
    };
  } catch (error) {
    await worker.terminate();
    throw new Error(
      "Failed to extract data from ID. Please fill in the form manually.",
    );
  }
}
