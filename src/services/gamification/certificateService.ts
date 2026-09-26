import { supabase } from "@/integrations/supabase/client";

export type CertificateType = "league_champion" | "mythic_achievement" | "mastery_distinction";

export interface StudentCertificate {
  id: string;
  student_id: string;
  certificate_type: CertificateType;
  title: string;
  description: string;
  verification_code: string;
  issued_at: string;
  metadata: {
    student_name?: string;
    student_level?: number;
    badge_id?: string;
    achievement_detail?: string;
    school_name?: string;
    academic_year?: string;
    honors_rank?: string;
  };
}

/**
 * Generates a human-friendly verification code:
 * Format: ECLAT-CERT-{YYYY}-{4_CHARS} e.g. ECLAT-CERT-2026-9F7K
 */
export function generateVerificationCode(year: number = new Date().getFullYear()): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude easily confused chars (0, 1, I, O)
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ECLAT-CERT-${year}-${code}`;
}

/**
 * Issues a new certificate in student_certificates if one matching this title does not already exist
 */
export async function issueCertificate(params: {
  studentId: string;
  studentName: string;
  certificateType: CertificateType;
  title: string;
  description: string;
  schoolName?: string;
  metadata?: Record<string, any>;
}): Promise<StudentCertificate | null> {
  try {
    // Check if certificate already issued
    const { data: existing } = await (supabase.from("student_certificates" as any) as any)
      .select("*")
      .eq("student_id", params.studentId)
      .eq("title", params.title)
      .maybeSingle();

    if (existing) {
      return existing as StudentCertificate;
    }

    const verificationCode = generateVerificationCode();
    const payload = {
      student_id: params.studentId,
      certificate_type: params.certificateType,
      title: params.title,
      description: params.description,
      verification_code: verificationCode,
      metadata: {
        student_name: params.studentName,
        school_name: params.schoolName || "National Scholar",
        academic_year: `${new Date().getFullYear()} Academic Year`,
        ...params.metadata,
      },
    };

    const { data: created, error } = await (supabase.from("student_certificates" as any) as any)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.warn("Failed to issue certificate:", error);
      return null;
    }

    return created as StudentCertificate;
  } catch (err) {
    console.error("Error in issueCertificate:", err);
    return null;
  }
}

/**
 * Public Verification Service
 * Validates any issued certificate code against database records
 */
export async function verifyCertificateByCode(verificationCode: string): Promise<{
  valid: boolean;
  certificate?: StudentCertificate;
  error?: string;
}> {
  try {
    const cleanCode = verificationCode.trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, error: "Please enter a verification code." };
    }

    const { data, error } = await (supabase.from("student_certificates" as any) as any)
      .select("*")
      .eq("verification_code", cleanCode)
      .maybeSingle();

    if (error || !data) {
      return { valid: false, error: "Certificate not found or verification code is invalid." };
    }

    return { valid: true, certificate: data as StudentCertificate };
  } catch (err) {
    console.error("Error verifying certificate:", err);
    return { valid: false, error: "Unable to connect to verification registry." };
  }
}

/**
 * Fetches all certificates awarded to a student
 */
export async function fetchStudentCertificates(studentId: string): Promise<StudentCertificate[]> {
  try {
    const { data, error } = await (supabase.from("student_certificates" as any) as any)
      .select("*")
      .eq("student_id", studentId)
      .order("issued_at", { ascending: false });

    if (error) throw error;
    return (data || []) as StudentCertificate[];
  } catch (err) {
    console.error("Error fetching student certificates:", err);
    return [];
  }
}

/**
 * Checks milestone conditions and automatically awards distinction certificates:
 * 1. Tier 8 Promotion -> "National League Champion"
 * 2. Any Mythic Achievement -> "Mythic Academic Distinction"
 * 3. Double Grandmaster -> "Mastery of Mathematics & English Language"
 */
export async function checkAndAwardMilestoneCertificates(params: {
  studentId: string;
  studentName: string;
  leagueTier?: number;
  unlockedBadgeIds?: string[];
  schoolName?: string;
}): Promise<StudentCertificate[]> {
  const awarded: StudentCertificate[] = [];

  // 1. League Champion Certificate
  if (params.leagueTier && params.leagueTier >= 8) {
    const cert = await issueCertificate({
      studentId: params.studentId,
      studentName: params.studentName,
      certificateType: "league_champion",
      title: "Certificate of National League Championship",
      description: "For demonstrating premier competitive academic mastery and ascending to Éclat Champion (Tier 8), the highest collegiate ranking in the federation.",
      schoolName: params.schoolName,
      metadata: { honors_rank: "Éclat Champion (Tier 8)" },
    });
    if (cert) awarded.push(cert);
  }

  // 2. Double Grandmaster
  if (params.unlockedBadgeIds?.includes("double_grandmaster")) {
    const cert = await issueCertificate({
      studentId: params.studentId,
      studentName: params.studentName,
      certificateType: "mastery_distinction",
      title: "Distinction in Core Mathematical & English Mastery",
      description: "Conferred for maintaining an extraordinary 90%+ curriculum mastery across both foundational pillars of academic rigor: Mathematics and the English Language.",
      schoolName: params.schoolName,
      metadata: { honors_rank: "Double Grandmaster" },
    });
    if (cert) awarded.push(cert);
  }

  // 3. Éclat Legend
  if (params.unlockedBadgeIds?.includes("eclat_legend")) {
    const cert = await issueCertificate({
      studentId: params.studentId,
      studentName: params.studentName,
      certificateType: "mythic_achievement",
      title: "Order of Éclat: Platform Legend",
      description: "The highest academic distinction awarded on the platform. Conferred for attaining Student Level 50, universal curriculum mastery, and supreme leaderboard standing.",
      schoolName: params.schoolName,
      metadata: { honors_rank: "Platform Legend" },
    });
    if (cert) awarded.push(cert);
  }

  return awarded;
}
