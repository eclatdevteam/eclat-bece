export type SubjectCategory = 'core' | 'elective';

export interface Subject {
  id: string;
  name: string;
  code: string;
  icon?: string | null;
  category: SubjectCategory;
  description: string | null;
  available_year_6: boolean;
  available_year_9: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface SubjectWithCounts extends Subject {
  year_6_count: number;
  year_9_count: number;
  total_count: number;
}

export interface CreateSubjectInput {
  name: string;
  code: string;
  icon?: string;
  category: SubjectCategory;
  description?: string;
  available_year_6: boolean;
  available_year_9: boolean;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateSubjectInput {
  name?: string;
  code?: string;
  icon?: string;
  category?: SubjectCategory;
  description?: string;
  available_year_6?: boolean;
  available_year_9?: boolean;
  is_active?: boolean;
  display_order?: number;
}

/**
 * Auto-generates a standardized uppercase short code from a subject name.
 * Examples:
 * - "French" -> "FREN"
 * - "Computer Science" -> "COMP"
 * - "Christian Religious Studies" -> "CRS"
 * - "Civic Education" -> "CIV"
 */
export function generateSubjectCode(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";

  // Common acronym mappings for Nigerian BECE / Year 6 / Year 9 curriculum
  const knownAcronyms: Record<string, string> = {
    "mathematics": "MATH",
    "english language": "ENG",
    "basic science": "SCI",
    "basic technology": "TECH",
    "basic science & technology": "BST",
    "basic science and technology": "BST",
    "social studies": "SOC",
    "civic education": "CIV",
    "general paper": "GEN",
    "business studies": "BUS",
    "christian religious studies": "CRS",
    "christian religious knowledge": "CRK",
    "islamic religious studies": "IRS",
    "islamic religious knowledge": "IRK",
    "physical and health education": "PHE",
    "physical & health education": "PHE",
    "agricultural science": "AGRIC",
    "home economics": "HEC",
    "computer science": "COMP",
    "computer studies": "COMP",
    "information technology": "IT",
    "french language": "FREN",
    "cultural and creative arts": "CCA",
    "cultural & creative arts": "CCA",
    "music": "MUS",
    "fine art": "ART",
    "yoruba language": "YOR",
    "igbo language": "IGBO",
    "hausa language": "HAU",
  };

  const lower = trimmed.toLowerCase();
  if (knownAcronyms[lower]) {
    return knownAcronyms[lower];
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    // 3 or more words: Take initials (e.g., Civic Defense Studies -> CDS)
    return words.map(w => w[0].toUpperCase()).join("");
  } else if (words.length === 2) {
    // 2 words: e.g. "Creative Arts" -> "CART", "Moral Education" -> "MOR"
    // Use first 3 letters of first word or 2 + 2 letters
    const w1 = words[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const w2 = words[1].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (w1.length >= 3) {
      return w1.slice(0, 4);
    }
    return (w1.slice(0, 2) + w2.slice(0, 2)).toUpperCase();
  } else {
    // Single word: Take first 4 characters (e.g. "Biology" -> "BIOL")
    const clean = words[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return clean.slice(0, Math.min(4, clean.length));
  }
}
