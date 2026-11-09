import { describe, expect, it } from 'vitest'
import { createBoard, fireAt, placeShip, toTargetView } from '../board'
import { FLEET } from '../fleet'
import type { TargetView } from '../types'
import { seededRng } from '../rng'
import { chooseAiShot, DIFFICULTIES } from '.'
import { cellKey, fittableCells, placements } from './placements'
import { simulate } from './simulate'

function view(length = 3): TargetView {
  return {
    cells: Array.from({ length: 10 }, () => Array(10).fill('unknown')),
    remainingShips: [{ ...FLEET[0], length }],
  }
}

describe('chooseAiShot', () => {
  for (const { id } of DIFFICULTIES) {
    it(`${id}: deterministic and unknown-only`, () => {
      const target = view()
      target.cells[4][4] = 'hit'
      const shot = chooseAiShot(id, target, seededRng(42))
      expect(shot).toEqual(chooseAiShot(id, target, seededRng(42)))
      expect(target.cells[shot.row][shot.col]).toBe('unknown')
    })
    it(`${id}: handles no ships and rejects an exhausted board`, () => {
      const target = view()
      target.remainingShips = []
      target.cells.forEach((row) => row.fill('miss'))
      target.cells[9][9] = 'unknown'
      expect(chooseAiShot(id, target, seededRng(1))).toEqual({ row: 9, col: 9 })
      target.cells[9][9] = 'miss'
      expect(() => chooseAiShot(id, target, seededRng(1))).toThrow('pickRandom called with no items')
    })
  }
})

describe('medium hunt/target', () => {
  it('follows a line', () => {
    const target = view()
    target.cells[4][4] = target.cells[4][5] = 'hit'
    for (let seed = 0; seed < 20; seed++) {
      expect([{ row: 4, col: 3 }, { row: 4, col: 6 }])
        .toContainEqual(chooseAiShot('medium', target, seededRng(seed)))
    }
  })
  it.each(['miss', 'edge'] as const)('backs up from a %s', (block) => {
    const target = view()
    const row = block === 'edge' ? 0 : 3
    target.cells[row][4] = target.cells[row + 1][4] = 'hit'
    if (block === 'miss') target.cells[row - 1][4] = 'miss'
    expect(chooseAiShot('medium', target, seededRng(1))).toEqual({ row: row + 2, col: 4 })
  })
  it('prefers the longest run', () => {
    const target = view(5)
    target.cells[2][2] = target.cells[2][3] = 'hit'
    target.cells[6][2] = target.cells[6][3] = target.cells[6][4] = 'hit'
    expect(chooseAiShot('medium', target, seededRng(2)).row).toBe(6)
  })
  it('targets remaining hits after a touching ship sinks', () => {
    let ships = placeShip([], { shipId: 'destroyer', origin: { row: 3, col: 3 }, orientation: 'horizontal' })
    ships = placeShip(ships, { shipId: 'cruiser', origin: { row: 4, col: 3 }, orientation: 'horizontal' })
    let board = createBoard(ships)
    for (const coord of [{ row: 3, col: 3 }, { row: 4, col: 3 }, { row: 3, col: 4 }]) {
      const result = fireAt(board, coord)
      if (!result.ok) throw new Error(result.reason)
      board = result.board
    }
    const target = toTargetView(board)
    expect(target.cells[3][3]).toBe('sunk')
    expect(target.cells[4][3]).toBe('hit')
    expect([{ row: 5, col: 3 }, { row: 4, col: 2 }, { row: 4, col: 4 }])
      .toContainEqual(chooseAiShot('medium', target, seededRng(1)))
  })
  it('falls back to neighbours when both ends are blocked', () => {
    const target = view()
    target.cells[4][4] = target.cells[4][5] = 'hit'
    target.cells[4][3] = target.cells[4][6] = 'miss'
    expect([3, 5]).toContain(chooseAiShot('medium', target, seededRng(1)).row)
  })
  it.each([2, 3, 4])('hunts on length-%i parity', (length) => {
    for (let seed = 0; seed < 30; seed++) {
      const shot = chooseAiShot('medium', view(length), seededRng(seed))
      expect((shot.row + shot.col) % length).toBe(0)
    }
  })
})

describe('hard density', () => {
  it('targets adjacent to a hit', () => {
    const target = view()
    target.cells[4][4] = 'hit'
    const shot = chooseAiShot('hard', target, seededRng(3))
    expect(Math.abs(shot.row - 4) + Math.abs(shot.col - 4)).toBe(1)
  })
  it('extends aligned hits', () => {
    const target = view()
    target.cells[4][4] = target.cells[4][5] = 'hit'
    expect([{ row: 4, col: 3 }, { row: 4, col: 6 }])
      .toContainEqual(chooseAiShot('hard', target, seededRng(5)))
  })
})

describe('placements', () => {
  it.each(['medium', 'hard'] as const)('%s avoids isolated unfittable cells', (id) => {
    const target = view(2)
    target.cells[0][1] = target.cells[1][0] = 'miss'
    const fits = fittableCells(target)
    expect(fits.has(0)).toBe(false)
    for (let seed = 0; seed < 30; seed++) {
      expect(fits.has(cellKey(chooseAiShot(id, target, seededRng(seed))))).toBe(true)
    }
  })
  it('enumerates in-bounds placements avoiding miss and sunk', () => {
    const target = view()
    expect(placements(target, 3)).toHaveLength(160)
    target.cells[4][4] = 'miss'
    target.cells[5][5] = 'sunk'
    for (const cells of placements(target, 3)) {
      expect(cells).toHaveLength(3)
      expect(cells.every(({ row, col }) => target.cells[row][col] === 'unknown')).toBe(true)
    }
    expect(placements(target, 11)).toEqual([])
  })
})

describe('simulation', () => {
  it('finishes 200 identical fleets per level without repeats, with improving averages', () => {
    const stats = DIFFICULTIES.map(({ id }) => simulate(id, 200))
    for (const result of stats) {
      expect(result.shotCounts).toHaveLength(200)
      expect(result.max).toBeLessThanOrEqual(100)
    }
    expect(stats[0].avg).toBeGreaterThan(stats[1].avg)
    expect(stats[1].avg).toBeGreaterThan(stats[2].avg)
  }, 30000)
  it('rejects invalid game counts', () => {
    for (const games of [0, -1, 1.5]) expect(() => simulate('easy', games)).toThrow('positive integer')
  })
})
