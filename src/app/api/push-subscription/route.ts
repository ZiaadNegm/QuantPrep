import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscription } = await request.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        subscription_json: subscription,
        active: true,
      },
      { onConflict: 'user_id,endpoint' }
    );

  if (error) {
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { endpoint } = await request.json();
  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  await supabase
    .from('push_subscriptions')
    .update({ active: false })
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  return NextResponse.json({ ok: true });
}
