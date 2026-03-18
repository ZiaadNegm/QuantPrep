'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, timezone')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name ?? '')
        setTimezone(profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
      } else {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      }
      setLoading(false)
    }
    loadProfile()
  }, [supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, display_name: displayName, timezone, updated_at: new Date().toISOString() })

    if (error) {
      setMessage('Failed to save profile')
    } else {
      setMessage('Profile saved')
    }
    setSaving(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div className="p-8 text-center text-foreground-muted">Loading...</div>
  }

  const initials = displayName
    ? displayName.charAt(0).toUpperCase()
    : 'QP'

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-lg font-medium text-foreground-bright">Profile</h1>

        {/* User info section */}
        <div className="rounded-lg border border-border-subtle bg-background-elevated p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background-card font-mono text-xl text-foreground-muted">
              {initials}
            </div>
            <div>
              <p className="font-medium text-foreground-bright">
                {displayName || 'No display name'}
              </p>
              <p className="text-sm text-foreground-muted">{email}</p>
            </div>
          </div>
        </div>

        {/* Settings section */}
        <form onSubmit={handleSave} className="rounded-lg border border-border-subtle bg-background-elevated p-6 space-y-5">
          <h2 className="text-xs uppercase tracking-wider text-foreground-muted">Settings</h2>

          <div>
            <label className="mb-1 block text-sm text-foreground-muted">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-md border border-border bg-background-card px-4 py-2.5 text-foreground-muted cursor-not-allowed outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-foreground-muted">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-md border border-border bg-background-elevated px-4 py-2.5 text-foreground outline-none transition-colors focus:border-foreground-muted"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-foreground-muted">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-border bg-background-elevated px-4 py-2.5 text-foreground outline-none transition-colors focus:border-foreground-muted"
            >
              {Intl.supportedValuesOf('timeZone').map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md border border-foreground-muted bg-background-card py-2.5 font-medium text-foreground-bright transition-all hover:bg-background-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          {message && (
            <p className={`text-sm ${message.includes('Failed') ? 'text-error' : 'text-success'}`}>
              {message}
            </p>
          )}
        </form>

        {/* Sign out section */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleSignOut}
            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
