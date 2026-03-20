export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  if (!('PushManager' in window)) return null;

  try {
    await navigator.serviceWorker.register('/sw.js');
    // navigator.serviceWorker.ready resolves only when a SW is active,
    // which is required before calling pushManager.subscribe().
    const ready = await navigator.serviceWorker.ready;
    return ready;
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}
