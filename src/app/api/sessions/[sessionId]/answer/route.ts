import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAnswer } from '@/lib/generator';

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

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // Check timer expiry for timed sessions
    if (session.timer_enabled && session.timer_duration_seconds && session.started_at) {
      const now = Date.now();
      const startedAt = new Date(session.started_at).getTime();
      const pausedTime = session.elapsed_seconds_at_pause ? session.elapsed_seconds_at_pause * 1000 : 0;
      const elapsed = (now - startedAt - pausedTime) / 1000;
      if (elapsed >= session.timer_duration_seconds) {
        // Auto-complete the session
        await supabase
          .from('sessions')
          .update({ status: 'completed', completed_at: new Date().toISOString(), ended_at: new Date().toISOString() })
          .eq('id', sessionId);
        return NextResponse.json({ error: 'Timer expired', timerExpired: true }, { status: 400 });
      }
    }

    const body = await request.json();
    const { questionIndex, userAnswer, responseTimeMs } = body;

    if (questionIndex === undefined || userAnswer === undefined || responseTimeMs === undefined) {
      return NextResponse.json({ error: 'Missing required fields: questionIndex, userAnswer, responseTimeMs' }, { status: 400 });
    }

    // Get the question at the given order index
    const { data: question, error: questionError } = await supabase
      .from('question_instances')
      .select('*')
      .eq('session_id', sessionId)
      .eq('order_index', questionIndex)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check answer server-side
    const isCorrect = checkAnswer(userAnswer, question.correct_answer);

    // Update question instance
    const { error: updateError } = await supabase
      .from('question_instances')
      .update({
        user_answer: userAnswer,
        is_correct: isCorrect,
        skipped: false,
        response_time_ms: responseTimeMs,
        answered_at: new Date().toISOString(),
      })
      .eq('id', question.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update question', details: updateError.message }, { status: 500 });
    }

    // Bump current_question_index
    const nextIndex = questionIndex + 1;
    await supabase
      .from('sessions')
      .update({ current_question_index: nextIndex })
      .eq('id', sessionId);

    // Get next question
    if (nextIndex < (session.question_count_target ?? Infinity)) {
      const { data: nextQuestion } = await supabase
        .from('question_instances')
        .select('prompt, order_index, target_time_seconds')
        .eq('session_id', sessionId)
        .eq('order_index', nextIndex)
        .single();

      return NextResponse.json({
        isCorrect,
        correctAnswer: question.correct_answer,
        nextQuestion: nextQuestion
          ? {
              prompt: nextQuestion.prompt,
              orderIndex: nextQuestion.order_index,
              targetTimeSeconds: nextQuestion.target_time_seconds,
            }
          : null,
      });
    }

    return NextResponse.json({
      isCorrect,
      correctAnswer: question.correct_answer,
      nextQuestion: null,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
