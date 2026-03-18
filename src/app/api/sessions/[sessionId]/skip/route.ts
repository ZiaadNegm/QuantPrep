import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const body = await request.json();
    const { questionIndex, responseTimeMs } = body;

    if (questionIndex === undefined || responseTimeMs === undefined) {
      return NextResponse.json({ error: 'Missing required fields: questionIndex, responseTimeMs' }, { status: 400 });
    }

    // Get the question
    const { data: question, error: questionError } = await supabase
      .from('question_instances')
      .select('id')
      .eq('session_id', sessionId)
      .eq('order_index', questionIndex)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Mark as skipped
    const { error: updateError } = await supabase
      .from('question_instances')
      .update({
        skipped: true,
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
        nextQuestion: nextQuestion
          ? {
              prompt: nextQuestion.prompt,
              orderIndex: nextQuestion.order_index,
              targetTimeSeconds: nextQuestion.target_time_seconds,
            }
          : null,
      });
    }

    return NextResponse.json({ nextQuestion: null });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
