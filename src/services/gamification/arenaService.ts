/**
 * Head-to-Head Arena Service
 * Handles persistence, matchmaking queries, duel turn submission, and point distribution
 */

import { supabase } from "@/integrations/supabase/client";
import {
  ArenaMatchInput,
  ArenaMatchResult,
  ArenaChallenge,
} from "./types";
import { calculateArenaMatchEP } from "./arenaEngine";
import { calculateStudentLevel } from "./levelEngine";

export interface CreateChallengeInput {
  challengerId: string;
  opponentId: string;
  challengeName: string;
  subject: string;
  topic?: string;
  maxTimeSeconds: number;
  questionIds: string[];
}

/**
 * Creates and persists a new challenge in the database
 */
export async function createDuelChallenge(input: CreateChallengeInput): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("create_arena_challenge" as any, {
      p_challenger_id: input.challengerId,
      p_opponent_id: input.opponentId,
      p_challenge_name: input.challengeName,
      p_subject: input.subject,
      p_topic: input.topic || null,
      p_max_time_seconds: input.maxTimeSeconds,
      p_question_ids: input.questionIds,
    });

    if (error) throw error;
    return data as string;
  } catch (err) {
    console.error("Failed to create duel challenge:", err);
    throw err;
  }
}

/**
 * Fetches challenges where current student is the opponent and status is 'pending'
 */
export async function fetchIncomingChallenges(studentId: string): Promise<ArenaChallenge[]> {
  try {
    const { data, error } = await supabase
      .from("arena_challenges" as any)
      .select(`
        id,
        challenger_id,
        opponent_id,
        challenge_name,
        subject,
        topic,
        question_ids,
        max_time_seconds,
        status,
        challenger_score,
        opponent_score,
        winner_id,
        created_at,
        challenger:students!arena_challenges_challenger_id_fkey(name, username, school:schools(name))
      `)
      .eq("opponent_id", studentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      challengerId: row.challenger_id,
      opponentId: row.opponent_id,
      challengerName: row.challenger?.name || "Fellow Scholar",
      opponentName: "You",
      challengerSchool: row.challenger?.school?.name,
      subject: row.subject,
      topic: row.topic,
      numberOfQuestions: (row.question_ids || []).length,
      maxTimeSeconds: row.max_time_seconds,
      status: row.status,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("Error fetching incoming challenges:", err);
    return [];
  }
}

/**
 * Fetches active or completed challenges for a student
 */
export async function fetchStudentDuelHistory(studentId: string): Promise<ArenaChallenge[]> {
  try {
    const { data, error } = await supabase
      .from("arena_challenges" as any)
      .select(`
        id,
        challenger_id,
        opponent_id,
        challenge_name,
        subject,
        topic,
        question_ids,
        max_time_seconds,
        status,
        challenger_score,
        challenger_time_taken,
        opponent_score,
        opponent_time_taken,
        challenger_ep,
        opponent_ep,
        winner_id,
        created_at,
        completed_at,
        challenger:students!arena_challenges_challenger_id_fkey(name, username),
        opponent:students!arena_challenges_opponent_id_fkey(name, username)
      `)
      .or(`challenger_id.eq.${studentId},opponent_id.eq.${studentId}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      challengerId: row.challenger_id,
      opponentId: row.opponent_id,
      challengerName: row.challenger?.name || "Challenger",
      opponentName: row.opponent?.name || "Opponent",
      subject: row.subject,
      topic: row.topic,
      numberOfQuestions: (row.question_ids || []).length,
      maxTimeSeconds: row.max_time_seconds,
      status: row.status,
      challengerScore: row.challenger_score,
      challengerTimeSeconds: row.challenger_time_taken,
      opponentScore: row.opponent_score,
      opponentTimeSeconds: row.opponent_time_taken,
      challengerEP: row.challenger_ep,
      opponentEP: row.opponent_ep,
      winnerId: row.winner_id,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    }));
  } catch (err) {
    console.error("Error fetching duel history:", err);
    return [];
  }
}

/**
 * Accepts or declines an incoming challenge
 */
export async function updateChallengeStatus(
  challengeId: string,
  newStatus: "accepted" | "declined"
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("arena_challenges" as any)
      .update({ status: newStatus })
      .eq("id", challengeId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating challenge status:", err);
    return false;
  }
}

/**
 * Submits duel performance for a student and completes the match if both have played
 */
export async function submitDuelTurn(params: {
  challengeId: string;
  studentId: string;
  score: number;
  timeTakenSeconds: number;
}): Promise<{ isMatchComplete: boolean; matchResult?: ArenaMatchResult }> {
  const { challengeId, studentId, score, timeTakenSeconds } = params;

  try {
    // 1. Fetch challenge details
    const { data: challenge, error: fetchErr } = await supabase
      .from("arena_challenges" as any)
      .select("*")
      .eq("id", challengeId)
      .single();

    if (fetchErr || !challenge) {
      throw new Error("Challenge not found");
    }

    const isChallenger = challenge.challenger_id === studentId;
    const opponentId = isChallenger ? challenge.opponent_id : challenge.challenger_id;

    // 2. Update this player's submission
    const updatePayload: any = isChallenger
      ? { challenger_score: score, challenger_time_taken: timeTakenSeconds }
      : { opponent_score: score, opponent_time_taken: timeTakenSeconds };

    const opponentAlreadySubmitted = isChallenger
      ? challenge.opponent_score !== null && challenge.opponent_score !== undefined
      : challenge.challenger_score !== null && challenge.challenger_score !== undefined;

    // If opponent hasn't played yet, just save turn and wait
    if (!opponentAlreadySubmitted) {
      await supabase
        .from("arena_challenges" as any)
        .update(updatePayload)
        .eq("id", challengeId);

      return { isMatchComplete: false };
    }

    // Both players have now submitted: determine winner and calculate EP!
    const cScore = isChallenger ? score : challenge.challenger_score;
    const cTime = isChallenger ? timeTakenSeconds : challenge.challenger_time_taken;
    const oScore = isChallenger ? challenge.opponent_score : score;
    const oTime = isChallenger ? challenge.opponent_time_taken : timeTakenSeconds;

    let winnerId: string | null = null;
    if (cScore > oScore) {
      winnerId = challenge.challenger_id;
    } else if (oScore > cScore) {
      winnerId = challenge.opponent_id;
    } else {
      // Scores tied -> tiebreaker is faster solving time
      if (cTime < oTime) {
        winnerId = challenge.challenger_id;
      } else if (oTime < cTime) {
        winnerId = challenge.opponent_id;
      } else {
        winnerId = null; // Absolute Draw
      }
    }

    // Determine current player's outcome
    let playerOutcome: "win" | "draw" | "loss" = "draw";
    if (winnerId === studentId) playerOutcome = "win";
    else if (winnerId !== null) playerOutcome = "loss";

    // 3. Count matches between this pair in the last 24 hours (anti-collusion check)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: pairMatchesCount } = await supabase
      .from("arena_challenges" as any)
      .select("*", { count: "exact", head: true })
      .or(
        `and(challenger_id.eq.${challenge.challenger_id},opponent_id.eq.${challenge.opponent_id}),and(challenger_id.eq.${challenge.opponent_id},opponent_id.eq.${challenge.challenger_id})`
      )
      .eq("status", "completed")
      .gte("created_at", twentyFourHoursAgo);

    // 4. Fetch profiles for tier & win streak info
    const { data: pProfile } = await supabase
      .from("student_gamification_profile" as any)
      .select("current_league_tier, lifetime_ep, weekly_ep, monthly_ep")
      .eq("student_id", studentId)
      .maybeSingle();

    const { data: oProfile } = await supabase
      .from("student_gamification_profile" as any)
      .select("current_league_tier")
      .eq("student_id", opponentId)
      .maybeSingle();

    const playerTier = pProfile?.current_league_tier || 1;
    const opponentTier = oProfile?.current_league_tier || 1;

    // Calculate EP for this player
    const matchResult = calculateArenaMatchEP({
      outcome: playerOutcome,
      playerTier,
      opponentTier,
      currentWinStreak: 0,
      matchesBetweenPairToday: pairMatchesCount || 0,
    });

    // 5. Save completed challenge record
    updatePayload.winner_id = winnerId;
    updatePayload.status = "completed";
    updatePayload.completed_at = new Date().toISOString();
    if (isChallenger) {
      updatePayload.challenger_ep = matchResult.totalEP;
    } else {
      updatePayload.opponent_ep = matchResult.totalEP;
    }

    await supabase
      .from("arena_challenges" as any)
      .update(updatePayload)
      .eq("id", challengeId);

    // 6. Record points in ledger & profile if EP > 0
    if (matchResult.totalEP > 0) {
      await supabase.from("student_points_ledger" as any).insert({
        student_id: studentId,
        amount: matchResult.totalEP,
        source_type: "session_bonus",
        reference_id: challengeId,
        metadata: {
          label: `Head-to-Head Arena (${playerOutcome.toUpperCase()})`,
          isUpset: matchResult.isUpset,
          streakBonus: matchResult.streakBonusEP,
        },
      });

      const currentLifetime = Number(pProfile?.lifetime_ep || 0);
      const newLifetime = currentLifetime + matchResult.totalEP;
      const levelCalc = calculateStudentLevel(newLifetime);

      await (supabase.from("student_gamification_profile" as any) as any).upsert(
        {
          student_id: studentId,
          lifetime_ep: newLifetime,
          current_level: levelCalc.level,
          weekly_ep: Number(pProfile?.weekly_ep || 0) + matchResult.totalEP,
          monthly_ep: Number(pProfile?.monthly_ep || 0) + matchResult.totalEP,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id" }
      );

      // Update weekly cohort points
      try {
        if (typeof supabase.rpc === "function") {
          await supabase.rpc("update_student_cohort_points" as any, {
            p_student_id: studentId,
            p_additional_ep: matchResult.totalEP,
          });
        }
      } catch (cohortErr) {
        console.warn("Failed to sync cohort points for arena match:", cohortErr);
      }
    }

    return { isMatchComplete: true, matchResult };
  } catch (err) {
    console.error("Error submitting duel turn:", err);
    throw err;
  }
}
