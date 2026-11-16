export interface PupilPrivacyCard {
  id: string;
  question: string;
  iconName: "smile" | "book" | "trophy" | "shield-alert" | "help-circle" | "heart";
  themeColor: "cyan" | "emerald" | "amber" | "rose" | "indigo";
  leadText: string;
  bulletPoints?: string[];
  alertNote?: string;
}

export const pupilPrivacyMetadata = {
  title: "Your Privacy on Éclat",
  subtitle: "A little about your information and how we keep you safe",
  targetAudience: "Pupils & Students",
  supportEmail: "support@eclatapp.xyz",
  dashboardNotice: "This page is accessible directly from your student dashboard at all times.",
};

export const pupilPrivacyIntro = {
  greeting: "Hi there! 👋",
  message:
    "Éclat helps you learn, practise questions, take part in challenges and see how much you're improving. To make all this work, we need to remember a few things about you.",
};

export const pupilPrivacyCards: PupilPrivacyCard[] = [
  {
    id: "what-we-know",
    question: "What do we know about you?",
    iconName: "book",
    themeColor: "cyan",
    leadText: "We only keep track of information that helps you learn and prepare for your exams:",
    bulletPoints: [
      "Your name, username, class, and school",
      "The questions you answer during practice and mock exams",
      "Your scores, points, and badges earned",
      "How you're progressing across different subjects",
    ],
  },
  {
    id: "why-we-need-this",
    question: "Why do we need this?",
    iconName: "smile",
    themeColor: "indigo",
    leadText: "Everything we record is designed to support your academic growth:",
    bulletPoints: [
      "So you can see how much you've improved week by week",
      "So Éclat can give you more practice with subjects you find difficult",
      "So your parent, guardian, or teacher can see how well you are doing and help you succeed",
    ],
  },
  {
    id: "can-others-see",
    question: "Can other pupils see my information?",
    iconName: "trophy",
    themeColor: "amber",
    leadText: "Other pupils can only see your friendly competition stats:",
    bulletPoints: [
      "Other pupils can see your username, school, scores, or points on public leaderboards and during duel challenges",
      "They CANNOT see your private account password, your email, or all your individual practice answer records",
    ],
    alertNote: "Your private learning history is kept confidential between you, your parents, and your school teachers.",
  },
  {
    id: "what-not-to-share",
    question: "What shouldn't I share?",
    iconName: "shield-alert",
    themeColor: "rose",
    leadText: "Always protect your personal privacy when using the internet:",
    bulletPoints: [
      "Keep your password completely secret — never give it to friends or classmates",
      "Do NOT share your home address or phone number with other pupils",
      "Do NOT share private family details online",
    ],
    alertNote: "If anyone ever asks you for your password or personal contact details, tell your parent, guardian, or teacher right away!",
  },
  {
    id: "if-worried",
    question: "What if something worries me?",
    iconName: "help-circle",
    themeColor: "emerald",
    leadText: "You are never alone on Éclat. If anything makes you feel confused or uncomfortable:",
    bulletPoints: [
      "Speak directly with your parent, guardian, or teacher",
      "Your parents or teachers can contact the friendly Éclat support team anytime at support@eclatapp.xyz",
    ],
  },
];

export const pupilPrivacyClosing = {
  heading: "One last thing ✨",
  message:
    "Your information deserves to be treated carefully. We're here to help you learn, master your subjects, and win scholarships — not to make you feel uncomfortable or unsafe.",
};
