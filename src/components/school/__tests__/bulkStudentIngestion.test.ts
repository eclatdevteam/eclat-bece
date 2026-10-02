import { describe, it, expect } from "vitest";

describe("Bulk Student Ingestion Validation Engine", () => {
  const normalizeCohort = (val: string | undefined): "year_6" | "year_9" => {
    if (!val) return "year_9";
    const clean = val.toLowerCase().trim();
    if (clean.includes("6") || clean.includes("primary") || clean === "p6" || clean === "year 6") {
      return "year_6";
    }
    return "year_9";
  };

  const cleanUsername = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 20);
  };

  const autoGenerateUsername = (fullName: string, existingSet: Set<string>): string => {
    const parts = fullName.toLowerCase().trim().split(/\s+/);
    const baseUser = cleanUsername(parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0]);
    let candidate = baseUser.slice(0, 16);
    let counter = 1;
    while (existingSet.has(candidate)) {
      candidate = `${baseUser.slice(0, 14)}${counter}`;
      counter++;
    }
    return candidate;
  };

  it("accurately normalizes cohorts across various raw notations", () => {
    expect(normalizeCohort("JSS 3")).toBe("year_9");
    expect(normalizeCohort("Year 9")).toBe("year_9");
    expect(normalizeCohort("jss3")).toBe("year_9");
    expect(normalizeCohort("Primary 6")).toBe("year_6");
    expect(normalizeCohort("p6")).toBe("year_6");
    expect(normalizeCohort("Year 6")).toBe("year_6");
    expect(normalizeCohort("")).toBe("year_9");
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

  it("validates row data criteria correctly", () => {
    const validateRow = (row: { fullName: string; username?: string; password?: string }) => {
      const errors: string[] = [];
      if (!row.fullName || row.fullName.trim().length < 2) {
        errors.push("Full name must be at least 2 characters.");
      }
      if (row.username && (row.username.length < 2 || row.username.length > 20)) {
        errors.push("Username must be between 2 and 20 characters.");
      }
      if (row.password && row.password.length < 6) {
        errors.push("Password must be at least 6 characters.");
      }
      return errors;
    };

    expect(validateRow({ fullName: "A" }).length).toBe(1);
    expect(validateRow({ fullName: "Ada Okafor", password: "123" }).length).toBe(1);
    expect(validateRow({ fullName: "Ada Okafor", username: "a", password: "Password123!" }).length).toBe(1);
    expect(validateRow({ fullName: "Ada Okafor", username: "ada.okafor", password: "Password123!" }).length).toBe(0);
  });
});
