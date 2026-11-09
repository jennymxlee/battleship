import { allCoords } from '../coords'
import { pickRandom } from '../rng'
import type { Coord, Rng, TargetView } from '../types'

export function unknownCells(view: TargetView): Coord[] {
  return allCoords().filter(({ row, col }) => view.cells[row][col] === 'unknown')
}

export function easyShot(view: TargetView, rng: Rng): Coord {
  return pickRandom(rng, unknownCells(view))
}
