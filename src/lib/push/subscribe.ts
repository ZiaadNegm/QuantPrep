function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription> {
  const vapidKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '').trim();
  if (!vapidKey) {
    throw new Error('VAPID key missing');
  }

  // iOS Safari prefers DOMString; other browsers use Uint8Array
  if (isIOS()) {
    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    });
  }

  const keyBytes = urlBase64ToUint8Array(vapidKey);
  const keyBuffer = keyBytes.buffer.slice(
    keyBytes.byteOffset,
    keyBytes.byteOffset + keyBytes.byteLength
  ) as ArrayBuffer;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBuffer,
  });
}

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getPermissionState(): PermissionState {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  if (!('PushManager' in window)) return 'unsupported';
  return Notification.permission;
}
