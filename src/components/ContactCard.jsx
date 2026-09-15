import { Mail, Phone, ShieldCheck, User } from 'lucide-react'

export default function ContactCard({ profile, roleLabel }) {
  if (!profile) return null
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-[#F8F8F7] px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-extrabold text-[#1F2937]">
        <User size={15} className="text-[#0F766E]" />
        {profile.full_name || `Unnamed ${roleLabel}`}
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
          {roleLabel}
        </span>
      </div>
      {profile.phone ? (
        <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#0F766E]">
          <Phone size={14} /> {profile.phone}
        </a>
      ) : null}
      {profile.email ? (
        <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#0F766E]">
          <Mail size={14} /> {profile.email}
        </a>
      ) : null}
      {profile.rera_number ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
          <ShieldCheck size={14} className="text-[#0F766E]" /> RERA: {profile.rera_number}
        </span>
      ) : null}
    </div>
  )
}