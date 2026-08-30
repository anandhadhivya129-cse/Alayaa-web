import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient.js'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Processing secure sign in...')

  useEffect(() => {
    let active = true

    const run = async () => {
      try {
        const code = searchParams.get('code')
        const nextPath = searchParams.get('next') || '/login'

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        let session = null
        for (let attempt = 0; attempt < 20; attempt += 1) {
          const { data } = await supabase.auth.getSession()
          if (data?.session) {
            session = data.session
            break
          }
          await new Promise((resolve) => setTimeout(resolve, 150))
        }

        if (!active) return

        if (!session) {
          throw new Error('We could not verify your sign-in link. Please request a new one.')
        }

        setStatus('done')
        setMessage('Authentication completed successfully.')
        window.setTimeout(() => {
          window.location.replace(nextPath)
        }, 100)
      } catch (error) {
        console.error(error)
        if (!active) return
        setStatus('error')
        setMessage(error.message || 'Authentication callback failed.')
      }
    }

    run()
    return () => {
      active = false
    }
  }, [searchParams])

  if (status === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] text-[#6B7280]">
        Redirecting...
      </div>
    )
  }

  if (status === 'error') {
    return <Navigate to="/login" replace state={{ message }} />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] text-[#6B7280]">
      {message}
    </div>
  )
}