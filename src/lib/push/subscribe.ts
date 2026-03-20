function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription> {
  const raw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!raw) {
    throw new Error('VAPID key missing');
  }

  const key = raw.trim().replace(/^["']|["']$/g, '');
  const keyBytes = urlBase64ToUint8Array(key);

  // Validate through the browser's own crypto stack — this ensures
  // the key is a valid P-256 point according to this engine's implementation.
  // Copy into a fresh ArrayBuffer to satisfy TypeScript and iOS Safari
  const buf = new ArrayBuffer(keyBytes.length);
  new Uint8Array(buf).set(keyBytes);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    buf,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
  const validatedBuffer = await crypto.subtle.exportKey('raw', cryptoKey);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: validatedBuffer,
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
