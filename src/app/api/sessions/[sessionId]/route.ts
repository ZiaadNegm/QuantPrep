import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    const { data: questions, error: questionsError } = await supabase
      .from('question_instances')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true });

    if (questionsError) {
      return NextResponse.json({ error: 'Failed to fetch questions', details: questionsError.message }, { status: 500 });
    }

    // Compute remaining time for timed sessions
    let remainingSeconds: number | null = null;
    if (session.timer_enabled && session.timer_duration_seconds && session.started_at) {
      const now = Date.now();
      const startedAt = new Date(session.started_at).getTime();
      const pausedTime = session.elapsed_seconds_at_pause ? session.elapsed_seconds_at_pause * 1000 : 0;
      const elapsed = now - startedAt - pausedTime;
      remainingSeconds = Math.max(0, session.timer_duration_seconds - elapsed / 1000);
    }

    // Strip correct_answer from unanswered questions, but include answer_length for auto-submit
    const sanitizedQuestions = questions.map((q: Record<string, unknown>) => {
      if (!q.user_answer && !q.skipped) {
        const { correct_answer, ...rest } = q;
        return { ...rest, answer_length: (correct_answer as string).length };
      }
      return q;
    });

    return NextResponse.json({
      session,
      questions: sanitizedQuestions,
      remainingSeconds,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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

    // Verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, user_id, paused_at, elapsed_seconds_at_pause')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.action === 'pause') {
      updates.paused_at = new Date().toISOString();
    } else if (body.action === 'resume') {
      if (session.paused_at) {
        const pausedDuration = (Date.now() - new Date(session.paused_at).getTime()) / 1000;
        const previousPaused = Number(session.elapsed_seconds_at_pause ?? 0);
        updates.elapsed_seconds_at_pause = previousPaused + pausedDuration;
      }
      updates.paused_at = null;
    }

    if (body.currentQuestionIndex !== undefined) {
      updates.current_question_index = body.currentQuestionIndex;
    }
    if (body.pausedAt !== undefined && body.action === undefined) {
      updates.paused_at = body.pausedAt;
    }
    if (body.elapsedSecondsAtPause !== undefined && body.action === undefined) {
      updates.elapsed_seconds_at_pause = body.elapsedSecondsAtPause;
    }

    const { data: updated, error: updateError } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update session', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ session: updated });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
