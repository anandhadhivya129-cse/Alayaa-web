import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ChevronDown, Home, Menu, Search, ShieldCheck, UserRound, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { tamilNaduCities } from '../data/properties.js'
import PostPropertyModal from './PostPropertyModal.jsx'

const navLinks = [
  { label: 'Buy', href: '#featured' },
  { label: 'Rent', href: '#featured' },
  { label: 'Commercial', href: '#featured' },
  { label: 'New Projects', href: '#featured' },
  { label: 'Plots', href: '#featured' },
  { label: 'Map View', scrollTo: 'map' },
  { label: 'Services', scrollTo: 'services' },
]

const navBtnClass =
  'flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] font-semibold text-[#1F2937] transition-colors duration-200 hover:bg-[#F0FAF8] hover:text-[#0F766E]'

const AlayaaLogo = () => (
  <div className="flex shrink-0 items-center gap-1.5">
    {/* House icon */}
    <svg
      width="36"
      height="36"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 22 L24 4 L44 22"
        stroke="#0F766E"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 22 L8 44 L40 44 L40 22"
        stroke="#0F766E"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 44 L18 32 L30 32 L30 44"
        stroke="#0F766E"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>

    {/* Text */}
    <div className="flex flex-col leading-none">
      <span className="text-[10px] font-semibold tracking-[2px] text-[#6B7280] uppercase">
        real estate
      </span>
      <span className="text-[24px] font-black tracking-[-0.5px] leading-none text-[#0F766E]">
        ALAYAA
      </span>
    </div>
  </div>
)

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [citiesOpen, setCitiesOpen] = useState(false)

  const [loginOpen, setLoginOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)

  const [signInOpen, setSignInOpen] = useState(false)
  const [activeMega, setActiveMega] = useState(null)
  const [showPostModal, setShowPostModal] = useState(false)

  const handleMegaToggle = (label) => {
    setActiveMega(activeMega === label ? null : label)
  }

  const closeAll = () => {
    setActiveMega(null)
    setOpen(false)
    setSignInOpen(false)
    setCitiesOpen(false)
  }
  const roleDashboardPath = {
    customer: '/dashboard',
    broker: '/broker/dashboard',
    admin: '/admin/dashboard',
  }[user?.profile?.role] || '/dashboard'

  const handleLogout = async () => {
    await logout()
    setLoginOpen(false)
    navigate('/')
  }

  const userInitial = (user?.profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-3 py-3 sm:px-4 lg:px-6">

          {/* LEFT: Logo */}
          <div className="flex shrink-0 items-center">
            <Link to="/" className="flex items-center gap-3" onClick={closeAll}>
              <AlayaaLogo />
            </Link>
          </div>

          {/* CENTER: Nav links (always centered, never wraps) */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-x-0.5 overflow-visible lg:flex">
            {navLinks.map((item) => {
              const isMega = ['Buy', 'Rent', 'Commercial', 'New Projects', 'Plots'].includes(item.label)
              const alignRight = ['New Projects', 'Plots'].includes(item.label)

              return (
                <div key={item.label} className="relative shrink-0">
                  {!isMega && item.to ? (
                    <Link to={item.to} onClick={closeAll} className={navBtnClass}>
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        if (item.scrollTo) {
                          if (location.pathname !== '/') {
                            navigate('/')
                            setTimeout(() => {
                              document.getElementById(item.scrollTo)?.scrollIntoView({ behavior: 'smooth' })
                            }, 300)
                          } else {
                            document.getElementById(item.scrollTo)?.scrollIntoView({ behavior: 'smooth' })
                          }
                          closeAll()
                        } else if (isMega) {
                          handleMegaToggle(item.label)
                        }
                      }}
                      onMouseEnter={() => isMega && setActiveMega(item.label)}
                      className={navBtnClass}
                    >
                      {item.label}
                      {isMega && (
                        <ChevronDown
                          size={16}
                          className={`shrink-0 transition ${activeMega === item.label ? 'rotate-180' : ''}`}
                        />
                      )}
                    </button>
                  )}
                  <AnimatePresence>
                    {isMega && activeMega === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        onMouseLeave={() => setActiveMega(null)}
                        className={`absolute top-[58px] w-[680px] bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-8 grid grid-cols-12 z-[60] max-h-[460px] overflow-auto ${alignRight ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}
                      >
                        <div className="col-span-5">
                          <p className="uppercase text-xs tracking-widest text-gray-500 mb-5 font-semibold">POPULAR CITIES</p>
                          <div className="grid grid-cols-2 gap-y-3 text-[15px] text-gray-700">
                            {tamilNaduCities.slice(0, 14).map((city) => (
                              <a key={city} href="#cities" onClick={closeAll} className="hover:text-[#0F766E] transition py-0.5">
                                {city}
                              </a>
                            ))}
                          </div>
                        </div>

                        <div className="col-span-4 border-l border-gray-100 pl-8">
                          <p className="uppercase text-xs tracking-widest text-gray-500 mb-5 font-semibold">
                            {item.label === 'New Projects' ? 'NEW PROJECTS' : item.label === 'Commercial' ? 'COMMERCIAL' : 'PLOTS & LAND'}
                          </p>
                          <div className="space-y-3 text-[15px] text-gray-700">
                            {item.label === 'New Projects' ? (
                              <>
                                <a href="#featured" className="block hover:text-[#0F766E]">Luxury Projects</a>
                                <a href="#featured" className="block hover:text-[#0F766E]">Under Construction</a>
                              </>
                            ) : item.label === 'Commercial' ? (
                              <>
                                <a href="#featured" className="block hover:text-[#0F766E]">Office Spaces</a>
                                <a href="#featured" className="block hover:text-[#0F766E]">Retail Shops</a>
                              </>
                            ) : (
                              <>
                                <a href="#featured" className="block hover:text-[#0F766E]">Residential Plots</a>
                                <a href="#featured" className="block hover:text-[#0F766E]">Commercial Plots</a>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="col-span-3 border-l border-gray-100 pl-8">
                          <a href="#featured" className="flex items-center gap-3 text-sm hover:text-[#0F766E]">
                            <Home size={20} /> Featured Properties
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}

            {/* Tamil Nadu Cities Button */}
            <div className="relative shrink-0">
              <button onClick={() => setCitiesOpen(!citiesOpen)} className={navBtnClass}>
                Tamil Nadu Cities
                <ChevronDown size={15} className={`shrink-0 ${citiesOpen ? 'rotate-180 transition' : 'transition'}`} />
              </button>
              <AnimatePresence>
                {citiesOpen && (
                  <motion.div className="absolute left-0 mt-3 grid w-72 grid-cols-2 gap-1 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-xl z-[60]">
                    {tamilNaduCities.map((city) => (
                      <a key={city} href="#cities" onClick={closeAll} className="rounded-xl px-3 py-2 text-sm text-[#6B7280] hover:bg-[#F0FAF8] hover:text-[#0F766E]">
                        {city}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: Auth + Post Property */}
          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <div className="relative shrink-0">
              {user ? (
                <>
                  <button
                    onClick={() => setLoginOpen(!loginOpen)}
                    aria-label="Account menu"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F766E] text-base font-bold text-white transition hover:brightness-110"
                  >
                    {userInitial}
                  </button>

                  <AnimatePresence>
                    {loginOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-56 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-xl"
                      >
                        <Link
                          to={roleDashboardPath}
                          onClick={() => setLoginOpen(false)}
                          className="block rounded-lg px-4 py-3 hover:bg-[#F0FAF8]"
                        >
                          My Dashboard
                        </Link>
                        <Link
                          to={roleDashboardPath}
                          onClick={() => setLoginOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-[#F0FAF8]"
                        >
                          <Settings size={15} /> Modify Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut size={15} /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSignInOpen((v) => !v)}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    <UserRound size={16} className="shrink-0" />
                    Sign In
                    <ChevronDown size={14} className={`shrink-0 ${signInOpen ? 'rotate-180 transition' : 'transition'}`} />
                  </button>

                  <AnimatePresence>
                    {signInOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-56 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-xl z-[60]"
                      >
                        <Link to="/admin/login" onClick={closeAll} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#1F2937] hover:bg-[#F0FAF8] hover:text-[#0F766E]">
                          <ShieldCheck size={17} className="text-[#0F766E]" /> Admin Login
                        </Link>
                        <Link to="/login" onClick={closeAll} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#1F2937] hover:bg-[#F0FAF8] hover:text-[#0F766E]">
                          <UserRound size={17} className="text-[#0F766E]" /> User Login
                        </Link>
                        <Link to="/broker/login" onClick={closeAll} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#1F2937] hover:bg-[#F0FAF8] hover:text-[#0F766E]">
                          <Building2 size={17} className="text-[#0F766E]" /> Broker Login
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            <button
              onClick={() => setShowPostModal(true)}
              className="btn-primary shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold"
            >
              Post Property
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="ml-auto shrink-0 rounded-xl border border-[#E5E7EB] p-2 text-[#1F2937] md:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-[#E5E7EB] bg-white px-4 py-4 md:hidden">
              <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[#F8F8F7] px-3 py-2">
                <Search size={16} className="text-[#0F766E]" />
                <span className="text-sm text-[#6B7280]">Search Chennai, Coimbatore, Madurai...</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {navLinks.map((item) => (
                  item.to ? (
                    <Link key={item.label} to={item.to} onClick={closeAll} className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm font-semibold">
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href ?? `#${item.scrollTo}`}
                      onClick={(e) => {
                        if (item.scrollTo) {
                          e.preventDefault()
                          document.getElementById(item.scrollTo)?.scrollIntoView({ behavior: 'smooth' })
                        }
                        closeAll()
                      }}
                      className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm font-semibold"
                    >
                      {item.label}
                    </a>
                  )
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                {user ? (
                  <>
                    <Link to={roleDashboardPath} className="btn-secondary flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold">Dashboard</Link>
                    <button onClick={handleLogout} className="btn-primary flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold">Sign in</Link>
                    <button onClick={() => { setOpen(false); setShowPostModal(true) }} className="btn-primary flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold">
                      Post Property
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {showPostModal && <PostPropertyModal onClose={() => setShowPostModal(false)} />}
    </>
  )
}
