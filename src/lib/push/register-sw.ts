export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  if (!('PushManager' in window)) return null;

  try {
    await navigator.serviceWorker.register('/sw.js');
    // navigator.serviceWorker.ready resolves when registration.active is set,
    // but that happens during "activating" — not "activated".
    // iOS Safari requires the SW to be fully "activated" before
    // PushManager.subscribe() will accept any applicationServerKey.
    const ready = await navigator.serviceWorker.ready;

    if (ready.active && ready.active.state !== 'activated') {
      await new Promise<void>((resolve) => {
        ready.active!.addEventListener('statechange', function handler() {
          if (ready.active!.state === 'activated') {
            ready.active!.removeEventListener('statechange', handler);
            resolve();
          }
        });
      });
    }

    return ready;
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}
