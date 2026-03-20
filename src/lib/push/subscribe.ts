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
): Promise<PushSubscription | null> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.error('VAPID public key not configured');
    return null;
  }

  const keyBytes = urlBase64ToUint8Array(vapidPublicKey);
  // Create a correctly-sized ArrayBuffer from the Uint8Array.
  // Using new Uint8Array(keyBytes).buffer avoids the iOS Safari issue where
  // .buffer on the original array can reference a larger backing store.
  const keyBuffer = new ArrayBuffer(keyBytes.length);
  new Uint8Array(keyBuffer).set(keyBytes);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBuffer,
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
