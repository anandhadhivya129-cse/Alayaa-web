import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, Loader2, MapPin, MessageSquare, Phone, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  createEnquiry,
  fetchProfileById,
  fetchFavorites,
  fetchPropertyById,
  toggleFavorite,
} from '../services/Api.jsx'

function formatPrice(value) {
  if (!Number.isFinite(value)) return 'On request'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

export default function PropertyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [property, setProperty] = useState(null)
  const [broker, setBroker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingFavorite, setSavingFavorite] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [enquiry, setEnquiry] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isFavourite, setIsFavourite] = useState(false)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchPropertyById(id)
        if (!mounted) return
        setProperty(data)
        if (user?.id) {
          const currentFavorites = await fetchFavorites(user.id)
          if (mounted) {
            setIsFavourite(currentFavorites.some((favorite) => favorite.property_id === data.id))
          }
        }
        if (data?.broker_id) {
          const brokerProfile = await fetchProfileById(data.broker_id)
          if (mounted) setBroker(brokerProfile)
        }
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [id, user?.id])

  const images = useMemo(() => property?.images || [], [property])

  const handleFavourite = async () => {
    if (!user?.id) {
      setMessage('Please sign in to save this property.')
      return
    }
    setSavingFavorite(true)
    setMessage('')
    try {
      const result = await toggleFavorite(user.id, property.id)
      setIsFavourite(result.favorited)
      setMessage(result.favorited ? 'Added to your favorites.' : 'Removed from your favorites.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingFavorite(false)
    }
  }

  const handleEnquiry = async (event) => {
    event.preventDefault()
    if (!user?.id) {
      setMessage('Please sign in to send an enquiry.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await createEnquiry({
        customer_id: user.id,
        customer_email: user.email,
        customer_name: user.profile?.full_name || '',
        property_id: property.id,
        broker_id: property.broker_id,
        broker_email: broker?.email || '',
        property_title: property.title,
        message: enquiry,
      })
      setEnquiry('')
      setMessage('Your enquiry has been sent successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] text-[#6B7280]">
        <Loader2 className="mr-2 animate-spin" size={18} />
        Loading property...
      </div>
    )
  }

  if (error && !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4">
        <div className="surface max-w-lg rounded-[28px] p-8 text-center">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <Link to="/" className="mt-4 inline-flex btn-primary rounded-2xl px-5 py-3 font-bold">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  if (!property) return null

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-sm font-bold text-[#6B7280] hover:text-[#0F766E]">
            Back to listings
          </Link>
          <button
            onClick={handleFavourite}
            disabled={savingFavorite}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-bold text-[#1F2937] shadow-sm transition hover:border-[#0F766E]/30 hover:text-[#0F766E] disabled:opacity-60"
          >
            <Heart size={16} className={isFavourite ? 'fill-current text-[#0F766E]' : ''} />
            {savingFavorite ? 'Saving...' : isFavourite ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.45fr_.85fr]">
          <section className="surface overflow-hidden rounded-[28px]">
            {images.length ? (
              <div className="grid gap-1 sm:grid-cols-2">
                {images.slice(0, 4).map((src, index) => (
                  <img
                    key={`${src}-${index}`}
                    src={src}
                    alt={property.title}
                    className={`h-64 w-full object-cover ${index === 0 ? 'sm:col-span-2 sm:h-96' : 'sm:h-48'}`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center bg-[#F8F8F7] text-[#6B7280]">
                No images available
              </div>
            )}
            <div className="p-6 sm:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F0FAF8] px-3 py-1 text-xs font-bold text-[#0F766E]">
                  {property.property_type}
                </span>
                <span className="rounded-full bg-[#F8F8F7] px-3 py-1 text-xs font-bold text-[#6B7280]">
                  {property.status}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#1F2937]">{property.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#6B7280]">
               <span className="inline-flex items-center gap-1.5">
  <MapPin size={16} className="text-[#0F766E]" />
  {property.location}, {property.city}
</span>
<span>{property.bhk} BHK</span>
<span>{property.bedrooms} beds</span>
<span>{property.bathrooms} baths</span>
<span>{property.area} sq ft</span>
<span>{property.furnishing}</span>
</div>
<div className="mt-5 text-3xl font-extrabold text-[#134E4A]">{property.priceLabel}</div>
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#6B7280]">{property.description}</p>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="surface rounded-[28px] p-6">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#6B7280]">Broker</div>
              <div className="flex items-center gap-4">
                <Avatar profile={broker} />
                <div>
                  <div className="text-lg font-extrabold text-[#1F2937]">{broker?.full_name || 'Broker'}</div>
                  <div className="text-sm text-[#6B7280]">{broker?.city || 'Tamil Nadu'}</div>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-[#6B7280]">
                {broker?.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone size={15} className="text-[#0F766E]" />
                    {broker.phone}
                  </div>
                ) : null}
                {broker?.email ? (
                  <div className="flex items-center gap-2">
                    <MessageSquare size={15} className="text-[#0F766E]" />
                    {broker.email}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="surface rounded-[28px] p-6">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#6B7280]">Send enquiry</div>
              {message ? <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
              {error ? <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p> : null}
              <form onSubmit={handleEnquiry} className="space-y-4">
                <label className="block text-sm font-bold text-[#1F2937]">
                  Message
                  <textarea
                    className="input-field mt-2 min-h-32 resize-none"
                    value={enquiry}
                    onChange={(event) => setEnquiry(event.target.value)}
                    placeholder="Tell the broker what you are looking for..."
                    required
                  />
                </label>
                <button type="submit" disabled={submitting} className="btn-primary w-full rounded-2xl py-3 font-bold disabled:opacity-60">
                  {submitting ? 'Sending...' : 'Send enquiry'}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Avatar({ profile }) {
  const initials = profile?.full_name
    ? profile.full_name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : 'B'

  return profile?.profile_picture ? (
    <img src={profile.profile_picture} alt={profile?.full_name || 'Broker'} className="h-14 w-14 rounded-2xl object-cover" />
  ) : (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0FAF8] text-sm font-extrabold text-[#0F766E]">
      {initials}
    </div>
  )
}