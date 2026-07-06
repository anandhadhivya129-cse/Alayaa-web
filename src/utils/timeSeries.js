// Groups arrays of ISO timestamp strings into daily / weekly / monthly buckets
// for the admin dashboard activity chart.

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek(date) {
  const d = startOfDay(date)
  const day = d.getDay() // 0 = Sunday
  d.setDate(d.getDate() - day)
  return d
}

function startOfMonth(date) {
  const d = startOfDay(date)
  d.setDate(1)
  return d
}

const PERIODS = {
  daily: { count: 14, step: DAY_MS, bucketStart: startOfDay, label: (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
  weekly: { count: 12, step: 7 * DAY_MS, bucketStart: startOfWeek, label: (d) => `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` },
  monthly: { count: 12, step: null, bucketStart: startOfMonth, label: (d) => d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) },
}

/**
 * @param {{[series: string]: string[]}} seriesMap - e.g. { users: [...isoDates], properties: [...] }
 * @param {'daily'|'weekly'|'monthly'} period
 * @returns {{ labels: string[], series: {[key: string]: number[]} }}
 */
export function buildActivitySeries(seriesMap, period = 'daily') {
  const config = PERIODS[period] || PERIODS.daily
  const now = new Date()
  const buckets = []

  if (period === 'monthly') {
    const cursor = startOfMonth(now)
    for (let i = config.count - 1; i >= 0; i -= 1) {
      const d = new Date(cursor)
      d.setMonth(d.getMonth() - i)
      buckets.push(d)
    }
  } else {
    const cursorStart = config.bucketStart(now)
    for (let i = config.count - 1; i >= 0; i -= 1) {
      buckets.push(new Date(cursorStart.getTime() - i * config.step))
    }
  }

  const labels = buckets.map((d) => config.label(d))
  const series = {}

  Object.entries(seriesMap).forEach(([key, dates]) => {
    const counts = new Array(buckets.length).fill(0)
    ;(dates || []).forEach((iso) => {
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return
      const bucketDate = config.bucketStart(date)
      const index = buckets.findIndex((b) => b.getTime() === bucketDate.getTime())
      if (index >= 0) counts[index] += 1
    })
    series[key] = counts
  })

  return { labels, series }
}

export const ACTIVITY_PERIODS = ['daily', 'weekly', 'monthly']
