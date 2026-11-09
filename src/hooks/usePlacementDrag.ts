import { useRef, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { FLEET, sameCoord } from '../game'
import type { Coord, Orientation, ShipId } from '../game'
import type { usePlacement } from './usePlacement'

interface Drag {
  pointerId: number
  shipId: ShipId
  offset: number
  startX: number
  startY: number
  moved: boolean
  target: HTMLElement
}

function cellAtPoint(event: PointerEvent, root: HTMLElement): Coord | null {
  const element = document.elementFromPoint(event.clientX, event.clientY)
  const cell = element?.closest<HTMLElement>('[data-row][data-col]')
  if (!cell || !root.contains(cell)) return null
  return { row: Number(cell.dataset.row), col: Number(cell.dataset.col) }
}

function originAt(cell: Coord | null, offset: number, orientation: Orientation): Coord | null {
  if (!cell) return null
  if (orientation === 'horizontal') return { row: cell.row, col: cell.col - offset }
  return { row: cell.row - offset, col: cell.col }
}

export function usePlacementDrag(placement: ReturnType<typeof usePlacement>) {
  const drag = useRef<Drag | null>(null)
  const suppressClick = useRef(false)
  const [hoveredCell, setHoveredCell] = useState<Coord | null>(null)
  const [dragging, setDragging] = useState(false)

  function release() {
    const current = drag.current
    drag.current = null
    if (current?.target.hasPointerCapture?.(current.pointerId)) {
      current.target.releasePointerCapture(current.pointerId)
    }
    setDragging(false)
    setHoveredCell(null)
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (drag.current || event.button !== 0) return
    suppressClick.current = false
    const target = (event.target as HTMLElement).closest<HTMLElement>('button')
    if (!target) return
    let shipId = FLEET.find(s => s.id === target.dataset.shipId)?.id
    const segment = (event.target as HTMLElement).closest<HTMLElement>('[data-segment]')
    let offset = Number(segment?.dataset.segment ?? 0)
    if (!shipId && target.dataset.row !== undefined) {
      const coord = { row: Number(target.dataset.row), col: Number(target.dataset.col) }
      const ship = placement.ships.find(s => s.cells.some(c => sameCoord(c, coord)))
      if (!ship) return
      shipId = ship.id
      offset = ship.cells.findIndex(c => sameCoord(c, coord))
    }
    if (!shipId) return
    target.setPointerCapture?.(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      shipId,
      offset,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      target,
    }
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    if (!current.moved) {
      if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) <= 4) return
      current.moved = true
      placement.select(current.shipId)
      setDragging(true)
    }
    event.preventDefault()
    setHoveredCell(cellAtPoint(event, event.currentTarget))
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    if (current.moved) {
      const cell = cellAtPoint(event, event.currentTarget)
      const origin = originAt(cell, current.offset, placement.orientation)
      if (origin) placement.place(origin, current.shipId)
      suppressClick.current = true
    }
    release()
  }

  function onPointerCancel(event: PointerEvent<HTMLElement>) {
    if (event.pointerId !== drag.current?.pointerId) return
    suppressClick.current = drag.current.moved
    release()
  }

  function onClickCapture(event: MouseEvent<HTMLElement>) {
    if (!suppressClick.current || event.detail === 0) return
    suppressClick.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return {
    dragging,
    origin: originAt(hoveredCell, drag.current?.offset ?? 0, placement.orientation),
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture },
  }
}
