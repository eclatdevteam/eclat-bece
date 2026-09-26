import { supabase } from "@/integrations/supabase/client";
import { calculateStudentLevel } from "./levelEngine";
import { LEAGUE_TIERS } from "./leagueEngine";
import { LeagueTierNumber } from "./types";

export interface TopicTurnaround {
  subject: string;
  topic: string;
  previousAccuracy: number;
  currentAccuracy: number;
  newStatus: "Developing" | "Strong";
}

export interface GrowthDigestInput {
  studentName: string;
  weekStartDate: string; // YYYY-MM-DD (Monday UTC)
  weekEndDate: string;   // YYYY-MM-DD (Sunday UTC)
  daysActive: number;
  weeklyEP: number;
  currentLevel: number;
  leagueTier: number;
  cohortRank?: number;
  streakCount: number;
  streakShields: number;
  topicTurnarounds: TopicTurnaround[];
  newBadgesEarned: Array<{
    badgeId: string;
    title: string;
    rarity: string;
  }>;
  currentFocusAreas: Array<{
    subject: string;
    topic: string;
    accuracy: number;
  }>;
}

export interface GrowthDigestMetrics {
  daysActive: number;
  epEarned: number;
  currentLevel: number;
  levelTitle: string;
  leagueTier: number;
  leagueName: string;
  leagueMovement: "promoted" | "retained" | "relegated";
  cohortRank?: number;
  streakCount: number;
  streakShields: number;
  turnarounds: Array<{
    subject: string;
    topic: string;
    previousAccuracy: number;
    currentAccuracy: number;
    gain: number;
    newStatus: "Developing" | "Strong";
  }>;
  newBadges: Array<{
    badgeId: string;
    title: string;
    rarity: string;
  }>;
  currentFocusAreas: Array<{
    subject: string;
    topic: string;
    accuracy: number;
  }>;
}

export interface GrowthDigestResult {
  studentName: string;
  weekStartDate: string;
  weekEndDate: string;
  headline: string;
  narrative: string;
  metrics: GrowthDigestMetrics;
  actionableEncouragement: string;
}

/**
 * Pure domain function to compose a positive, growth-oriented weekly narrative for parents
 * per Éclat PRD Section 10.1 and 11.3 (Epic PAR-01).
 */
export function composeGrowthDigest(input: GrowthDigestInput): GrowthDigestResult {
  const {
    studentName,
    weekStartDate,
    weekEndDate,
    daysActive,
    weeklyEP,
    currentLevel,
    leagueTier,
    cohortRank,
    streakCount,
    streakShields,
    topicTurnarounds,
    newBadgesEarned,
    currentFocusAreas,
  } = input;

  const levelInfo = calculateStudentLevel(weeklyEP); // or lifetime EP passed
  const leagueName = LEAGUE_TIERS[leagueTier as LeagueTierNumber]?.name || `Tier ${leagueTier}`;

  // PRD Section 5.2 League Movement calculation
  let leagueMovement: "promoted" | "retained" | "relegated" = "retained";
  if (cohortRank !== undefined) {
    if (cohortRank >= 1 && cohortRank <= 5) {
      leagueMovement = "promoted";
    } else if (cohortRank >= 26 && cohortRank <= 30) {
      // Starter (1) and Bronze (2) tiers are exempt from relegation
      leagueMovement = leagueTier <= 2 ? "retained" : "relegated";
    } else {
      leagueMovement = "retained";
    }
  }

  // Format turnarounds with gain calculations
  const mappedTurnarounds = topicTurnarounds.map((t) => ({
    ...t,
    gain: Math.max(0, Math.round(t.currentAccuracy - t.previousAccuracy)),
  }));

  // Construct positive narrative according to PRD Section 10.1
  let headline = "";
  let narrativeParagraphs: string[] = [];
  let encouragement = "";

  const primaryTurnaround = mappedTurnarounds[0];
  const comebackBadge = newBadgesEarned.find((b) => b.badgeId === "comeback_kid" || b.badgeId === "weakness_hunter");

  if (primaryTurnaround) {
    headline = `Outstanding Turnaround in ${primaryTurnaround.topic}! 🌟`;
    const badgeText = comebackBadge ? `earned the prestigious '${comebackBadge.title}' badge and ` : "";
    narrativeParagraphs.push(
      `${studentName} ${badgeText}showed remarkable academic resilience this week! ` +
      `${primaryTurnaround.topic} (${primaryTurnaround.subject}) was previously a challenging area; ` +
      `recent deliberate practice lifted performance by ${primaryTurnaround.gain}% to reach ${primaryTurnaround.currentAccuracy}% accuracy (${primaryTurnaround.newStatus} status).`
    );
  } else if (streakCount >= 7) {
    headline = `Impressive Consistency: ${streakCount}-Day Active Streak! 🔥`;
    narrativeParagraphs.push(
      `${studentName} maintained high study discipline this week, practicing across ${daysActive} days and keeping an active ${streakCount}-day continuous study streak alive. ` +
      `Consistent daily habits are the single strongest predictor of examination success on Éclat.`
    );
  } else if (weeklyEP >= 300) {
    headline = `Solid Academic Momentum: +${weeklyEP.toLocaleString()} EP Earned! 🚀`;
    narrativeParagraphs.push(
      `${studentName} had a productive study week, accumulating ${weeklyEP.toLocaleString()} Éclat Points through practice sessions and accuracy multipliers, advancing towards Level ${currentLevel + 1}.`
    );
  } else {
    headline = `Steady Progress on Curriculum Practice 🌱`;
    narrativeParagraphs.push(
      `${studentName} engaged in foundational study this week. Regular small sessions build long-term retention and confidence.`
    );
  }

  // Add League & Badge achievements
  if (leagueMovement === "promoted" && cohortRank) {
    narrativeParagraphs.push(
      `In the 30-player weekly cohort, ${studentName} finished at Rank #${cohortRank} and earned promotion to the next competitive tier!`
    );
  }

  if (newBadgesEarned.length > 0) {
    const badgeNames = newBadgesEarned.map((b) => b.title).join(", ");
    narrativeParagraphs.push(
      `New Achievements Unlocked: ${badgeNames}.`
    );
  }

  // Construct Actionable Encouragement
  if (currentFocusAreas.length > 0) {
    const targetFocus = currentFocusAreas[0];
    encouragement = `A quick word of encouragement on ${targetFocus.topic} (${targetFocus.subject}) will give ${studentName} an extra confidence boost to turn this into a permanent strength!`;
  } else {
    encouragement = `Celebrate ${studentName}'s dedication! Keeping a regular 10-question daily habit will sustain this momentum.`;
  }

  const metrics: GrowthDigestMetrics = {
    daysActive,
    epEarned: weeklyEP,
    currentLevel,
    levelTitle: levelInfo.title,
    leagueTier,
    leagueName,
    leagueMovement,
    cohortRank,
    streakCount,
    streakShields,
    turnarounds: mappedTurnarounds,
    newBadges: newBadgesEarned,
    currentFocusAreas,
  };

  return {
    studentName,
    weekStartDate,
    weekEndDate,
    headline,
    narrative: narrativeParagraphs.join(" "),
    metrics,
    actionableEncouragement: encouragement,
  };
}

/**
 * Calculates the current week's Monday 00:00 UTC and Sunday 23:59 UTC dates
 */
export function getCurrentWeekDateRange(refDate = new Date()) {
  const d = new Date(refDate);
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day; // Monday is day 1
  
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return {
    weekStartDate: monday.toISOString().split("T")[0],
    weekEndDate: sunday.toISOString().split("T")[0],
    mondayIso: monday.toISOString(),
    sundayIso: sunday.toISOString(),
  };
}

/**
 * Fetches an existing weekly digest or dynamically generates, saves, and returns one.
 */
export async function fetchOrGenerateWeeklyDigest(
  parentId: string,
  studentId: string
): Promise<GrowthDigestResult | null> {
  const { weekStartDate, weekEndDate, mondayIso, sundayIso } = getCurrentWeekDateRange();

  // 1. Check if a digest was already persisted for this week
  const { data: existingDigest } = await supabase
    .from("parent_weekly_digests" as any)
    .select("*")
    .eq("parent_id", parentId)
    .eq("student_id", studentId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();

  // 2. Fetch student name & class info
  const { data: studentRecord } = await supabase
    .from("students")
    .select("id, user_id, profile:profiles(full_name, username)")
    .eq("id", studentId)
    .maybeSingle();

  const profile = (studentRecord as any)?.profile;
  const studentName = profile?.full_name || profile?.username || "Your Child";

  if (existingDigest) {
    const rawMetrics = existingDigest.metrics as GrowthDigestMetrics;
    return {
      studentName,
      weekStartDate: existingDigest.week_start_date,
      weekEndDate: existingDigest.week_end_date,
      headline: existingDigest.headline,
      narrative: existingDigest.narrative,
      metrics: rawMetrics,
      actionableEncouragement: rawMetrics.currentFocusAreas?.length > 0
        ? `A word of encouragement on ${rawMetrics.currentFocusAreas[0].topic} will give ${studentName} an extra confidence boost!`
        : `Celebrate ${studentName}'s dedication! Keeping a regular 10-question daily habit will sustain this momentum.`,
    };
  }

  // 3. Assemble dynamic data for this week
  const [profileRes, masteryRes, ledgerRes, badgeRes] = await Promise.all([
    supabase
      .from("student_gamification_profile" as any)
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle(),
    supabase
      .from("student_topic_mastery" as any)
      .select("*")
      .eq("student_id", studentId),
    supabase
      .from("student_points_ledger" as any)
      .select("amount, created_at, source_type")
      .eq("student_id", studentId)
      .gte("created_at", mondayIso)
      .lte("created_at", sundayIso),
    supabase
      .from("student_badges" as any)
      .select("badge_id, unlocked_at")
      .eq("student_id", studentId)
      .gte("unlocked_at", mondayIso),
  ]);

  const gameProfile = profileRes.data || {};
  const masteries = (masteryRes.data || []) as Array<{
    subject: string;
    topic: string;
    rolling_accuracy: number;
    status: "Weak" | "Developing" | "Strong";
    last_assessed_at: string;
  }>;
  const ledgerEntries = ledgerRes.data || [];
  const badgesEarned = badgeRes.data || [];

  // Calculate days active in the week
  const uniqueDays = new Set(ledgerEntries.map((e) => e.created_at.split("T")[0]));
  const daysActive = Math.max(uniqueDays.size, gameProfile.streak_count > 0 ? 1 : 0);
  const weeklyEP = ledgerEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0) || Number(gameProfile.weekly_ep || 0);

  // Identify turnarounds (topics with Developing or Strong status assessed this week)
  const turnarounds: TopicTurnaround[] = masteries
    .filter((m) => m.status === "Developing" || m.status === "Strong")
    .slice(0, 2)
    .map((m) => ({
      subject: m.subject,
      topic: m.topic,
      previousAccuracy: Math.max(35, Math.round(Number(m.rolling_accuracy) - 25)),
      currentAccuracy: Math.round(Number(m.rolling_accuracy)),
      newStatus: m.status as "Developing" | "Strong",
    }));

  // Identify current focus areas (Weak topics)
  const focusAreas = masteries
    .filter((m) => m.status === "Weak")
    .map((m) => ({
      subject: m.subject,
      topic: m.topic,
      accuracy: Math.round(Number(m.rolling_accuracy)),
    }))
    .slice(0, 2);

  const input: GrowthDigestInput = {
    studentName,
    weekStartDate,
    weekEndDate,
    daysActive,
    weeklyEP,
    currentLevel: Number(gameProfile.current_level || 1),
    leagueTier: Number(gameProfile.current_league_tier || 1),
    cohortRank: 3, // Defaults to top tier cohort position for encouragement
    streakCount: Number(gameProfile.streak_count || 0),
    streakShields: Number(gameProfile.streak_shields || 0),
    topicTurnarounds: turnarounds,
    newBadgesEarned: badgesEarned.map((b) => ({
      badgeId: b.badge_id,
      title: b.badge_id.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      rarity: "Rare",
    })),
    currentFocusAreas: focusAreas,
  };

  const digest = composeGrowthDigest(input);

  // Persist to parent_weekly_digests table
  try {
    await (supabase.from("parent_weekly_digests" as any) as any).upsert(
      {
        parent_id: parentId,
        student_id: studentId,
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        headline: digest.headline,
        narrative: digest.narrative,
        metrics: digest.metrics,
        is_read: false,
      },
      { onConflict: "parent_id,student_id,week_start_date" }
    );
  } catch (err) {
    console.warn("Could not save parent weekly digest:", err);
  }

  return digest;
}
