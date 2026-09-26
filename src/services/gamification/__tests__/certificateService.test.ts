import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateVerificationCode, verifyCertificateByCode, issueCertificate } from "../certificateService";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

describe("Certificate Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates correctly formatted verification codes", () => {
    const code = generateVerificationCode(2026);
    expect(code).toMatch(/^ECLAT-CERT-2026-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
  });

  it("verifies a valid certificate code successfully", async () => {
    const mockCert = {
      id: "cert-123",
      student_id: "student-456",
      certificate_type: "league_champion",
      title: "Certificate of National League Championship",
      description: "For reaching Éclat Champion",
      verification_code: "ECLAT-CERT-2026-X9Q2",
      issued_at: new Date().toISOString(),
      metadata: { student_name: "Francis Okeke" },
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockCert, error: null });
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    (supabase.from as any).mockReturnValue({ select: selectMock });

    const result = await verifyCertificateByCode("ECLAT-CERT-2026-X9Q2");
    expect(result.valid).toBe(true);
    expect(result.certificate?.title).toBe("Certificate of National League Championship");
    expect(result.certificate?.metadata.student_name).toBe("Francis Okeke");
  });

  it("returns invalid result when verification code is not found", async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    (supabase.from as any).mockReturnValue({ select: selectMock });

    const result = await verifyCertificateByCode("ECLAT-CERT-9999-FAKE");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Certificate not found");
  });

  it("returns existing certificate without duplicating if already issued", async () => {
    const existingCert = {
      id: "cert-existing",
      student_id: "student-1",
      title: "Distinction in Mathematics",
      verification_code: "ECLAT-CERT-2026-EXIS",
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: existingCert, error: null });
    const eqMock2 = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });
    (supabase.from as any).mockReturnValue({ select: selectMock });

    const cert = await issueCertificate({
      studentId: "student-1",
      studentName: "Weird Ore",
      certificateType: "mastery_distinction",
      title: "Distinction in Mathematics",
      description: "For mastering math",
    });

    expect(cert?.id).toBe("cert-existing");
    expect(cert?.verification_code).toBe("ECLAT-CERT-2026-EXIS");
  });
});
