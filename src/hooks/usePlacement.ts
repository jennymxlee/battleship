import { useState } from 'react'
import {
  FLEET,
  getShipSpec,
  isCompleteFleet,
  placeShip,
  randomFleet,
  shipCells,
  validatePlacement,
} from '../game'
import type { Coord, Orientation, PlacedShip, Rng, ShipId } from '../game'

export function usePlacement(rng: Rng = Math.random) {
  const [ships, setShips] = useState<PlacedShip[]>([])
  const [selected, setSelected] = useState<ShipId | null>('carrier')
  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [message, setMessage] = useState('Select a ship, then choose its starting square.')
  const preview = (origin: Coord, shipId = selected) => {
    if (!shipId) return null
    const placement = { shipId, origin, orientation }
    return {
      cells: shipCells(origin, getShipSpec(shipId).length, orientation),
      valid:
        validatePlacement(
          ships.filter(s => s.id !== shipId),
          placement,
        ) === null,
    }
  }
  return {
    ships,
    selected,
    orientation,
    message,
    preview,
    select: (id: ShipId) => {
      setSelected(id)
      setOrientation(ships.find(s => s.id === id)?.orientation ?? orientation)
      setMessage(`${getShipSpec(id).name} selected. Drag it, or choose an empty starting square.`)
    },
    place: (origin: Coord, shipId = selected) => {
      if (!shipId) return false
      const others = ships.filter(s => s.id !== shipId)
      const placement = { shipId, origin, orientation }
      if (validatePlacement(others, placement)) {
        setMessage('Cannot place here: overlapping or outside the board.')
        return false
      }
      setShips(placeShip(others, placement))
      const next = FLEET.find(s => s.id !== shipId && !others.some(p => p.id === s.id))
      setSelected(next?.id ?? null)
      setMessage(next ? `Ship placed. Next: ${next.name}.` : 'Fleet ready. Start battle, or select a ship to adjust it.')
      return true
    },
    remove: () => {
      if (!selected) return
      setShips(ships.filter(s => s.id !== selected))
      setMessage(`${getShipSpec(selected).name} removed. Choose a new position.`)
    },
    rotate: (movePlaced = true) => {
      const next = orientation === 'horizontal' ? 'vertical' : 'horizontal'
      const ship = ships.find(s => s.id === selected)
      if (ship && movePlaced) {
        const others = ships.filter(s => s.id !== selected)
        const placement = { shipId: ship.id, origin: ship.origin, orientation: next } as const
        if (validatePlacement(others, placement)) {
          setMessage('Cannot rotate here: overlapping or outside the board. Move the ship first.')
          return
        }
        setShips(placeShip(others, placement))
      }
      setOrientation(next)
      setMessage(`Orientation: ${next}.`)
    },
    randomize: () => {
      setShips(randomFleet(rng))
      setSelected(null)
      setMessage('Fleet randomized and ready. Start battle, or select a ship to adjust it.')
    },
    clear: () => {
      setShips([])
      setSelected('carrier')
      setOrientation('horizontal')
      setMessage('Fleet cleared. Select a ship, then choose its starting square.')
    },
    isComplete: isCompleteFleet(ships),
  }
}
