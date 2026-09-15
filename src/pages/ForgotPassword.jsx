import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import AuthShell from '../components/AuthShell.jsx'
import { forgotPassword } from '../services/Api.jsx'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const data = await forgotPassword(email)
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthShell title="Forgot Password" subtitle="Enter your email to receive a reset token.">
      {error && <Message status="error">{error}</Message>}
      {message && <Message status="success">{message}</Message>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-bold text-[#1F2937]">
          Email Address
          <div className="relative mt-2">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F766E]" />
            <input className="input-field pl-11" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@alayaa.in" required />
          </div>
        </label>
        <button className="btn-primary w-full rounded-2xl py-3 font-bold">Send reset link</button>
      </form>
      <p className="mt-6 text-center text-sm text-[#6B7280]">
        <Link to="/login" className="font-bold text-[#0F766E]">Back to login</Link>
      </p>
    </AuthShell>
  )
}

function Message({ status, children }) {
  return (
    <div className={`mb-5 rounded-2xl px-4 py-3 text-sm font-semibold ${status === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-rose-200 bg-rose-50 text-rose-600'}`}>
      {children}
    </div>
  )
}