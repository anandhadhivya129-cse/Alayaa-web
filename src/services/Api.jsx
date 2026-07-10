import { supabase } from './supabaseClient.js'

const SITE_URL = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
const AVATAR_BUCKET = 'profile-pictures'
const PROPERTY_BUCKET = 'property-images'
const EMAIL_FUNCTION = 'send_notification_email'

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function safeJson(value) {
  return value && typeof value === 'object' ? value : {}
}

function normalizeProfile(row, brokerApproval = null) {
  if (!row) return null
  return {
    id: row.id,
    full_name: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    role: row.role || 'customer',
    profile_picture: row.profile_picture || '',
    city: row.city || '',
    bio: row.bio || '',
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    brokerApproval,
  }
}
function formatIndianPrice(value) {
  const num = Number(value || 0)
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
  if (num >= 100000)   return `₹${(num / 100000).toFixed(2)} L`
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}K`
  if (num === 0)       return 'On request'
  return `₹${num.toLocaleString('en-IN')}`
}
function normalizeProperty(row) {
  if (!row) return null
  
  return {
    id: row.id,
    broker_id: row.broker_id || null,
    title: row.title || '',
    description: row.description || '',
    city: row.city || '',
    locality: row.locality || '',
    location: row.location || '',
    price: Number(row.price_value || 0),
    priceValue: Number(row.price_value || 0), // convert raw rupees to lakhs, matching mock data's scale
    bhk: Number(row.bhk || row.bedrooms || 0),
    bedrooms: Number(row.bedrooms || 0),
    bathrooms: Number(row.bathrooms || 0),
    area: row.area ? `${row.area} sq.ft` : (row.area_value ? `${row.area_value} sq.ft` : ''),
    areaValue: Number(row.area_value || row.area || 0),
    propertyType: row.property_type || '',
    listingType: row.listing_type || 'Buy',
    image: row.image || (Array.isArray(row.images) && row.images[0]) || '',
    images: Array.isArray(row.images) ? row.images : (row.image ? [row.image] : []),
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    verified: Boolean(row.verified),
    amenities: row.amenities || [],
    parking: row.parking || '',
    furnishing: row.furnishing || '',
    status: row.status || 'draft',
    nearby: { school: row.school_distance || '—', railway: row.rail_distance || '—' },
    created_at: row.created_at || null,
  }
}


function normalizeFavourite(row, property = null) {
  return {
    id: row.id,
    customer_id: row.customer_id,
    property_id: row.property_id,
    created_at: row.created_at || null,
    property,
  }
}

function normalizeEnquiry(row, property = null, broker = null) {
  return {
    id: row.id,
    customer_id: row.customer_id,
    property_id: row.property_id,
    broker_id: row.broker_id,
    message: row.message || '',
    status: row.status || 'new',
    reply_message: row.reply_message || '',
    replied_at: row.replied_at || null,
    created_at: row.created_at || null,
    property,
    broker,
  }
}

async function raiseIfError(result) {
  if (result.error) {
    throw result.error
  }
  return result.data
}

async function getCurrentAuthUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user || null
}


async function fetchBrokerApproval(brokerId) {
  return { status: 'approved' }  
}

async function ensureProfileForAuthUser(authUser) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error) throw error

  if (data) {
    return data
  }

  
  if (authUser.email) {
    const { data: byEmail, error: emailError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', authUser.email)
      .maybeSingle()

    if (emailError) throw emailError

    if (byEmail) {
      const { data: relinked, error: relinkError } = await supabase
        .from('profiles')
        .update({ id: authUser.id })
        .eq('email', authUser.email)
        .select('*')
        .single()

      if (relinkError) throw relinkError
      return relinked
    }
  }

  const metadata = safeJson(authUser.user_metadata)
  const profilePayload = {
    id: authUser.id,
    full_name: metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'ALAYAA User',
    email: authUser.email || '',
    phone: metadata.phone || '',
    role: metadata.role || 'customer',
    profile_picture: metadata.profile_picture || '',
    city: metadata.city || '',
    bio: metadata.bio || '',
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' })
    .select('*')
    .single()

  if (insertError) throw insertError
  return inserted
}

async function attachProperties(rows, normalizer = normalizeFavourite) {
  const propertyIds = [...new Set(rows.map((row) => row.property_id).filter(Boolean))]
  if (!propertyIds.length) return rows.map((row) => normalizer(row, null))

  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .in('id', propertyIds)

  if (error) throw error

  const propertyMap = new Map((properties || []).map((property) => [property.id, normalizeProperty(property)]))
  return rows.map((row) => normalizer(row, propertyMap.get(row.property_id) || null))
}

async function attachProfiles(rows, profileKey) {
  const profileIds = [...new Set(rows.map((row) => row[profileKey]).filter(Boolean))]
  if (!profileIds.length) return rows

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', profileIds)

  if (error) throw error

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, normalizeProfile(profile)]))
  return rows.map((row) => ({ ...row, [profileKey.replace('_id', '')]: profileMap.get(row[profileKey]) || null }))
}

function authRedirectPath(nextPath) {
  const safeNext = nextPath || '/login'
  return `${SITE_URL}/auth/callback?next=${encodeURIComponent(safeNext)}`
}

export async function login({ email, password, role }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })


  if (error) throw error

  const authUser = data.user
  if (!authUser) {
    throw new Error('Unable to sign in right now.')
  }

  const profile = normalizeProfile(await ensureProfileForAuthUser(authUser), await fetchBrokerApproval(authUser.id))
  if (!profile) {
    throw new Error('Your profile could not be loaded.')
  }

  if (role && profile.role !== role) {
    await supabase.auth.signOut()
    throw new Error(`This account is registered as a ${profile.role}. Please use the correct login page.`)
  }

  if (profile.role === 'broker') {
    const approval = profile.brokerApproval || (await fetchBrokerApproval(authUser.id))
    if (approval?.status === 'rejected') {
      await supabase.auth.signOut()
      throw new Error('Your broker application has been rejected. Please contact support.')
    }
    profile.brokerApproval = approval
  }

  return {
    session: data.session,
    user: {
      id: authUser.id,
      email: authUser.email || profile.email,
      profile,
    },
  }
}

export async function register(payload) {
  const {
    fullName,
    email,
    phone,
    city,
    bio,
    password,
    role = 'customer',
  } = payload

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authRedirectPath('/login?verified=1'),
      data: {
        full_name: fullName,
        phone,
        city,
        bio,
        role,
      },
    },
  })

  console.log('SIGNUP RESULT DATA:', data)
  console.log('SIGNUP RESULT ERROR:', error)

  if (error) throw error

  if (data.user) {
    try {
      await sendEmailEvent('welcome', {
        to: email,
        fullName,
        role,
      })
    } catch (sendError) {
      console.error('Welcome email failed', sendError)
    }
  }

  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function forgotPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authRedirectPath('/reset-password'),
  })

  if (error) throw error
  return data
}

export async function resetPassword(password) {
  const { data, error } = await supabase.auth.updateUser({ password })
  if (error) throw error
  return data
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const approval = data.role === 'broker' ? await fetchBrokerApproval(userId) : null
  return normalizeProfile(data, approval)
}

export async function updateProfile(userId, updates) {
  const payload = {
    full_name: updates.full_name ?? updates.fullName ?? undefined,
    phone: updates.phone ?? undefined,
    city: updates.city ?? undefined,
    bio: updates.bio ?? undefined,
    profile_picture: updates.profile_picture ?? updates.profilePicture ?? undefined,
    updated_at: new Date().toISOString(),
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key]
  })

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error

  const approval = data.role === 'broker' ? await fetchBrokerApproval(userId) : null
  return normalizeProfile(data, approval)
}

export async function uploadProfilePicture(file, userId) {
  const extension = file.name.split('.').pop() || 'jpg'
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
  .from(PROPERTY_BUCKET)
  .upload(filePath, file, { upsert: true, cacheControl: '3600', contentType: file.type })

console.log('UPLOAD ERROR DETAIL:', error, 'BUCKET:', PROPERTY_BUCKET, 'PATH:', filePath, 'FILE TYPE:', file.type)

if (error) throw error

  if (error) throw error

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

export async function uploadPropertyImages(files, brokerId) {
  const uploads = await Promise.all(
    files.map(async (file) => {
      const extension = file.name.split('.').pop() || 'jpg'
      const filePath = `${brokerId}/${crypto.randomUUID()}.${extension}`
      const { error } = await supabase.storage
        .from(PROPERTY_BUCKET)
        .upload(filePath, file, { upsert: true, cacheControl: '3600', contentType: file.type })

      if (error) throw error

      const { data } = supabase.storage.from(PROPERTY_BUCKET).getPublicUrl(filePath)
      return data.publicUrl
    }),
  )

  return uploads
}
export async function fetchProperties(filters = {}) {
  const options = typeof filters === 'string' ? { query: filters } : filters

  const {
    query = '',
    city = '',
    propertyType = '',
    status = 'active',
    minPrice,
    maxPrice,
    bedrooms,
    limit,
  } = options

  let request = supabase
    .from('properties') // <-- your actual table name
    .select('*')
    .order('id', { ascending: false })

  if (status) {
    request = request.eq('status', status)
  }

  if (city) {
  request = request.ilike('city', city)
}

  if (propertyType) {
    request = request.eq('property_type', propertyType)
  }

  if (typeof minPrice === 'number') {
    request = request.gte('price_value', minPrice)
  }

  if (typeof maxPrice === 'number') {
    request = request.lte('price_value', maxPrice)
  }

  if (typeof bedrooms === 'number') {
    request = request.gte('bhk', bedrooms)
  }

  if (query) {
    const term = query.trim()

    request = request.or(
      `title.ilike.%${term}%,location.ilike.%${term}%,locality.ilike.%${term}%,city.ilike.%${term}%`
    )
  }

  if (limit) {
    request = request.limit(limit)
  }

  const { data, error } = await request

  if (error) {
    console.error(error)
    throw error
  }

  return (data || []).map(normalizeProperty)
}

export async function fetchPropertyById(id) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return normalizeProperty(data)
}

// AFTER
export async function fetchBrokerProperties(brokerId) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('broker_id', brokerId)   // ✅ directly filter
    .order('id', { ascending: false })

  if (error) throw error
  return (data || []).map(normalizeProperty)
}

export async function createProperty(payload) {
  const { data: authUser, error: authErr } = await supabase.auth.getUser()
  console.log('AUTH USER:', authUser, 'AUTH ERROR:', authErr)
  const { data: sessionData } = await supabase.auth.getSession()
  console.log('SESSION:', sessionData)
  const brokerId = payload.broker_id || authUser.user?.id
  if (!brokerId) throw new Error('A logged in broker is required.')

  const row = {
    broker_id: brokerId,
    title: payload.title,
    description: payload.description,
   price_value: Number(payload.price || 0),  
    location: payload.location,
    city: payload.city,
    bedrooms: Number(payload.bedrooms || 0),
    bathrooms: Number(payload.bathrooms || 0),
    area: Number(payload.area || 0),
    property_type: payload.property_type,
    status: payload.status || 'active',
    images: asArray(payload.images),
  }

  const { data, error } = await supabase
    .from('properties')
    .insert(row)
    .select('*')
    .single()

  if (error) throw error
  return normalizeProperty(data)
}

// AFTER
export async function updateProperty(id, payload) {
  const row = {
    title: payload.title,
    description: payload.description,
    price_value: Number(payload.price || 0),  
    location: payload.location,
    city: payload.city,
    locality: payload.locality || '',
    bedrooms: Number(payload.bedrooms || 0),
    bathrooms: Number(payload.bathrooms || 0),
    area: Number(payload.area || 0),
    property_type: payload.property_type,
    status: payload.status || 'active',
    images: asArray(payload.images),
    updated_at: new Date().toISOString(),
  }
  

  const { data, error } = await supabase
    .from('properties')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return normalizeProperty(data)
}

export async function deleteProperty(id) {
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function fetchFavorites(customerId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return attachProperties(data || [])
}

export async function fetchUserFavorites(customerId) {
  return fetchFavorites(customerId)
}

export async function toggleFavorite(customerId, propertyId) {
  const { data: existing, error: lookupError } = await supabase
    .from('favorites')
    .select('*')
    .eq('customer_id', customerId)
    .eq('property_id', propertyId)
    .maybeSingle()

  if (lookupError) throw lookupError

  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('id', existing.id)
    if (error) throw error
    return { favorited: false }
  }

  const { data, error } = await supabase
    .from('favorites')
    .insert({ customer_id: customerId, property_id: propertyId })
    .select('*')
    .single()

  if (error) throw error
  return { favorited: true, favorite: data }
}

export async function fetchCustomerEnquiries(customerId) {
  const { data, error } = await supabase
    .from('enquiries')
    .select('*, property:properties(title, location, city, broker_id)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = data || []
  return attachProperties(rows, normalizeEnquiry)
}

export async function fetchBrokerEnquiries(brokerId) {
  const { data, error } = await supabase
    .from('enquiries')
    .select('*')
    .eq('broker_id', brokerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = data || []
  const withProperties = await attachProperties(rows, normalizeEnquiry)
  return attachProfiles(withProperties, 'customer_id')
}

export async function createEnquiry(payload) {
  const row = {
    customer_id: payload.customer_id,
    property_id: payload.property_id,
    broker_id: payload.broker_id,
    message: payload.message,
    status: payload.status || 'new',
  }

  const { data, error } = await supabase
    .from('enquiries')
    .insert(row)
    .select('*')
    .single()

  if (error) throw error

  try {
    await sendEmailEvent('enquiry', {
      to: payload.broker_email || '',
      propertyTitle: payload.property_title || '',
      customerName: payload.customer_name || '',
      message: payload.message,
      customerEmail: payload.customer_email || '',
    })
  } catch (sendError) {
    console.error('Enquiry notification failed', sendError)
  }

  return normalizeEnquiry(data)
}

export async function replyToEnquiry(enquiryId, replyMessage, context = {}) {
  const { data, error } = await supabase
    .from('enquiries')
    .update({
      reply_message: replyMessage,
      status: 'replied',
      replied_at: new Date().toISOString(),
    })
    .eq('id', enquiryId)
    .select('*')
    .single()

  if (error) throw error

  try {
    await sendEmailEvent('enquiry_reply', {
      to: context.customer_email || '',
      customerName: context.customer_name || '',
      brokerName: context.broker_name || '',
      propertyTitle: context.property_title || '',
      replyMessage,
    })
  } catch (sendError) {
    console.error('Enquiry reply notification failed', sendError)
  }

  return normalizeEnquiry(data)
}

export async function fetchBrokerDashboard(brokerId) {
  const [properties, enquiries, approval] = await Promise.all([
    fetchBrokerProperties(brokerId),
    fetchBrokerEnquiries(brokerId),
    fetchBrokerApproval(brokerId),
  ])

  return {
    properties,
    enquiries,
    approval,
    stats: {
      totalProperties: properties.length,
      totalEnquiries: enquiries.length,
      pendingEnquiries: enquiries.filter((item) => item.status === 'new').length,
    },
  }
}

export async function fetchAdminStats() {
  const [properties, profiles, enquiries, approvals] = await Promise.all([
    supabase.from('properties').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('enquiries').select('id', { count: 'exact', head: true }),
    supabase.from('broker_approvals').select('id', { count: 'exact', head: true }),
  ])

  return {
    propertiesCount: properties.count || 0,
    usersCount: profiles.count || 0,
    enquiriesCount: enquiries.count || 0,
    brokerRequestsCount: approvals.count || 0,
  }
}

export async function fetchAdminActivitySeries() {
  const [properties, profiles, enquiries] = await Promise.all([
    supabase.from('properties').select('created_at'),
    supabase.from('profiles').select('created_at'),
    supabase.from('enquiries').select('created_at'),
  ])

  if (properties.error) throw properties.error
  if (profiles.error) throw profiles.error
  if (enquiries.error) throw enquiries.error

  return {
    properties: (properties.data || []).map((row) => row.created_at).filter(Boolean),
    users: (profiles.data || []).map((row) => row.created_at).filter(Boolean),
    enquiries: (enquiries.data || []).map((row) => row.created_at).filter(Boolean),
  }
}

export async function fetchAdminUsers() {
  const [{ data: profiles, error: profilesError }, { data: approvals, error: approvalsError }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('broker_approvals').select('*'),
  ])

  if (profilesError) throw profilesError
  if (approvalsError) throw approvalsError

  const approvalMap = new Map((approvals || []).map((approval) => [approval.broker_id, approval]))
  return (profiles || []).map((profile) => normalizeProfile(profile, approvalMap.get(profile.id) || null))
}

export async function fetchPendingBrokers() {
  const { data, error } = await supabase
    .from('broker_approvals')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error

  const brokerIds = (data || []).map((row) => row.broker_id)
  if (!brokerIds.length) return []

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', brokerIds)

  if (profileError) throw profileError

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, normalizeProfile(profile)]))
  return (data || []).map((approval) => ({
    ...approval,
    profile: profileMap.get(approval.broker_id) || null,
  }))
}

export async function approveBroker(brokerId, approvedBy) {
  const timestamp = new Date().toISOString()
  const { data, error } = await supabase
    .from('broker_approvals')
    .update({ status: 'approved', approved_by: approvedBy, approved_at: timestamp })
    .eq('broker_id', brokerId)
    .select('*')
    .single()

  if (error) throw error

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', brokerId).maybeSingle()

  try {
    await sendEmailEvent('broker_approved', {
      to: profile?.email || '',
      fullName: profile?.full_name || '',
    })
  } catch (sendError) {
    console.error('Broker approval email failed', sendError)
  }

  return data
}

export async function rejectBroker(brokerId, approvedBy) {
  const timestamp = new Date().toISOString()
  const { data, error } = await supabase
    .from('broker_approvals')
    .update({ status: 'rejected', approved_by: approvedBy, approved_at: timestamp })
    .eq('broker_id', brokerId)
    .select('*')
    .single()

  if (error) throw error

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', brokerId).maybeSingle()

  try {
    await sendEmailEvent('broker_rejected', {
      to: profile?.email || '',
      fullName: profile?.full_name || '',
    })
  } catch (sendError) {
    console.error('Broker rejection email failed', sendError)
  }

  return data
}

export async function updateUserRole(userId, role) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return normalizeProfile(data, data.role === 'broker' ? await fetchBrokerApproval(userId) : null)
}

export async function sendEmailEvent(type, payload = {}) {
  const { data, error } = await supabase.functions.invoke(EMAIL_FUNCTION, {
    body: {
      type,
      payload,
    },
  })

  if (error) throw error
  return data
}

export async function getSessionUser() {
  const authUser = await getCurrentAuthUser()
  if (!authUser) return null

  const profile = await ensureProfileForAuthUser(authUser)
  const brokerApproval = profile.role === 'broker' ? await fetchBrokerApproval(authUser.id) : null

  return {
    id: authUser.id,
    email: authUser.email || profile.email,
    profile: normalizeProfile(profile, brokerApproval),
  }
}

export async function refreshSessionProfile() {
  return getSessionUser()
}

export { normalizeProfile, normalizeProperty, normalizeEnquiry, normalizeFavourite }

export async function fetchEnquiryMessages(enquiryId) {
  const { data, error } = await supabase
    .from('enquiry_messages')
    .select('*')
    .eq('enquiry_id', enquiryId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function sendEnquiryMessage(enquiryId, senderId, senderRole, message) {
  const { data, error } = await supabase
    .from('enquiry_messages')
    .insert({ enquiry_id: enquiryId, sender_id: senderId, sender_role: senderRole, message })
    .select()
    .single()
  if (error) throw error
  return data
}

export function subscribeToEnquiryMessages(enquiryId, onMessage) {
  const channel = supabase
    .channel(`enquiry-messages-${enquiryId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'enquiry_messages', filter: `enquiry_id=eq.${enquiryId}` },
      (payload) => onMessage(payload.new)
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export async function fetchProfileById(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, rera_number, profile_picture')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}