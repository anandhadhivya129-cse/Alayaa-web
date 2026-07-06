import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Home,
  LogOut,
  MapPin,
  Search,
  Sparkles,
  User,
  Eye,
  Building2,
  MessageSquare,
  Filter,
  Loader2,
  Bell,
  Camera,
  Lock,
  Trash2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Phone,
  Mail,
  Shield,
  Download,
  X,
  Menu,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext.jsx';
import ProfileEditor from '../components/ProfileEditor.jsx';
import {
  fetchCustomerEnquiries,
  fetchFavorites,
  fetchProperties,
  toggleFavorite,
} from '../services/api.jsx';

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl text-sm font-bold transition-all
      ${type === 'success' ? 'bg-[#0F766E] text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────────
function Badge({ children }) {
  return <span className="rounded-full bg-[#F8F8F7] px-3 py-1 text-xs font-bold text-[#6B7280]">{children}</span>;
}

const STATUS_STYLES = {
  new: 'bg-[#F0FAF8] text-[#0F766E]',
  read: 'bg-blue-50 text-blue-600',
  replied: 'bg-emerald-50 text-emerald-600',
  closed: 'bg-[#F3F4F6] text-[#6B7280]',
};

function StatusBadge({ status, children }) {
  const style = STATUS_STYLES[status] || 'bg-[#F8F8F7] text-[#6B7280]';
  return <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${style}`}>{children}</span>;
}

function EmptyState({ icon: Icon = Home, title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#E5E7EB] bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0FAF8] text-[#0F766E]">
        <Icon size={20} />
      </div>
      <div className="mt-4 text-lg font-extrabold text-[#1F2937]">{title}</div>
      <p className="mt-2 text-sm text-[#6B7280]">{description}</p>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-[#1F2937]">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs font-bold text-red-500">{error}</p> : null}
    </div>
  );
}

const inputClass =
  'w-full rounded-2xl border border-[#E5E7EB] px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#0F766E]';

// ─── Property Card ────────────────────────────────────────────────────────────
function PropertyCard({ property, isFavorite, onToggleFavorite, saving }) {
  return (
    <div className="group overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white transition hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="relative h-44 w-full overflow-hidden bg-[#F0FAF8]">
        {property.image_url ? (
          <img src={property.image_url} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#0F766E]">
            <Building2 size={36} />
          </div>
        )}
        <button
          disabled={saving}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(property.id);
          }}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition disabled:opacity-60 ${
            isFavorite ? 'bg-rose-500 text-white' : 'bg-white text-[#6B7280] hover:text-rose-500'
          }`}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <Link to={`/property/${property.id}`} className="block p-5">
        <div className="font-extrabold text-[#1F2937]">{property.title}</div>
        <div className="mt-1 flex items-center gap-1 text-sm text-[#6B7280]">
          <MapPin size={13} />
          {property.location}, {property.city}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-bold text-[#0F766E]">{formatPrice(property.price)}</div>
          <Badge>{property.property_type}</Badge>
        </div>
      </Link>
    </div>
  );
}

// ─── Avatar Upload ────────────────────────────────────────────────────────────
function AvatarUpload({ initials, avatarUrl, onChange }) {
  return (
    <div className="relative inline-block">
      <div className="h-24 w-24 rounded-full bg-[#F0FAF8] border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl font-extrabold text-[#0F766E]">{initials}</span>
        )}
      </div>
      <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#0F766E] text-white shadow-md hover:bg-[#134E4A] transition-colors">
        <Camera size={14} />
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) onChange(URL.createObjectURL(file));
          }}
        />
      </label>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ showToast, user }) {
  const [activeSection, setActiveSection] = useState('personal');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Personal Info
  const [personal, setPersonal] = useState({
    fullName: user?.profile?.full_name || 'Rahul Kumar',
    email: user?.email || user?.profile?.email || 'rahul@alayaa.in',
    phone: user?.profile?.phone || '+91 98765 43210',
    city: user?.profile?.city || 'Chennai',
    bio: user?.profile?.bio || '',
  });
  const [personalErrors, setPersonalErrors] = useState({});

  // Password
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});

  // Notifications
  const [notifications, setNotifications] = useState({
    newListings: true,
    priceDrops: true,
    inquiryUpdates: true,
    brokerMessages: false,
    weeklyDigest: true,
    smsAlerts: false,
  });

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const validatePersonal = () => {
    const errs = {};
    if (!personal.fullName.trim()) errs.fullName = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) errs.email = 'Enter a valid email';
    if (personal.phone && !/^\+?\d[\d\s-]{7,}$/.test(personal.phone)) errs.phone = 'Enter a valid phone number';
    return errs;
  };

  const validatePasswords = () => {
    const errs = {};
    if (!passwords.current) errs.current = 'Current password is required';
    if (passwords.next.length < 8) errs.next = 'Password must be at least 8 characters';
    if (passwords.next !== passwords.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handlePersonalSave = async (e) => {
    e.preventDefault();
    const errs = validatePersonal();
    if (Object.keys(errs).length) {
      setPersonalErrors(errs);
      return;
    }
    setPersonalErrors({});
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    showToast('Profile updated successfully', 'success');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errs = validatePasswords();
    if (Object.keys(errs).length) {
      setPwErrors(errs);
      return;
    }
    setPwErrors({});
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setPasswords({ current: '', next: '', confirm: '' });
    showToast('Password changed successfully', 'success');
  };

  const handleNotificationsSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    showToast('Notification preferences saved', 'success');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm !== 'DELETE') return;
    showToast('Account deletion requested. You will receive an email.', 'success');
    setDeleteConfirm('');
  };

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Password & Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ];

  const initials = personal.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left sidebar navigation */}
      <div className="lg:w-56 shrink-0">
        <div className="surface rounded-3xl p-2">
          <div className="flex flex-col items-center gap-2 px-4 py-5 border-b border-[#E5E7EB] mb-2">
            <AvatarUpload initials={initials} avatarUrl={avatarUrl} onChange={setAvatarUrl} />
            <div className="text-center mt-1">
              <div className="font-extrabold text-[#1F2937] text-sm">{personal.fullName}</div>
              <div className="text-xs text-[#6B7280] mt-0.5">{personal.city || 'No city set'}</div>
            </div>
          </div>

          <nav className="space-y-0.5">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition
                  ${activeSection === id
                    ? id === 'danger'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-[#F0FAF8] text-[#0F766E]'
                    : id === 'danger'
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-[#6B7280] hover:bg-[#F8F8F7] hover:text-[#1F2937]'}`}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{label}</span>
                <ChevronRight size={14} className="opacity-40" />
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Right content panel */}
      <div className="flex-1 min-w-0">
        {/* Personal Info */}
        {activeSection === 'personal' && (
          <div className="surface rounded-3xl p-8 animate-fade-in-up">
            <div className="mb-6">
              <p className="section-eyebrow">Account</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#1F2937]">Personal Information</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Update your name, contact details, and how you appear on ALAYAA.</p>
            </div>

            <div className="mb-8 flex items-center gap-5 rounded-2xl bg-[#F8F8F7] p-5">
              <AvatarUpload initials={initials} avatarUrl={avatarUrl} onChange={setAvatarUrl} />
              <div>
                <div className="font-bold text-[#1F2937]">Profile photo</div>
                <div className="mt-0.5 text-sm text-[#6B7280]">Click the camera icon to upload. JPG or PNG, max 2MB.</div>
                {avatarUrl && (
                  <button
                    onClick={() => setAvatarUrl('')}
                    className="mt-2 text-xs font-bold text-red-500 hover:text-red-600"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handlePersonalSave} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" error={personalErrors.fullName}>
                  <input
                    className={inputClass}
                    value={personal.fullName}
                    onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                  />
                </Field>
                <Field label="Email" error={personalErrors.email}>
                  <input
                    type="email"
                    className={inputClass}
                    value={personal.email}
                    onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                  />
                </Field>
                <Field label="Phone" error={personalErrors.phone}>
                  <input
                    className={inputClass}
                    value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                  />
                </Field>
                <Field label="City">
                  <input
                    className={inputClass}
                    value={personal.city}
                    onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Bio">
                    <textarea
                      rows={3}
                      className={inputClass}
                      placeholder="Tell brokers a little about what you're looking for..."
                      value={personal.bio}
                      onChange={(e) => setPersonal({ ...personal, bio: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary rounded-2xl px-7 py-3 font-bold text-sm disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" className="btn-secondary rounded-2xl px-5 py-3 font-bold text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password & Security */}
        {activeSection === 'security' && (
          <div className="surface rounded-3xl p-8 animate-fade-in-up">
            <div className="mb-6">
              <p className="section-eyebrow">Security</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#1F2937]">Password & Security</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Keep your account secure with a strong password.</p>
            </div>

            <form onSubmit={handlePasswordChange} noValidate className="max-w-md space-y-5">
              <Field label="Current password" error={pwErrors.current}>
                <input
                  type="password"
                  className={inputClass}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                />
              </Field>
              <Field label="New password" error={pwErrors.next}>
                <input
                  type="password"
                  className={inputClass}
                  value={passwords.next}
                  onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                />
              </Field>
              <Field label="Confirm new password" error={pwErrors.confirm}>
                <input
                  type="password"
                  className={inputClass}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
              </Field>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary rounded-2xl px-7 py-3 font-bold text-sm disabled:opacity-60"
              >
                {saving ? 'Updating…' : 'Update password'}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#F0FAF8] p-5 text-sm text-[#134E4A]">
              <Shield size={18} />
              We recommend using a unique password you don't use anywhere else.
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeSection === 'notifications' && (
          <div className="surface rounded-3xl p-8 animate-fade-in-up">
            <div className="mb-6">
              <p className="section-eyebrow">Preferences</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#1F2937]">Notifications</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Choose what you'd like to hear from us about.</p>
            </div>

            <div className="space-y-3">
              {[
                ['newListings', 'New listings matching your search', Home],
                ['priceDrops', 'Price drops on saved properties', Sparkles],
                ['inquiryUpdates', 'Updates on your enquiries', MessageSquare],
                ['brokerMessages', 'Messages from brokers', Mail],
                ['weeklyDigest', 'Weekly digest email', Bell],
                ['smsAlerts', 'SMS alerts', Phone],
              ].map(([key, label, Icon]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] px-5 py-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-[#0F766E]" />
                    <span className="text-sm font-bold text-[#1F2937]">{label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                    className="h-5 w-5 accent-[#0F766E]"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={handleNotificationsSave}
              disabled={saving}
              className="btn-primary mt-6 rounded-2xl px-7 py-3 font-bold text-sm disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
        )}

        {/* Danger Zone */}
        {activeSection === 'danger' && (
          <div className="surface rounded-3xl p-8 animate-fade-in-up">
            <div className="mb-6">
              <p className="section-eyebrow text-red-500">Danger zone</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#1F2937]">Delete account</h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                This will permanently delete your account, saved properties, and enquiry history. This action cannot be undone.
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                <AlertCircle size={16} /> Type DELETE to confirm
              </div>
              <input
                className="mt-3 w-full rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm outline-none"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE'}
                className="mt-4 flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                <Trash2 size={15} /> Delete my account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('properties');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [savingFavorite, setSavingFavorite] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [allProperties, favs, userEnquiries] = await Promise.all([
          fetchProperties({ status: '' }),
          fetchFavorites(user.id),
          fetchCustomerEnquiries(user.id),
        ]);

        if (!active) return;

        setProperties(allProperties);
        setFavorites(favs);
        setEnquiries(userEnquiries);
      } catch (error) {
        if (active) setToast({ message: error.message, type: 'error' });
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.property_id)), [favorites]);
  const repliedEnquiryCount = useMemo(
    () => enquiries.filter((item) => item.status === 'replied').length,
    [enquiries]
  );
  const cities = useMemo(() => [...new Set(properties.map((p) => p.city).filter(Boolean))], [properties]);
  const types = useMemo(() => [...new Set(properties.map((p) => p.property_type).filter(Boolean))], [properties]);

  const visibleProperties = useMemo(() => {
    return properties.filter((property) => {
      const term = query.trim().toLowerCase();
      const matchesQuery = !term || 
        [property.title, property.location, property.city, property.description]
          .join(' ')
          .toLowerCase()
          .includes(term);
      const matchesCity = !city || property.city === city;
      const matchesType = !propertyType || property.property_type === propertyType;
      return matchesQuery && matchesCity && matchesType;
    });
  }, [properties, query, city, propertyType]);

  const favoriteProperties = useMemo(
    () => favorites.map((fav) => fav.property).filter(Boolean),
    [favorites]
  );

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const togglePropertyFavorite = async (propertyId) => {
    if (!user?.id) return;
    setSavingFavorite(propertyId);
    try {
      await toggleFavorite(user.id, propertyId);
      const freshFavorites = await fetchFavorites(user.id);
      setFavorites(freshFavorites);
      setToast({
        message: favoriteIds.has(propertyId) ? 'Removed from favorites.' : 'Saved to favorites.',
        type: 'success',
      });
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setSavingFavorite('');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  };

  const stats = [
    { label: 'Saved properties', value: favorites.length, icon: Heart },
    { label: 'Active enquiries', value: enquiries.length, icon: MessageSquare },
    { label: 'Listings available', value: properties.length, icon: Home },
    { label: 'Profile complete', value: user?.profile?.full_name ? 'Yes' : 'No', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Mobile top bar with hamburger toggle (hidden on lg and up) */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F766E] font-extrabold text-white">A</div>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E] font-extrabold text-white">A</div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B7280]">Customer</div>
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
            ['properties', 'Browse Properties', Search, 0],
            ['favorites', 'Favorites', Heart, favorites.length],
            ['enquiries', 'My Enquiries', MessageSquare, repliedEnquiryCount],
            ['profile', 'Profile', User, 0],
          ].map(([id, label, Icon, badgeCount]) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${
                tab === id ? 'bg-[#0F766E] text-white' : 'text-[#6B7280] hover:bg-[#F0FAF8] hover:text-[#0F766E]'
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
        <button onClick={handleLogout} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[#6B7280] hover:bg-[#F8F8F7]">
          <LogOut size={17} /> Logout
        </button>
      </aside>

      <main className="p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="section-eyebrow">Welcome back</p>
                <h1 className="mt-2 text-4xl font-extrabold text-[#1F2937]">
                  {user?.profile?.full_name ? `Hi, ${user.profile.full_name.split(' ')[0]}` : 'Your dashboard'}
                </h1>
                <p className="mt-2 text-[#6B7280]">Browse listings, manage favorites, and track your enquiries.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge>{user?.profile?.full_name || 'Customer'}</Badge>
                <Badge>{user?.email || user?.profile?.email}</Badge>
              </div>
            </div>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="surface rounded-[28px] p-6">
                <stat.icon size={22} className="mb-5 text-[#0F766E]" />
                <div className="text-3xl font-extrabold text-[#1F2937]">{stat.value}</div>
                <div className="mt-1 text-sm text-[#6B7280]">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* BROWSE PROPERTIES TAB */}
          {tab === 'properties' ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
                  <Search size={18} className="text-[#6B7280]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title, location, city..."
                    className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[#9CA3AF]"
                  />
                </div>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-bold text-[#1F2937]"
                >
                  <option value="">All cities</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-bold text-[#1F2937]"
                >
                  <option value="">All types</option>
                  {types.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-14 text-[#6B7280]">
                  <Loader2 className="mr-2 animate-spin" size={18} /> Loading properties...
                </div>
              ) : visibleProperties.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No properties found"
                  description="Try adjusting your search or filters."
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isFavorite={favoriteIds.has(property.id)}
                      onToggleFavorite={togglePropertyFavorite}
                      saving={savingFavorite === property.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* FAVORITES TAB */}
          {tab === 'favorites' ? (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-14 text-[#6B7280]">
                  <Loader2 className="mr-2 animate-spin" size={18} /> Loading favorites...
                </div>
              ) : favoriteProperties.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="No saved properties yet"
                  description="Tap the heart icon on any listing to save it here."
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {favoriteProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isFavorite={true}
                      onToggleFavorite={togglePropertyFavorite}
                      saving={savingFavorite === property.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* ENQUIRIES TAB */}
          {tab === 'enquiries' ? (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-14 text-[#6B7280]">
                  <Loader2 className="mr-2 animate-spin" size={18} /> Loading enquiries...
                </div>
              ) : enquiries.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No enquiries yet"
                  description="Reach out to a broker about a property to see your enquiries here."
                />
              ) : (
                <div className="space-y-3">
                  {enquiries.map((enquiry) => (
                    <div
                      key={enquiry.id}
                      className="flex flex-col gap-3 rounded-[24px] border border-[#E5E7EB] bg-white p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-extrabold text-[#1F2937]">
                            {enquiry.property?.title || 'Property enquiry'}
                          </div>
                          <div className="mt-1 text-sm text-[#6B7280]">{enquiry.message}</div>
                        </div>
                        <StatusBadge status={enquiry.status}>{enquiry.status || 'pending'}</StatusBadge>
                      </div>

                      {enquiry.reply_message ? (
                        <div className="rounded-2xl bg-[#F0FAF8] p-4">
                          <div className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">
                            Broker reply
                          </div>
                          <p className="mt-1 text-sm leading-6 text-[#134E4A]">{enquiry.reply_message}</p>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-[#9CA3AF]">
                          Waiting for the broker to respond.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* PROFILE TAB */}
          {tab === 'profile' ? <ProfileTab showToast={showToast} user={user} /> : null}
        </div>
      </main>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
