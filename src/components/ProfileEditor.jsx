import { useEffect, useState } from 'react'
import { Camera, CheckCircle2, Loader2, Mail, MapPin, Phone, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function ProfileEditor({ title = 'Profile', subtitle = 'Update your public account details.' }) {
  const { user, updateProfile, uploadProfilePicture } = useAuth()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    bio: '',
    profile_picture: '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.profile) return
    setForm({
      full_name: user.profile.full_name || '',
      email: user.email || user.profile.email || '',
      phone: user.profile.phone || '',
      city: user.profile.city || '',
      bio: user.profile.bio || '',
      profile_picture: user.profile.profile_picture || '',
    })
  }, [user])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await updateProfile({
        full_name: form.full_name,
        phone: form.phone,
        city: form.city,
        bio: form.bio,
        profile_picture: form.profile_picture,
    });
      setMessage('Profile updated successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePictureUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    setMessage('')
    try {
      const updated = await uploadProfilePicture(file)
      setForm((current) => ({ ...current, profile_picture: updated.profile_picture || current.profile_picture }))
      setMessage('Profile picture updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const initials = (form.full_name || user?.profile?.full_name || 'A')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <section className="surface rounded-[28px] p-6 sm:p-8">
      <div className="mb-6">
        <p className="section-eyebrow">Account</p>
        <h2 className="mt-1 text-2xl font-extrabold text-[#1F2937]">{title}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
      </div>

      {message ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="mr-2 inline-block" size={16} />
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-3xl bg-[#F8F8F7] p-5">
        <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-white shadow-sm">
          {form.profile_picture ? (
            <img src={form.profile_picture} alt={form.full_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-[#0F766E]">{initials}</div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-base font-extrabold text-[#1F2937]">Profile photo</div>
          <div className="mt-1 text-sm text-[#6B7280]">Upload a clear avatar for your customer, broker, or admin profile.</div>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-bold text-[#1F2937] shadow-sm transition hover:border-[#0F766E]/30 hover:text-[#0F766E]">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {uploading ? 'Uploading...' : 'Upload photo'}
            <input type="file" accept="image/*" className="sr-only" onChange={handlePictureUpload} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" icon={User}>
            <input
              className="input-field"
              value={form.full_name}
              onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              placeholder="Full name"
              required
            />
          </Field>
          <Field label="Email address" icon={Mail}>
            <input className="input-field bg-[#F8F8F7]" value={form.email} readOnly />
          </Field>
          <Field label="Phone number" icon={Phone}>
            <input
              className="input-field"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field label="City" icon={MapPin}>
            <input
              className="input-field"
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              placeholder="City"
            />
          </Field>
        </div>
        <Field label="Bio">
          <textarea
            className="input-field min-h-28 resize-none"
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            placeholder="Tell people a little about yourself..."
          />
        </Field>
        <button type="submit" disabled={saving} className="btn-primary rounded-2xl px-6 py-3 font-bold disabled:opacity-60">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block text-sm font-bold text-[#1F2937]">
      {label}
      <div className="relative mt-2">
        {Icon ? <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F766E]" /> : null}
        <div className={Icon ? 'pl-11' : ''}>{children}</div>
      </div>
    </label>
  )
}
