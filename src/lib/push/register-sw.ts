export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  if (!('PushManager' in window)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');

    // Wait for the service worker to become active before returning.
    // pushManager.subscribe() fails if the SW is still installing.
    if (registration.installing || registration.waiting) {
      await new Promise<void>((resolve) => {
        const sw = registration.installing || registration.waiting;
        if (!sw) { resolve(); return; }
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') resolve();
        });
        // In case it's already activated by the time we add the listener
        if (sw.state === 'activated') resolve();
      });
    }

    return registration;
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}
