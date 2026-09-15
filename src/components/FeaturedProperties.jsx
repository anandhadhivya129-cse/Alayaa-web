import React, { useEffect, useMemo, useState } from 'react'
import { Grid2X2, Map } from 'lucide-react'
import PropertyCard from './PropertyCard.jsx'
import MapView from './MapView.jsx'
import PropertyComparison from './PropertyComparison.jsx'
import { tamilNaduCities } from '../data/properties.js'
import { fetchProperties } from '../services/Api.jsx'

const budgetRanges = [
  { label: 'Any Budget', min: 0, max: Infinity },
  { label: 'Under Rs 75 L', min: 0, max: 75 },
  { label: 'Rs 75 L - Rs 1.5 Cr', min: 75, max: 150 },
  { label: 'Rs 1.5 Cr+', min: 150, max: Infinity },
]

export default function FeaturedProperties() {
  const [budget, setBudget] = useState(budgetRanges[0])
  const [type, setType] = useState('All')
  const [bhk, setBhk] = useState('All')
  const [city, setCity] = useState('All')
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
useEffect(() => {
  let mounted = true
  fetchProperties({ status: 'active' })
    .then((data) => {
      console.log('FETCHED PROPERTIES:', data)
      if (mounted) setProperties(data)
    })
    .catch((err) => {
      console.error('FETCH PROPERTIES ERROR:', err)
      if (mounted) setProperties([])
    })
    .finally(() => { if (mounted) setLoading(false) })
  return () => { mounted = false }
}, [])

  const filtered = useMemo(() => properties.filter((property) => {
    const budgetMatch = property.priceValue >= budget.min && property.priceValue <= budget.max
    const typeMatch = type === 'All' || property.propertyType === type
    const bhkMatch = bhk === 'All' || String(property.bhk) === bhk
    const cityMatch = city === 'All' || property.city === city
    return budgetMatch && typeMatch && bhkMatch && cityMatch
  }), [properties, budget, type, bhk, city])

  const selectedProperties = properties.filter((property) => selected.includes(property.id))

  const toggleCompare = (id) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  return (
    <section id="featured" className="bg-[#F8F8F7] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-eyebrow">Handpicked listings</p>
            <h2 className="section-title mt-2 text-4xl md:text-5xl">Featured Tamil Nadu Properties</h2>
            <p className="mt-3 max-w-2xl text-[#6B7280]">Filter verified homes, villas, plots, and commercial spaces by budget, BHK, type, and city.</p>
          </div>
          <div className="flex rounded-2xl border border-[#E5E7EB] bg-white p-1">
            <button onClick={() => setView('list')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${view === 'list' ? 'bg-[#0F766E] text-white' : 'text-[#6B7280]'}`}>
              <Grid2X2 size={16} /> List View
            </button>
            <button onClick={() => setView('map')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${view === 'map' ? 'bg-[#0F766E] text-white' : 'text-[#6B7280]'}`}>
              <Map size={16} /> Map View
            </button>
          </div>
        </div>

        <div className="surface mb-8 grid gap-3 rounded-3xl p-4 md:grid-cols-4">
          <select className="input-field" value={budget.label} onChange={(event) => setBudget(budgetRanges.find((item) => item.label === event.target.value))}>
            {budgetRanges.map((item) => <option key={item.label}>{item.label}</option>)}
          </select>
          <select className="input-field" value={type} onChange={(event) => setType(event.target.value)}>
            {['All', 'Apartment', 'Villa', 'Plot', 'Commercial', 'Independent House'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="input-field" value={bhk} onChange={(event) => setBhk(event.target.value)}>
            {['All', '2', '3', '4'].map((item) => <option key={item} value={item}>{item === 'All' ? 'Any BHK' : `${item} BHK`}</option>)}
          </select>
          <select className="input-field" value={city} onChange={(event) => setCity(event.target.value)}>
            {['All', ...tamilNaduCities].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        {view === 'list' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} selected={selected.includes(property.id)} onCompareToggle={toggleCompare} />
            ))}
          </div>
        ) : (
          <MapView properties={filtered} />
        )}

        <PropertyComparison properties={selectedProperties} />
      </div>
    </section>
  )
}
