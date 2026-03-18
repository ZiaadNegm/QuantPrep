import webpush from 'web-push';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    'mailto:noreply@quantprep.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export type SendResult = 'sent' | 'expired' | 'failed';

export async function sendPushNotification(
  subscriptionJson: webpush.PushSubscription,
  payload: { title: string; body: string; url: string }
): Promise<SendResult> {
  ensureConfigured();
  try {
    await webpush.sendNotification(subscriptionJson, JSON.stringify(payload));
    return 'sent';
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 410 || statusCode === 404) {
      return 'expired';
    }
    console.error('Push send failed:', err);
    return 'failed';
  }
}
