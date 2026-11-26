import React from "react";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { PupilPrivacyView } from "@/components/legal/PupilPrivacyView";
import { pupilPrivacyMetadata } from "@/data/legal/pupilPrivacyData";

export default function PupilPrivacyPage() {
  return (
    <LegalLayout
      title={pupilPrivacyMetadata.title}
      subtitle="A friendly guide for students on how Éclat keeps your personal information, quizzes, and learning stats secure."
      lastUpdated="11 November 2026"
      version="1.0"
    >
      <PupilPrivacyView />
    </LegalLayout>
  );
}
