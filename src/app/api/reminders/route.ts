import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('user_reminders')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!data) {
    // Return defaults
    return NextResponse.json({
      user_id: user.id,
      enabled: false,
      reminder_time: '09:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      last_sent_at: null,
    });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { enabled, reminder_time, timezone } = await request.json();

  const { error } = await supabase
    .from('user_reminders')
    .upsert(
      {
        user_id: user.id,
        enabled: enabled ?? false,
        reminder_time: reminder_time ?? '09:00',
        timezone: timezone ?? 'UTC',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    return NextResponse.json({ error: 'Failed to save reminder settings' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
