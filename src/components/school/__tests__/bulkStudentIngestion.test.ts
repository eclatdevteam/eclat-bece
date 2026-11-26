import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  normalizeCohort,
  cleanUsername,
  autoGenerateUsername,
  parseRawRosterRows,
} from "../bulkRosterParser";

describe("Bulk Student Ingestion Validation Engine", () => {
  const mockClasses = [
    { id: "class-1", name: "JSS 3A" },
    { id: "class-2", name: "JSS 3B" },
    { id: "class-3", name: "Primary 6 Gold" },
  ];

  it("accurately normalizes cohorts across various raw notations", () => {
    expect(normalizeCohort("JSS 3")).toBe("year_9");
    expect(normalizeCohort("Year 9")).toBe("year_9");
    expect(normalizeCohort("jss3")).toBe("year_9");
    expect(normalizeCohort("Primary 6")).toBe("year_6");
    expect(normalizeCohort("p6")).toBe("year_6");
    expect(normalizeCohort("Year 6")).toBe("year_6");
    expect(normalizeCohort("")).toBe("year_9");
    expect(normalizeCohort(null)).toBe("year_9");
    expect(normalizeCohort(undefined, "year_6")).toBe("year_6");
  });

  it("cleans and sanitizes username strings according to auth requirements", () => {
    expect(cleanUsername("Ada Okafor")).toBe("adaokafor");
    expect(cleanUsername("john_doe.123")).toBe("john_doe.123");
    expect(cleanUsername("Student@2026!#$")).toBe("student2026");
    expect(cleanUsername("a".repeat(30)).length).toBe(20);
  });

  it("auto-generates unique usernames from full names avoiding collisions", () => {
    const seen = new Set<string>(["ada.okafor"]);
    const user1 = autoGenerateUsername("Ada Okafor", seen);
    expect(user1).toBe("ada.okafor1");

    seen.add(user1);
    const user2 = autoGenerateUsername("Ada Okafor", seen);
    expect(user2).toBe("ada.okafor2");

    const user3 = autoGenerateUsername("Kwame Mensah", seen);
    expect(user3).toBe("kwame.mensah");
  });

  it("parses raw CSV rows correctly with class arm matching and auto credentials", () => {
    const csvData = [
      {
        "Full Name": "Ada Okafor",
        Cohort: "year_9",
        "Class Arm": "JSS 3A",
        Username: "ada.okafor",
        "Temporary Password": "Password123!",
      },
      {
        "Full Name": "Kwame Mensah",
        Cohort: "year_9",
        "Class Arm": "JSS 3B",
        Username: "",
        "Temporary Password": "",
      },
      {
        "Full Name": "Fatima Bello",
        Cohort: "Primary 6",
        "Class Arm": "Primary 6 Gold",
        Username: "fatima.bello",
        "Temporary Password": "Pass123!",
      },
    ];

    const results = parseRawRosterRows(csvData, mockClasses, "year_9");

    expect(results.length).toBe(3);

    // Row 1: Explicit username & password
    expect(results[0].fullName).toBe("Ada Okafor");
    expect(results[0].cohort).toBe("year_9");
    expect(results[0].classId).toBe("class-1");
    expect(results[0].classArmName).toBe("JSS 3A");
    expect(results[0].username).toBe("ada.okafor");
    expect(results[0].password).toBe("Password123!");
    expect(results[0].status).toBe("ready");
    expect(results[0].errors).toEqual([]);

    // Row 2: Auto generated username & password
    expect(results[1].fullName).toBe("Kwame Mensah");
    expect(results[1].cohort).toBe("year_9");
    expect(results[1].classId).toBe("class-2");
    expect(results[1].isAutoUsername).toBe(true);
    expect(results[1].username).toBe("kwame.mensah");
    expect(results[1].isAutoPassword).toBe(true);
    expect(results[1].password.startsWith("Eclat")).toBe(true);
    expect(results[1].status).toBe("ready");

    // Row 3: Cohort normalized to year_6
    expect(results[2].fullName).toBe("Fatima Bello");
    expect(results[2].cohort).toBe("year_6");
    expect(results[2].classId).toBe("class-3");
    expect(results[2].status).toBe("ready");
  });

  it("parses rows extracted from binary Excel workbooks (SheetJS format)", () => {
    // Construct an Excel workbook in memory using SheetJS
    const sampleExcelData = [
      {
        "Full Name": "Chidi Eze",
        Cohort: "JSS 3",
        "Class Arm": "JSS 3A",
        Username: "chidi.eze",
        "Temporary Password": "Password2026!",
      },
      {
        "Full Name": "Zainab Aliyu",
        Cohort: "Year 6",
        "Class Arm": "Primary 6 Gold",
        Username: "zainab.aliyu",
        "Temporary Password": "Password2026!",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleExcelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Write to array buffer and read back to simulate binary file drop
    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const readWorkbook = XLSX.read(excelBuffer, { type: "array" });
    const sheetName = readWorkbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(readWorkbook.Sheets[sheetName], {
      defval: "",
    });

    const parsed = parseRawRosterRows(rawRows, mockClasses);

    expect(parsed.length).toBe(2);
    expect(parsed[0].fullName).toBe("Chidi Eze");
    expect(parsed[0].cohort).toBe("year_9");
    expect(parsed[0].classId).toBe("class-1");
    expect(parsed[0].status).toBe("ready");

    expect(parsed[1].fullName).toBe("Zainab Aliyu");
    expect(parsed[1].cohort).toBe("year_6");
    expect(parsed[1].classId).toBe("class-3");
    expect(parsed[1].status).toBe("ready");
  });

  it("flags invalid names, duplicate usernames, and short passwords with error statuses", () => {
    const invalidRows = [
      {
        "Full Name": "A", // too short
        Username: "valid.user",
        Password: "Password123!",
      },
      {
        "Full Name": "Emeka Okonkwo",
        Username: "valid.user", // duplicate username
        Password: "123", // password too short
      },
    ];

    const parsed = parseRawRosterRows(invalidRows, mockClasses);

    expect(parsed.length).toBe(2);
    expect(parsed[0].status).toBe("error");
    expect(parsed[0].errors).toContain("Full name must be at least 2 characters.");
    expect(parsed[0].selected).toBe(false);

    expect(parsed[1].status).toBe("error");
    expect(parsed[1].errors).toContain('Duplicate username "@valid.user" detected in import list.');
    expect(parsed[1].errors).toContain("Password must be at least 6 characters.");
    expect(parsed[1].selected).toBe(false);
  });

  it("handles PapaParse CSV string parse pipeline correctly", () => {
    const csvText = `Full Name,Cohort,Class Arm,Username,Temporary Password\nAmara Diallo,year_9,JSS 3B,amara.diallo,SecurePass99!`;
    const parsedCsv = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: "greedy",
    });

    const parsed = parseRawRosterRows(parsedCsv.data, mockClasses);
    expect(parsed.length).toBe(1);
    expect(parsed[0].fullName).toBe("Amara Diallo");
    expect(parsed[0].cohort).toBe("year_9");
    expect(parsed[0].classArmName).toBe("JSS 3B");
    expect(parsed[0].classId).toBe("class-2");
    expect(parsed[0].username).toBe("amara.diallo");
    expect(parsed[0].password).toBe("SecurePass99!");
    expect(parsed[0].status).toBe("ready");
  });
});
