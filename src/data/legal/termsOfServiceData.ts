export interface LegalSubSection {
  title?: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalSection {
  id: string;
  number: number;
  title: string;
  summary?: string;
  paragraphs?: string[];
  list?: string[];
  subsections?: LegalSubSection[];
  callout?: {
    type: "info" | "warning" | "success";
    title?: string;
    text: string;
  };
}

export interface LegalDocumentMetadata {
  title: string;
  entity: string;
  address: string;
  lastUpdated: string;
  version: string;
  supportEmail: string;
  website: string;
}

export const termsOfServiceMetadata: LegalDocumentMetadata = {
  title: "Terms of Service",
  entity: "Eclatapp Technologies Ltd (Éclat)",
  address: "Alara Street, Onike, Yaba, Lagos, Nigeria",
  lastUpdated: "11 November 2026",
  version: "1.0",
  supportEmail: "support@eclatapp.xyz",
  website: "https://eclatapp.com.ng",
};

export const termsOfServicePreamble: string[] = [
  "Welcome to Éclat!",
  "These Terms of Service (\"Terms\") govern your access to and use of the Éclat website, educational platform, applications, content and associated services (collectively, the \"Platform\").",
  "The Platform is operated by Eclatapp Technologies Ltd, a company registered in Nigeria, with its business address at Alara Street, Onike, Yaba, Lagos, Nigeria.",
  "By creating an account, subscribing to our services or accessing the Platform through an authorised account, you agree to comply with these Terms.",
  "Where an account is created for a child, the parent, legal guardian or authorised school representative responsible for creating or managing that account must accept the applicable terms.",
  "Please read these Terms carefully.",
];

export const termsOfServiceSections: LegalSection[] = [
  {
    id: "about-eclat",
    number: 1,
    title: "About Éclat",
    paragraphs: [
      "Éclat is an online educational platform designed to support learning, practice, assessment and academic development.",
      "The availability of specific subjects and features may vary depending on the user's account type, subscription or service package.",
      "Éclat is an educational support platform. It does not replace a school, qualified teacher, official examination body or professional educational assessment.",
    ],
    list: [
      "Curriculum-aligned educational questions and practice exercises",
      "Assignments and learning activities",
      "Timed assessments",
      "Individual and group learning challenges",
      "One-to-one academic duels",
      "Scores, points, rankings and leaderboards",
      "Performance tracking and mastery assessments",
      "Parent and school dashboards",
      "Educational progress reports",
      "Other features introduced as the Platform develops",
    ],
  },
  {
    id: "eligibility-and-account-creation",
    number: 2,
    title: "Eligibility and account creation",
    paragraphs: [
      "The Platform is currently intended for users in Nigeria.",
      "Accounts may be created by:",
    ],
    list: [
      "Parents or legal guardians registering children",
      "Schools registering pupils through authorised representatives",
      "Teachers or school administrators authorised to manage school accounts",
    ],
    callout: {
      type: "warning",
      title: "Notice Regarding Children's Accounts",
      text: "Children cannot independently create Éclat accounts. A child's account must be created or authorised through the applicable parent, guardian or school onboarding process.",
    },
    subsections: [
      {
        paragraphs: [
          "Users must provide accurate registration information and maintain current account details where necessary.",
          "Parents and schools are responsible for ensuring that accounts are created for legitimate educational purposes and that they have the necessary authority to provide the relevant information.",
          "Éclat may request reasonable verification of account ownership, parental or guardian authority, or school authorisation.",
        ],
      },
    ],
  },
  {
    id: "parent-and-guardian-responsibilities",
    number: 3,
    title: "Parent and guardian responsibilities",
    paragraphs: [
      "Parents and guardians who register children on Éclat agree to:",
    ],
    list: [
      "Provide accurate information when creating or managing a child's account.",
      "Ensure they have the legal authority to register the child.",
      "Review applicable privacy information and consent choices.",
      "Keep account credentials secure.",
      "Supervise their child's use of the Platform as appropriate.",
      "Report suspected unauthorised access or misuse.",
      "Avoid sharing another child's personal information without lawful authority.",
      "Inform Éclat of relevant inaccuracies or concerns concerning their child's account.",
    ],
    subsections: [
      {
        paragraphs: [
          "Parents and guardians may exercise applicable privacy rights on behalf of their children, subject to relevant legal requirements.",
        ],
      },
    ],
  },
  {
    id: "school-responsibilities",
    number: 4,
    title: "School responsibilities",
    paragraphs: [
      "Schools registering on Éclat agree to:",
    ],
    list: [
      "Register through an authorised representative.",
      "Provide accurate school and pupil information.",
      "Establish an appropriate lawful basis for processing and submitting pupil information.",
      "Provide required privacy notices and obtain any legally necessary parental or guardian permissions.",
      "Ensure information uploaded to Éclat is relevant and limited to approved educational purposes.",
      "Restrict account access to authorised teachers and administrators.",
      "Maintain appropriate password and account-security practices.",
      "Notify Éclat promptly when a teacher or administrator should no longer have access.",
      "Use pupil data only for lawful and legitimate educational purposes.",
      "Comply with the applicable School Data Processing Agreement.",
    ],
    callout: {
      type: "info",
      title: "Sensitive Data Prohibition",
      text: "Schools must not upload unnecessary sensitive information about pupils, including medical histories, government identification documents (NIN) or other information not requested by the Platform.",
    },
    subsections: [
      {
        paragraphs: [
          "The school remains responsible for its own compliance obligations. Éclat remains responsible for obligations imposed on it by applicable data protection law.",
        ],
      },
    ],
  },
  {
    id: "account-security",
    number: 5,
    title: "Account security",
    paragraphs: [
      "Account holders are responsible for maintaining the confidentiality of their login details and for taking reasonable steps to prevent unauthorised access.",
      "Accounts must not be sold, transferred or knowingly shared with unauthorised persons.",
      "Parents and schools may issue or manage pupil login credentials through the available Platform functions.",
      "Users should promptly notify Éclat if they suspect that an account has been accessed without authorisation.",
      "Éclat may temporarily restrict access where reasonably necessary to investigate a security concern or protect users.",
    ],
  },
  {
    id: "educational-content-and-learning-results",
    number: 6,
    title: "Educational content and learning results",
    paragraphs: [
      "Éclat provides educational questions, exercises, assessments and performance feedback to support learning.",
      "We aim to make our content accurate, age-appropriate and educationally useful. However, we cannot guarantee that every question, answer, explanation or assessment will be free from errors.",
      "Learning results and mastery indicators are intended to support educational development. They should not be treated as definitive measures of intelligence, academic potential or a child's overall abilities.",
      "The Platform does not guarantee any particular examination score, school admission, academic improvement or educational outcome.",
      "Parents and schools should use Éclat's information alongside appropriate teaching, supervision and professional judgement.",
      "Users may report suspected content errors to support@eclatapp.xyz.",
    ],
  },
  {
    id: "duels-challenges-and-leaderboards",
    number: 7,
    title: "Duels, challenges and leaderboards",
    paragraphs: [
      "Éclat may allow pupils to participate in educational duels, challenges, competitions and leaderboard activities.",
      "The duel feature allows a pupil to generate a challenge code that another pupil can use to complete the same question set and compare results.",
      "By participating in these activities, users agree to follow the applicable activity rules and refrain from cheating, impersonation, manipulation or other unfair conduct.",
      "Éclat may investigate suspicious activity and correct, disqualify or remove results where there is reasonable evidence of abuse or technical error.",
    ],
    callout: {
      type: "info",
      title: "Public Leaderboard Visibility",
      text: "Leaderboards currently may display usernames, school names, scores and points publicly. Parents and schools should review the Privacy Policy for details. Éclat may revise leaderboard visibility and introduce additional privacy controls to protect pupils.",
    },
    subsections: [
      {
        paragraphs: [
          "Participation in optional public competitions or publicity activities may be subject to separate rules and permissions.",
        ],
      },
    ],
  },
  {
    id: "competitions-prizes-and-rewards",
    number: 8,
    title: "Competitions, prizes and rewards",
    paragraphs: [
      "From time to time, Éclat may organise educational competitions and offer prizes or rewards.",
      "Each competition may be governed by additional published rules covering:",
    ],
    list: [
      "Eligibility",
      "Entry requirements",
      "Competition dates",
      "Scoring and winner selection",
      "Prize descriptions",
      "Verification of results",
      "Disqualification and appeals",
      "Delivery or collection of prizes",
      "Publicity and personal information",
    ],
    subsections: [
      {
        paragraphs: [
          "Where competition rules conflict with these Terms on a specific competition matter, the published competition rules will govern that matter, subject to applicable law.",
          "Prizes will not be guaranteed unless expressly announced as part of a particular competition.",
          "Where prizes are awarded to children, Éclat may require appropriate parent or guardian involvement in verification and fulfilment.",
          "Éclat will not publish identifiable photographs or other additional personal information about child winners for promotional purposes without an appropriate lawful basis and any required permissions.",
        ],
      },
    ],
  },
  {
    id: "subscriptions-and-payments",
    number: 9,
    title: "Subscriptions and payments",
    paragraphs: [
      "Some Éclat services may require payment.",
      "The applicable subscription fee, duration, included features and payment conditions will be disclosed before purchase.",
      "The Platform may offer annual subscriptions, school packages or other service arrangements.",
      "Payments are processed through Paystack or another payment provider identified at checkout.",
      "Users are responsible for ensuring that payment information submitted to the payment provider is accurate and that they are authorised to use the selected payment method.",
      "A subscription becomes active when the applicable payment or activation requirements have been satisfied.",
      "Éclat may update its prices from time to time. Any new or changed price will be disclosed before it applies to a subsequent purchase or renewal.",
      "Automatic renewal will apply only where expressly disclosed and authorised. The checkout page must explain any recurring billing arrangement and the method for cancelling future renewals.",
      "Éclat does not guarantee continued paid access following expiry of a subscription unless the account is renewed or another valid access arrangement applies.",
    ],
  },
  {
    id: "free-trials-and-promotional-access",
    number: 10,
    title: "Free trials and promotional access",
    paragraphs: [
      "Éclat may offer free trials or complimentary access to selected schools, parents or users.",
      "The duration, included features and conditions of each trial will be communicated when access is granted.",
      "Unless expressly stated otherwise, a free trial does not require users to purchase a subscription after the trial ends.",
      "Éclat will not initiate an automatic paid subscription at the end of a trial without appropriate prior authorisation and disclosure.",
      "Trial users must comply with these Terms and the applicable privacy requirements.",
      "At the end of a trial, access to certain features may be restricted.",
      "Any retention or deletion of trial-account records will be handled according to the applicable Privacy Policy, retention schedule and legal requirements.",
    ],
  },
  {
    id: "cancellation-and-refunds",
    number: 11,
    title: "Cancellation and refunds",
    paragraphs: [
      "Users may choose not to renew a subscription and may request account closure through the available account controls or by contacting support@eclatapp.xyz.",
      "Cancellation of an active subscription will not automatically result in a refund unless required by applicable law or provided under the refund terms disclosed at purchase.",
      "Where a paid service is not supplied as agreed, is materially defective or otherwise gives rise to a statutory consumer remedy, Éclat will assess and honour applicable legal rights.",
      "Requests for refunds should be submitted with relevant transaction details.",
      "Any specific voluntary refund conditions, processing timelines or applicable deductions must be disclosed before purchase.",
      "Nothing in these Terms excludes consumer rights that cannot lawfully be waived.",
    ],
  },
  {
    id: "acceptable-use",
    number: 12,
    title: "Acceptable use",
    paragraphs: [
      "Users must not:",
    ],
    list: [
      "Attempt to gain unauthorised access to another person's account or records.",
      "Upload malware or other harmful content.",
      "Interfere with the operation or security of the Platform.",
      "Use automated tools to scrape or extract questions, answers or user information without authorisation.",
      "Copy or redistribute protected educational content unlawfully.",
      "Manipulate scores, points, rankings or competition results.",
      "Harass, threaten, impersonate or exploit another user.",
      "Share another pupil's personal information without lawful authority.",
      "Use the Platform for unlawful, fraudulent or harmful activities.",
      "Attempt to bypass security controls or account restrictions.",
    ],
    subsections: [
      {
        paragraphs: [
          "Éclat may take proportionate action to prevent misuse, including suspending accounts or removing improperly obtained results.",
        ],
      },
    ],
  },
  {
    id: "intellectual-property",
    number: 13,
    title: "Intellectual property",
    paragraphs: [
      "Unless otherwise stated, the Platform and its original educational content, question banks, explanations, software, designs, trademarks, logos and other proprietary materials belong to Eclatapp Technologies Ltd or its licensors.",
      "Users receive a limited, non-exclusive, non-transferable right to access and use the Platform and its content for authorised educational purposes during the applicable access period.",
      "Users must not reproduce, sell, license, distribute or commercially exploit Éclat's proprietary materials without prior written permission.",
      "Teachers and schools may use permitted content within the Platform for their authorised educational activities, subject to their subscription and service terms.",
      "Nothing in these Terms transfers ownership of a pupil's personal information or grants Éclat ownership of school records.",
    ],
  },
  {
    id: "privacy-and-data-protection",
    number: 14,
    title: "Privacy and data protection",
    paragraphs: [
      "Éclat processes personal information in accordance with its Privacy Policy and applicable Nigerian data protection law.",
      "The Platform may process pupil names, usernames, account credentials, school and class information, learning activities, answers, scores and progress records.",
      "For school-managed pupil information, the applicable School Data Processing Agreement governs processing conducted on the school's documented instructions.",
      "Éclat may use third-party providers for hosting, payments and other necessary services, as explained in its Privacy Policy.",
      "Users may submit privacy-related requests to support@eclatapp.xyz.",
      "Where consent is the applicable lawful basis, withdrawal rights and other relevant protections will apply.",
      "Acceptance of these Terms does not constitute blanket consent to optional advertising, publicity or unrelated uses of personal information.",
    ],
  },
  {
    id: "service-availability-and-changes",
    number: 15,
    title: "Service availability and changes",
    paragraphs: [
      "Éclat aims to maintain a reliable and accessible learning platform.",
      "However, the service may occasionally be unavailable because of maintenance, updates, network failures, security incidents or circumstances beyond our reasonable control.",
      "We may introduce, modify or discontinue features to improve the Platform, comply with legal requirements or address security and operational issues.",
      "Where a material change adversely affects an active paid service, we will provide appropriate notice and any remedies required by applicable law or contract.",
      "We will make reasonable efforts to minimise disruption and protect relevant account information.",
    ],
  },
  {
    id: "account-suspension-and-termination",
    number: 16,
    title: "Account suspension and termination",
    paragraphs: [
      "Éclat may suspend or restrict an account where reasonably necessary because of:",
    ],
    list: [
      "Serious or repeated violations of these Terms",
      "Suspected fraudulent or unauthorised activity",
      "Security threats",
      "Unlawful use of the Platform",
      "Unresolved payment issues affecting paid access",
      "A valid legal obligation or regulatory requirement",
    ],
    subsections: [
      {
        paragraphs: [
          "Where appropriate, Éclat will provide notice and a reasonable opportunity to address the issue.",
          "Users may request account closure at any time.",
          "Schools may terminate their service arrangements in accordance with the applicable contract.",
          "Following termination, access may end and personal information will be handled in accordance with the Privacy Policy, applicable Data Processing Agreement and approved retention and deletion procedures.",
          "Termination does not remove accrued payment obligations or other lawful obligations that survive the end of the service.",
        ],
      },
    ],
  },
  {
    id: "third-party-services",
    number: 17,
    title: "Third-party services",
    paragraphs: [
      "Éclat uses third-party service providers for certain functions, including hosting and payment processing.",
      "Where users are directed to an external payment service or third-party website, additional terms and privacy notices may apply.",
      "Éclat remains responsible for its own legal and contractual obligations concerning service providers and personal data.",
    ],
  },
  {
    id: "disclaimer-and-limitations",
    number: 18,
    title: "Disclaimer and limitations",
    paragraphs: [
      "Éclat provides educational support tools and does not guarantee particular academic results, examination outcomes or school admissions.",
      "We will exercise reasonable care and skill in providing the services and will not exclude liability where such exclusion is prohibited by applicable law.",
      "To the extent permitted by law, Éclat will not be responsible for losses caused solely by events beyond its reasonable control or by a user's unlawful or unauthorised conduct.",
      "Nothing in these Terms excludes or limits liability for fraud, wilful misconduct, legally actionable negligence, violations of non-excludable consumer rights or any other liability that cannot lawfully be excluded.",
      "Any additional limitations of liability agreed with institutional customers must be set out in their applicable contract and remain subject to law.",
    ],
  },
  {
    id: "complaints-and-dispute-resolution",
    number: 19,
    title: "Complaints and dispute resolution",
    paragraphs: [
      "We encourage users to contact Éclat first so we can investigate and attempt to resolve service-related concerns.",
      "Complaints may be submitted to support@eclatapp.xyz.",
      "We will seek to respond within a reasonable time, considering the nature and urgency of the issue.",
      "Nothing in these Terms prevents users from exercising statutory rights, making complaints to a competent regulator or seeking remedies before a court or other authorised body.",
    ],
  },
  {
    id: "changes-to-these-terms",
    number: 20,
    title: "Changes to these Terms",
    paragraphs: [
      "We may update these Terms to reflect changes in our services, legal requirements, pricing arrangements or operational practices.",
      "We will publish the updated version and its effective date.",
      "For material changes affecting existing users, we will provide appropriate advance notice and obtain renewed agreement where required.",
      "Changes will not retrospectively remove accrued rights or lawful remedies.",
      "Continued use of the Platform after a validly notified change may constitute acceptance where legally appropriate, but we will seek affirmative acceptance where necessary.",
    ],
  },
  {
    id: "governing-law",
    number: 21,
    title: "Governing law",
    paragraphs: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria.",
      "Disputes shall be subject to the jurisdiction of the competent courts of Nigeria, without prejudice to any mandatory consumer protection rights or lawful regulatory complaint mechanisms.",
    ],
  },
  {
    id: "contact-information",
    number: 22,
    title: "Contact information",
    paragraphs: [
      "For account support, subscription enquiries, legal notices, privacy questions or other concerns, contact:",
    ],
    subsections: [
      {
        paragraphs: [
          "Eclatapp Technologies Ltd",
          "Alara Street, Onike, Yaba, Lagos, Nigeria",
          "Email: support@eclatapp.xyz",
          "Website: https://eclatapp.com.ng",
        ],
      },
    ],
  },
];

export const termsOfServiceAcknowledgement: string =
  "By selecting the applicable agreement checkbox during registration or otherwise validly accepting these Terms, the responsible parent, guardian or authorised school representative confirms that they have read and agree to these Terms of Service.";
