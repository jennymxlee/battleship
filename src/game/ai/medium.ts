import { allCoords, isInBounds, neighbors } from '../coords'
import { pickRandom } from '../rng'
import type { Coord, Rng, TargetView } from '../types'
import { unknownCells } from './easy'
import { cellKey, fittableCells } from './placements'

export function mediumShot(view: TargetView, rng: Rng): Coord {
  const unknown = unknownCells(view)
  const fits = fittableCells(view)
  const hits = allCoords().filter(({ row, col }) => view.cells[row][col] === 'hit')
  const isHit = (cell: Coord) => isInBounds(cell) && view.cells[cell.row][cell.col] === 'hit'
  const isUnknown = (cell: Coord) => isInBounds(cell) && view.cells[cell.row][cell.col] === 'unknown'
  const runs: { length: number; ends: Coord[] }[] = []
  for (const hit of hits) {
    for (const [dr, dc] of [[1, 0], [0, 1]]) {
      const before = { row: hit.row - dr, col: hit.col - dc }
      if (isHit(before)) continue
      let length = 1
      let after = { row: hit.row + dr, col: hit.col + dc }
      while (isHit(after)) {
        length++
        after = { row: after.row + dr, col: after.col + dc }
      }
      const ends = [before, after].filter(isUnknown)
      if (length >= 2 && ends.length) runs.push({ length, ends })
    }
  }
  let candidates: Coord[]
  if (runs.length) {
    const longest = Math.max(...runs.map((run) => run.length))
    candidates = runs.filter((run) => run.length === longest).flatMap((run) => run.ends)
  } else {
    candidates = hits.flatMap(neighbors).filter(isUnknown)
  }
  candidates = [...new Map(candidates.map((cell) => [cellKey(cell), cell])).values()]
  if (candidates.length) {
    const fittable = candidates.filter((cell) => fits.has(cellKey(cell)))
    return pickRandom(rng, fittable.length ? fittable : candidates)
  }
  const fittable = unknown.filter((cell) => fits.has(cellKey(cell)))
  const minimum = Math.min(...view.remainingShips.map((ship) => ship.length))
  const parity = fittable.filter(({ row, col }) => (row + col) % minimum === 0)
  return pickRandom(rng, parity.length ? parity : fittable.length ? fittable : unknown)
}
