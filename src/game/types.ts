export const BOARD_SIZE = 10

export type Orientation = 'horizontal' | 'vertical'

export interface Coord {
  row: number
  col: number
}

export type ShipId = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer'

export interface ShipSpec {
  id: ShipId
  name: string
  length: number
}

export interface Placement {
  shipId: ShipId
  origin: Coord
  orientation: Orientation
}

export interface PlacedShip extends ShipSpec {
  origin: Coord
  orientation: Orientation
  cells: Coord[]
}

/** What a board owner knows about each cell that has been fired at. */
export type ShotMark = 'miss' | 'hit' | null

export interface Board {
  ships: PlacedShip[]
  shots: ShotMark[][]
}

export type ShotOutcome = 'miss' | 'hit' | 'sunk'

export type FireResult =
  | { ok: true; board: Board; outcome: ShotOutcome; ship: PlacedShip | null }
  | { ok: false; reason: 'out-of-bounds' | 'already-fired' }

/** The attacker's view of an opponent board: only what has been revealed by shots. */
export type TargetCell = 'unknown' | 'miss' | 'hit' | 'sunk'

export interface TargetView {
  cells: TargetCell[][]
  /** Ships not yet sunk. The AI may use their lengths but not their positions. */
  remainingShips: ShipSpec[]
}

export type Rng = () => number
