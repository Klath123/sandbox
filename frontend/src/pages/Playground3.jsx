import React, { useMemo, useState } from "react"
import { arc } from "d3-shape"
import { levels } from "@/components/levels"

const SIZE = 760
const CENTER = SIZE / 2
const RING_WIDTH = 70

export default function Playground() {

  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)

  const sectors = useMemo(() => {
    const arr = []
    levels.forEach((lvl, lvlIndex) => {
      lvl.precautions.forEach((p, pIndex) => {
        arr.push({
          ...p,
          levelIndex: lvlIndex,
          level: lvl.level,
          levelDesc: lvl.desc,
          precautionIndex: pIndex
        })
      })
    })
    return arr
  }, [])

  const sectorsByLevel = useMemo(() => {
    const grouped = {}
    sectors.forEach(sector => {
      if (!grouped[sector.levelIndex]) grouped[sector.levelIndex] = []
      grouped[sector.levelIndex].push(sector)
    })
    return grouped
  }, [sectors])

  const getFill = (sector, index) => {
    if (selected?.title === sector.title) return "#7cc37c"
    if (hovered === index) return "#d9f2d9"
    return "#efefef"
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-800 flex justify-center p-10">

      <div className="flex gap-10 max-w-7xl w-full">

        {/* RADAR */}

        <div className="bg-white p-6 border rounded shadow-sm">

          <svg width={SIZE} height={SIZE}>

            {/* Concentric rings */}
            {[0,1,2,3,4].map(level => (
              <circle
                key={level}
                cx={CENTER}
                cy={CENTER}
                r={level * RING_WIDTH + 40}
                fill="none"
                stroke="#bdbdbd"
                strokeWidth="1"
              />
            ))}

            {/* Radial lines */}
            {[...Array(16)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 16
              const x = CENTER + 320 * Math.cos(angle)
              const y = CENTER + 320 * Math.sin(angle)

              return (
                <line
                  key={i}
                  x1={CENTER}
                  y1={CENTER}
                  x2={x}
                  y2={y}
                  stroke="#d1d1d1"
                  strokeWidth="1"
                />
              )
            })}

            {/* Sectors */}
            {[0,1,2,3].map(levelIndex => {

              const levelSectors = sectorsByLevel[levelIndex] || []
              const angleStep = (2 * Math.PI) / levelSectors.length

              const inner = levelIndex * RING_WIDTH + 40
              const outer = inner + RING_WIDTH

              return levelSectors.map((sector, idx) => {

                const globalIndex = sectors.findIndex(s => s.title === sector.title)

                const startAngle = idx * angleStep
                const endAngle = startAngle + angleStep
                const midAngle = (startAngle + endAngle) / 2

                const path = arc()
                  .innerRadius(inner)
                  .outerRadius(outer)
                  .startAngle(startAngle)
                  .endAngle(endAngle)

                const labelRadius = outer + 18
                const lx = CENTER + Math.cos(midAngle) * labelRadius
                const ly = CENTER + Math.sin(midAngle) * labelRadius

                return (
                  <g
                    key={globalIndex}
                    transform={`translate(${CENTER},${CENTER})`}
                    onClick={() => setSelected(sector)}
                    onMouseEnter={() => setHovered(globalIndex)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: "pointer" }}
                  >

                    <path
                      d={path()}
                      fill={getFill(sector, globalIndex)}
                      stroke="#888"
                      strokeWidth="1"
                    />

                    {/* label */}
                    <text
                      x={lx - CENTER}
                      y={ly - CENTER}
                      fontSize="9"
                      fill="#333"
                      textAnchor="middle"
                    >
                      {sector.title.length > 18
                        ? sector.title.substring(0,16) + "..."
                        : sector.title}
                    </text>

                  </g>
                )
              })
            })}

            {/* Center */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r="35"
              fill="white"
              stroke="#888"
            />

            <text
              x={CENTER}
              y={CENTER+5}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
              fontWeight="600"
            >
              VAJRA
            </text>

          </svg>

        </div>


        {/* RIGHT PANEL */}

        <div className="w-[420px] bg-white border rounded shadow-sm p-6">

          {!selected && (
            <>
              <h2 className="text-lg font-semibold mb-3">
                Security Control Details
              </h2>

              <p className="text-gray-600 text-sm">
                Click any section of the radar to see the precaution and
                risks related to that security control.
              </p>

              <div className="mt-5 text-sm text-gray-500">
                Total Controls: {sectors.length}
              </div>
            </>
          )}

          {selected && (
            <>
              <h2 className="text-lg font-semibold mb-1">
                {selected.title}
              </h2>

              <p className="text-gray-500 text-sm mb-3">
                {selected.level}
              </p>

              <p className="text-gray-600 text-sm mb-4">
                {selected.levelDesc}
              </p>

              <h3 className="text-sm font-semibold text-red-600 mb-2">
                Risks if not implemented
              </h3>

              <ul className="list-disc ml-4 text-sm text-gray-600 space-y-1">
                {selected.risk.map((r,i)=>(
                  <li key={i}>{r}</li>
                ))}
              </ul>

              <button
                onClick={()=>setSelected(null)}
                className="mt-5 text-sm text-blue-600 hover:underline"
              >
                Back
              </button>
            </>
          )}

        </div>

      </div>

    </div>
  )
}