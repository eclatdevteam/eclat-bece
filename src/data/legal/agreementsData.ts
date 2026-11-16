export interface AgreementDefinition {
  id: string;
  title: string;
  targetRole: "parent" | "school";
  badge: string;
  checkboxLabel: string;
  intro: string;
  statements: string[];
  consentClause: string;
  actionButtonText: string;
  actionUrl: string;
}

export const agreementsMetadata = {
  title: "Parent & School Agreements",
  entity: "Eclatapp Technologies Ltd (Éclat)",
  lastUpdated: "11 November 2026",
  supportEmail: "support@eclatapp.xyz",
};

export const parentGuardianAgreement: AgreementDefinition = {
  id: "parent-agreement",
  title: "Parent / Guardian Agreement",
  targetRole: "parent",
  badge: "Parent & Guardian Registration",
  checkboxLabel: "I confirm and agree",
  intro: "I confirm that I am the parent or legal guardian of the child I am registering, or that I have lawful authority to act on their behalf.",
  statements: [
    "I have read and agree to Éclat's Terms of Service and acknowledge its Privacy Policy.",
    "I understand that Eclatapp Technologies Ltd will collect and process my child's account information, learning activities, answers, scores, progress and other necessary educational data to provide its services.",
    "I understand that my child's username, school and performance information may be visible on Éclat's leaderboards, as explained in the Privacy Policy.",
    "Where parental consent is required for the educational processing described above, I give that consent.",
    "I understand that I can withdraw consent where applicable or request assistance with my child's information by contacting support@eclatapp.xyz.",
  ],
  consentClause:
    "By selecting the agreement checkbox during registration, you confirm that you have read, understood, and agreed to this Parent/Guardian Agreement.",
  actionButtonText: "Register as Parent",
  actionUrl: "/parent-signup",
};

export const schoolAgreementAndTerms: AgreementDefinition = {
  id: "school-agreement",
  title: "School Agreement and Data Processing Terms",
  targetRole: "school",
  badge: "Institutional & School Administration",
  checkboxLabel: "I confirm and accept on behalf of school",
  intro: "I confirm that I am authorised to register and act on behalf of my school and to accept these terms.",
  statements: [
    "I have read and agree to Éclat's Terms of Service and School Data Processing Agreement, and acknowledge the Privacy Policy.",
    "I confirm that my school has an appropriate lawful basis for providing pupils' information to Éclat, has fulfilled its applicable privacy-notice obligations and has obtained any parental or guardian permissions required by law.",
    "I understand that Eclatapp Technologies Ltd will process pupil information, including names, usernames, classes, learning activities, assessments and performance records, to provide educational services on behalf of the school, subject to the applicable agreement.",
    "I acknowledge the school's responsibilities for authorised data submission, account management and communication with parents or guardians, and Éclat's responsibilities for processing and protecting personal information in accordance with applicable law.",
  ],
  consentClause:
    "By selecting the agreement checkbox during institutional onboarding, the authorised school representative binds the institution to these Data Processing and Platform terms.",
  actionButtonText: "Register as School",
  actionUrl: "/school-signup",
};
