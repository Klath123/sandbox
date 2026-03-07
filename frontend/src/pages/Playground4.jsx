import React, { useMemo, useState } from "react"
import { arc } from "d3-shape"
import { motion, AnimatePresence } from "framer-motion"
import { levels } from "@/components/levels"

const SIZE = 720
const CENTER = SIZE / 2
const RING_WIDTH = 68

const LEVEL_ACCENT = ["#38bdf8", "#818cf8", "#34d399", "#fb923c"]
const LEVEL_DIM    = ["#0c2233", "#1a1a3a", "#0d2e22", "#2a1a0a"]

export default function Playground() {
  const [selected, setSelected]     = useState(null)
  const [hovered, setHovered]       = useState(null)
  const [implemented, setImplemented] = useState({})
  const [openAccordion, setOpenAccordion] = useState(null)

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
    ? { label: "Secure",   color: "#34d399", bg: "rgba(52,211,153,.12)" }
    : safetyPct >= 50
    ? { label: "Moderate", color: "#fbbf24", bg: "rgba(251,191,36,.12)" }
    : safetyPct >= 25
    ? { label: "At Risk",  color: "#fb923c", bg: "rgba(251,146,60,.12)" }
    : { label: "Critical", color: "#f87171", bg: "rgba(248,113,113,.12)" }

  const toggleImpl = (sector) =>
    setImplemented(prev => ({ ...prev, [sector.id]: !prev[sector.id] }))

  const getFill = (sector, idx) => {
    if (implemented[sector.id]) return LEVEL_DIM[sector.levelIndex]
    if (selected?.title === sector.title) return LEVEL_DIM[sector.levelIndex]
    if (hovered === idx) return "#1a2033"
    return "#111827"
  }

  const getStroke = (sector, idx) => {
    if (implemented[sector.id]) return LEVEL_ACCENT[sector.levelIndex]
    if (selected?.title === sector.title) return LEVEL_ACCENT[sector.levelIndex]
    if (hovered === idx) return "#374151"
    return "#1f2937"
  }

  const circumference = 2 * Math.PI * 28
  const dashOffset = circumference * (1 - safetyPct / 100)

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1a",
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      color: "#e2e8f0",
      display: "flex",
      flexDirection: "column"
    }}>

      {/* ── TOP NAV ── */}
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 32px",
          borderBottom: "1px solid #1e2a3a",
          background: "rgba(10,15,26,.85)",
          backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 50
        }}
      >
        {/* Logo */}
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0f1a" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "#f1f5f9" }}>VAJRA</span>
          <span style={{ fontSize: 10, color: "#475569", letterSpacing: "0.06em" }}>AI SECURITY FRAMEWORK</span>
        </div>

        {/* Level pills */}
        <div style={{ marginLeft: 24, display: "flex", gap: 8 }}>
          {levels.map((lvl, i) => (
            <div key={i} style={{
              fontSize: 10, fontWeight: 600, padding: "3px 10px",
              borderRadius: 20, letterSpacing: "0.06em",
              background: LEVEL_DIM[i],
              color: LEVEL_ACCENT[i],
              border: `1px solid ${LEVEL_ACCENT[i]}40`
            }}>
              {lvl.icon} L{lvl.level}
            </div>
          ))}
        </div>

        {/* Safety score pill */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            padding: "5px 14px", borderRadius: 20,
            background: safetyMeta.bg,
            border: `1px solid ${safetyMeta.color}40`,
            display: "flex", alignItems: "center", gap: 7
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: safetyMeta.color, boxShadow: `0 0 6px ${safetyMeta.color}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: safetyMeta.color, letterSpacing: "0.06em" }}>
              {safetyMeta.label}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{safetyPct}%</span>
          </div>
          <button
            onClick={() => { setImplemented({}); setSelected(null) }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 8,
              background: "#1e2a3a", border: "1px solid #2d3f55",
              color: "#94a3b8", fontSize: 11, cursor: "pointer",
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
          transition={{ duration: 0.55, delay: 0.1 }}
          style={{
            flex: "0 0 auto", padding: "28px 24px 28px 32px",
            display: "flex", flexDirection: "column", alignItems: "center",
            borderRight: "1px solid #1e2a3a",
            background: "#0d1321"
          }}
        >
          <svg width={SIZE} height={SIZE}>
            <defs>
              {LEVEL_ACCENT.map((c, i) => (
                <radialGradient key={i} id={`rg${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={c} stopOpacity="0.04"/>
                  <stop offset="100%" stopColor={c} stopOpacity="0"/>
                </radialGradient>
              ))}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>

            {/* Ring fills */}
            {[0,1,2,3].map(i => (
              <circle key={i} cx={CENTER} cy={CENTER} r={(i+1)*RING_WIDTH+40} fill={`url(#rg${i})`}/>
            ))}

            {/* Ring borders */}
            {[0,1,2,3,4].map(i => (
              <circle key={i} cx={CENTER} cy={CENTER} r={i*RING_WIDTH+40}
                fill="none" stroke="#1e2a3a" strokeWidth="1"
                strokeDasharray={i === 0 ? "none" : "3,5"}
              />
            ))}

            {/* Spokes */}
            {[...Array(28)].map((_, i) => {
              const a = (i * Math.PI * 2) / 28 - Math.PI / 2
              return (
                <line key={i}
                  x1={CENTER} y1={CENTER}
                  x2={CENTER + 330 * Math.cos(a)}
                  y2={CENTER + 330 * Math.sin(a)}
                  stroke="#1a2433" strokeWidth="0.7"
                />
              )
            })}

            {/* Sectors */}
            {[0,1,2,3].map(lvlIdx => {
              const lvlSectors = sectorsByLevel[lvlIdx] || []
              const step = (2 * Math.PI) / lvlSectors.length
              const inner = lvlIdx * RING_WIDTH + 40
              const outer = inner + RING_WIDTH
              const accent = LEVEL_ACCENT[lvlIdx]

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

                return (
                  <g
                    key={gi}
                    transform={`translate(${CENTER},${CENTER})`}
                    onClick={() => setSelected(isSel ? null : sector)}
                    onMouseEnter={() => setHovered(gi)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <path
                      d={pathFn()}
                      fill={getFill(sector, gi)}
                      stroke={isImpl || isSel || isHov ? accent : "#1f2937"}
                      strokeWidth={isSel ? 1.5 : 0.8}
                      style={{ transition: "all 0.15s ease" }}
                      filter={isSel ? "url(#glow)" : "none"}
                    />

                    {/* index */}
                    <text
                      x={Math.cos(mid) * (inner + RING_WIDTH / 2)}
                      y={Math.sin(mid) * (inner + RING_WIDTH / 2)}
                      fontSize="8" textAnchor="middle" dominantBaseline="middle"
                      fill={isImpl ? accent : isSel ? accent : "#4b5563"}
                      fontWeight={isSel || isImpl ? "700" : "400"}
                      style={{ pointerEvents: "none" }}
                    >
                      {isImpl ? "✓" : idx + 1}
                    </text>

                    {/* outer label */}
                    <text
                      x={lx - CENTER} y={ly - CENTER}
                      fontSize="8.5" textAnchor="middle" dominantBaseline="middle"
                      fill={isSel ? accent : isHov ? "#cbd5e1" : "#4b5563"}
                      fontWeight={isSel ? "700" : "400"}
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
                x={CENTER}
                y={CENTER - (i * RING_WIDTH + 40 + RING_WIDTH / 2)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="700"
                fill={LEVEL_ACCENT[i]} opacity="0.5"
                style={{ pointerEvents: "none" }}
              >
                L{i + 1}
              </text>
            ))}

            {/* Center badge */}
            <g transform={`translate(${CENTER},${CENTER})`}>
              <circle r="36" fill="#0d1321" stroke="#1e2a3a" strokeWidth="1.5"/>
              <circle r="28" fill="none" stroke="#1e2a3a" strokeWidth="3"/>
              <circle r="28" fill="none" stroke={safetyMeta.color} strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90)"
                style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s" }}
              />
              <text textAnchor="middle" dominantBaseline="middle"
                fontSize="13" fontWeight="700" fill="#f1f5f9">
                {safetyPct}%
              </text>
              <text y="14" textAnchor="middle" fontSize="7"
                fill="#475569" letterSpacing="0.05em">
                SECURE
              </text>
            </g>
          </svg>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
            {[
              { label: "Default",     color: "#1f2937", border: "#374151" },
              { label: "Implemented", color: LEVEL_ACCENT[0], border: LEVEL_ACCENT[0] },
              { label: "Selected",    color: LEVEL_ACCENT[1], border: LEVEL_ACCENT[1] },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: item.label === "Default" ? "#111827" : item.color + "22",
                  border: `1px solid ${item.border}`
                }}/>
                <span style={{ fontSize: 10, color: "#4b5563", letterSpacing: "0.04em" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── RIGHT DETAIL PANEL ── */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "28px 32px",
          background: "#0a0f1a"
        }}>
          <AnimatePresence mode="wait">

            {/* ── EMPTY STATE ── */}
            {!selected && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 4, letterSpacing: "0.02em" }}>
                  Security Controls
                </h2>
                <p style={{ fontSize: 12, color: "#475569", marginBottom: 28 }}>
                  Click any radar segment to inspect a control
                </p>

                {/* Overall posture card */}
                <div style={{
                  background: "#0d1321", border: "1px solid #1e2a3a",
                  borderRadius: 12, padding: "20px 22px", marginBottom: 20
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#475569", marginBottom: 4, letterSpacing: "0.08em" }}>OVERALL SAFETY POSTURE</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: safetyMeta.color }}>{safetyPct}%</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{implementedCount} / {totalControls} controls</div>
                    </div>
                    <div style={{
                      padding: "6px 14px", borderRadius: 20,
                      background: safetyMeta.bg, color: safetyMeta.color,
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
                      border: `1px solid ${safetyMeta.color}40`
                    }}>{safetyMeta.label}</div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 6, background: "#1e2a3a", borderRadius: 8, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${safetyPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ height: "100%", background: safetyMeta.color, borderRadius: 8 }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: "#374151" }}>
                    <span>Critical</span><span>Moderate</span><span>Secure</span>
                  </div>
                </div>

                {/* Level accordion list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {levels.map((lvl, i) => {
                    const isOpen = openAccordion === i
                    const lvlImpl = Object.entries(implemented).filter(([k, v]) => v && k.startsWith(`${i}-`)).length
                    const accent = LEVEL_ACCENT[i]

                    return (
                      <div key={i} style={{
                        background: "#0d1321",
                        border: `1px solid ${isOpen ? accent + "50" : "#1e2a3a"}`,
                        borderRadius: 10,
                        overflow: "hidden",
                        transition: "border-color 0.2s"
                      }}>
                        {/* Accordion header */}
                        <button
                          onClick={() => setOpenAccordion(isOpen ? null : i)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "13px 16px", background: "none", border: "none",
                            cursor: "pointer", textAlign: "left", fontFamily: "inherit"
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{lvl.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: "0.04em" }}>
                              L{lvl.level} — {lvl.name}
                            </div>
                            <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>
                              {lvl.precautions.length} controls · {lvlImpl} implemented
                            </div>
                          </div>
                          {/* Mini progress */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 48, height: 3, background: "#1e2a3a", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{
                                height: "100%", borderRadius: 4, background: accent,
                                width: `${Math.round((lvlImpl / lvl.precautions.length) * 100)}%`,
                                transition: "width 0.4s"
                              }}/>
                            </div>
                            <motion.svg
                              width="12" height="12" viewBox="0 0 24 24"
                              fill="none" stroke={accent} strokeWidth="2"
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <path d="M6 9l6 6 6-6"/>
                            </motion.svg>
                          </div>
                        </button>

                        {/* Accordion body */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              key="body"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: "easeInOut" }}
                              style={{ overflow: "hidden" }}
                            >
                              <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                                <p style={{ fontSize: 11, color: "#64748b", marginBottom: 8, lineHeight: 1.6, borderTop: "1px solid #1a2433", paddingTop: 10 }}>
                                  {lvl.desc}
                                </p>
                                {lvl.precautions.map((p, pi) => {
                                  const sId = `${i}-${pi}`
                                  const isImpl = implemented[sId]
                                  return (
                                    <motion.div
                                      key={pi}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: pi * 0.03 }}
                                      style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "8px 10px", borderRadius: 7,
                                        background: isImpl ? accent + "0d" : "#111827",
                                        border: `1px solid ${isImpl ? accent + "40" : "#1f2937"}`,
                                        cursor: "pointer",
                                        transition: "all 0.15s"
                                      }}
                                      onClick={() => {
                                        const fakeSector = sectors.find(s => s.id === sId)
                                        if (fakeSector) setSelected(fakeSector)
                                      }}
                                    >
                                      <div style={{
                                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                        background: isImpl ? accent : "#1e2a3a",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 9, color: isImpl ? "#0a0f1a" : "#374151",
                                        transition: "all 0.2s"
                                      }}>
                                        {isImpl ? "✓" : pi + 1}
                                      </div>
                                      <span style={{ flex: 1, fontSize: 11, color: isImpl ? accent : "#94a3b8" }}>
                                        {p.title}
                                      </span>
                                    </motion.div>
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
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
              >
                {/* Back button */}
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "none", border: "none", cursor: "pointer",
                    color: "#475569", fontSize: 11, fontFamily: "inherit",
                    padding: 0, marginBottom: 20, letterSpacing: "0.04em"
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5m7-7-7 7 7 7"/>
                  </svg>
                  ALL CONTROLS
                </button>

                {/* Level + title header */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>{selected.levelIcon}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      letterSpacing: "0.08em",
                      background: LEVEL_ACCENT[selected.levelIndex] + "18",
                      color: LEVEL_ACCENT[selected.levelIndex],
                      border: `1px solid ${LEVEL_ACCENT[selected.levelIndex]}40`
                    }}>
                      L{selected.level} · {selected.levelName.toUpperCase()}
                    </span>
                    {implemented[selected.id] && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                          background: "#34d39918", color: "#34d399",
                          border: "1px solid #34d39940"
                        }}
                      >
                        ✓ IMPLEMENTED
                      </motion.span>
                    )}
                  </div>

                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, lineHeight: 1.3 }}>
                    {selected.title}
                  </h2>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
                    {selected.description}
                  </p>
                </div>

                {/* Safety score inline */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
                  padding: "10px 14px", borderRadius: 8,
                  background: "#0d1321", border: "1px solid #1e2a3a"
                }}>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.06em" }}>SAFETY POSTURE</div>
                  <div style={{ flex: 1, height: 4, background: "#1e2a3a", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", background: safetyMeta.color, borderRadius: 4,
                      width: `${safetyPct}%`, transition: "width 0.4s"
                    }}/>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: safetyMeta.color }}>{safetyPct}%</div>
                </div>

                {/* ── RISKS ── */}
                <div style={{
                  background: "#0d1321", border: "1px solid #f87171" + "30",
                  borderRadius: 10, padding: "16px 18px", marginBottom: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 6,
                      background: "#f8717118", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#f87171", letterSpacing: "0.07em" }}>
                      RISKS IF NOT IMPLEMENTED
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.risk.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                      >
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: "#f8717160", marginTop: 6, flexShrink: 0
                        }}/>
                        <span style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>{r}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* ── MITIGATION ── */}
                {selected.mitigation && (
                  <div style={{
                    background: "#0d1321", border: "1px solid #34d39930",
                    borderRadius: 10, padding: "16px 18px", marginBottom: 12
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: "#34d39918", display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#34d399", letterSpacing: "0.07em" }}>
                        RECOMMENDED MITIGATION
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.7 }}>{selected.mitigation}</p>
                  </div>
                )}

                {/* ── COMPLIANCE ── */}
                {selected.compliance?.length > 0 && (
                  <div style={{
                    background: "#0d1321", border: "1px solid #818cf830",
                    borderRadius: 10, padding: "16px 18px", marginBottom: 20
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: "#818cf818", display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", letterSpacing: "0.07em" }}>
                        COMPLIANCE STANDARDS
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {selected.compliance.map((c, i) => (
                        <span key={i} style={{
                          fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                          background: "#818cf815", color: "#818cf8",
                          border: "1px solid #818cf830"
                        }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── IMPLEMENT TOGGLE ── */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleImpl(selected)}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                    letterSpacing: "0.07em", cursor: "pointer",
                    border: `1px solid ${implemented[selected.id] ? "#34d39940" : "#38bdf840"}`,
                    background: implemented[selected.id] ? "#34d39912" : "#38bdf812",
                    color: implemented[selected.id] ? "#34d399" : "#38bdf8",
                    transition: "all 0.2s"
                  }}
                >
                  {implemented[selected.id] ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg> MARK AS NOT IMPLEMENTED</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> MARK AS IMPLEMENTED</>
                  )}
                </motion.button>

                <div style={{ marginTop: 16, textAlign: "center", fontSize: 10, color: "#1e2a3a", letterSpacing: "0.05em" }}>
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