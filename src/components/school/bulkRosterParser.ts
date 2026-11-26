export interface ParsedStudentRow {
  rowId: string;
  fullName: string;
  cohort: "year_6" | "year_9";
  classArmName: string;
  classId: string | null;
  username: string;
  password: string;
  isAutoUsername: boolean;
  isAutoPassword: boolean;
  status: "ready" | "error";
  errors: string[];
  selected: boolean;
}

export interface ImportResult {
  rowId: string;
  fullName: string;
  username: string;
  password: string;
  cohort: string;
  classArm: string;
  success: boolean;
  error?: string;
}

// Helper to normalize cohort string
export const normalizeCohort = (
  val: string | undefined | null,
  defaultCohort: "year_6" | "year_9" = "year_9"
): "year_6" | "year_9" => {
  if (!val) return defaultCohort;
  const clean = String(val).toLowerCase().trim();
  if (clean.includes("6") || clean.includes("primary") || clean === "p6" || clean === "year 6") {
    return "year_6";
  }
  return "year_9";
};

// Helper to normalize username candidate
export const cleanUsername = (str: string): string => {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 20);
};

// Auto generate username without collisions
export const autoGenerateUsername = (fullName: string, seenUsernames: Set<string>): string => {
  const parts = String(fullName).toLowerCase().trim().split(/\s+/);
  const baseUser = cleanUsername(parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0]);
  let candidate = baseUser.slice(0, 16);
  let counter = 1;
  while (seenUsernames.has(candidate)) {
    candidate = `${baseUser.slice(0, 14)}${counter}`;
    counter++;
  }
  return candidate;
};

// Shared row parser supporting both Excel row objects and PapaParse row objects
export const parseRawRosterRows = (
  rawRows: Record<string, any>[],
  classes: Array<{ id: string; name: string }>,
  defaultCohort: "year_6" | "year_9" = "year_9",
  defaultClassId: string = "none"
): ParsedStudentRow[] => {
  const seenUsernames = new Set<string>();
  const rows: ParsedStudentRow[] = [];

  rawRows.forEach((row, index) => {
    // Flexible key lookup
    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        for (const [colKey, colVal] of Object.entries(row)) {
          if (colKey.trim().toLowerCase() === k.toLowerCase()) {
            return colVal !== undefined && colVal !== null ? String(colVal).trim() : "";
          }
        }
      }
      return "";
    };

    const rawName = getVal("Full Name", "fullName", "full_name", "name", "student name", "student_name", "student");
    const rawCohort = getVal("Cohort", "cohort", "classYear", "class_year", "level", "class year", "grade");
    const rawClass = getVal("Class Arm", "class_arm", "classArm", "class", "arm", "arm name", "section");
    const rawUsername = getVal("Username", "username", "user", "login");
    const rawPassword = getVal("Temporary Password", "Password", "password", "temp_password", "temp password");

    if (!rawName && !rawUsername) {
      // Empty or spacer row
      return;
    }

    const errors: string[] = [];

    // Validate Full Name
    if (!rawName || rawName.length < 2) {
      errors.push("Full name must be at least 2 characters.");
    } else if (rawName.length > 100) {
      errors.push("Full name must not exceed 100 characters.");
    }

    const cohort = normalizeCohort(rawCohort, defaultCohort);

    // Resolve class arm
    let matchedClassId: string | null = null;
    let matchedClassName = "";

    if (rawClass) {
      const foundClass = classes.find(
        (c) => c.name.toLowerCase() === rawClass.toLowerCase()
      );
      if (foundClass) {
        matchedClassId = foundClass.id;
        matchedClassName = foundClass.name;
      } else {
        matchedClassName = rawClass;
      }
    } else if (defaultClassId !== "none") {
      const foundClass = classes.find((c) => c.id === defaultClassId);
      if (foundClass) {
        matchedClassId = foundClass.id;
        matchedClassName = foundClass.name;
      }
    }

    // Resolve or auto-generate username
    let username = "";
    let isAutoUsername = false;

    if (rawUsername) {
      username = cleanUsername(rawUsername);
      if (username.length < 2 || username.length > 20) {
        errors.push("Username must be between 2 and 20 characters.");
      }
    } else if (rawName) {
      isAutoUsername = true;
      username = autoGenerateUsername(rawName, seenUsernames);
    }

    if (username) {
      if (seenUsernames.has(username)) {
        errors.push(`Duplicate username "@${username}" detected in import list.`);
      } else {
        seenUsernames.add(username);
      }
    } else {
      errors.push("Could not generate valid username.");
    }

    // Resolve or auto-generate password
    let password = "";
    let isAutoPassword = false;

    if (rawPassword) {
      password = rawPassword.trim();
      if (password.length < 6) {
        errors.push("Password must be at least 6 characters.");
      }
    } else {
      isAutoPassword = true;
      password = `Eclat${Math.floor(1000 + Math.random() * 9000)}!`;
    }

    rows.push({
      rowId: `row-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fullName: rawName,
      cohort,
      classArmName: matchedClassName,
      classId: matchedClassId,
      username,
      password,
      isAutoUsername,
      isAutoPassword,
      status: errors.length > 0 ? "error" : "ready",
      errors,
      selected: errors.length === 0,
    });
  });

  return rows;
};
