import { BOARD_SIZE, type Coord } from './types'

const COLUMN_LABELS = 'ABCDEFGHIJ'

export function isInBounds({ row, col }: Coord): boolean {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE
  )
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col
}

export function columnLabel(col: number): string {
  return COLUMN_LABELS[col]
}

/** Human-friendly label, e.g. { row: 0, col: 0 } -> "A1". */
export function formatCoord({ row, col }: Coord): string {
  return `${columnLabel(col)}${row + 1}`
}

export function neighbors({ row, col }: Coord): Coord[] {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter(isInBounds)
}

export function allCoords(): Coord[] {
  const coords: Coord[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) coords.push({ row, col })
  }
  return coords
}
