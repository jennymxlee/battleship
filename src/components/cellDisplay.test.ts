import { describe, expect, it } from 'vitest'
import { createBoard, fireAt, formatCoord, placeShip } from '../game'
import type { Board, Coord } from '../game'
import { battleCellDisplay, placementCellDisplay } from './cellDisplay'

const coord = { row: 6, col: 1 }

function fleet(shipId: 'cruiser' | 'carrier' = 'cruiser') {
  return placeShip([], { shipId, origin: coord, orientation: 'horizontal' })
}

function shot(board: Board, target: Coord) {
  const result = fireAt(board, target)
  if (!result.ok) throw new Error(result.reason)
  return result.board
}

function label(board: Board, own = false, reveal = false) {
  return `${formatCoord(coord)}, ${battleCellDisplay(board, coord, own, reveal).label}`
}

describe('battle cell display', () => {
  it('labels untouched cells without revealing hidden ships', () => {
    const board = createBoard(fleet('carrier'))
    expect(label(board)).toBe('B7, not fired')
    expect(battleCellDisplay(board, coord, false, false).symbol).toBe('')
    expect(label(board, true)).toBe('B7, your Carrier')
    expect(label(board, false, true)).toBe('B7, revealed Carrier')
  })

  it('labels misses and hits and prevents repeated shots', () => {
    const miss = shot(createBoard([]), coord)
    expect(label(miss)).toBe('B7, miss')
    expect(battleCellDisplay(miss, coord, false, false)).toMatchObject({ symbol: '•', disabled: true })
    const hit = shot(createBoard(fleet()), coord)
    expect(label(hit)).toBe('B7, hit')
    expect(battleCellDisplay(hit, coord, false, false)).toMatchObject({ symbol: '✕', disabled: true })
  })

  it('labels sunk ships and uses the distinct legend symbol', () => {
    let board = createBoard(fleet())
    for (const cell of board.ships[0].cells) board = shot(board, cell)
    expect(label(board)).toBe('B7, sunk Cruiser')
    expect(battleCellDisplay(board, coord, false, false)).toMatchObject({ symbol: '▧', className: 'sunk' })
  })
})

describe('placement cell display', () => {
  it('handles an empty preview and placed ships', () => {
    expect(placementCellDisplay([], coord, null).label).toBe('empty')
    expect(placementCellDisplay(fleet(), coord, null).label).toBe('your Cruiser')
  })

  it('marks valid and invalid previews with an invalid symbol', () => {
    const valid = placementCellDisplay([], coord, { cells: [coord], valid: true })
    expect(valid.label).toBe('empty, valid placement')
    expect(valid.className).toContain('preview-valid')
    const invalid = placementCellDisplay(fleet(), coord, { cells: [coord], valid: false })
    expect(invalid.label).toBe('your Cruiser, invalid placement')
    expect(invalid.symbol).toBe('!')
    expect(invalid.className).toContain('preview-invalid')
    expect(placementCellDisplay([], coord, { cells: [], valid: false }).label).toBe('empty')
  })
})
