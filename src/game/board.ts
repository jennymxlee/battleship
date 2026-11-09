import { allCoords, isInBounds, sameCoord } from './coords'
import { FLEET, getShipSpec } from './fleet'
import { pickRandom, randomInt } from './rng'
import {
  BOARD_SIZE,
  type Board,
  type Coord,
  type FireResult,
  type Orientation,
  type PlacedShip,
  type Placement,
  type Rng,
  type ShotMark,
  type TargetView,
} from './types'

export function shipCells(origin: Coord, length: number, orientation: Orientation): Coord[] {
  return Array.from({ length }, (_, i) =>
    orientation === 'horizontal'
      ? { row: origin.row, col: origin.col + i }
      : { row: origin.row + i, col: origin.col },
  )
}

export type PlacementError = 'out-of-bounds' | 'overlap' | 'duplicate-ship'

/** Checks whether `placement` fits alongside `ships`. A ship being moved should be excluded from `ships` by the caller. */
export function validatePlacement(ships: readonly PlacedShip[], placement: Placement): PlacementError | null {
  if (ships.some((s) => s.id === placement.shipId)) return 'duplicate-ship'
  const { length } = getShipSpec(placement.shipId)
  const cells = shipCells(placement.origin, length, placement.orientation)
  if (!cells.every(isInBounds)) return 'out-of-bounds'
  const occupied = ships.flatMap((s) => s.cells)
  if (cells.some((c) => occupied.some((o) => sameCoord(c, o)))) return 'overlap'
  return null
}

export function placeShip(ships: readonly PlacedShip[], placement: Placement): PlacedShip[] {
  const error = validatePlacement(ships, placement)
  if (error) throw new Error(`Cannot place ${placement.shipId}: ${error}`)
  const spec = getShipSpec(placement.shipId)
  return [
    ...ships,
    {
      ...spec,
      origin: placement.origin,
      orientation: placement.orientation,
      cells: shipCells(placement.origin, spec.length, placement.orientation),
    },
  ]
}

/** True when `ships` is exactly one of each fleet ship, all in bounds and non-overlapping. */
export function isCompleteFleet(ships: readonly PlacedShip[]): boolean {
  if (ships.length !== FLEET.length) return false
  let placed: PlacedShip[] = []
  for (const ship of ships) {
    const placement = { shipId: ship.id, origin: ship.origin, orientation: ship.orientation }
    if (validatePlacement(placed, placement)) return false
    placed = placeShip(placed, placement)
  }
  return true
}

export function randomFleet(rng: Rng): PlacedShip[] {
  let ships: PlacedShip[] = []
  for (const spec of FLEET) {
    const options: Placement[] = []
    for (const orientation of ['horizontal', 'vertical'] as const) {
      for (const origin of allCoords()) {
        const placement = { shipId: spec.id, origin, orientation }
        if (!validatePlacement(ships, placement)) options.push(placement)
      }
    }
    // A 10x10 board always has room for the standard fleet, but restart defensively if it ever doesn't.
    if (options.length === 0) return randomFleet(rng)
    ships = placeShip(ships, pickRandom(rng, options))
  }
  return ships
}

export function randomOrientation(rng: Rng): Orientation {
  return randomInt(rng, 2) === 0 ? 'horizontal' : 'vertical'
}

export function createBoard(ships: PlacedShip[]): Board {
  return {
    ships,
    shots: Array.from({ length: BOARD_SIZE }, () => Array<ShotMark>(BOARD_SIZE).fill(null)),
  }
}

export function shipAt(board: Board, coord: Coord): PlacedShip | null {
  return board.ships.find((s) => s.cells.some((c) => sameCoord(c, coord))) ?? null
}

export function isShipSunk(board: Board, ship: PlacedShip): boolean {
  return ship.cells.every((c) => board.shots[c.row][c.col] === 'hit')
}

export function allShipsSunk(board: Board): boolean {
  return board.ships.length > 0 && board.ships.every((s) => isShipSunk(board, s))
}

export function fireAt(board: Board, coord: Coord): FireResult {
  if (!isInBounds(coord)) return { ok: false, reason: 'out-of-bounds' }
  if (board.shots[coord.row][coord.col] !== null) return { ok: false, reason: 'already-fired' }

  const ship = shipAt(board, coord)
  const shots = board.shots.map((row, r) =>
    r === coord.row ? row.map((mark, c) => (c === coord.col ? (ship ? 'hit' : 'miss') : mark)) : row,
  )
  const next: Board = { ...board, shots }

  if (!ship) return { ok: true, board: next, outcome: 'miss', ship: null }
  return { ok: true, board: next, outcome: isShipSunk(next, ship) ? 'sunk' : 'hit', ship }
}

/** What the attacker is allowed to know: shot results, sunk ships, and which ships remain. */
export function toTargetView(board: Board): TargetView {
  const sunk = board.ships.filter((s) => isShipSunk(board, s))
  const cells = board.shots.map((row, r) =>
    row.map((mark, c) => {
      if (mark === null) return 'unknown' as const
      if (mark === 'miss') return 'miss' as const
      return sunk.some((s) => s.cells.some((cell) => cell.row === r && cell.col === c)) ? ('sunk' as const) : ('hit' as const)
    }),
  )
  return {
    cells,
    remainingShips: board.ships
      .filter((s) => !sunk.includes(s))
      .map(({ id, name, length }) => ({ id, name, length })),
  }
}
