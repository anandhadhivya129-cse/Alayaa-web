import { useState, useEffect } from 'react'
import { fetchProperties } from '../services/Api.jsx'
import PostPropertyModal from '../components/PostPropertyModal.jsx'
import React from 'react'
import { Award, Building2, CheckCircle2, FileText, Headphones, Home as HomeIcon, TrendingUp, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar.jsx'
import HeroSection from '../components/HeroSection.jsx'
import FeaturedProperties from '../components/FeaturedProperties.jsx'
import PopularCities from '../components/PopularCities.jsx'
import EMICalculator from '../components/EMICalculator.jsx'
import MapView from '../components/MapView.jsx'
import Footer from '../components/Footer.jsx'

const propertyTypes = [
  { label: 'Apartments', count: '12,800+', icon: Building2 },
  { label: 'Villas', count: '3,900+', icon: HomeIcon },
  { label: 'Plots', count: '6,400+', icon: TrendingUp },
  { label: 'Commercial', count: '2,100+', icon: FileText },
]

const advantages = [
  { title: 'Verified Inventory', desc: 'Every premium listing carries location, document, and seller checks.', icon: Award },
  { title: 'Tamil Nadu Depth', desc: 'Focused city intelligence across Chennai, Coimbatore, Madurai, Salem, and more.', icon: Building2 },
  { title: 'Buyer Tools', desc: 'Map view, comparisons, nearby amenities, and EMI planning in one workflow.', icon: CheckCircle2 },
  { title: 'Guided Support', desc: 'Dedicated assistance for site visits, negotiations, and paperwork.', icon: Headphones },
]

export default function Home() {
const [showPostModal, setShowPostModal] = useState(false)
const [homeProperties, setHomeProperties] = useState([])

useEffect(() => {
  fetchProperties({ status: 'active' })
    .then(setHomeProperties)
    .catch(() => setHomeProperties([]))
}, [])
  return (
    <div className="app-shell">
      <Navbar />
      <HeroSection />
      <FeaturedProperties />
      <PopularCities />

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-eyebrow">Browse by need</p>
              <h2 className="section-title mt-2 text-4xl md:text-5xl">Property Categories</h2>
            </div>
            <p className="max-w-xl text-[#6B7280]">Purpose-built search paths for families, investors, builders, and businesses.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {propertyTypes.map(({ label, count, icon: Icon }, index) => (
              <motion.button
                key={label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * .06 }}
                className="surface card-hover rounded-3xl p-6 text-left"
              >
                <Icon size={24} className="mb-5 text-[#0F766E]" />
                <div className="text-xl font-extrabold text-[#1F2937]">{label}</div>
                <div className="mt-1 text-sm text-[#6B7280]">{count} listings</div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <div id="map">
  <MapView properties={homeProperties} />
</div>

<div id="services">
  <EMICalculator />
</div>

      <section className="bg-[#F8F8F7] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="section-eyebrow">Why ALAYAA</p>
            <h2 className="section-title mt-2 text-4xl md:text-5xl">Premium Tools, Local Trust</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {advantages.map(({ title, desc, icon: Icon }) => (
              <div key={title} className="surface rounded-3xl p-6">
                <Icon size={22} className="mb-4 text-[#0F766E]" />
                <h3 className="text-lg font-extrabold text-[#1F2937]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#134E4A] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-white/70">For brokers and builders</p>
            <h2 className="mt-2 text-4xl font-extrabold">List premium Tamil Nadu properties on ALAYAA.</h2>
            <p className="mt-3 max-w-2xl text-white/70">Manage enquiries, approvals, customer analytics, and verified listing visibility from your dashboard.</p>
          </div>
          <button
  onClick={() => setShowPostModal(true)}
  className="rounded-full bg-white px-6 py-3 text-center font-bold text-[#134E4A] transition hover:bg-[#F8F8F7]"
>
  Post Property Free
</button>
        </div>
      </section>

      <Footer />
{showPostModal && <PostPropertyModal onClose={() => setShowPostModal(false)} />}
    </div>
  )
}
