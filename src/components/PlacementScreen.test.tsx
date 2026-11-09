import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { seededRng } from '../game'
import { PlacementScreen } from './PlacementScreen'

beforeEach(() => {
  vi.stubGlobal('PointerEvent', MouseEvent)
  Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn() })
})

afterEach(() => {
  cleanup()
  delete (document as Partial<Document>).elementFromPoint
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function setup() {
  render(<PlacementScreen rng={seededRng(42)} onStart={() => {}} />)
}

function cell(row: number, col: number) {
  return screen.getByRole('grid').querySelector<HTMLButtonElement>(`[data-row="${row}"][data-col="${col}"]`)!
}

function aim(target: Element | null) {
  vi.mocked(document.elementFromPoint).mockReturnValue(target)
}

function press(target: Element) {
  const capture = vi.fn()
  Object.defineProperty(target, 'setPointerCapture', { configurable: true, value: capture })
  fireEvent.pointerDown(target, { button: 0, clientX: 10, clientY: 10 })
  expect(capture).toHaveBeenCalledOnce()
}

function move(target: Element, destination: Element | null) {
  aim(destination)
  fireEvent.pointerMove(target, { clientX: 40, clientY: 40 })
}

function drop(target: Element) {
  fireEvent.pointerUp(target, { clientX: 40, clientY: 40 })
}

function clearHover() {
  fireEvent.mouseLeave(screen.getByRole('grid'))
}

it('drags a tray ship onto the grid with the shared preview and suppresses the trailing click', () => {
  setup()
  const carrier = screen.getByRole('button', { name: /Carrier.*Awaiting/ })
  press(carrier)
  move(carrier, cell(2, 3))
  expect(cell(2, 3)).toHaveClass('preview-valid')
  expect(cell(2, 7)).toHaveClass('preview-valid')
  drop(carrier)
  fireEvent.click(carrier, { detail: 1 })
  clearHover()
  expect(cell(2, 3)).toHaveAccessibleName('D3, your Carrier')
  expect(cell(2, 7)).toHaveAccessibleName('H3, your Carrier')
  expect(screen.getByRole('button', { name: /Battleship.*Awaiting/ })).toHaveAttribute('aria-pressed', 'true')
})

it('repositions a placed ship preserving the third-segment grab offset', () => {
  setup()
  fireEvent.click(cell(0, 0))
  const grabbed = cell(0, 2)
  press(grabbed)
  move(grabbed, cell(4, 5))
  expect(cell(4, 3)).toHaveClass('preview-valid')
  drop(grabbed)
  clearHover()
  expect(cell(4, 3)).toHaveAccessibleName('D5, your Carrier')
  expect(cell(4, 7)).toHaveAccessibleName('H5, your Carrier')
  expect(cell(0, 0)).toHaveAccessibleName('A1, empty')
})

it('keeps ships unchanged after invalid, off-grid, or cancelled drops', () => {
  setup()
  fireEvent.click(cell(0, 0))
  const battleship = screen.getByRole('button', { name: /Battleship.*Awaiting/ })
  press(battleship)
  move(battleship, cell(0, 0))
  expect(cell(0, 0)).toHaveClass('preview-invalid')
  drop(battleship)
  clearHover()
  expect(battleship).toHaveTextContent('Awaiting orders')
  const grabbed = cell(0, 2)
  press(grabbed)
  move(grabbed, null)
  drop(grabbed)
  clearHover()
  expect(cell(0, 0)).toHaveAccessibleName('A1, your Carrier')
  press(grabbed)
  move(grabbed, cell(5, 5))
  fireEvent.pointerCancel(grabbed)
  clearHover()
  expect(cell(0, 0)).toHaveAccessibleName('A1, your Carrier')
  expect(cell(5, 3)).toHaveAccessibleName('D6, empty')
})

it('rotates during drag with R and the rotate button while retaining segment offset', () => {
  setup()
  fireEvent.click(cell(0, 0))
  const grabbed = cell(0, 2)
  press(grabbed)
  move(grabbed, cell(4, 5))
  fireEvent.keyDown(screen.getByRole('grid'), { key: 'r' })
  expect(cell(2, 5)).toHaveClass('preview-valid')
  fireEvent.click(screen.getByRole('button', { name: 'Rotate (R): vertical' }))
  expect(cell(4, 3)).toHaveClass('preview-valid')
  fireEvent.keyDown(screen.getByRole('grid'), { key: 'r' })
  drop(grabbed)
  clearHover()
  expect(cell(2, 5)).toHaveAccessibleName('F3, your Carrier')
  expect(cell(6, 5)).toHaveAccessibleName('F7, your Carrier')
})

it('a press below the drag threshold keeps click-to-select working', () => {
  setup()
  const cruiser = screen.getByRole('button', { name: /Cruiser.*Awaiting/ })
  press(cruiser)
  fireEvent.pointerMove(cruiser, { clientX: 12, clientY: 11 })
  fireEvent.pointerUp(cruiser, { clientX: 12, clientY: 11 })
  fireEvent.click(cruiser, { detail: 1 })
  expect(cruiser).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(cell(3, 0))
  clearHover()
  expect(cell(3, 2)).toHaveAccessibleName('C4, your Cruiser')
})
