import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Shared domain engines — the same TypeScript sources the client UI imports,
// so the scoring rules can no longer drift between client and server.
import { calculateSessionPoints } from "../_shared/gamification/pointsEngine.ts";
import { updateTopicMastery } from "../_shared/gamification/masteryEngine.ts";
import { evaluateDailyStreak } from "../_shared/gamification/streakEngine.ts";
import { evaluateDailyChallenge } from "../_shared/gamification/dailyChallengeEngine.ts";
import { calculateStudentLevel } from "../_shared/gamification/levelEngine.ts";
import { evaluateBadgesToUnlock } from "../_shared/gamification/badgeEngine.ts";
import {
  evaluateQuestionAttemptAntiGaming,
  applyDailySpeedBonusCap,
} from "../_shared/gamification/antiGamingEngine.ts";
import type {
  SessionQuestionInput,
  TopicMasteryState,
  StreakState,
  StudentLevelInfo,
  DailyChallengeResult,
} from "../_shared/gamification/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

interface AnswerRow {
  question_id: string;
  selected_index: number | null;
  is_correct: boolean;
  graded: boolean;
  time_spent_ms: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: userErr } = await userClient.auth.getUser(
      authHeader.replace(/^Bearer\s+/i, "").trim()
    );
    if (userErr || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    const { sessionId } = await req.json().catch(() => ({}) as { sessionId?: string });
    if (!sessionId) {
      return json({ error: "sessionId is required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // --- Load and authorize the session -----------------------------------
    const { data: session, error: sessionErr } = await admin
      .from("quiz_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessionErr || !session) {
      return json({ error: "Session not found" }, 404);
    }

    const { data: student, error: studentErr } = await admin
      .from("students")
      .select("id, user_id, class_year")
      .eq("id", session.student_id)
      .maybeSingle();
    if (studentErr || !student) {
      return json({ error: "Student profile not found" }, 404);
    }
    if (student.user_id !== userId) {
      return json({ error: "Forbidden" }, 403);
    }
    if (session.status !== "in_progress") {
      return json({ error: "Session already completed" }, 409);
    }

    // --- Load graded answers + question metadata --------------------------
    const { data: answers, error: answersErr } = await admin
      .from("quiz_session_answers")
      .select("question_id, selected_index, is_correct, graded, time_spent_ms")
      .eq("session_id", sessionId);
    if (answersErr) throw answersErr;

    const answerRows = (answers ?? []) as AnswerRow[];
    if (answerRows.length === 0) {
      return json({ error: "Session has no recorded answers" }, 400);
    }

    const questionIds = answerRows.map((a) => a.question_id);
    const isYear6 = await admin
      .from("quiz_questions_year6")
      .select("id, difficulty, topic")
      .in("id", questionIds);
    const isYear9 = await admin
      .from("quiz_questions_year9")
      .select("id, difficulty, topic")
      .in("id", questionIds);
    if (isYear6.error || isYear9.error) throw isYear6.error ?? isYear9.error;

    const metaById = new Map<string, { difficulty: string; topic: string | null }>();
    for (const q of isYear6.data ?? []) metaById.set(q.id, q);
    for (const q of isYear9.data ?? []) metaById.set(q.id, q);

    const todayUTC = new Date().toISOString().split("T")[0];

    // --- Build session inputs with real per-question timing ---------------
    const sessionQuestions: SessionQuestionInput[] = answerRows.map((a) => {
      const meta = metaById.get(a.question_id);
      return {
        questionId: a.question_id,
        difficulty: (meta?.difficulty as SessionQuestionInput["difficulty"]) || "medium",
        isCorrect: a.is_correct,
        timeSpentSeconds: Math.max(0, a.time_spent_ms / 1000),
        expectedTimeSeconds: 60,
        isFocusArea: false,
        questionClassYear: student.class_year ?? undefined,
      };
    });

    // --- Points with per-question anti-gaming (real timings at last!) -----
    const evaluatedQuestions = sessionQuestions.map((q) => {
      const agEval = evaluateQuestionAttemptAntiGaming({
        timeSpentSeconds: q.timeSpentSeconds,
        questionClassYear: q.questionClassYear,
      });
      return {
        ...q,
        antiGamingMultiplier: agEval.epMultiplier,
        antiGamingFlag: agEval.flaggedReason,
      };
    });

    const pointResult = calculateSessionPoints(
      evaluatedQuestions,
      false // dedicated focus sessions are not exercised by the current UI
    );

    let netSessionEP = pointResult.totalEP;
    const subject = session.subject || "Mixed Topics";
    const topic = session.topic || "General";

    // --- Enforce daily speed bonus cap against the ledger -----------------
    if (pointResult.speedBonus > 0) {
      const todayStart = `${todayUTC}T00:00:00.000Z`;
      const { data: todaySpeedRows } = await admin
        .from("student_points_ledger")
        .select("amount")
        .eq("student_id", student.id)
        .eq("source_type", "speed_bonus")
        .gte("created_at", todayStart);
      const speedEarnedToday = (todaySpeedRows ?? []).reduce(
        (acc: number, row: { amount: number }) => acc + Number(row.amount || 0),
        0
      );
      const allowedSpeed = applyDailySpeedBonusCap(speedEarnedToday, pointResult.speedBonus);
      if (allowedSpeed < pointResult.speedBonus) {
        const deduction = pointResult.speedBonus - allowedSpeed;
        pointResult.speedBonus = allowedSpeed;
        pointResult.totalEP -= deduction;
        const speedItem = pointResult.breakdown.find((b) => b.category === "speed_bonus");
        if (speedItem) speedItem.amount = allowedSpeed;
      }
      netSessionEP = pointResult.totalEP;
    }

    const ledgerEntries = pointResult.breakdown.map((item) => ({
      student_id: student.id,
      amount: item.amount,
      source_type: item.category,
      reference_id: null,
      metadata: {
        label: item.label,
        description: item.description,
        subject,
        topic,
      },
    }));

    // --- Daily challenge reward (server-side eligibility) -----------------
    let dailyChallengeOutcome: DailyChallengeResult | undefined;
    if (session.mode === "daily_challenge") {
      dailyChallengeOutcome = evaluateDailyChallenge({
        completedQuestions: answerRows.length,
        scorePercentage: pointResult.accuracyPercentage,
        alreadyCompletedToday: false, // start_quiz_session already gated this
      });
      if (dailyChallengeOutcome.eligible && dailyChallengeOutcome.totalEP > 0) {
        netSessionEP += dailyChallengeOutcome.totalEP;
        ledgerEntries.push({
          student_id: student.id,
          amount: dailyChallengeOutcome.totalEP,
          source_type: "daily_challenge",
          reference_id: null,
          metadata: {
            label: "Daily Challenge Reward",
            description: dailyChallengeOutcome.reason,
          },
        });
      }
    }

    // --- Streak ------------------------------------------------------------
    const { data: profile } = await admin
      .from("student_gamification_profile")
      .select("*")
      .eq("student_id", student.id)
      .maybeSingle();

    const streakEval = evaluateDailyStreak({
      currentState: {
        currentStreak: Number(profile?.streak_count || 0),
        longestStreak: Number(profile?.longest_streak || 0),
        lastQualifyingDate: profile?.last_qualifying_date || null,
        streakShields: Number(profile?.streak_shields || 0),
      } as StreakState,
      dateUTC: todayUTC,
      questionsAnsweredToday: answerRows.length,
      dailyChallengeCompletedToday: dailyChallengeOutcome?.eligible,
    });
    if (streakEval.streakBonusEP > 0) {
      netSessionEP += streakEval.streakBonusEP;
      ledgerEntries.push({
        student_id: student.id,
        amount: streakEval.streakBonusEP,
        source_type: "streak_bonus",
        reference_id: null,
        metadata: {
          label: `Streak Milestone (${streakEval.milestoneClassification || `Day ${streakEval.newState.currentStreak}`})`,
          streakDay: streakEval.newState.currentStreak,
        },
      });
    }

    // --- Topic mastery (single-topic practice only) ------------------------
    let masteryOutcome: Record<string, unknown> | undefined;
    if (session.topic && session.mode !== "daily_challenge") {
      const { data: existingMastery } = await admin
        .from("student_topic_mastery")
        .select("*")
        .eq("student_id", student.id)
        .eq("subject", subject)
        .eq("topic", topic)
        .maybeSingle();

      const topicState: TopicMasteryState = {
        subject,
        topic,
        rollingAnswers: (existingMastery?.rolling_answers as boolean[]) || [],
        rollingAccuracy: Number(existingMastery?.rolling_accuracy || 0),
        status: (existingMastery?.status as TopicMasteryState["status"]) || "developing",
        totalAttempted: Number(existingMastery?.total_attempted || 0),
      };

      const masteryEval = updateTopicMastery(topicState, sessionQuestions.map((q) => q.isCorrect));

      await admin.from("student_topic_mastery").upsert(
        {
          student_id: student.id,
          subject,
          topic,
          rolling_answers: masteryEval.updatedRollingAnswers,
          rolling_accuracy: masteryEval.newAccuracy,
          status: masteryEval.newStatus,
          total_attempted: topicState.totalAttempted + sessionQuestions.length,
          last_assessed_at: new Date().toISOString(),
        },
        { onConflict: "student_id,subject,topic" }
      );

      if (masteryEval.totalBonusEP > 0) {
        netSessionEP += masteryEval.totalBonusEP;
        ledgerEntries.push({
          student_id: student.id,
          amount: masteryEval.totalBonusEP,
          source_type: "milestone_bonus",
          reference_id: null,
          metadata: {
            label: "Mastery Transition Bonus",
            description: `Progressed from ${masteryEval.previousStatus} (${masteryEval.previousAccuracy}%) to ${masteryEval.newStatus} (${masteryEval.newAccuracy}%)`,
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

    // --- Badges -------------------------------------------------------------
    const { data: existingBadges } = await admin
      .from("student_badges")
      .select("badge_id")
      .eq("student_id", student.id);
    const earnedBadgeIds = (existingBadges ?? []).map((b: { badge_id: string }) => b.badge_id);
    const unlockedBadges = evaluateBadgesToUnlock(
      {
        totalSessionsCompleted: 1,
        currentStreak: streakEval.newState.currentStreak,
        sessionQuestionsCount: answerRows.length,
        sessionAccuracyPercent: pointResult.accuracyPercentage,
        distinctTopicsAttemptedCount: 1,
      },
      earnedBadgeIds
    );
    for (const badge of unlockedBadges) {
      netSessionEP += badge.rewardEP;
      await admin.from("student_badges").insert({
        student_id: student.id,
        badge_id: badge.id,
        tier: 1,
        metadata: { title: badge.title, rarity: badge.rarity, rewardEP: badge.rewardEP },
      });
      ledgerEntries.push({
        student_id: student.id,
        amount: badge.rewardEP,
        source_type: "badge_unlock",
        reference_id: null,
        metadata: { label: `Badge Unlocked: ${badge.title}`, badgeId: badge.id },
      });
    }

    // --- Persist: quiz_results ---------------------------------------------
    const correctCount = sessionQuestions.filter((q) => q.isCorrect).length;
    const percentage =
      sessionQuestions.length > 0 ? Math.round((correctCount / sessionQuestions.length) * 100) : 0;

    const { data: quizResult, error: quizErr } = await admin
      .from("quiz_results")
      .insert({
        student_id: student.id,
        subject: session.mode === "daily_challenge" ? "Daily Challenge" : subject,
        score: percentage,
        total_questions: sessionQuestions.length,
        correct_answers: correctCount,
      })
      .select("id")
      .single();
    if (quizErr) throw quizErr;

    for (const entry of ledgerEntries) {
      entry.reference_id = quizResult?.id ?? null;
    }
    if (ledgerEntries.length > 0) {
      const { error: ledgerErr } = await admin.from("student_points_ledger").insert(ledgerEntries);
      if (ledgerErr) throw ledgerErr;
    }

    // --- Persist: profile ---------------------------------------------------
    const newLifetimeEP = Number(profile?.lifetime_ep || 0) + netSessionEP;
    const levelOutcome: StudentLevelInfo = calculateStudentLevel(newLifetimeEP);
    const profileUpdates: Record<string, unknown> = {
      student_id: student.id,
      lifetime_ep: newLifetimeEP,
      current_level: levelOutcome.level,
      weekly_ep: Number(profile?.weekly_ep || 0) + netSessionEP,
      monthly_ep: Number(profile?.monthly_ep || 0) + netSessionEP,
      streak_count: streakEval.newState.currentStreak,
      longest_streak: streakEval.newState.longestStreak,
      last_qualifying_date: streakEval.newState.lastQualifyingDate,
      streak_shields: streakEval.newState.streakShields,
      updated_at: new Date().toISOString(),
    };
    if (session.mode === "daily_challenge" || dailyChallengeOutcome?.eligible) {
      profileUpdates.last_daily_challenge_date = todayUTC;
    }

    const { error: profileErr } = await admin
      .from("student_gamification_profile")
      .upsert(profileUpdates, { onConflict: "student_id" });
    if (profileErr) throw profileErr;

    // --- Persist: cohort points + assignment completion ---------------------
    await admin.rpc("update_student_cohort_points", {
      p_student_id: student.id,
      p_additional_ep: netSessionEP,
    });

    if (session.assignment_id) {
      const { error: assignErr } = await admin
        .from("practice_assignments")
        .update({
          status: "completed",
          score: percentage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.assignment_id);
      if (assignErr) throw assignErr;

      if (session.subject) {
        const { data: studentProfile } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .maybeSingle();
        const { data: assignment } = await admin
          .from("practice_assignments")
          .select("parent_id")
          .eq("id", session.assignment_id)
          .maybeSingle();
        if (assignment?.parent_id) {
          const { data: parentUser } = await admin
            .from("parents")
            .select("user_id")
            .eq("id", assignment.parent_id)
            .maybeSingle();
          if (parentUser?.user_id) {
            await admin.from("notifications").insert({
              user_id: parentUser.user_id,
              type: "assignment_completed",
              title: "Practice Completed",
              message: `${studentProfile?.full_name || "Your child"} completed a ${session.subject} practice task.`,
            });
          }
        }
      }
    }

    // --- Mark session complete ----------------------------------------------
    await admin
      .from("quiz_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    // Per-question answer key so the client can build review snapshots without
    // ever having received the answers up front.
    const questionAnswerKey: Array<{ question_id: string; is_correct: boolean; correct_index: number | null }> = [];
    for (const answer of answerRows) {
      const year = metaById.has(answer.question_id)
        ? ((isYear6.data ?? []).some((q) => q.id === answer.question_id) ? "year_6" : "year_9")
        : null;
      let correctIndex: number | null = null;
      if (year) {
        const table = year === "year_6" ? "quiz_options_year6" : "quiz_options_year9";
        const { data: opts } = await admin
          .from(table)
          .select("id, is_correct, display_order")
          .eq("question_id", answer.question_id)
          .order("display_order", { ascending: true });
        if (opts) {
          const idx = opts.findIndex((o: { is_correct: boolean }) => o.is_correct);
          correctIndex = idx >= 0 ? idx : null;
        }
      }
      questionAnswerKey.push({
        question_id: answer.question_id,
        is_correct: answer.is_correct,
        correct_index: correctIndex,
      });
    }

    return json({
      outcome: {
        quizResultId: quizResult?.id,
        pointResult,
        masteryOutcome,
        streakOutcome: {
          currentStreak: streakEval.newState.currentStreak,
          streakIncremented: streakEval.streakIncremented,
          streakPreservedByShield: streakEval.streakPreservedByShield,
          milestoneBonusEP: streakEval.streakBonusEP,
        },
        dailyChallengeOutcome,
        levelOutcome,
        unlockedBadges,
        questionAnswerKey,
      },
    });
  } catch (err) {
    console.error("complete-quiz-session error:", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
