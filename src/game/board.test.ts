import { describe, expect, it } from 'vitest'
import {
  allShipsSunk,
  createBoard,
  fireAt,
  isCompleteFleet,
  placeShip,
  randomFleet,
  shipCells,
  toTargetView,
  validatePlacement,
} from './board'
import { FLEET } from './fleet'
import { seededRng } from './rng'
import type { Board, PlacedShip, Placement } from './types'

const p = (shipId: Placement['shipId'], row: number, col: number, orientation: Placement['orientation'] = 'horizontal'): Placement => ({
  shipId,
  origin: { row, col },
  orientation,
})

/** Carrier on row 0, battleship on row 1 (touching), cruiser/sub/destroyer spread out. */
function touchingFleet(): PlacedShip[] {
  return [p('carrier', 0, 0), p('battleship', 1, 0), p('cruiser', 5, 5, 'vertical'), p('submarine', 9, 0), p('destroyer', 5, 9, 'vertical')].reduce<PlacedShip[]>(placeShip, [])
}

function fire(board: Board, row: number, col: number): Board {
  const result = fireAt(board, { row, col })
  if (!result.ok) throw new Error(result.reason)
  return result.board
}

describe('shipCells', () => {
  it('extends right for horizontal and down for vertical', () => {
    expect(shipCells({ row: 2, col: 3 }, 3, 'horizontal')).toEqual([
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ])
    expect(shipCells({ row: 2, col: 3 }, 2, 'vertical')).toEqual([
      { row: 2, col: 3 },
      { row: 3, col: 3 },
    ])
  })
})

describe('validatePlacement', () => {
  it('accepts ships that touch the far edges exactly', () => {
    expect(validatePlacement([], p('carrier', 9, 5))).toBeNull()
    expect(validatePlacement([], p('carrier', 5, 9, 'vertical'))).toBeNull()
  })

  it('rejects ships that run off the board by one cell', () => {
    expect(validatePlacement([], p('carrier', 0, 6))).toBe('out-of-bounds')
    expect(validatePlacement([], p('carrier', 6, 0, 'vertical'))).toBe('out-of-bounds')
  })

  it('rejects negative origins', () => {
    expect(validatePlacement([], p('destroyer', -1, 0))).toBe('out-of-bounds')
  })

  it('rejects overlap, including a single shared cell', () => {
    const ships = placeShip([], p('carrier', 4, 0))
    expect(validatePlacement(ships, p('battleship', 1, 4, 'vertical'))).toBe('overlap')
  })

  it('allows ships to touch side by side', () => {
    const ships = placeShip([], p('carrier', 4, 0))
    expect(validatePlacement(ships, p('battleship', 5, 0))).toBeNull()
  })

  it('rejects placing the same ship twice', () => {
    const ships = placeShip([], p('destroyer', 0, 0))
    expect(validatePlacement(ships, p('destroyer', 5, 5))).toBe('duplicate-ship')
  })
})

describe('isCompleteFleet', () => {
  it('accepts one of each ship', () => {
    expect(isCompleteFleet(touchingFleet())).toBe(true)
  })

  it('rejects missing ships', () => {
    expect(isCompleteFleet(touchingFleet().slice(1))).toBe(false)
  })

  it('rejects a fleet whose cells were tampered with to overlap', () => {
    const ships = touchingFleet()
    ships[1] = { ...ships[1], origin: { row: 0, col: 0 } }
    expect(isCompleteFleet(ships)).toBe(false)
  })
})

describe('randomFleet', () => {
  it('always produces a complete, valid fleet', () => {
    const rng = seededRng(1)
    for (let i = 0; i < 500; i++) {
      const ships = randomFleet(rng)
      expect(ships.map((s) => s.id).sort()).toEqual(FLEET.map((s) => s.id).sort())
      expect(isCompleteFleet(ships)).toBe(true)
    }
  })

  it('uses both orientations', () => {
    const rng = seededRng(2)
    const orientations = new Set(Array.from({ length: 50 }, () => randomFleet(rng)).flat().map((s) => s.orientation))
    expect(orientations).toEqual(new Set(['horizontal', 'vertical']))
  })
})

describe('fireAt', () => {
  it('reports miss, hit and sunk', () => {
    let board = createBoard(touchingFleet())
    const miss = fireAt(board, { row: 3, col: 3 })
    expect(miss.ok && miss.outcome).toBe('miss')

    const hit = fireAt(board, { row: 9, col: 0 })
    expect(hit.ok && hit.outcome).toBe('hit')
    board = fire(board, 9, 0)
    board = fire(board, 9, 1)
    const sunk = fireAt(board, { row: 9, col: 2 })
    expect(sunk.ok && sunk.outcome).toBe('sunk')
    expect(sunk.ok && sunk.ship?.id).toBe('submarine')
  })

  it('does not mutate the original board', () => {
    const board = createBoard(touchingFleet())
    fireAt(board, { row: 0, col: 0 })
    expect(board.shots[0][0]).toBeNull()
  })

  it('rejects repeat and out-of-bounds shots', () => {
    const board = fire(createBoard(touchingFleet()), 3, 3)
    expect(fireAt(board, { row: 3, col: 3 })).toEqual({ ok: false, reason: 'already-fired' })
    expect(fireAt(board, { row: 10, col: 0 })).toEqual({ ok: false, reason: 'out-of-bounds' })
    expect(fireAt(board, { row: 0, col: -1 })).toEqual({ ok: false, reason: 'out-of-bounds' })
  })

  it('only sinks the ship that was fully hit when ships touch', () => {
    let board = createBoard(touchingFleet())
    // Hit all four battleship cells (row 1) and the carrier cells directly above them.
    for (let col = 0; col < 4; col++) {
      board = fire(board, 0, col)
      board = fire(board, 1, col)
    }
    const view = toTargetView(board)
    expect(view.cells[1].slice(0, 4)).toEqual(['sunk', 'sunk', 'sunk', 'sunk'])
    expect(view.cells[0].slice(0, 5)).toEqual(['hit', 'hit', 'hit', 'hit', 'unknown'])
    expect(view.remainingShips.map((s) => s.id)).not.toContain('battleship')
    expect(view.remainingShips.map((s) => s.id)).toContain('carrier')
  })
})

describe('allShipsSunk', () => {
  it('is false for an empty board and true once every cell is hit', () => {
    expect(allShipsSunk(createBoard([]))).toBe(false)
    let board = createBoard(touchingFleet())
    expect(allShipsSunk(board)).toBe(false)
    for (const cell of board.ships.flatMap((s) => s.cells)) board = fire(board, cell.row, cell.col)
    expect(allShipsSunk(board)).toBe(true)
  })
})

describe('toTargetView', () => {
  it('never reveals unhit ship cells', () => {
    const view = toTargetView(createBoard(touchingFleet()))
    expect(view.cells.flat().every((c) => c === 'unknown')).toBe(true)
    expect(view.remainingShips).toHaveLength(FLEET.length)
  })
})
