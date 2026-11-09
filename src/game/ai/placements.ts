import { allCoords, isInBounds } from '../coords'
import { shipCells } from '../board'
import { BOARD_SIZE, type Coord, type TargetView } from '../types'

export function placements(view: TargetView, length: number): Coord[][] {
  const result: Coord[][] = []
  for (const origin of allCoords()) {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const cells = shipCells(origin, length, orientation)
      if (cells.every((cell) => isInBounds(cell) &&
        view.cells[cell.row][cell.col] !== 'miss' && view.cells[cell.row][cell.col] !== 'sunk')) {
        result.push(cells)
      }
    }
  }
  return result
}

export function cellKey({ row, col }: Coord): number {
  return row * BOARD_SIZE + col
}

export function fittableCells(view: TargetView): Set<number> {
  return new Set([...new Set(view.remainingShips.map((ship) => ship.length))]
    .flatMap((length) => placements(view, length).flat().map(cellKey)))
}
