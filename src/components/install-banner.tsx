'use client'

import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Don't show if previously dismissed
    if (localStorage.getItem('quantprep-install-dismissed')) return

    // Don't show if push is not supported
    if (!('PushManager' in window)) return

    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(ios)
    setShow(true)

    // Listen for beforeinstallprompt (Android/Desktop)
    function handlePrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
  }, [])

  function dismiss() {
    localStorage.setItem('quantprep-install-dismissed', '1')
    setShow(false)
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      setShow(false)
    }
  }

  if (!show) return null

  return (
    <div className="mx-6 mt-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
      <div>
        <p className="font-medium text-blue-900">Install QuantPrep for daily reminders</p>
        {isIOS ? (
          <p className="text-blue-700 mt-0.5">
            Tap the share button, then &ldquo;Add to Home Screen&rdquo;
          </p>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="mt-1 text-blue-700 underline hover:text-blue-900"
          >
            Install now
          </button>
        ) : (
          <p className="text-blue-700 mt-0.5">
            Use your browser menu to install this app
          </p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="ml-4 text-blue-400 hover:text-blue-600"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
