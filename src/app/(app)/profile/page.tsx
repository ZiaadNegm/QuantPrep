'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ReminderSettings from '@/components/reminder-settings'

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
    return <div className="p-8 text-center text-[#737373]">Loading...</div>
  }

  const initials = displayName
    ? displayName.charAt(0).toUpperCase()
    : 'QP'

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-semibold text-white text-center">Profile</h1>

        {/* User info section */}
        <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#222] text-xl text-[#a3a3a3]">
              {initials}
            </div>
            <div className="text-center">
              <p className="font-medium text-white">
                {displayName || 'No display name'}
              </p>
              <p className="text-sm text-[#737373]">{email}</p>
            </div>
          </div>
        </div>

        {/* Settings section */}
        <form onSubmit={handleSave} className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6 space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">Settings</h2>

          <div>
            <label className="mb-1 block text-sm text-[#737373]">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl border border-[#333] bg-[#1a1a1a] px-4 py-2.5 text-[#737373] cursor-not-allowed outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#737373]">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-[#333] bg-[#171717] px-4 py-2.5 text-[#a3a3a3] outline-none transition-colors focus:border-[#a3a3a3]"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#737373]">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl border border-[#333] bg-[#171717] px-4 py-2.5 text-[#a3a3a3] outline-none transition-colors focus:border-[#a3a3a3]"
            >
              {Intl.supportedValuesOf('timeZone').map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl border border-[#a3a3a3] bg-[#1a1a1a] py-2.5 font-medium text-white transition-all hover:bg-[#222] disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          {message && (
            <p className={`text-sm ${message.includes('Failed') ? 'text-error' : 'text-success'}`}>
              {message}
            </p>
          )}
        </form>

        <ReminderSettings timezone={timezone} />

        {/* Sign out section */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleSignOut}
            className="text-sm text-[#737373] transition-colors hover:text-white cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
