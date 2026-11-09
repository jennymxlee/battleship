import { useRef, useState } from 'react'
import { columnLabel, formatCoord } from '../game'
import type { Coord } from '../game'
import type { CellDisplay } from './cellDisplay'

export function Grid({
  label,
  cell,
  onActivate,
  onHover,
  disabled = false,
}: {
  label: string
  cell: (coord: Coord) => CellDisplay
  onActivate?: (coord: Coord) => void
  onHover?: (coord: Coord | null) => void
  disabled?: boolean
}) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  return (
    <div
      role="grid"
      aria-label={label}
      aria-disabled={disabled}
      className="grid"
      onMouseLeave={() => onHover?.(null)}
    >
      <div role="row" className="grid-row">
        <span className="axis" />
        {Array.from({ length: 10 }, (_, col) => (
          <span role="columnheader" className="axis" key={col}>
            {columnLabel(col)}
          </span>
        ))}
      </div>
      {Array.from({ length: 10 }, (_, row) => (
        <div role="row" className="grid-row" key={row}>
          <span role="rowheader" className="axis">
            {row + 1}
          </span>
          {Array.from({ length: 10 }, (_, col) => {
            const coord = { row, col },
              index = row * 10 + col,
              display = cell(coord)
            return (
              <div role="gridcell" key={col}>
                <button
                  ref={el => {
                    refs.current[index] = el
                  }}
                  data-row={row}
                  data-col={col}
                  className={`cell ${display.className ?? ''}`}
                  aria-label={`${formatCoord(coord)}, ${display.label}`}
                  aria-disabled={disabled || display.disabled || !onActivate}
                  tabIndex={active === index ? 0 : -1}
                  onFocus={() => {
                    setActive(index)
                    onHover?.(coord)
                  }}
                  onMouseEnter={() => onHover?.(coord)}
                  onKeyDown={event => {
                    const delta = {
                      ArrowUp: [-1, 0],
                      ArrowDown: [1, 0],
                      ArrowLeft: [0, -1],
                      ArrowRight: [0, 1],
                    }[event.key]
                    if (!delta) return
                    event.preventDefault()
                    const next =
                      Math.max(0, Math.min(9, row + delta[0])) * 10 + Math.max(0, Math.min(9, col + delta[1]))
                    refs.current[next]?.focus()
                  }}
                  onClick={() => {
                    if (!disabled && !display.disabled) onActivate?.(coord)
                  }}
                >
                  <span aria-hidden="true">{display.symbol ?? ''}</span>
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
