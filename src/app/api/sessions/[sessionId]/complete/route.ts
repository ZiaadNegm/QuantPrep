import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAnswer } from '@/lib/generator';

interface ClientAnswer {
  questionIndex: number;
  userAnswer: string | null;
  responseTimeMs: number;
  skipped: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse optional answers from request body
    let clientAnswers: ClientAnswer[] | null = null;
    try {
      const body = await request.json();
      if (body.answers && Array.isArray(body.answers)) {
        clientAnswers = body.answers;
      }
    } catch {
      // No body or invalid JSON — that's fine, we'll use fallback behavior
    }

    // Fetch all questions for this session
    const { data: questions, error: questionsError } = await supabase
      .from('question_instances')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true });

    if (questionsError || !questions) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // If client provided answers, bulk-update question_instances
    if (clientAnswers && clientAnswers.length > 0) {
      // Build a map of question by order_index for quick lookup
      const questionMap = new Map(questions.map((q) => [q.order_index, q]));

      for (const ans of clientAnswers) {
        const question = questionMap.get(ans.questionIndex);
        if (!question) continue;

        // Already answered on server (from a previous submission) — skip
        if (question.user_answer !== null || question.skipped) continue;

        if (ans.skipped) {
          await supabase
            .from('question_instances')
            .update({
              skipped: true,
              response_time_ms: ans.responseTimeMs,
              answered_at: new Date().toISOString(),
            })
            .eq('id', question.id);
        } else if (ans.userAnswer) {
          // Check answer server-side — never trust the client
          const isCorrect = checkAnswer(ans.userAnswer, question.correct_answer);

          await supabase
            .from('question_instances')
            .update({
              user_answer: ans.userAnswer,
              is_correct: isCorrect,
              skipped: false,
              response_time_ms: ans.responseTimeMs,
              answered_at: new Date().toISOString(),
            })
            .eq('id', question.id);
        }
      }
    }

    // Mark any remaining unanswered questions as skipped
    await supabase
      .from('question_instances')
      .update({
        skipped: true,
        answered_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .is('user_answer', null)
      .eq('skipped', false);

    // Re-fetch questions after updates for accurate aggregation
    const { data: updatedQuestions, error: refetchError } = await supabase
      .from('question_instances')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true });

    if (refetchError || !updatedQuestions) {
      return NextResponse.json({ error: 'Failed to fetch updated questions' }, { status: 500 });
    }

    // Compute aggregates
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let totalResponseTimeMs = 0;
    let responseTimeCount = 0;
    let withinTargetCount = 0;

    for (const q of updatedQuestions) {
      if (q.skipped) {
        skippedCount++;
      } else if (q.is_correct === true) {
        correctCount++;
      } else if (q.is_correct === false) {
        wrongCount++;
      }

      if (q.response_time_ms != null) {
        totalResponseTimeMs += q.response_time_ms;
        responseTimeCount++;
      }

      if (q.response_time_ms != null && q.target_time_seconds != null && !q.skipped) {
        if (q.response_time_ms <= q.target_time_seconds * 1000) {
          withinTargetCount++;
        }
      }
    }

    const totalAnswered = correctCount + wrongCount;
    const accuracy = totalAnswered > 0 ? correctCount / totalAnswered : 0;
    const avgResponseTimeMs = responseTimeCount > 0 ? Math.round(totalResponseTimeMs / responseTimeCount) : null;
    const percentWithinTarget = totalAnswered > 0 ? withinTargetCount / totalAnswered : 0;

    // Score: practice = +1 per correct; test = +1 correct, -1 wrong
    let score: number;
    if (session.mode === 'test') {
      score = correctCount - wrongCount;
    } else {
      score = correctCount;
    }

    const now = new Date().toISOString();

    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({
        score,
        accuracy,
        avg_response_time_ms: avgResponseTimeMs,
        correct_count: correctCount,
        wrong_count: wrongCount,
        skipped_count: skippedCount,
        total_answered: totalAnswered,
        percent_within_target: percentWithinTarget,
        status: 'completed',
        completed_at: now,
        ended_at: now,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to complete session', details: updateError.message }, { status: 500 });
    }

    // Update streak
    try {
      await updateStreak(supabase, user.id, totalAnswered);
    } catch {
      // Non-fatal: streak update failure should not block session completion
    }

    return NextResponse.json({
      session: updatedSession,
      questions: updatedQuestions,
      results: {
        score,
        accuracy,
        avgResponseTimeMs,
        correctCount,
        wrongCount,
        skippedCount,
        totalAnswered,
        percentWithinTarget,
      },
    });
  } catch (err) {
    console.error('POST /api/sessions/[id]/complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateStreak(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  userId: string,
  totalAnswered: number
) {
  const qualifyingThreshold = 5;
  if (totalAnswered < qualifyingThreshold) return;

  // Try to get user timezone from profiles
  let userTimezone = 'UTC';
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', userId)
      .single();
    if (profile?.timezone) {
      userTimezone = profile.timezone;
    }
  } catch {
    // Profiles table may not exist; use UTC
  }

  // Get today's date in user's timezone
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: userTimezone }); // YYYY-MM-DD format

  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!streak) {
    // Create new streak
    await supabase
      .from('streaks')
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_qualifying_date: todayStr,
      });
    return;
  }

  const lastDate = streak.last_qualifying_date;

  if (lastDate === todayStr) {
    // Already counted today, no change
    return;
  }

  // Check if last qualifying date was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: userTimezone });

  let newStreak: number;
  if (lastDate === yesterdayStr) {
    // Continue streak
    newStreak = (streak.current_streak || 0) + 1;
  } else {
    // Reset streak
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, streak.longest_streak || 0);

  await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_qualifying_date: todayStr,
    })
    .eq('user_id', userId);
}
