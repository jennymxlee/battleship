import type { ShipId, ShipSpec } from './types'

export const FLEET: readonly ShipSpec[] = [
  { id: 'carrier', name: 'Carrier', length: 5 },
  { id: 'battleship', name: 'Battleship', length: 4 },
  { id: 'cruiser', name: 'Cruiser', length: 3 },
  { id: 'submarine', name: 'Submarine', length: 3 },
  { id: 'destroyer', name: 'Destroyer', length: 2 },
]

export function getShipSpec(id: ShipId): ShipSpec {
  const spec = FLEET.find((s) => s.id === id)
  if (!spec) throw new Error(`Unknown ship: ${id}`)
  return spec
}
