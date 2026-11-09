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
  const [selected, setSelected] = useState<ShipId>('carrier')
  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const preview = (origin: Coord, shipId = selected) => {
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
    preview,
    select: (id: ShipId) => {
      setSelected(id)
      setOrientation(ships.find(s => s.id === id)?.orientation ?? orientation)
    },
    place: (origin: Coord, shipId = selected) => {
      const others = ships.filter(s => s.id !== shipId)
      const placement = { shipId, origin, orientation }
      if (validatePlacement(others, placement)) return false
      setShips(placeShip(others, placement))
      const next = FLEET.find(s => s.id !== shipId && !others.some(p => p.id === s.id))
      if (next) setSelected(next.id)
      return true
    },
    remove: () => setShips(ships.filter(s => s.id !== selected)),
    rotate: () => setOrientation(o => (o === 'horizontal' ? 'vertical' : 'horizontal')),
    randomize: () => setShips(randomFleet(rng)),
    clear: () => {
      setShips([])
      setSelected('carrier')
      setOrientation('horizontal')
    },
    isComplete: isCompleteFleet(ships),
  }
}
