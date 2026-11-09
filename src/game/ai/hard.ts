import { pickRandom } from '../rng'
import type { Coord, Rng, TargetView } from '../types'
import { unknownCells } from './easy'
import { cellKey, placements } from './placements'

export function hardShot(view: TargetView, rng: Rng): Coord {
  const unknown = unknownCells(view)
  const hasHits = view.cells.some((row) => row.includes('hit'))
  const scores = new Map<number, number>()
  for (const ship of view.remainingShips) {
    for (const cells of placements(view, ship.length)) {
      const hits = cells.filter(({ row, col }) => view.cells[row][col] === 'hit').length
      const weight = hasHits ? (hits ? 1000 ** hits : 0) : 1
      for (const cell of cells) {
        if (view.cells[cell.row][cell.col] !== 'unknown') continue
        const key = cellKey(cell)
        scores.set(key, (scores.get(key) ?? 0) + weight)
      }
    }
  }
  const best = Math.max(0, ...scores.values())
  return pickRandom(rng, best > 0
    ? unknown.filter((cell) => scores.get(cellKey(cell)) === best)
    : unknown)
}
