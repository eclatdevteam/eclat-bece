export interface PrivacySection {
  id: string;
  number: number;
  title: string;
  paragraphs?: string[];
  list?: string[];
  subsections?: {
    subtitle?: string;
    paragraphs?: string[];
    list?: string[];
  }[];
  table?: {
    headers: string[];
    rows: { purpose: string; information: string }[];
  };
  callout?: {
    type: "info" | "warning" | "success";
    title?: string;
    text: string;
  };
}

export const privacyPolicyMetadata = {
  title: "Privacy Policy",
  entity: "Eclatapp Technologies Ltd (Éclat)",
  address: "Alara Street, Onike, Yaba, Lagos, Nigeria",
  version: "0.1",
  lastUpdated: "11 November 2026",
  supportEmail: "support@eclatapp.xyz",
  regulator: "Nigeria Data Protection Commission (NDPC)",
};

export const privacyPolicySections: PrivacySection[] = [
  {
    id: "introduction",
    number: 1,
    title: "Introduction",
    paragraphs: [
      "At Éclat, we believe children should be able to learn, practise and develop their abilities in an environment that respects their privacy and protects their personal information.",
      "This Privacy Policy explains how Eclatapp Technologies Ltd (\"Éclat\", \"we\", \"us\" or \"our\") collects, uses, stores, shares and protects personal information through the Éclat educational platform and its associated website.",
      "Éclat provides digital educational tools that support pupils, parents and schools through learning exercises, assignments, challenges, assessments, performance tracking and educational progress reports.",
      "Because children use our services, we recognise that their personal information requires particular care.",
      "We seek to collect only information necessary to deliver our educational services and to give parents and schools appropriate oversight of children's learning.",
      "Our services are currently intended for users in Nigeria.",
    ],
  },
  {
    id: "who-we-are",
    number: 2,
    title: "Who we are",
    paragraphs: [
      "Legal entity: Eclatapp Technologies Ltd",
      "Business address: Alara Street, Onike, Yaba, Lagos, Nigeria",
      "Privacy contact: support@eclatapp.xyz",
      "For information provided by a school to manage its pupils, the school will ordinarily determine the purposes for which its pupil records are processed, while Éclat processes those records to provide its services under the school's instructions.",
      "Where parents register directly, or where Éclat independently determines the purposes and means of processing, Éclat may act as a data controller.",
      "Our responsibilities may therefore differ according to how an account was created and the particular processing activity involved.",
    ],
  },
  {
    id: "information-we-collect",
    number: 3,
    title: "Information we collect",
    subsections: [
      {
        subtitle: "A. Information about pupils",
        paragraphs: [
          "Depending on how a pupil is registered and uses the platform, we may process:",
        ],
        list: [
          "Full name",
          "Username",
          "Account authentication credentials",
          "Class or year group",
          "School affiliation",
          "Learning activities and completed exercises",
          "Answers submitted to questions",
          "Assessment results, scores and points",
          "Number of attempts and time spent on activities",
          "Learning progress, mastery levels and areas requiring further practice",
          "Challenge participation and results",
          "Account and session information necessary to operate learning features",
        ],
      },
      {
        subtitle: "B. Information about parents and guardians",
        paragraphs: ["We may collect:"],
        list: [
          "Full name",
          "Email address",
          "Telephone number",
          "Account information",
          "Details of the child profiles they manage",
          "Subscription or payment status",
          "Privacy preferences and consent records, where applicable",
        ],
      },
      {
        subtitle: "C. Information about school representatives",
        paragraphs: [
          "We may collect:",
        ],
        list: [
          "Full name",
          "Email address",
          "Telephone number",
          "School name",
          "Professional role or account permissions",
          "Account and school administration information",
        ],
      },
      {
        subtitle: "D. Information collected automatically",
        paragraphs: [
          "Our systems may process technical information needed to operate, maintain and protect the platform, including browser or device information, session information, IP addresses and technical logs.",
          "We also use Google Analytics. The precise scope of analytics processing across our public website and pupil-facing application is under review.",
          "We will maintain a cookie and analytics notice describing the technologies actually in use, their purposes and applicable user choices.",
        ],
      },
    ],
    callout: {
      type: "info",
      title: "Credential Security",
      text: "Passwords must be protected using appropriate technical safeguards. We do not display stored passwords to other users.",
    },
  },
  {
    id: "information-we-do-not-ordinarily-request",
    number: 4,
    title: "Information we do not ordinarily request",
    paragraphs: [
      "For ordinary pupil registration and learning activities, Éclat does NOT require:",
    ],
    list: [
      "Home or residential addresses",
      "Government-issued identity numbers (NIN, passport numbers)",
      "Biometric identification information",
      "Medical histories",
      "Religious information",
      "Parents' financial account details (credit/debit card numbers are handled securely by Paystack)",
      "Pupil photographs",
      "Continuous or precise geographic location tracking",
    ],
    callout: {
      type: "success",
      title: "Built for Child Safety",
      text: "Our registration process does not collect sensitive personal data. We do not provide an unrestricted pupil-to-pupil messaging facility. Our duel feature allows pupils to generate a challenge code to complete the same questions and compare scores. We do not use identifiable pupil records for AI-based profiling or automated AI decision-making.",
    },
  },
  {
    id: "why-we-use-personal-information",
    number: 5,
    title: "Why we use personal information",
    paragraphs: [
      "We process personal information for the following specific educational and administrative purposes:",
    ],
    table: {
      headers: ["Purpose", "Information involved"],
      rows: [
        { purpose: "Account creation and authentication", information: "Names, usernames, credentials and account roles" },
        { purpose: "Delivering educational activities", information: "Class information, exercises and assignments" },
        { purpose: "Monitoring learning progress", information: "Answers, results, scores, attempts and mastery information" },
        { purpose: "Parent and teacher dashboards", information: "Pupil performance and progress information" },
        { purpose: "Educational challenges & duels", information: "Usernames, scores, points, schools and challenge results" },
        { purpose: "Customer support", information: "Contact details and relevant account information" },
        { purpose: "Subscriptions & billing", information: "Account identity, subscription status and payment references" },
        { purpose: "Platform operation and security", information: "Necessary technical records and session information" },
        { purpose: "Legal compliance", information: "Records necessary to comply with lawful obligations" },
      ],
    },
    subsections: [
      {
        paragraphs: [
          "We will only process personal information where an appropriate legal basis exists under applicable Nigerian data protection law.",
          "Depending on the activity, this may include consent, contractual necessity, compliance with legal obligations, legitimate interests where permitted and appropriately assessed, or another lawful basis.",
          "For school-managed educational processing, the school and Éclat must identify the applicable lawful basis and document their respective responsibilities.",
        ],
      },
    ],
  },
  {
    id: "childrens-privacy-and-parental-involvement",
    number: 6,
    title: "Children's privacy and parental involvement",
    paragraphs: [
      "Éclat is designed to support children's education.",
      "Pupils cannot independently create their own accounts. Registration is managed by a parent, guardian or authorised school representative.",
      "Where parental or guardian consent is required, we will use appropriate procedures to obtain and document it.",
      "Where processing is undertaken under an applicable educational-purpose exception or another lawful basis, we will document the basis and apply appropriate confidentiality, necessity and security safeguards.",
      "Schools are responsible for ensuring they have the authority and appropriate lawful basis to provide pupil information to Éclat. Éclat is responsible for meeting its own obligations as a controller or processor, as applicable.",
      "Participation in optional public-facing competitions, publication of identifiable winner information and promotional use of children's photographs will be subject to additional review and appropriate permissions.",
    ],
  },
  {
    id: "learning-progress-and-leaderboards",
    number: 7,
    title: "Learning progress and leaderboards",
    paragraphs: [
      "Éclat records educational performance to support learning, assessment, progress monitoring and challenges.",
      "The platform currently includes publicly accessible leaderboard functionality displaying pupils' usernames, school affiliations, points and scores.",
      "This information may still constitute personal data, particularly where a username identifies a pupil or can be connected to their identity.",
    ],
    callout: {
      type: "warning",
      title: "Leaderboard Privacy Notice",
      text: "Proposed protection, pending implementation: Éclat will restrict routine pupil-performance leaderboards to appropriately authorised users or redesign public rankings to avoid identifying individual children. Any optional publication of identifiable competition results will be subject to an appropriate lawful basis and additional safeguards. Until this change is implemented, we recognise the privacy considerations associated with public leaderboard display.",
    },
  },
  {
    id: "payments",
    number: 8,
    title: "Payments",
    paragraphs: [
      "Payments are processed through Paystack.",
      "Payment-related information may be processed by Paystack in accordance with its applicable privacy and security arrangements.",
      "Éclat may retain payment references, subscription status and other transaction information necessary for account administration, reconciliation, support and legal compliance.",
      "Éclat does not need to collect or store full payment card details in its own educational database.",
    ],
  },
  {
    id: "service-providers-and-sharing",
    number: 9,
    title: "Service providers and sharing",
    paragraphs: [
      "We use third-party service providers to operate and maintain the platform. Providers currently identified include:",
    ],
    list: [
      "Supabase - database, authentication and cloud infrastructure services",
      "Vercel / Render - application hosting and edge deployment services",
      "Google Analytics - website or application analytics, subject to configuration confirmation",
      "Paystack - payment processing and transaction verification",
    ],
    subsections: [
      {
        paragraphs: [
          "Additional providers and their exact functions will be confirmed in our internal subprocessor register.",
          "We may share personal information with service providers only where necessary for legitimate platform operations, subject to appropriate contractual, confidentiality and security safeguards.",
          "We may also disclose information where required by applicable law or a valid legal process.",
          "We do NOT sell pupils' personal information.",
          "We do NOT authorise third parties to use pupil learning records for their own unrelated advertising purposes.",
        ],
      },
    ],
  },
  {
    id: "where-information-is-stored",
    number: 10,
    title: "Where information is stored",
    paragraphs: [
      "Éclat uses cloud-based infrastructure, including Supabase and cloud hosting platforms.",
      "The precise hosting locations, database regions, backup arrangements and any international transfers are being verified.",
      "Personal information may be processed outside Nigeria depending on the infrastructure configuration and service providers involved.",
      "Where international transfers occur, Éclat will assess and document an appropriate lawful transfer mechanism and safeguards under Nigerian data protection law before treating those transfers as approved.",
    ],
  },
  {
    id: "how-we-protect-information",
    number: 11,
    title: "How we protect information",
    paragraphs: [
      "Éclat uses access controls, authenticated accounts, HTTPS connections, password protection and encryption measures intended to reduce the risk of unauthorised access or disclosure.",
      "We are reviewing and strengthening additional measures including:",
    ],
    list: [
      "Role-based access restrictions",
      "Production-system access controls",
      "Audit and security logs",
      "Backup and recovery arrangements",
      "Incident detection and response",
      "Periodic technical security testing",
      "Supplier security assessments",
    ],
    subsections: [
      {
        paragraphs: [
          "No system can eliminate every security risk. We will review our controls as the platform and its user base develop.",
        ],
      },
    ],
  },
  {
    id: "how-long-we-keep-information",
    number: 12,
    title: "How long we keep information",
    paragraphs: [
      "We aim to retain personal information only for as long as necessary for the purposes for which it was collected, subject to applicable legal, contractual and safeguarding requirements.",
      "Our retention periods will distinguish between active accounts, expired subscriptions, closed school accounts, deleted pupil profiles, financial records and technical logs.",
      "Where deletion is requested or an account is closed, we will apply our retention and deletion procedures, including appropriate treatment of linked educational records and any retained technical copies.",
      "Specific operational retention periods will be published after our technical verification and internal policy approval.",
    ],
  },
  {
    id: "your-privacy-rights",
    number: 13,
    title: "Your privacy rights",
    paragraphs: [
      "Subject to applicable law and relevant exceptions, individuals may have rights to:",
    ],
    list: [
      "Obtain information about how their personal data is processed",
      "Request access to personal information",
      "Request correction of inaccurate information",
      "Request deletion where legally applicable",
      "Withdraw consent where processing relies on consent",
      "Object to certain processing",
      "Request restriction of certain processing",
      "Exercise applicable data portability rights",
      "Make a complaint to the Nigeria Data Protection Commission (NDPC)",
    ],
    subsections: [
      {
        paragraphs: [
          "Parents and legal guardians may exercise relevant rights on behalf of children, subject to applicable law.",
          "For school-managed accounts, we may need to coordinate requests with the relevant school.",
          "To submit a privacy-related request, contact support@eclatapp.xyz.",
          "We may take appropriate steps to verify the identity or authority of a requester before disclosing or changing information.",
        ],
      },
    ],
  },
  {
    id: "data-incidents",
    number: 14,
    title: "Data incidents",
    paragraphs: [
      "If a personal data breach occurs, we will assess its nature, scope and likely impact, take appropriate containment measures and notify relevant parties and authorities where required by law.",
      "Where we process information on behalf of a school, we will also inform that school as required under our applicable agreement and the law.",
    ],
  },
  {
    id: "changes-to-this-policy",
    number: 15,
    title: "Changes to this policy",
    paragraphs: [
      "We may update this policy to reflect changes to our services, infrastructure, legal obligations or information-processing practices.",
      "Where changes materially affect how children's information is used, we will take appropriate steps to inform schools, parents or guardians and obtain any permissions required by law.",
    ],
  },
  {
    id: "contact-us",
    number: 16,
    title: "Contact us",
    paragraphs: [
      "For privacy questions, access or deletion requests, concerns about children's information or suspected misuse of personal data, please contact:",
      "Eclatapp Technologies Ltd",
      "Alara Street, Onike, Yaba, Lagos, Nigeria",
      "Email: support@eclatapp.xyz",
      "Individuals may also contact the Nigeria Data Protection Commission (NDPC) where they believe their data protection rights have been infringed.",
    ],
  },
];
