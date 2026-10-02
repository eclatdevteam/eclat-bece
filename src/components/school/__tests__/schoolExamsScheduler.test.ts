import { describe, it, expect } from "vitest";

describe("School Exam Scheduler & Seating Roster Engine", () => {
  interface MockStudent {
    id: string;
    name: string;
    class_year: "year_6" | "year_9";
    class_id: string | null;
  }

  const sampleStudents: MockStudent[] = [
    { id: "s1", name: "Ada Okafor", class_year: "year_9", class_id: "class-9a" },
    { id: "s2", name: "Kwame Mensah", class_year: "year_9", class_id: "class-9b" },
    { id: "s3", name: "Chidi Eze", class_year: "year_9", class_id: "class-9a" },
    { id: "s4", name: "Fatima Bello", class_year: "year_6", class_id: "class-6a" },
  ];

  it("filters all candidates in the cohort when exam is school-wide", () => {
    const exam = { cohort: "year_9", class_id: null };
    const candidates = sampleStudents.filter((s) => {
      if (exam.class_id) return s.class_id === exam.class_id;
      return s.class_year === exam.cohort;
    });

    expect(candidates.length).toBe(3);
    expect(candidates.map((c) => c.name)).toEqual(["Ada Okafor", "Kwame Mensah", "Chidi Eze"]);
  });

  it("filters strictly by class arm when class_id is specified on exam", () => {
    const exam = { cohort: "year_9", class_id: "class-9a" };
    const candidates = sampleStudents.filter((s) => {
      if (exam.class_id) return s.class_id === exam.class_id;
      return s.class_year === exam.cohort;
    });

    expect(candidates.length).toBe(2);
    expect(candidates.map((c) => c.name)).toEqual(["Ada Okafor", "Chidi Eze"]);
  });

  it("allocates alphabetical sequential desk seat numbers", () => {
    const unsorted = [
      { name: "Zainab Aliyu" },
      { name: "Ada Okafor" },
      { name: "Bayo Balogun" },
    ];

    const sorted = [...unsorted].sort((a, b) => a.name.localeCompare(b.name));
    const seated = sorted.map((s, idx) => ({
      ...s,
      seatNumber: `Seat #${String(idx + 1).padStart(2, "0")}`,
    }));

    expect(seated[0].name).toBe("Ada Okafor");
    expect(seated[0].seatNumber).toBe("Seat #01");
    expect(seated[1].name).toBe("Bayo Balogun");
    expect(seated[1].seatNumber).toBe("Seat #02");
    expect(seated[2].name).toBe("Zainab Aliyu");
    expect(seated[2].seatNumber).toBe("Seat #03");
  });
});
