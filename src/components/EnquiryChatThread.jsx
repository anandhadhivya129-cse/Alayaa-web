import { useEffect, useRef, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { fetchEnquiryMessages, sendEnquiryMessage, subscribeToEnquiryMessages } from '../services/api.jsx'

export default function EnquiryChatThread({ enquiryId, currentUserId, currentUserRole }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchEnquiryMessages(enquiryId)
        if (active) setMessages(data)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()

    const unsubscribe = subscribeToEnquiryMessages(enquiryId, (newMessage) => {
      setMessages((current) => {
        if (current.some((m) => m.id === newMessage.id)) return current
        return [...current, newMessage]
      })
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [enquiryId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setSending(true)
    try {
      await sendEnquiryMessage(enquiryId, currentUserId, currentUserRole, text)
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="max-h-80 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-[#6B7280]">
            <Loader2 className="mr-2 animate-spin" size={16} /> Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs font-semibold text-[#9CA3AF]">No messages yet.</div>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_role === currentUserRole
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-6 ${
                    isMine ? 'bg-[#0F766E] text-white' : 'bg-[#F0FAF8] text-[#134E4A]'
                  }`}
                >
                  {m.message}
                  <div className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-[#0F766E]/60'}`}>
                    {new Date(m.created_at).toLocaleString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-[#E5E7EB] p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-2xl border border-[#E5E7EB] px-4 py-2.5 text-sm outline-none focus:border-[#0F766E]"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0F766E] text-white disabled:opacity-50"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  )
}