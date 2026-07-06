import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  LogOut,
  MessageSquare,
  Plus,
  ShieldAlert,
  User,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  MapPin,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import ProfileEditor from '../components/ProfileEditor.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import {
  createProperty,
  deleteProperty,
  fetchBrokerDashboard,
  replyToEnquiry,
  updateProperty,
  uploadPropertyImages,
} from '../services/api.jsx'

const emptyForm = {
  title: '',
  description: '',
  price: '',
  location: '',
  city: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  property_type: 'Apartment',
  status: 'active',
  images: [],
  latitude: null,
  longitude: null,
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export default function BrokerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState({
    properties: [],
    enquiries: [],
    approval: null,
    stats: { totalProperties: 0, totalEnquiries: 0, pendingEnquiries: 0 },
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [fileList, setFileList] = useState([])
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [replyDrafts, setReplyDrafts] = useState({})
  const [replyingId, setReplyingId] = useState('')

  const approvalStatus =
    dashboard.approval?.status || user?.profile?.brokerApproval?.status || 'pending'
  const isApproved =
    !approvalStatus || approvalStatus === 'approved' || approvalStatus === 'pending'

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user?.id) return
      setLoading(true)
      try {
        const data = await fetchBrokerDashboard(user.id)
        if (!active) return
        setDashboard(data)
      } catch (error) {
        if (active) setToast(error.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [user?.id])

  const visibleProperties = useMemo(() => {
    return dashboard.properties.filter((property) => {
      const matchesQuery =
        !query ||
        [property.title, property.location, property.city, property.description]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      const matchesStatus = !filterStatus || property.status === filterStatus
      return matchesQuery && matchesStatus
    })
  }, [dashboard.properties, query, filterStatus])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const startEdit = (property) => {
    setEditingId(property.id)
    setForm({
      title: property.title || '',
      description: property.description || '',
      price: property.price || '',
      location: property.location || '',
      city: property.city || '',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      area: property.area || '',
      property_type: property.property_type || 'Apartment',
      status: property.status || 'active',
      images: property.images || [],
    })
    setFileList([])
    setTab('properties')
  }

  const resetForm = () => {
    setEditingId('')
    setForm(emptyForm)
    setFileList([])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isApproved) {
      setToast('Your broker account must be approved before managing listings.')
      return
    }
    setSaving(true)
    try {
      let imageUrls = form.images
      if (fileList.length) {
        const uploads = await uploadPropertyImages(fileList, user.id)
        imageUrls = [...form.images, ...uploads]
      }
      const payload = {
        ...form,
        price: Number(form.price) * 10000000,
        images: imageUrls,
        broker_id: user.id,
      }
      if (editingId) {
        await updateProperty(editingId, payload)
        setToast('Property updated successfully.')
      } else {
        await createProperty(payload)
        setToast('Property created successfully.')
      }
      const refreshed = await fetchBrokerDashboard(user.id)
      setDashboard(refreshed)
      resetForm()
    } catch (error) {
      setToast(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Delete this property permanently?')) return
    setSaving(true)
    try {
      await deleteProperty(propertyId)
      const refreshed = await fetchBrokerDashboard(user.id)
      setDashboard(refreshed)
      setToast('Property deleted.')
    } catch (error) {
      setToast(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReply = async (enquiry) => {
    const message = (replyDrafts[enquiry.id] || '').trim()
    if (!message) {
      setToast('Write a reply message before sending.')
      return
    }
    setReplyingId(enquiry.id)
    try {
      await replyToEnquiry(enquiry.id, message, {
        customer_email: enquiry.customer?.email || '',
        customer_name: enquiry.customer?.full_name || '',
        broker_name: user?.profile?.full_name || 'Your broker',
        property_title: enquiry.property?.title || '',
      })
      const refreshed = await fetchBrokerDashboard(user.id)
      setDashboard(refreshed)
      setReplyDrafts((current) => ({ ...current, [enquiry.id]: '' }))
      setToast('Reply sent to customer.')
    } catch (error) {
      setToast(error.message)
    } finally {
      setReplyingId('')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Mobile top bar with hamburger toggle (hidden on lg and up) */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F766E] font-extrabold text-white">B</div>
          <span className="text-lg font-extrabold text-[#134E4A]">ALAYAA</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] text-[#1F2937]"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Backdrop shown only when mobile drawer is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 -translate-x-full flex-col border-r border-[#E5E7EB] bg-white p-5 transition-transform duration-200 lg:translate-x-0 lg:flex ${
          sidebarOpen ? 'translate-x-0' : ''
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E] font-extrabold text-white">
              B
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B7280]">Broker</div>
              <div className="text-xl font-extrabold text-[#134E4A]">ALAYAA</div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F8F8F7] lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            ['overview', 'Overview', Building2, 0],
            ['properties', 'Properties', Plus, 0],
            ['enquiries', 'Enquiries', MessageSquare, dashboard.stats.pendingEnquiries],
            ['profile', 'Profile', User, 0],
          ].map(([id, label, Icon, badgeCount]) => (
            <button
              key={id}
              onClick={() => {
                setTab(id)
                setSidebarOpen(false)
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${
                tab === id
                  ? 'bg-[#0F766E] text-white'
                  : 'text-[#6B7280] hover:bg-[#F0FAF8] hover:text-[#0F766E]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={17} /> {label}
              </span>
              {badgeCount > 0 ? (
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                    tab === id ? 'bg-white text-[#0F766E]' : 'bg-rose-500 text-white'
                  }`}
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[#6B7280] hover:bg-[#F8F8F7]"
        >
          <LogOut size={17} /> Logout
        </button>
      </aside>

      <main className="p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="section-eyebrow">Broker workspace</p>
                <h1 className="mt-2 text-4xl font-extrabold text-[#1F2937]">
                  Welcome back, {user?.profile?.full_name || 'Broker'}
                </h1>
                <p className="mt-2 text-[#6B7280]">{user?.email || user?.profile?.email}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <StatusPill>{approvalStatus}</StatusPill>
                <StatusPill>{user?.profile?.city || 'No city set'}</StatusPill>
              </div>
            </div>
            {!isApproved ? (
              <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                <ShieldAlert className="mr-2 inline-block" size={16} />
                {approvalStatus === 'rejected'
                  ? 'Your broker application was rejected. Contact support to review your account.'
                  : 'Your broker application is pending approval. You can view the dashboard but cannot publish properties yet.'}
              </div>
            ) : null}
          </div>

          {toast ? <Toast text={toast} onClose={() => setToast('')} /> : null}

          {tab === 'overview' ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Building2} label="My properties" value={dashboard.stats.totalProperties} />
                <StatCard icon={MessageSquare} label="Enquiries" value={dashboard.stats.totalEnquiries} />
                <StatCard icon={User} label="Profile ready" value={user?.profile?.full_name ? 'Yes' : 'No'} />
                <StatCard icon={ShieldAlert} label="Approval status" value={approvalStatus} />
              </div>
              <section className="surface rounded-[28px] p-6">
                <h2 className="text-2xl font-extrabold text-[#1F2937]">Latest enquiries</h2>
                <div className="mt-5 space-y-3">
                  {dashboard.enquiries.length ? (
                    dashboard.enquiries.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-3xl border border-[#E5E7EB] bg-white p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-extrabold text-[#1F2937]">
                              {item.property?.title || 'Property enquiry'}
                            </div>
                            <div className="mt-1 text-sm text-[#6B7280]">
                              {item.property?.location || item.property?.city || ''}
                            </div>
                          </div>
                          <StatusPill status={item.status}>{item.status}</StatusPill>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-[#6B7280]">{item.message}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No enquiries yet"
                      description="Customer enquiries will appear here once your listings are live."
                    />
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {tab === 'properties' ? (
            <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
              <section className="surface rounded-[28px] p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1F2937]">
                      {editingId ? 'Edit property' : 'Add property'}
                    </h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Publish verified listings from your broker account.
                    </p>
                  </div>
                  {editingId ? (
                    <button onClick={resetForm} className="text-sm font-bold text-[#0F766E]">
                      Cancel edit
                    </button>
                  ) : null}
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field label="Title">
                    <input
                      className="input-field"
                      value={form.title}
                      onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      className="input-field min-h-28 resize-none"
                      value={form.description}
                      onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                      required
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Price">
                      <input
                        className="input-field"
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))}
                        required
                      />
                    </Field>
                    <Field label="Location">
                      <input
                        className="input-field"
                        value={form.location}
                        onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))}
                        required
                      />
                    </Field>
                    <Field label="City">
                      <input
                        className="input-field"
                        value={form.city}
                        onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))}
                        required
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Pin on map">
                        <LocationPicker
                          latitude={form.latitude}
                          longitude={form.longitude}
                          onChange={({ latitude, longitude }) =>
                            setForm((c) => ({ ...c, latitude, longitude }))
                          }
                        />
                      </Field>
                    </div>
                    <Field label="Property type">
                      <select
                        className="input-field"
                        value={form.property_type}
                        onChange={(e) => setForm((c) => ({ ...c, property_type: e.target.value }))}
                      >
                        {['Apartment', 'Villa', 'Plot', 'Independent House', 'Commercial', 'Studio'].map(
                          (type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          )
                        )}
                      </select>
                    </Field>
                    <Field label="Bedrooms">
                      <input
                        className="input-field"
                        type="number"
                        value={form.bedrooms}
                        onChange={(e) => setForm((c) => ({ ...c, bedrooms: e.target.value }))}
                      />
                    </Field>
                    <Field label="Bathrooms">
                      <input
                        className="input-field"
                        type="number"
                        value={form.bathrooms}
                        onChange={(e) => setForm((c) => ({ ...c, bathrooms: e.target.value }))}
                      />
                    </Field>
                    <Field label="Area (sq ft)">
                      <input
                        className="input-field"
                        type="number"
                        value={form.area}
                        onChange={(e) => setForm((c) => ({ ...c, area: e.target.value }))}
                      />
                    </Field>
                    <Field label="Status">
                      <select
                        className="input-field"
                        value={form.status}
                        onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
                      >
                        {['active', 'draft', 'pending', 'sold', 'rented'].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="rounded-3xl border border-dashed border-[#E5E7EB] bg-[#F8F8F7] p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1F2937]">
                      <Upload size={16} className="text-[#0F766E]" />
                      Property images
                    </div>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Upload JPG or PNG images. They will be stored in Supabase Storage.
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="mt-4 block w-full text-sm text-[#6B7280]"
                      onChange={(e) => setFileList([...e.target.files])}
                    />
                    {form.images.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {form.images.map((url) => (
                          <img key={url} src={url} alt="Property" className="h-16 w-20 rounded-xl object-cover" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !isApproved}
                    className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {editingId ? 'Update property' : 'Create property'}
                  </button>
                </form>
              </section>

              <section className="surface rounded-[28px] p-6 sm:p-8">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1F2937]">My listings</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Review, edit, and remove your published properties.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="input-field"
                      placeholder="Search listings"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <select
                      className="input-field"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">All statuses</option>
                      {['active', 'draft', 'pending', 'sold', 'rented'].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-20 text-[#6B7280]">
                    <Loader2 className="mr-2 animate-spin" size={18} /> Loading properties...
                  </div>
                ) : visibleProperties.length ? (
                  <div className="space-y-4">
                    {visibleProperties.map((property) => (
                      <div key={property.id} className="rounded-3xl border border-[#E5E7EB] bg-white p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-lg font-extrabold text-[#1F2937]">{property.title}</div>
                            <div className="mt-1 flex items-center gap-1 text-sm text-[#6B7280]">
                              <MapPin size={14} className="text-[#0F766E]" />
                              {property.location}, {property.city}
                            </div>
                          </div>
                          <StatusPill status={property.status}>{property.status}</StatusPill>
                        </div>
                        <div className="mt-3 text-sm leading-6 text-[#6B7280]">{property.description}</div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xl font-extrabold text-[#134E4A]">
                            {formatPrice(property.price)}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(property)}
                              className="rounded-2xl bg-[#F0FAF8] px-4 py-2 text-sm font-bold text-[#0F766E]"
                            >
                              <Pencil size={14} className="mr-1 inline-block" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(property.id)}
                              className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600"
                            >
                              <Trash2 size={14} className="mr-1 inline-block" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No properties yet"
                    description="Create your first listing to start generating enquiries."
                  />
                )}
              </section>
            </div>
          ) : null}

          {tab === 'enquiries' ? (
            <section className="surface rounded-[28px] p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold text-[#1F2937]">Incoming enquiries</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Customer messages attached to your listings.</p>
              <div className="mt-6 space-y-4">
                {dashboard.enquiries.length ? (
                  dashboard.enquiries.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-[#E5E7EB] bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-extrabold text-[#1F2937]">
                            {item.property?.title || 'Property enquiry'}
                          </div>
                          <div className="mt-1 text-sm text-[#6B7280]">
                            {item.customer?.full_name || 'Customer'}
                            {item.customer?.email ? ` · ${item.customer.email}` : ''}
                          </div>
                        </div>
                        <StatusPill status={item.status}>{item.status}</StatusPill>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-[#6B7280]">{item.message}</p>

                      {item.reply_message ? (
                        <div className="mt-4 rounded-2xl bg-[#F0FAF8] p-4">
                          <div className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">Your reply</div>
                          <p className="mt-1 text-sm leading-6 text-[#134E4A]">{item.reply_message}</p>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <textarea
                          className="input-field flex-1 resize-none"
                          rows={2}
                          placeholder={item.reply_message ? 'Send another reply...' : 'Write a reply to this customer...'}
                          value={replyDrafts[item.id] ?? ''}
                          onChange={(e) =>
                            setReplyDrafts((current) => ({ ...current, [item.id]: e.target.value }))
                          }
                        />
                        <button
                          onClick={() => handleReply(item)}
                          disabled={replyingId === item.id}
                          className="btn-primary flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
                        >
                          {replyingId === item.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <MessageSquare size={15} />
                          )}
                          {item.reply_message ? 'Send again' : 'Send reply'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No enquiries yet"
                    description="You will see customer enquiries here after properties go live."
                  />
                )}
              </div>
            </section>
          ) : null}

          {tab === 'profile' ? (
            <ProfileEditor
              title="Broker profile"
              subtitle="Update the information customers see on your public profile."
            />
          ) : null}
        </div>
      </main>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-bold text-[#1F2937]">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="surface rounded-[28px] p-6">
      <Icon size={22} className="mb-5 text-[#0F766E]" />
      <div className="text-3xl font-extrabold text-[#1F2937]">{value}</div>
      <div className="mt-1 text-sm text-[#6B7280]">{label}</div>
    </div>
  )
}

const STATUS_STYLES = {
  new: 'bg-[#F0FAF8] text-[#0F766E]',
  read: 'bg-blue-50 text-blue-600',
  replied: 'bg-emerald-50 text-emerald-600',
  closed: 'bg-[#F3F4F6] text-[#6B7280]',
  active: 'bg-emerald-50 text-emerald-600',
  draft: 'bg-[#F3F4F6] text-[#6B7280]',
  pending: 'bg-amber-50 text-amber-600',
  sold: 'bg-rose-50 text-rose-600',
  rented: 'bg-blue-50 text-blue-600',
  approved: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-rose-50 text-rose-600',
}

function StatusPill({ status, children }) {
  const style = STATUS_STYLES[status] || 'bg-[#F0FAF8] text-[#0F766E]'
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${style}`}>
      {children}
    </span>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#E5E7EB] bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0FAF8] text-[#0F766E]">
        <Building2 size={20} />
      </div>
      <div className="mt-4 text-lg font-extrabold text-[#1F2937]">{title}</div>
      <p className="mt-2 text-sm text-[#6B7280]">{description}</p>
    </div>
  )
}

function Toast({ text, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [text, onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-[#134E4A] px-5 py-4 text-sm font-bold text-white shadow-xl">
      {text}
      <button onClick={onClose} className="text-white/70 hover:text-white" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}