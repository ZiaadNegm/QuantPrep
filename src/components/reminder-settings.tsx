'use client'

import { useState, useEffect, useCallback } from 'react'
import { registerServiceWorker } from '@/lib/push/register-sw'
import { subscribeToPush, getPermissionState, type PermissionState } from '@/lib/push/subscribe'

interface Props {
  timezone: string
}

export default function ReminderSettings({ timezone }: Props) {
  const [enabled, setEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [permissionState, setPermissionState] = useState<PermissionState>('default')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setPermissionState(getPermissionState())
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/reminders')
        if (res.ok) {
          const data = await res.json()
          setEnabled(data.enabled)
          setReminderTime(data.reminder_time?.slice(0, 5) ?? '09:00')
        }
      } catch {
        // Use defaults
      }
      setLoading(false)
    }
    load()
  }, [])

  const saveReminder = useCallback(async (newEnabled: boolean, newTime: string) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: newEnabled,
          reminder_time: newTime,
          timezone,
        }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setError('Failed to save reminder settings')
    }
    setSaving(false)
  }, [timezone])

  async function handleToggle() {
    if (!enabled) {
      // Turning ON — need permission + subscription
      if (permissionState === 'denied') {
        setError('Notifications are blocked. Please enable them in your browser settings.')
        return
      }

      if (permissionState === 'default' || permissionState === 'granted') {
        try {
          const permission = await Notification.requestPermission()
          setPermissionState(permission as PermissionState)

          if (permission !== 'granted') {
            setError('Notification permission was not granted')
            return
          }

          // Register SW and subscribe
          const registration = await registerServiceWorker()
          if (!registration) {
            setError('Service worker registration failed. Make sure the app is installed as a PWA.')
            return
          }

          const subscription = await subscribeToPush(registration)
          if (!subscription) {
            setError('Push subscription failed')
            return
          }

          // Save subscription to server
          const res = await fetch('/api/push-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: subscription.toJSON() }),
          })
          if (!res.ok) {
            setError('Failed to save push subscription')
            return
          }
        } catch {
          setError('Failed to set up notifications')
          return
        }
      }

      setEnabled(true)
      await saveReminder(true, reminderTime)
    } else {
      // Turning OFF
      setEnabled(false)
      await saveReminder(false, reminderTime)
    }
  }

  async function handleTimeChange(newTime: string) {
    setReminderTime(newTime)
    if (enabled) {
      await saveReminder(true, newTime)
    }
  }

  if (loading) return null
  if (permissionState === 'unsupported') return null

  return (
    <div className="space-y-3 pt-6 border-t">
      <h2 className="text-sm font-medium text-gray-700">Daily Reminder</h2>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Send a daily practice reminder
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-gray-300'
          } ${saving ? 'opacity-50' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">Reminder time</label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
          />
        </div>
      )}

      {permissionState === 'denied' && (
        <p className="text-xs text-red-600">
          Notifications are blocked. Open your browser settings to re-enable them.
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
