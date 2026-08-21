"use client"

import { useId, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

/* Palette alignée sur les jetons de la charte (globals.css). */
export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

function niceMax(value: number) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

/* ------------------------------------------------------------------ */
/* Courbe de tendance avec aire dégradée + curseur au survol           */
/* ------------------------------------------------------------------ */

export interface TrendPoint {
  label: string
  value: number
  secondary?: number
}

export function TrendChart({
  data,
  formatValue,
  height = 220,
  className,
}: {
  data: TrendPoint[]
  formatValue: (value: number) => string
  height?: number
  className?: string
}) {
  const gradientId = useId()
  const [active, setActive] = useState<number | null>(null)

  const { path, area, points, max } = useMemo(() => {
    const width = 1000
    const max = niceMax(Math.max(...data.map((d) => d.value), 1))
    const stepX = data.length > 1 ? width / (data.length - 1) : width
    const points = data.map((d, i) => ({
      x: i * stepX,
      y: height - (d.value / max) * (height - 24) - 12,
      ...d,
    }))

    // Courbe lissée (Catmull-Rom converti en Bézier cubique).
    let path = points.length ? `M ${points[0].x},${points[0].y}` : ""
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2] ?? p2
      const c1x = p1.x + (p2.x - p0.x) / 6
      const c1y = p1.y + (p2.y - p0.y) / 6
      const c2x = p2.x - (p3.x - p1.x) / 6
      const c2y = p2.y - (p3.y - p1.y) / 6
      path += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
    }
    const area = points.length ? `${path} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z` : ""
    return { path, area, points, max }
  }, [data, height])

  const activePoint = active !== null ? points[active] : null

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 1000 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        onMouseLeave={() => setActive(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          setActive(Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))))
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2="1000"
            y1={height - ratio * (height - 24) - 12}
            y2={height - ratio * (height - 24) - 12}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke="var(--chart-1)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />

        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1="0"
              y2={height}
              stroke="var(--chart-1)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="5" fill="var(--popover)" stroke="var(--chart-1)" strokeWidth="3" />
          </>
        )}
      </svg>

      <div className="mt-2 flex justify-between px-1 text-[11px] text-muted-foreground">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>

      {activePoint && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(activePoint.x / 1000) * 100}%` }}
        >
          <p className="font-medium">{formatValue(activePoint.value)}</p>
          <p className="text-muted-foreground">{activePoint.label}</p>
        </div>
      )}

      <span className="absolute right-1 top-0 text-[10px] text-muted-foreground">{formatValue(max)}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Anneau de répartition                                               */
/* ------------------------------------------------------------------ */

export function DonutChart({
  data,
  formatValue,
  centerLabel,
}: {
  data: { label: string; value: number }[]
  formatValue: (value: number) => string
  centerLabel?: string
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const radius = 52
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative shrink-0">
        <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--muted)" strokeWidth="16" />
          {data.map((slice, index) => {
            const length = (slice.value / total) * circumference
            const dash = `${length} ${circumference - length}`
            const el = (
              <circle
                key={slice.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth="16"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += length
            return el
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-serif text-lg leading-none">{formatValue(total)}</p>
            {centerLabel && <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{centerLabel}</p>}
          </div>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {data.map((slice, index) => (
          <li key={slice.label} className="flex items-center gap-3 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="flex-1 truncate">{slice.label}</span>
            <span className="text-xs text-muted-foreground">{Math.round((slice.value / total) * 100)}%</span>
            <span className="w-24 text-right text-xs font-medium">{formatValue(slice.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Classement en barres horizontales                                   */
/* ------------------------------------------------------------------ */

export function RankingBars({
  data,
  formatValue,
}: {
  data: { label: string; value: number; hint?: string }[]
  formatValue: (value: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <ul className="space-y-3.5">
      {data.map((item, index) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">
              <span className="mr-2 text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </span>
            <span className="shrink-0 text-xs font-medium">{formatValue(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: `linear-gradient(90deg, var(--chart-1), var(--chart-3))`,
              }}
            />
          </div>
          {item.hint && <p className="mt-1 text-[11px] text-muted-foreground">{item.hint}</p>}
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* Colonnes (comparaison mensuelle)                                    */
/* ------------------------------------------------------------------ */

export function ColumnChart({
  data,
  formatValue,
  height = 200,
}: {
  data: { label: string; value: number }[]
  formatValue: (value: number) => string
  height?: number
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 1))
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item) => (
          <div key={item.label} className="group relative flex flex-1 flex-col items-center justify-end gap-2">
            <span className="pointer-events-none absolute -top-1 rounded-lg border border-border bg-popover px-2 py-1 text-[11px] opacity-0 shadow transition group-hover:opacity-100">
              {formatValue(item.value)}
            </span>
            <div
              className="w-full rounded-t-xl bg-gradient-to-t from-[var(--chart-3)] to-[var(--chart-1)] opacity-85 transition group-hover:opacity-100"
              style={{ height: `${Math.max(2, (item.value / max) * (height - 28))}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 text-center text-[11px] text-muted-foreground">
        {data.map((item) => (
          <span key={item.label} className="flex-1 truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mini-courbe pour les cartes d'indicateurs                           */
/* ------------------------------------------------------------------ */

export function Sparkline({ values, tone = "var(--chart-1)" }: { values: number[]; tone?: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const span = max - min || 1
  const path = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`)
    .join(" ")

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full">
      <path d={path} fill="none" stroke={tone} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Anneau de complétion (utilisé par l'éditeur de produit)             */
/* ------------------------------------------------------------------ */

export function ProgressRing({ value, size = 84 }: { value: number; size?: number }) {
  const radius = size / 2 - 7
  const circumference = 2 * Math.PI * radius
  const dash = (value / 100) * circumference

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={value >= 100 ? "var(--chart-2)" : "var(--chart-1)"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute font-serif text-base">{Math.round(value)}%</span>
    </div>
  )
}
