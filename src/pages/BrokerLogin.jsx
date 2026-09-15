import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function BrokerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const message = location.state?.message || '';

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({
        email: form.email,
        password: form.password,
        role: 'broker',
        remember,
      });
      navigate('/broker/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Broker Login"
      subtitle="Access your broker dashboard, listings, and lead management."
      footer={
        <div className="space-y-2 text-center text-sm text-[#6B7280]">
          <p>
            Need a broker account?{' '}
            <Link to="/broker/register" className="font-bold text-[#0F766E]">
              Register here
            </Link>
          </p>
          <p>
            Customer?{' '}
            <Link to="/login" className="font-bold text-[#0F766E]">
              Sign in as customer
            </Link>
          </p>
        </div>
      }
    >
      {message && <Notice tone="success">{message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <form onSubmit={handleLogin} className="space-y-4">
        <Field
          icon={Mail}
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => update('email', value)}
          placeholder="broker@alayaa.in"
        />

        <PasswordField
          value={form.password}
          onChange={(value) => update('password', value)}
          show={showPass}
          setShow={setShowPass}
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 whitespace-nowrap text-[#6B7280]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[#0F766E]"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="whitespace-nowrap font-bold text-[#0F766E]">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full rounded-2xl py-3 font-bold disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}

// ─── Reusable Components ─────────────────────────────────────────────────────

function Field({ icon: Icon, label, type = 'text', value, onChange, placeholder }) {
  return (
    <label className="block text-sm font-bold text-[#1F2937]">
      {label}
      <div className="relative mt-2">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F766E]" />
        <input
          className="input-field pl-11"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
        />
      </div>
    </label>
  );
}

function PasswordField({ value, onChange, show, setShow }) {
  return (
    <label className="block text-sm font-bold text-[#1F2937]">
      Password
      <div className="relative mt-2">
        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F766E]" />
        <input
          className="input-field pl-11 pr-11"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your password"
          required
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#0F766E]"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

function Notice({ tone, children }) {
  return (
    <div
      className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
        tone === 'success'
          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border border-rose-200 bg-rose-50 text-rose-600'
      }`}
    >
      {children}
    </div>
  );
}
