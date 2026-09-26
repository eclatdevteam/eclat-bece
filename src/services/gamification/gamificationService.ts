/**
 * Éclat Gamification Service
 * Orchestrates pure domain calculation engines with Supabase persistence
 */

import { supabase } from "@/integrations/supabase/client";
import { calculateSessionPoints } from "./pointsEngine";
import { updateTopicMastery } from "./masteryEngine";
import { evaluateDailyStreak } from "./streakEngine";
import { calculateStudentLevel } from "./levelEngine";
import { evaluateBadgesToUnlock, BadgeDefinition } from "./badgeEngine";
import {
  SessionQuestionInput,
  SessionPointResult,
  TopicMasteryState,
  StreakState,
  StudentLevelInfo,
} from "./types";

export interface RecordSessionGamificationParams {
  studentId: string;
  quizResultId?: string;
  subject: string;
  topic?: string;
  questions: SessionQuestionInput[];
  isDedicatedFocusSession?: boolean;
}

export interface GamificationSessionOutcome {
  pointResult: SessionPointResult;
  masteryOutcome?: {
    previousStatus: string;
    newStatus: string;
    previousAccuracy: number;
    newAccuracy: number;
    totalBonusEP: number;
  };
  streakOutcome?: {
    currentStreak: number;
    streakIncremented: boolean;
    streakPreservedByShield: boolean;
    milestoneBonusEP: number;
  };
  levelOutcome: StudentLevelInfo;
  unlockedBadges: BadgeDefinition[];
}

export async function recordSessionGamification(
  params: RecordSessionGamificationParams
): Promise<GamificationSessionOutcome> {
  const {
    studentId,
    quizResultId,
    subject,
    topic = "General",
    questions,
    isDedicatedFocusSession = false,
  } = params;

  // 1. Calculate session points and itemized breakdown
  const pointResult = calculateSessionPoints(questions, isDedicatedFocusSession);

  // 2. Fetch current gamification profile
  const { data: profile } = await supabase
    .from("student_gamification_profile" as any)
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  const currentLifetimeEP = Number(profile?.lifetime_ep || 0);
  const currentWeeklyEP = Number(profile?.weekly_ep || 0);
  const currentMonthlyEP = Number(profile?.monthly_ep || 0);
  const currentStreak = Number(profile?.streak_count || 0);
  const longestStreak = Number(profile?.longest_streak || 0);
  const streakShields = Number(profile?.streak_shields || 0);
  const lastQualifyingDate = profile?.last_qualifying_date || null;

  let netSessionEP = pointResult.totalEP;

  // Insert base point items into ledger
  const ledgerEntries = pointResult.breakdown.map((item) => ({
    student_id: studentId,
    amount: item.amount,
    source_type: item.category,
    reference_id: quizResultId || null,
    metadata: {
      label: item.label,
      description: item.description,
      subject,
      topic,
    },
  }));

  // 3. Process Topic Mastery (Rolling 30-question window)
  let masteryOutcome: GamificationSessionOutcome["masteryOutcome"] = undefined;
  if (topic && questions.length > 0) {
    const { data: existingMastery } = await supabase
      .from("student_topic_mastery" as any)
      .select("*")
      .eq("student_id", studentId)
      .eq("subject", subject)
      .eq("topic", topic)
      .maybeSingle();

    const topicState: TopicMasteryState = {
      subject,
      topic,
      rollingAnswers: (existingMastery?.rolling_answers as boolean[]) || [],
      rollingAccuracy: Number(existingMastery?.rolling_accuracy || 0),
      status: (existingMastery?.status as any) || "developing",
      totalAttempted: Number(existingMastery?.total_attempted || 0),
    };

    const sessionAnswers = questions.map((q) => q.isCorrect);
    const masteryEval = updateTopicMastery(topicState, sessionAnswers);

    // Save updated mastery to database
    await (supabase.from("student_topic_mastery" as any) as any).upsert(
      {
        student_id: studentId,
        subject,
        topic,
        rolling_answers: masteryEval.updatedRollingAnswers,
        rolling_accuracy: masteryEval.newAccuracy,
        status: masteryEval.newStatus,
        total_attempted: topicState.totalAttempted + sessionAnswers.length,
        last_assessed_at: new Date().toISOString(),
      },
      { onConflict: "student_id,subject,topic" }
    );

    if (masteryEval.totalBonusEP > 0) {
      netSessionEP += masteryEval.totalBonusEP;
      ledgerEntries.push({
        student_id: studentId,
        amount: masteryEval.totalBonusEP,
        source_type: "milestone_bonus",
        reference_id: quizResultId || null,
        metadata: {
          label: "Mastery Transition Bonus",
          description: `Progressed from ${masteryEval.previousStatus} (${masteryEval.previousAccuracy}%) to ${masteryEval.newStatus} (${masteryEval.newAccuracy}%)`,
          subject,
          topic,
        },
      });
    }

    masteryOutcome = {
      previousStatus: masteryEval.previousStatus,
      newStatus: masteryEval.newStatus,
      previousAccuracy: masteryEval.previousAccuracy,
      newAccuracy: masteryEval.newAccuracy,
      totalBonusEP: masteryEval.totalBonusEP,
    };
  }

  // 4. Evaluate Streak & Streak Shields
  const todayUTC = new Date().toISOString().split("T")[0];
  const currentStreakState: StreakState = {
    currentStreak,
    longestStreak,
    lastQualifyingDate,
    streakShields,
  };

  const streakEval = evaluateDailyStreak({
    currentState: currentStreakState,
    dateUTC: todayUTC,
    questionsAnsweredToday: questions.length,
  });

  if (streakEval.streakBonusEP > 0) {
    netSessionEP += streakEval.streakBonusEP;
    ledgerEntries.push({
      student_id: studentId,
      amount: streakEval.streakBonusEP,
      source_type: "streak_bonus",
      reference_id: quizResultId || null,
      metadata: {
        label: `Streak Milestone (${streakEval.milestoneClassification || `Day ${streakEval.newState.currentStreak}`})`,
        streakDay: streakEval.newState.currentStreak,
      },
    });
  }

  // 5. Batch write ledger entries
  if (ledgerEntries.length > 0) {
    await supabase.from("student_points_ledger" as any).insert(ledgerEntries);
  }

  // 6. Check and award any newly unlocked Badges
  const { data: existingBadges } = await supabase
    .from("student_badges" as any)
    .select("badge_id")
    .eq("student_id", studentId);

  const earnedBadgeIds = (existingBadges || []).map((b: any) => b.badge_id);

  const unlockedBadges = evaluateBadgesToUnlock(
    {
      totalSessionsCompleted: 1, // At least 1
      currentStreak: streakEval.newState.currentStreak,
      sessionQuestionsCount: questions.length,
      sessionAccuracyPercent: pointResult.accuracyPercentage,
      distinctTopicsAttemptedCount: 1,
    },
    earnedBadgeIds
  );

  for (const badge of unlockedBadges) {
    netSessionEP += badge.rewardEP;

    await (supabase.from("student_badges" as any) as any).insert({
      student_id: studentId,
      badge_id: badge.id,
      tier: 1,
      metadata: {
        title: badge.title,
        rarity: badge.rarity,
        rewardEP: badge.rewardEP,
      },
    });

    await supabase.from("student_points_ledger" as any).insert({
      student_id: studentId,
      amount: badge.rewardEP,
      source_type: "badge_unlock",
      reference_id: quizResultId || null,
      metadata: {
        label: `Badge Unlocked: ${badge.title}`,
        badgeId: badge.id,
        rarity: badge.rarity,
      },
    });
  }

  // 7. Update Student Gamification Profile with cumulative totals
  const newLifetimeEP = currentLifetimeEP + netSessionEP;
  const levelOutcome = calculateStudentLevel(newLifetimeEP);

  await (supabase.from("student_gamification_profile" as any) as any).upsert(
    {
      student_id: studentId,
      lifetime_ep: newLifetimeEP,
      current_level: levelOutcome.level,
      weekly_ep: currentWeeklyEP + netSessionEP,
      monthly_ep: currentMonthlyEP + netSessionEP,
      streak_count: streakEval.newState.currentStreak,
      longest_streak: streakEval.newState.longestStreak,
      last_qualifying_date: streakEval.newState.lastQualifyingDate,
      streak_shields: streakEval.newState.streakShields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" }
  );

  return {
    pointResult,
    masteryOutcome,
    streakOutcome: {
      currentStreak: streakEval.newState.currentStreak,
      streakIncremented: streakEval.streakIncremented,
      streakPreservedByShield: streakEval.streakPreservedByShield,
      milestoneBonusEP: streakEval.streakBonusEP,
    },
    levelOutcome,
    unlockedBadges,
  };
}
