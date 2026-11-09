import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { seededRng } from '../game'
import { usePlacement } from './usePlacement'
import { PlacementScreen } from '../components/PlacementScreen'

afterEach(cleanup)

it('placement rejects bounds and overlap, repositions excluding itself, removes and clears', () => {
  const { result } = renderHook(() => usePlacement(seededRng(1)))
  expect(result.current.isComplete).toBe(false)
  expect(result.current.preview({ row: 0, col: 9 }).valid).toBe(false)
  act(() => {
    expect(result.current.place({ row: 0, col: 9 })).toBe(false)
  })
  expect(result.current.ships).toHaveLength(0)
  act(() => {
    result.current.place({ row: 0, col: 0 })
  })
  expect(result.current.selected).toBe('battleship')
  act(() => {
    expect(result.current.place({ row: 0, col: 0 })).toBe(false)
  })
  expect(result.current.ships).toHaveLength(1)
  act(() => result.current.select('carrier'))
  act(() => {
    expect(result.current.place({ row: 0, col: 1 })).toBe(true)
  })
  expect(result.current.ships[0].origin.col).toBe(1)
  act(() => result.current.select('carrier'))
  act(() => result.current.rotate())
  expect(result.current.preview({ row: 0, col: 1 }).cells[1]).toEqual({ row: 1, col: 1 })
  act(() => result.current.remove())
  expect(result.current.ships).toHaveLength(0)
  act(() => result.current.randomize())
  expect(result.current.isComplete).toBe(true)
  act(() => result.current.clear())
  expect(result.current.ships).toHaveLength(0)
})

it('selects placed ships on the board and rotates with R', () => {
  render(<PlacementScreen rng={seededRng(2)} onStart={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: 'A1, empty' }))
  fireEvent.click(screen.getByRole('button', { name: 'A1, your Carrier' }))
  expect(screen.getByRole('button', { name: /Carrier.*Placed/ })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.keyDown(screen.getByRole('grid'), { key: 'r' })
  expect(screen.getByRole('button', { name: 'Rotate (R): vertical' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'J1, empty' }))
  expect(screen.getByRole('button', { name: 'J5, your Carrier' })).toBeInTheDocument()
})
