import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushNotification } from '@/lib/push/server';

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find users whose reminder is due:
  // - enabled = true
  // - reminder_time is within the current 15-minute window in their timezone
  // - last_sent_at is null or not today in their timezone
  const { data: dueReminders, error: queryError } = await supabase
    .rpc('get_due_reminders');

  if (queryError) {
    // Fallback: query directly if RPC doesn't exist
    const { data: reminders, error } = await supabase
      .from('user_reminders')
      .select('*')
      .eq('enabled', true);

    if (error || !reminders) {
      return NextResponse.json({ error: 'Failed to query reminders' }, { status: 500 });
    }

    const now = new Date();
    const results = { sent: 0, expired: 0, failed: 0, skipped: 0 };

    for (const reminder of reminders) {
      // Check if reminder is due in user's timezone
      if (!isReminderDue(reminder, now)) {
        results.skipped++;
        continue;
      }

      // Fetch active push subscriptions for this user
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('id, subscription_json')
        .eq('user_id', reminder.user_id)
        .eq('active', true);

      if (!subscriptions?.length) {
        results.skipped++;
        continue;
      }

      let anySent = false;
      for (const sub of subscriptions) {
        const result = await sendPushNotification(sub.subscription_json, {
          title: 'Time for mental math',
          body: 'Keep your streak alive — quick session',
          url: '/mental-math',
        });

        if (result === 'sent') {
          anySent = true;
          results.sent++;
        } else if (result === 'expired') {
          results.expired++;
          // Mark subscription as inactive
          await supabase
            .from('push_subscriptions')
            .update({ active: false })
            .eq('id', sub.id);
        } else {
          results.failed++;
        }
      }

      // Update last_sent_at if at least one notification was sent
      if (anySent) {
        await supabase
          .from('user_reminders')
          .update({ last_sent_at: now.toISOString() })
          .eq('user_id', reminder.user_id);
      }
    }

    return NextResponse.json({ ok: true, ...results });
  }

  // If RPC exists, use those results
  const results = { sent: 0, expired: 0, failed: 0 };
  const now = new Date();

  for (const reminder of (dueReminders ?? [])) {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, subscription_json')
      .eq('user_id', reminder.user_id)
      .eq('active', true);

    if (!subscriptions?.length) continue;

    let anySent = false;
    for (const sub of subscriptions) {
      const result = await sendPushNotification(sub.subscription_json, {
        title: 'Time for mental math',
        body: 'Keep your streak alive — quick session',
        url: '/mental-math',
      });

      if (result === 'sent') {
        anySent = true;
        results.sent++;
      } else if (result === 'expired') {
        results.expired++;
        await supabase
          .from('push_subscriptions')
          .update({ active: false })
          .eq('id', sub.id);
      } else {
        results.failed++;
      }
    }

    if (anySent) {
      await supabase
        .from('user_reminders')
        .update({ last_sent_at: now.toISOString() })
        .eq('user_id', reminder.user_id);
    }
  }

  return NextResponse.json({ ok: true, ...results });
}

function isReminderDue(
  reminder: { reminder_time: string; timezone: string; last_sent_at: string | null },
  now: Date
): boolean {
  try {
    // Get current time in user's timezone
    const userNow = new Date(now.toLocaleString('en-US', { timeZone: reminder.timezone }));
    const userHour = userNow.getHours();
    const userMinute = userNow.getMinutes();

    // Parse reminder time (HH:MM or HH:MM:SS)
    const [reminderHour, reminderMinute] = reminder.reminder_time.split(':').map(Number);

    // Check if current time is within the 15-minute window after reminder time
    const currentMinutes = userHour * 60 + userMinute;
    const reminderMinutes = reminderHour * 60 + reminderMinute;

    if (currentMinutes < reminderMinutes || currentMinutes >= reminderMinutes + 15) {
      return false;
    }

    // Check if already sent today in user's timezone
    if (reminder.last_sent_at) {
      const lastSent = new Date(reminder.last_sent_at);
      const lastSentInTz = new Date(lastSent.toLocaleString('en-US', { timeZone: reminder.timezone }));
      if (
        lastSentInTz.getFullYear() === userNow.getFullYear() &&
        lastSentInTz.getMonth() === userNow.getMonth() &&
        lastSentInTz.getDate() === userNow.getDate()
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
