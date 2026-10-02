import { describe, it, expect } from "vitest";

describe("School Teacher Allocation & Directory Engine", () => {
  interface MockClass {
    id: string;
    name: string;
    lead_teacher: string | null;
  }

  interface MockTeacher {
    id: string;
    full_name: string;
    department: string | null;
    primary_subject: string | null;
    assigned_class_ids: string[];
  }

  const sampleClasses: MockClass[] = [
    { id: "c1", name: "JSS 3A", lead_teacher: "Mr. Babatunde Fashola" },
    { id: "c2", name: "JSS 3B", lead_teacher: "Mrs. Ngozi Okonjo" },
    { id: "c3", name: "Primary 6 Gold", lead_teacher: "Mr. Babatunde Fashola" },
  ];

  const registeredTeachers: MockTeacher[] = [
    {
      id: "t1",
      full_name: "Mr. Babatunde Fashola",
      department: "Mathematics & Numeracy",
      primary_subject: "Mathematics",
      assigned_class_ids: ["c1", "c3"],
    },
  ];

  it("resolves assigned class names accurately from assigned_class_ids", () => {
    const classMap = new Map(sampleClasses.map((c) => [c.id, c.name]));
    const teacher = registeredTeachers[0];

    const resolvedNames = teacher.assigned_class_ids
      .map((id) => classMap.get(id))
      .filter(Boolean);

    expect(resolvedNames).toEqual(["JSS 3A", "Primary 6 Gold"]);
  });

  it("merges unregistered class lead teachers seamlessly without duplicate entries", () => {
    const registeredNames = new Set(registeredTeachers.map((t) => t.full_name.toLowerCase()));
    const merged = [...registeredTeachers.map((t) => ({ ...t, assigned_classes: ["JSS 3A", "Primary 6 Gold"] }))];

    sampleClasses.forEach((c) => {
      if (c.lead_teacher && !registeredNames.has(c.lead_teacher.toLowerCase())) {
        merged.push({
          id: `virtual-${c.id}`,
          full_name: c.lead_teacher,
          department: "Class Arm Faculty",
          primary_subject: "Class Lead",
          assigned_class_ids: [c.id],
          assigned_classes: [c.name],
        });
        registeredNames.add(c.lead_teacher.toLowerCase());
      }
    });

    expect(merged.length).toBe(2);
    expect(merged.map((m) => m.full_name)).toContain("Mr. Babatunde Fashola");
    expect(merged.map((m) => m.full_name)).toContain("Mrs. Ngozi Okonjo");
  });

  it("filters faculty by department or search terms", () => {
    const faculty = [
      { name: "Dr. Kemi Balogun", department: "Sciences & Technology", subject: "Basic Science" },
      { name: "Mr. Babatunde Fashola", department: "Mathematics & Numeracy", subject: "Mathematics" },
      { name: "Mrs. Ngozi Okonjo", department: "Languages & English Studies", subject: "English Language" },
    ];

    const searchMath = faculty.filter(
      (f) =>
        f.name.toLowerCase().includes("math") ||
        f.department.toLowerCase().includes("math") ||
        f.subject.toLowerCase().includes("math")
    );

    expect(searchMath.length).toBe(1);
    expect(searchMath[0].name).toBe("Mr. Babatunde Fashola");
  });
});
