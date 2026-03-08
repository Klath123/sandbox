import React, { useMemo, useState } from "react"
import { arc } from "d3-shape"
import { motion, AnimatePresence } from "framer-motion"
import { levels } from "@/components/levels"

const SIZE = 520
const CENTER = SIZE / 2
const RING_WIDTH = 55

const LEVEL_ACCENT = ["#38bdf8", "#818cf8", "#34d399", "#fb923c"]

export default function Playground() {
  const [darkMode, setDarkMode] = useState(true)
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [implemented, setImplemented] = useState({})
  const [openAccordion, setOpenAccordion] = useState(null)

  const theme = {
    bg:           darkMode ? "#0a0f1a"                  : "#f1f5f9",
    panel:        darkMode ? "#0d1321"                  : "#ffffff",
    panelAlt:     darkMode ? "#0a0f1a"                  : "#f1f5f9",
    text:         darkMode ? "#e2e8f0"                  : "#0f172a",
    textMuted:    darkMode ? "#94a3b8"                  : "#334155",   // ↑ lighter dark / darker light
    textDim:      darkMode ? "#cbd5e1"                  : "#475569",   // ↑ was too dim in both
    border:       darkMode ? "#2d4a6a"                  : "#94a3b8",   // ↑ more visible in light
    headerBg:     darkMode ? "rgba(10,15,26,.92)"       : "rgba(255,255,255,0.96)",
    levelDim:     darkMode
      ? ["#0c2233", "#1a1a3a", "#0d2e22", "#2a1a0a"]
      : ["#bae6fd", "#ddd6fe", "#a7f3d0", "#fed7aa"],               // ↑ saturated tints, not washed-out
    radarDefault: darkMode ? "#111827"                  : "#f8fafc",
    radarHover:   darkMode ? "#1a2033"                  : "#e2e8f0",  // ↑ visible hover in light
    radarStroke:  darkMode ? "#2d4a6a"                  : "#64748b",  // ↑ darker in light
    radarSpoke:   darkMode ? "#1e3a5f"                  : "#94a3b8",  // ↑ darker in light
    // text on radar sectors / outer labels
    outerLabel:   darkMode ? "#94a3b8"                  : "#1e293b",  // ↑ dark text in light mode
    outerLabelHov:darkMode ? "#cbd5e1"                  : "#0f172a",
    indexDefault: darkMode ? "#4b5563"                  : "#475569",
    cardText:     darkMode ? "#94a3b8"                  : "#334155",  // body copy inside cards
    sectionLabel: darkMode ? "#64748b"                  : "#1e293b",  // section heading text
  }

  const sectors = useMemo(() => {
    const arr = []
    levels.forEach((lvl, lvlIndex) => {
      lvl.precautions.forEach((p, pIndex) => {
        arr.push({
          ...p,
          levelIndex: lvlIndex,
          level: lvl.level,
          levelName: lvl.name,
          levelDesc: lvl.desc,
          levelIcon: lvl.icon,
          precautionIndex: pIndex,
          totalInLevel: lvl.precautions.length,
          id: `${lvlIndex}-${pIndex}`
        })
      })
    })
    return arr
  }, [])

  const sectorsByLevel = useMemo(() => {
    const grouped = {}
    sectors.forEach(s => {
      if (!grouped[s.levelIndex]) grouped[s.levelIndex] = []
      grouped[s.levelIndex].push(s)
    })
    return grouped
  }, [sectors])

  const implementedCount = Object.values(implemented).filter(Boolean).length
  const totalControls = sectors.length
  const safetyPct = Math.round((implementedCount / totalControls) * 100) || 0

  const safetyMeta = safetyPct >= 75
    ? { label: "Secure",   color: "#16a34a", bg: "rgba(22,163,74,.12)" }    // darker green for light contrast
    : safetyPct >= 50
    ? { label: "Moderate", color: "#d97706", bg: "rgba(217,119,6,.12)" }    // darker amber
    : safetyPct >= 25
    ? { label: "At Risk",  color: "#ea580c", bg: "rgba(234,88,12,.12)" }    // darker orange
    : { label: "Critical", color: "#dc2626", bg: "rgba(220,38,38,.12)" }    // darker red

  // Override to bright versions for dark mode glow
  const safetyColor = darkMode
    ? (safetyPct >= 75 ? "#34d399" : safetyPct >= 50 ? "#fbbf24" : safetyPct >= 25 ? "#fb923c" : "#f87171")
    : safetyMeta.color

  const toggleImpl = (sector) =>
    setImplemented(prev => ({ ...prev, [sector.id]: !prev[sector.id] }))

  const getFill = (sector, idx) => {
    if (implemented[sector.id]) return theme.levelDim[sector.levelIndex]
    if (selected?.title === sector.title) return theme.levelDim[sector.levelIndex]
    if (hovered === idx) return theme.radarHover
    return theme.radarDefault
  }

  const circumference = 2 * Math.PI * 28
  const dashOffset = circumference * (1 - safetyPct / 100)

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      color: theme.text,
      display: "flex",
      flexDirection: "column",
      transition: "background 0.3s ease"
    }}>

      {/* ── TOP NAV ── */}
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 32px",
          borderBottom: `1px solid ${theme.border}`,
          background: theme.headerBg,
          backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 50
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#0a0f1a" : "#ffffff"} strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: theme.text }}>VAJRA</span>
          <span style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "0.06em" }}>AI SECURITY FRAMEWORK</span>
        </div>

        <div style={{ marginLeft: 24, display: "flex", gap: 8 }}>
          {levels.map((lvl, i) => (
            <div key={i} style={{
              fontSize: 10, fontWeight: 700, padding: "3px 10px",
              borderRadius: 20, letterSpacing: "0.06em",
              background: theme.levelDim[i],
              color: darkMode ? LEVEL_ACCENT[i] : ["#0369a1","#4338ca","#065f46","#9a3412"][i], // darker accent in light
              border: `1px solid ${LEVEL_ACCENT[i]}60`
            }}>
              {lvl.icon} L{lvl.level}
            </div>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 8,
              background: darkMode ? "#1e2a3a" : "#e2e8f0",
              border: `1px solid ${darkMode ? "#2d3f55" : "#94a3b8"}`,
              color: theme.textDim, cursor: "pointer"
            }}
          >
            {darkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M19.78 4.22l1.42-1.42"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          <div style={{
            padding: "5px 14px", borderRadius: 20,
            background: safetyMeta.bg,
            border: `1px solid ${safetyColor}50`,
            display: "flex", alignItems: "center", gap: 7
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: safetyColor, boxShadow: darkMode ? `0 0 6px ${safetyColor}` : "none" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: safetyColor, letterSpacing: "0.06em" }}>
              {safetyMeta.label}
            </span>
            <span style={{ fontSize: 11, color: theme.textDim }}>{safetyPct}%</span>
          </div>

          <button
            onClick={() => { setImplemented({}); setSelected(null) }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 8,
              background: darkMode ? "#1e2a3a" : "#e2e8f0",
              border: `1px solid ${darkMode ? "#2d3f55" : "#94a3b8"}`,
              color: theme.textDim, fontSize: 11, cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            Reset
          </button>
        </div>
      </motion.header>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── RADAR PANEL ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            flex: "0 0 auto", padding: "28px 24px 28px 32px",
            display: "flex", flexDirection: "column", alignItems: "center",
            borderRight: `1px solid ${theme.border}`,
            background: theme.panel
          }}
        >
          <svg width={SIZE} height={SIZE}>
            <defs>
              {LEVEL_ACCENT.map((c, i) => (
                <radialGradient key={i} id={`rg${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={c} stopOpacity={darkMode ? "0.04" : "0.08"}/>
                  <stop offset="100%" stopColor={c} stopOpacity="0"/>
                </radialGradient>
              ))}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>

            {[0,1,2,3].map(i => (
              <circle key={i} cx={CENTER} cy={CENTER} r={(i+1)*RING_WIDTH+40} fill={`url(#rg${i})`}/>
            ))}

            {[0,1,2,3,4].map(i => (
              <circle key={i} cx={CENTER} cy={CENTER} r={i*RING_WIDTH+40}
                fill="none" stroke={theme.border} strokeWidth="1"
                strokeDasharray={i === 0 ? "none" : "3,5"}
              />
            ))}

            {[...Array(28)].map((_, i) => {
              const a = (i * Math.PI * 2) / 28 - Math.PI / 2
              return (
                <line key={i}
                  x1={CENTER} y1={CENTER}
                  x2={CENTER + 330 * Math.cos(a)}
                  y2={CENTER + 330 * Math.sin(a)}
                  stroke={theme.radarSpoke} strokeWidth="0.7"
                />
              )
            })}

            {[0,1,2,3].map(lvlIdx => {
              const lvlSectors = sectorsByLevel[lvlIdx] || []
              const step = (2 * Math.PI) / lvlSectors.length
              const inner = lvlIdx * RING_WIDTH + 40
              const outer = inner + RING_WIDTH
              const accent = LEVEL_ACCENT[lvlIdx]
              const accentDark = ["#0369a1","#4338ca","#065f46","#9a3412"][lvlIdx]

              return lvlSectors.map((sector, idx) => {
                const gi = sectors.findIndex(s => s.title === sector.title)
                const start = idx * step - Math.PI / 2
                const end   = start + step
                const mid   = (start + end) / 2

                const pathFn = arc()
                  .innerRadius(inner + 2).outerRadius(outer - 2)
                  .startAngle(start + 0.015).endAngle(end - 0.015)
                  .cornerRadius(3)

                const isSel  = selected?.title === sector.title
                const isHov  = hovered === gi
                const isImpl = implemented[sector.id]

                const lr = outer + 22
                const lx = CENTER + Math.cos(mid) * lr
                const ly = CENTER + Math.sin(mid) * lr
                const shortTitle = sector.title.length > 15
                  ? sector.title.substring(0, 13) + "…"
                  : sector.title

                const usedAccent = darkMode ? accent : accentDark

                return (
                  <g key={gi} transform={`translate(${CENTER},${CENTER})`}
                    onClick={() => setSelected(isSel ? null : sector)}
                    onMouseEnter={() => setHovered(gi)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <path
                      d={pathFn()}
                      fill={getFill(sector, gi)}
                      stroke={isImpl || isSel || isHov ? usedAccent : theme.radarStroke}
                      strokeWidth={isSel ? 1.5 : 0.8}
                      style={{ transition: "all 0.15s ease" }}
                      filter={isSel ? "url(#glow)" : "none"}
                    />
                    {/* index number inside sector */}
                    <text
                      x={Math.cos(mid) * (inner + RING_WIDTH / 2)}
                      y={Math.sin(mid) * (inner + RING_WIDTH / 2)}
                      fontSize="8" textAnchor="middle" dominantBaseline="middle"
                      fill={isImpl || isSel ? usedAccent : theme.indexDefault}
                      fontWeight={isSel || isImpl ? "700" : "500"}
                      style={{ pointerEvents: "none" }}
                    >
                      {isImpl ? "✓" : idx + 1}
                    </text>
                    {/* outer label */}
                    <text
                      x={lx - CENTER} y={ly - CENTER}
                      fontSize="8.5" textAnchor="middle" dominantBaseline="middle"
                      fill={isSel ? usedAccent : isHov ? theme.outerLabelHov : theme.outerLabel}
                      fontWeight={isSel ? "700" : "500"}
                      style={{ pointerEvents: "none", transition: "fill 0.15s" }}
                    >
                      {shortTitle}
                    </text>
                  </g>
                )
              })
            })}

            {/* Ring level labels */}
            {[0,1,2,3].map(i => (
              <text key={i}
                x={CENTER} y={CENTER - (i * RING_WIDTH + 40 + RING_WIDTH / 2)}
                textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700"
                fill={darkMode ? LEVEL_ACCENT[i] : ["#0369a1","#4338ca","#065f46","#9a3412"][i]}
                opacity={darkMode ? "0.5" : "0.8"}
                style={{ pointerEvents: "none" }}
              >
                L{i + 1}
              </text>
            ))}

            {/* Center badge */}
            <g transform={`translate(${CENTER},${CENTER})`}>
              <circle r="36" fill={theme.panel} stroke={theme.border} strokeWidth="1.5"/>
              <circle r="28" fill="none" stroke={theme.border} strokeWidth="3"/>
              <circle r="28" fill="none" stroke={safetyColor} strokeWidth="3"
                strokeLinecap="round" strokeDasharray={circumference}
                strokeDashoffset={dashOffset} transform="rotate(-90)"
                style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s" }}
              />
              <text textAnchor="middle" dominantBaseline="middle"
                fontSize="13" fontWeight="700" fill={theme.text}>
                {safetyPct}%
              </text>
              <text y="14" textAnchor="middle" fontSize="7"
                fill={theme.textMuted} letterSpacing="0.05em">SECURE</text>
            </g>
          </svg>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
            {[
              { label: "Default",     color: darkMode ? "#111827" : "#f8fafc", border: darkMode ? "#374151" : "#94a3b8" },
              { label: "Implemented", color: LEVEL_ACCENT[0], border: LEVEL_ACCENT[0] },
              { label: "Selected",    color: LEVEL_ACCENT[1], border: LEVEL_ACCENT[1] },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: item.label === "Default" ? item.color : item.color + "22",
                  border: `1px solid ${item.border}`
                }}/>
                <span style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "0.04em" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── RIGHT DETAIL PANEL ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", background: theme.panelAlt }}>
          <AnimatePresence mode="wait">

            {/* ── EMPTY STATE ── */}
            {!selected && (
              <motion.div key="empty"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
                  Security Controls
                </h2>
                <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 28 }}>
                  Click any radar segment to inspect a control
                </p>

                {/* Posture card */}
                <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4, letterSpacing: "0.08em" }}>OVERALL SAFETY POSTURE</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: safetyColor }}>{safetyPct}%</div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>{implementedCount} / {totalControls} controls</div>
                    </div>
                    <div style={{ padding: "6px 14px", borderRadius: 20, background: safetyMeta.bg, color: safetyColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", border: `1px solid ${safetyColor}40` }}>
                      {safetyMeta.label}
                    </div>
                  </div>
                  <div style={{ height: 6, background: theme.border, borderRadius: 8, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${safetyPct}%` }} transition={{ duration: 0.8 }}
                      style={{ height: "100%", background: safetyColor, borderRadius: 8 }} />
                  </div>
                </div>

                {/* Accordion */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {levels.map((lvl, i) => {
                    const isOpen = openAccordion === i
                    const lvlImpl = Object.entries(implemented).filter(([k, v]) => v && k.startsWith(`${i}-`)).length
                    const accent = LEVEL_ACCENT[i]
                    const accentDark = ["#0369a1","#4338ca","#065f46","#9a3412"][i]
                    const usedAccent = darkMode ? accent : accentDark

                    return (
                      <div key={i} style={{
                        background: theme.panel,
                        border: `1px solid ${isOpen ? usedAccent + "70" : theme.border}`,
                        borderRadius: 10, overflow: "hidden"
                      }}>
                        <button
                          onClick={() => setOpenAccordion(isOpen ? null : i)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                        >
                          <span style={{ fontSize: 16 }}>{lvl.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: usedAccent }}>L{lvl.level} — {lvl.name}</div>
                            <div style={{ fontSize: 10, color: theme.textMuted }}>{lvl.precautions.length} controls · {lvlImpl} implemented</div>
                          </div>
                          <motion.svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={usedAccent} strokeWidth="2.5" animate={{ rotate: isOpen ? 180 : 0 }}>
                            <path d="M6 9l6 6 6-6"/>
                          </motion.svg>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              style={{ overflow: "hidden" }}
                            >
                              <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                                <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, borderTop: `1px solid ${theme.border}`, paddingTop: 10, lineHeight: 1.6 }}>
                                  {lvl.desc}
                                </p>
                                {lvl.precautions.map((p, pi) => {
                                  const isImpl = implemented[`${i}-${pi}`]
                                  return (
                                    <div key={pi}
                                      onClick={() => setSelected(sectors.find(s => s.id === `${i}-${pi}`))}
                                      style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                                        background: isImpl ? usedAccent + "18" : (darkMode ? "#111827" : "#f1f5f9"),
                                        border: `1px solid ${isImpl ? usedAccent + "60" : theme.border}`
                                      }}
                                    >
                                      <div style={{
                                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                        background: isImpl ? usedAccent : (darkMode ? "#1e2a3a" : "#e2e8f0"),
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 9, fontWeight: 700,
                                        color: isImpl ? (darkMode ? "#0a0f1a" : "#ffffff") : theme.textMuted
                                      }}>
                                        {isImpl ? "✓" : pi + 1}
                                      </div>
                                      <span style={{ fontSize: 11, color: isImpl ? usedAccent : theme.text }}>
                                        {p.title}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* ── DETAIL VIEW ── */}
            {selected && (
              <motion.div key={selected.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button
                  onClick={() => setSelected(null)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: theme.textMuted, fontSize: 11, fontFamily: "inherit", marginBottom: 20 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
                  ALL CONTROLS
                </button>

                {/* Title block */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>{selected.levelIcon}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      background: LEVEL_ACCENT[selected.levelIndex] + "20",
                      color: darkMode ? LEVEL_ACCENT[selected.levelIndex] : ["#0369a1","#4338ca","#065f46","#9a3412"][selected.levelIndex],
                      border: `1px solid ${LEVEL_ACCENT[selected.levelIndex]}50`
                    }}>
                      L{selected.level} · {selected.levelName.toUpperCase()}
                    </span>
                    {implemented[selected.id] && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#34d39920", color: darkMode ? "#34d399" : "#065f46", border: "1px solid #34d39950" }}>
                        ✓ IMPLEMENTED
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, marginBottom: 8 }}>{selected.title}</h2>
                  <p style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.7 }}>{selected.description}</p>
                </div>

                {/* Risks card */}
                <div style={{ background: theme.panel, border: `1px solid ${darkMode ? "#f8717130" : "#fca5a5"}`, borderRadius: 10, padding: "16px 18px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: darkMode ? "#f8717118" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#f87171" : "#dc2626"} strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: darkMode ? "#f87171" : "#dc2626", letterSpacing: "0.07em" }}>
                      RISKS IF NOT IMPLEMENTED
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.risk.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: darkMode ? "#f8717160" : "#fca5a5", marginTop: 6, flexShrink: 0 }}/>
                        <span style={{ fontSize: 12.5, color: theme.cardText, lineHeight: 1.6 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mitigation card */}
                {selected.mitigation && (
                  <div style={{ background: theme.panel, border: `1px solid ${darkMode ? "#34d39930" : "#6ee7b7"}`, borderRadius: 10, padding: "16px 18px", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: darkMode ? "#34d39918" : "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#34d399" : "#065f46"} strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: darkMode ? "#34d399" : "#065f46", letterSpacing: "0.07em" }}>
                        RECOMMENDED MITIGATION
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: theme.cardText, lineHeight: 1.7 }}>{selected.mitigation}</p>
                  </div>
                )}

                {/* Compliance card */}
                {selected.compliance?.length > 0 && (
                  <div style={{ background: theme.panel, border: `1px solid ${darkMode ? "#818cf830" : "#a5b4fc"}`, borderRadius: 10, padding: "16px 18px", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: darkMode ? "#818cf818" : "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#818cf8" : "#4338ca"} strokeWidth="2">
                          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: darkMode ? "#818cf8" : "#4338ca", letterSpacing: "0.07em" }}>
                        COMPLIANCE STANDARDS
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {selected.compliance.map((c, i) => (
                        <span key={i} style={{
                          fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                          background: darkMode ? "#818cf815" : "#ede9fe",
                          color: darkMode ? "#818cf8" : "#4338ca",
                          border: `1px solid ${darkMode ? "#818cf830" : "#a5b4fc"}`
                        }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Implement toggle */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleImpl(selected)}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: "inherit", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", cursor: "pointer",
                    border: `1px solid ${implemented[selected.id]
                      ? (darkMode ? "#34d39940" : "#6ee7b7")
                      : (darkMode ? "#38bdf840" : "#7dd3fc")}`,
                    background: implemented[selected.id]
                      ? (darkMode ? "#34d39912" : "#d1fae5")
                      : (darkMode ? "#38bdf812" : "#e0f2fe"),
                    color: implemented[selected.id]
                      ? (darkMode ? "#34d399" : "#065f46")
                      : (darkMode ? "#38bdf8" : "#0369a1"),
                    transition: "all 0.2s"
                  }}
                >
                  {implemented[selected.id] ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg> MARK AS NOT IMPLEMENTED</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> MARK AS IMPLEMENTED</>
                  )}
                </motion.button>

                <div style={{ marginTop: 16, textAlign: "center", fontSize: 10, color: theme.textMuted, letterSpacing: "0.05em" }}>
                  CLICK ANOTHER SECTOR TO NAVIGATE
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}