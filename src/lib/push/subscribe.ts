export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription> {
  const raw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!raw) {
    throw new Error('VAPID key missing');
  }

  // Sanitize: Next.js NEXT_PUBLIC_ inlining can bake in quotes or whitespace
  const key = raw.trim().replace(/^["']|["']$/g, '');

  // Diagnostic — remove after confirming it works on iOS
  console.log('[push] VAPID key:', JSON.stringify(key), 'len:', key.length);

  if (key.length !== 87) {
    throw new Error(`VAPID key bad length: ${key.length} (expected 87). First 10: "${key.slice(0, 10)}"`);
  }

  // Pass as raw base64url string — most compatible with iOS Safari
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  });
  return subscription;
}

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getPermissionState(): PermissionState {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  if (!('PushManager' in window)) return 'unsupported';
  return Notification.permission;
}
