import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') ?? 'all';
    const level = searchParams.get('level');
    const operation = searchParams.get('operation');
    const numberType = searchParams.get('numberType');
    const mode = searchParams.get('mode');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Get user's session IDs (optionally filtered by mode)
    let sessionsQuery = supabase
      .from('sessions')
      .select('id, mode')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (mode && ['practice', 'test'].includes(mode)) {
      sessionsQuery = sessionsQuery.eq('mode', mode);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      return NextResponse.json({ error: 'Failed to fetch sessions', details: sessionsError.message }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ mistakes: [], total: 0 });
    }

    const sessionIds = sessions.map((s) => s.id);
    const sessionModeMap = new Map(sessions.map((s) => [s.id, s.mode]));

    // Fetch question instances that are mistakes
    // We need to handle filtering in JS since Supabase client OR conditions are limited
    const allMistakes: Record<string, unknown>[] = [];
    const batchSize = 100;

    for (let i = 0; i < sessionIds.length; i += batchSize) {
      const batch = sessionIds.slice(i, i + batchSize);

      let query = supabase
        .from('question_instances')
        .select(
          'id, session_id, prompt, user_answer, correct_answer, is_correct, skipped, response_time_ms, answered_at, level, operation_type, number_type, variable_position, target_time_seconds'
        )
        .in('session_id', batch)
        .order('answered_at', { ascending: false });

      // Apply filter
      if (filter === 'incorrect') {
        query = query.eq('is_correct', false).eq('skipped', false);
      } else if (filter === 'skipped') {
        query = query.eq('skipped', true);
      } else {
        // 'all' — get both incorrect and skipped using OR
        query = query.or('is_correct.eq.false,skipped.eq.true');
      }

      // Apply optional filters
      if (level) {
        query = query.eq('level', parseInt(level, 10));
      }
      if (operation) {
        query = query.eq('operation_type', operation);
      }
      if (numberType) {
        query = query.eq('number_type', numberType);
      }

      const { data: questions, error: questionsError } = await query;

      if (questionsError) {
        return NextResponse.json({ error: 'Failed to fetch questions', details: questionsError.message }, { status: 500 });
      }

      if (questions) {
        allMistakes.push(...questions);
      }
    }

    // Sort all mistakes by answered_at desc
    allMistakes.sort((a, b) => {
      const dateA = a.answered_at ? new Date(a.answered_at as string).getTime() : 0;
      const dateB = b.answered_at ? new Date(b.answered_at as string).getTime() : 0;
      return dateB - dateA;
    });

    const total = allMistakes.length;
    const paginated = allMistakes.slice(offset, offset + limit);

    const mistakes = paginated.map((q) => ({
      prompt: q.prompt,
      userAnswer: q.user_answer,
      correctAnswer: q.correct_answer,
      isCorrect: q.is_correct,
      skipped: q.skipped,
      responseTimeMs: q.response_time_ms,
      answeredAt: q.answered_at,
      level: q.level,
      operationType: q.operation_type,
      numberType: q.number_type,
      variablePosition: q.variable_position,
      targetTimeSeconds: q.target_time_seconds,
      sessionMode: sessionModeMap.get(q.session_id as string) ?? null,
      sessionId: q.session_id,
    }));

    return NextResponse.json({ mistakes, total });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
