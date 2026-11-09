import { isShipSunk, sameCoord, shipAt } from '../game'
import type { Board, Coord, PlacedShip } from '../game'

export interface CellDisplay {
  label: string
  className?: string
  symbol?: string
  disabled?: boolean
}

export interface PlacementPreview {
  cells: Coord[]
  valid: boolean
}

export function battleCellDisplay(board: Board, coord: Coord, own: boolean, reveal: boolean): CellDisplay {
  const ship = shipAt(board, coord)
  const mark = board.shots[coord.row][coord.col]
  if (ship && isShipSunk(board, ship)) {
    return { label: `sunk ${ship.name}`, className: 'sunk', symbol: '▧', disabled: true }
  }
  if (mark === 'hit') return { label: 'hit', className: 'hit', symbol: '✕', disabled: true }
  if (mark === 'miss') return { label: 'miss', className: 'miss', symbol: '•', disabled: true }
  if (ship && (own || reveal)) {
    const owner = own ? 'your' : 'revealed'
    return { label: `${owner} ${ship.name}`, className: 'ship', symbol: '▪' }
  }
  return { label: 'not fired', className: '', symbol: '', disabled: false }
}

export function placementCellDisplay(
  ships: PlacedShip[],
  coord: Coord,
  preview: PlacementPreview | null,
): CellDisplay {
  const ship = ships.find(s => s.cells.some(c => sameCoord(c, coord)))
  const display = { label: 'empty', className: '', symbol: '' }
  if (ship) {
    display.label = `your ${ship.name}`
    display.className = 'ship'
    display.symbol = '▪'
  }
  if (!preview?.cells.some(c => sameCoord(c, coord))) return display
  if (preview.valid) {
    display.label += ', valid placement'
    display.className += ' preview-valid'
  } else {
    display.label += ', invalid placement'
    display.className += ' preview-invalid'
    display.symbol = '!'
  }
  return display
}
