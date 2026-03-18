import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_GROUP_BY = ['level', 'operation', 'number_type'] as const;
type GroupByField = (typeof VALID_GROUP_BY)[number];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy') as GroupByField | null;

    if (!groupBy || !VALID_GROUP_BY.includes(groupBy)) {
      return NextResponse.json(
        { error: `Invalid groupBy. Must be one of: ${VALID_GROUP_BY.join(', ')}` },
        { status: 400 }
      );
    }

    // Get all completed session IDs for this user
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (sessionsError) {
      return NextResponse.json({ error: 'Failed to fetch sessions', details: sessionsError.message }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ breakdown: [] });
    }

    const sessionIds = sessions.map((s) => s.id);

    // Fetch question instances for those sessions
    // Supabase has a limit on IN clause size, so batch if needed
    const allQuestions: Record<string, unknown>[] = [];
    const batchSize = 100;

    for (let i = 0; i < sessionIds.length; i += batchSize) {
      const batch = sessionIds.slice(i, i + batchSize);
      const { data: questions, error: questionsError } = await supabase
        .from('question_instances')
        .select('level, operation_type, number_type, is_correct, skipped, response_time_ms')
        .in('session_id', batch);

      if (questionsError) {
        return NextResponse.json({ error: 'Failed to fetch questions', details: questionsError.message }, { status: 500 });
      }

      if (questions) {
        allQuestions.push(...questions);
      }
    }

    // Determine the DB field name for grouping
    const fieldMap: Record<GroupByField, string> = {
      level: 'level',
      operation: 'operation_type',
      number_type: 'number_type',
    };
    const field = fieldMap[groupBy];

    // Aggregate by group
    const groups = new Map<
      string,
      { total: number; correct: number; totalResponseTimeMs: number; responseTimeCount: number }
    >();

    for (const q of allQuestions) {
      const groupValue = String(q[field] ?? 'unknown');
      const entry = groups.get(groupValue) ?? { total: 0, correct: 0, totalResponseTimeMs: 0, responseTimeCount: 0 };

      if (q.skipped) {
        entry.total++;
      } else if (q.is_correct !== null) {
        entry.total++;
        if (q.is_correct) entry.correct++;
      }

      if (typeof q.response_time_ms === 'number') {
        entry.totalResponseTimeMs += q.response_time_ms;
        entry.responseTimeCount++;
      }

      groups.set(groupValue, entry);
    }

    const breakdown = Array.from(groups.entries()).map(([group, data]) => ({
      group,
      total: data.total,
      correct: data.correct,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 1000) / 10 : 0,
      avgResponseTimeMs: data.responseTimeCount > 0 ? Math.round(data.totalResponseTimeMs / data.responseTimeCount) : 0,
    }));

    // Sort by group value
    breakdown.sort((a, b) => a.group.localeCompare(b.group));

    return NextResponse.json({ breakdown });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
