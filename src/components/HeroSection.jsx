import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { tamilNaduCities } from '../data/properties.js'

const TABS = [
  { id: 'buy',        label: 'Buy' },
  { id: 'rent',       label: 'Rent' },
  { id: 'pg',         label: 'PG / Co-living' },
  { id: 'commercial', label: 'Commercial' },
]

const PLACEHOLDERS = {
  buy:        'Search locality, project or landmark…',
  rent:       'Search area or apartment name…',
  pg:         'Search PG, hostel or area…',
  commercial: 'Search commercial areas or buildings…',
}
export default function HeroSection() {
  
const [activeTab, setActiveTab] = useState('buy')
const navigate = useNavigate()
  return (
    <section className="relative overflow-hidden bg-[#FAF9F6]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-20 lg:pt-20">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D7E7E4] bg-white px-3 py-2 text-sm font-semibold text-[#134E4A]">
            <ShieldCheck size={16} className="text-[#0F766E]" /> Verified homes across Tamil Nadu
          </div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.03] tracking-normal text-[#1F2937] md:text-7xl">
            Find Your Perfect Property Across Tamil Nadu
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6B7280]">
            Discover verified homes, apartments, villas, plots, and commercial spaces across Tamil Nadu.
          </p>

          <div className="mt-9">
  {/* Tab Toggle */}
  <div className="flex w-fit overflow-hidden rounded-t-2xl border border-b-0 border-[#E5E7EB] bg-white">
    {TABS.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`px-5 py-3 text-sm font-semibold transition-colors ${
          activeTab === tab.id
            ? 'bg-[#0F766E] text-white'
            : 'bg-white text-[#6B7280] hover:bg-[#F3F4F6]'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>

  {/* Search Bar */}
  <div className="soft-surface rounded-b-[28px] rounded-tr-[28px] p-4">
    <div className="grid gap-3 md:grid-cols-5">
      <select className="input-field md:col-span-1" defaultValue="Chennai">
        {tamilNaduCities.map((city) => <option key={city}>{city}</option>)}
      </select>
      <input
        className="input-field md:col-span-1"
        placeholder={PLACEHOLDERS[activeTab]}
      />
      <select className="input-field md:col-span-1" defaultValue="">
        <option value="">
          {activeTab === 'pg' ? 'Preferred For' : activeTab === 'commercial' ? 'Space Type' : 'Property Type'}
        </option>
        {activeTab === 'pg'
          ? ['Boys', 'Girls', 'Co-ed'].map(o => <option key={o}>{o}</option>)
          : activeTab === 'commercial'
          ? ['Office', 'Shop', 'Warehouse', 'Showroom'].map(o => <option key={o}>{o}</option>)
          : ['Apartment', 'Villa', 'Plot', 'Commercial'].map(o => <option key={o}>{o}</option>)
        }
      </select>
      <select className="input-field md:col-span-1" defaultValue="">
        <option value="">Budget</option>
        {activeTab === 'pg'
          ? ['Under Rs 5K/mo', 'Rs 5K–10K/mo', 'Above Rs 10K/mo'].map(o => <option key={o}>{o}</option>)
          : ['Under Rs 50 L', 'Rs 50 L – Rs 1 Cr', 'Rs 1 Cr – Rs 2 Cr', 'Above Rs 2 Cr'].map(o => <option key={o}>{o}</option>)
        }
      </select>
      <button
        onClick={() => navigate(`/search?type=${activeTab}`)}
        className="btn-primary flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold"
      >
        <Search size={18} /> Search
      </button>
    </div>
  </div>
</div>

          <div className="mt-8 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ['10', 'TN cities'],
              ['31K+', 'verified listings'],
              ['4.8/5', 'buyer rating'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <div className="text-2xl font-extrabold text-[#134E4A]">{value}</div>
                <div className="text-sm text-[#6B7280]">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .65, delay: .1 }} className="relative">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop"
            alt="Premium Tamil Nadu residence"
            className="h-[260px] w-full rounded-[32px] object-cover shadow-2xl sm:h-[340px] lg:h-[520px]"
          />
          <div className="absolute bottom-5 left-5 right-5 rounded-3xl bg-white/88 p-5 shadow-xl backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#0F766E]"><Sparkles size={15} /> Featured in Chennai</div>
                <div className="text-xl font-extrabold text-[#1F2937]">Adyar Bay Residences</div>
                <div className="mt-1 flex items-center gap-1 text-sm text-[#6B7280]"><MapPin size={14} /> 3BHK, 1,820 sq.ft</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-[#134E4A]">Rs 2.35 Cr</div>
                <div className="text-xs text-[#6B7280]">Verified listing</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
