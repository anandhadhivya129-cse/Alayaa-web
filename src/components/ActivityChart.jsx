import { useMemo } from 'react'

const SERIES_COLORS = {
  users: '#0F766E',
  properties: '#F59E0B',
  enquiries: '#7C3AED',
}

const SERIES_LABELS = {
  users: 'New users',
  properties: 'New properties',
  enquiries: 'New enquiries',
}

export default function ActivityChart({ labels = [], series = {}, height = 260 }) {
  const keys = Object.keys(series)
  const maxValue = useMemo(() => {
    const values = keys.flatMap((key) => series[key] || [])
    return Math.max(1, ...values)
  }, [series, keys])

  const width = Math.max(560, labels.length * 56)
  const padding = { top: 16, right: 12, bottom: 32, left: 32 }
  const chartHeight = height - padding.top - padding.bottom
  const chartWidth = width - padding.left - padding.right
  const groupWidth = chartWidth / Math.max(1, labels.length)
  const barWidth = Math.max(4, (groupWidth - 12) / Math.max(1, keys.length))
  const gridLines = 4

  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => Math.round((maxValue / gridLines) * i))

  const hasData = keys.some((key) => (series[key] || []).some((value) => value > 0))

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-2 text-xs font-bold text-[#6B7280]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SERIES_COLORS[key] || '#6B7280' }} />
            {SERIES_LABELS[key] || key}
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] text-sm text-[#6B7280]">
          No activity recorded for this period yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <svg width={width} height={height} role="img" aria-label="Platform activity chart">
            {/* Gridlines */}
            {yTicks.map((tick, i) => {
              const y = padding.top + chartHeight - (tick / maxValue) * chartHeight
              return (
                <g key={tick + '-' + i}>
                  <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? '0' : '4 4'}
                  />
                  <text x={4} y={y + 4} fontSize="10" fill="#9CA3AF">
                    {tick}
                  </text>
                </g>
              )
            })}

            {/* Bars */}
            {labels.map((label, groupIndex) => {
              const groupX = padding.left + groupIndex * groupWidth
              return (
                <g key={label + '-' + groupIndex}>
                  {keys.map((key, keyIndex) => {
                    const value = (series[key] || [])[groupIndex] || 0
                    const barHeight = (value / maxValue) * chartHeight
                    const x = groupX + keyIndex * barWidth + 6
                    const y = padding.top + chartHeight - barHeight
                    return (
                      <rect
                        key={key}
                        x={x}
                        y={y}
                        width={Math.max(barWidth - 2, 2)}
                        height={Math.max(barHeight, value > 0 ? 2 : 0)}
                        rx="3"
                        fill={SERIES_COLORS[key] || '#6B7280'}
                      >
                        <title>{`${SERIES_LABELS[key] || key}: ${value} on ${label}`}</title>
                      </rect>
                    )
                  })}
                  <text
                    x={groupX + groupWidth / 2 - 6}
                    y={height - 10}
                    fontSize="10"
                    textAnchor="middle"
                    fill="#6B7280"
                  >
                    {label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}
