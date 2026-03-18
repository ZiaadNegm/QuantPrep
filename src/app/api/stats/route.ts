import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all completed sessions for this user
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (sessionsError) {
      return NextResponse.json({ error: 'Failed to fetch sessions', details: sessionsError.message }, { status: 500 });
    }

    // Fetch current streak
    const { data: streak } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .single();

    const totalSessions = sessions?.length ?? 0;
    const totalQuestionsAnswered = sessions?.reduce((sum, s) => sum + (s.total_answered ?? 0), 0) ?? 0;
    const currentStreak = streak?.current_streak ?? 0;

    // Recent 7-day snapshot
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sessions?.filter(
      (s) => s.completed_at && new Date(s.completed_at) >= sevenDaysAgo
    ) ?? [];

    let recentAvgAccuracy = 0;
    let recentAvgResponseTimeMs = 0;
    let recentPercentWithinTarget = 0;

    if (recentSessions.length > 0) {
      const totalAccuracy = recentSessions.reduce((sum, s) => sum + (s.accuracy ?? 0), 0);
      recentAvgAccuracy = totalAccuracy / recentSessions.length;

      const sessionsWithResponseTime = recentSessions.filter((s) => s.avg_response_time_ms != null);
      if (sessionsWithResponseTime.length > 0) {
        recentAvgResponseTimeMs =
          sessionsWithResponseTime.reduce((sum, s) => sum + s.avg_response_time_ms, 0) /
          sessionsWithResponseTime.length;
      }

      const totalPwt = recentSessions.reduce((sum, s) => sum + (s.percent_within_target ?? 0), 0);
      recentPercentWithinTarget = totalPwt / recentSessions.length;
    }

    // Accuracy over time (last 30 days, grouped by date)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30Sessions = sessions?.filter(
      (s) => s.completed_at && new Date(s.completed_at) >= thirtyDaysAgo
    ) ?? [];

    const accuracyByDate = new Map<string, { total: number; count: number }>();
    const responseTimeByDate = new Map<string, { total: number; count: number }>();

    for (const s of last30Sessions) {
      const date = new Date(s.completed_at).toISOString().split('T')[0];

      if (s.accuracy != null) {
        const entry = accuracyByDate.get(date) ?? { total: 0, count: 0 };
        entry.total += s.accuracy;
        entry.count += 1;
        accuracyByDate.set(date, entry);
      }

      if (s.avg_response_time_ms != null) {
        const entry = responseTimeByDate.get(date) ?? { total: 0, count: 0 };
        entry.total += s.avg_response_time_ms;
        entry.count += 1;
        responseTimeByDate.set(date, entry);
      }
    }

    const accuracyOverTime = Array.from(accuracyByDate.entries())
      .map(([date, { total, count }]) => ({
        date,
        accuracy: Math.round((total / count) * 1000) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const responseTimeOverTime = Array.from(responseTimeByDate.entries())
      .map(([date, { total, count }]) => ({
        date,
        avgResponseTimeMs: Math.round(total / count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalSessions,
      totalQuestionsAnswered,
      currentStreak,
      recentSnapshot: {
        avgAccuracy: Math.round(recentAvgAccuracy * 1000) / 10,
        avgResponseTimeMs: Math.round(recentAvgResponseTimeMs),
        percentWithinTarget: Math.round(recentPercentWithinTarget * 1000) / 10,
      },
      accuracyOverTime,
      responseTimeOverTime,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
