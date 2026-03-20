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

export interface PushDiagnostics {
  rawKeyLength: number;
  rawKeyPreview: string;
  trimmedKey: string;
  decodedByteLength: number;
  firstByte: string;
  last4Bytes: string;
  hexFirst8: string;
  swState: string;
  attempts: { method: string; result: string }[];
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<{ subscription: PushSubscription; diagnostics: PushDiagnostics }> {
  const raw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
  const key = raw.trim().replace(/^["']|["']$/g, '');
  const keyBytes = urlBase64ToUint8Array(key);

  const diagnostics: PushDiagnostics = {
    rawKeyLength: raw.length,
    rawKeyPreview: raw.slice(0, 10) + '...' + raw.slice(-10),
    trimmedKey: key.slice(0, 10) + '...' + key.slice(-10),
    decodedByteLength: keyBytes.length,
    firstByte: '0x' + (keyBytes[0]?.toString(16).padStart(2, '0') ?? '??'),
    last4Bytes: Array.from(keyBytes.slice(-4)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '),
    hexFirst8: Array.from(keyBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '),
    swState: registration.active?.state ?? registration.installing?.state ?? registration.waiting?.state ?? 'none',
    attempts: [],
  };

  // Wait for SW to be active
  if (!registration.active) {
    await new Promise<void>((resolve) => {
      const sw = registration.installing ?? registration.waiting;
      if (!sw) { resolve(); return; }
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') resolve();
      });
      if (sw.state === 'activated') resolve();
    });
    diagnostics.swState = 'waited->' + (registration.active?.state ?? 'still-none');
  }

  // Attempt 1: Uint8Array directly
  try {
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes,
    });
    diagnostics.attempts.push({ method: 'Uint8Array', result: 'SUCCESS' });
    return { subscription: sub, diagnostics };
  } catch (e) {
    diagnostics.attempts.push({ method: 'Uint8Array', result: (e as Error).message ?? String(e) });
  }

  // Attempt 2: Fresh ArrayBuffer copy
  try {
    const buf = new ArrayBuffer(keyBytes.length);
    new Uint8Array(buf).set(keyBytes);
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: buf,
    });
    diagnostics.attempts.push({ method: 'ArrayBuffer', result: 'SUCCESS' });
    return { subscription: sub, diagnostics };
  } catch (e) {
    diagnostics.attempts.push({ method: 'ArrayBuffer', result: (e as Error).message ?? String(e) });
  }

  // Attempt 3: .buffer slice (some engines need exact-length buffer)
  try {
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength),
    });
    diagnostics.attempts.push({ method: 'buffer.slice', result: 'SUCCESS' });
    return { subscription: sub, diagnostics };
  } catch (e) {
    diagnostics.attempts.push({ method: 'buffer.slice', result: (e as Error).message ?? String(e) });
  }

  // Attempt 4: Raw base64url string
  try {
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
    diagnostics.attempts.push({ method: 'string', result: 'SUCCESS' });
    return { subscription: sub, diagnostics };
  } catch (e) {
    diagnostics.attempts.push({ method: 'string', result: (e as Error).message ?? String(e) });
  }

  throw { diagnostics };
}

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getPermissionState(): PermissionState {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  if (!('PushManager' in window)) return 'unsupported';
  return Notification.permission;
}
