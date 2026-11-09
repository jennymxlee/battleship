import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../App'
import { createBoard, gameReducer, initialGameState, randomFleet, seededRng } from '../game'
import { usePlacement } from '../hooks/usePlacement'
import { BattleScreen } from './BattleScreen'
import { MoveLog } from './MoveLog'
import { PlacementScreen } from './PlacementScreen'

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function cell(row: number, col: number) {
  return screen.getByRole('grid').querySelector<HTMLButtonElement>(`[data-row="${row}"][data-col="${col}"]`)!
}

it('clicking any segment selects a placed ship without moving it', () => {
  render(<PlacementScreen rng={seededRng(1)} onStart={() => {}} />)
  fireEvent.click(cell(0, 0))
  fireEvent.click(cell(0, 2))
  fireEvent.click(cell(0, 2))
  fireEvent.mouseLeave(screen.getByRole('grid'))
  expect(cell(0, 0)).toHaveAccessibleName('A1, your Carrier')
  expect(cell(0, 4)).toHaveAccessibleName('E1, your Carrier')
  expect(cell(0, 5)).toHaveAccessibleName('F1, empty')
})

it('a complete fleet has no selection and stray clicks cannot move it', () => {
  const { result } = renderHook(() => usePlacement(seededRng(7)))
  act(() => result.current.randomize())
  const before = structuredClone(result.current.ships)
  expect(result.current.selected).toBeNull()
  act(() => { expect(result.current.place({ row: 0, col: 0 })).toBe(false) })
  expect(result.current.ships).toEqual(before)
  act(() => result.current.clear())
  for (let row = 0; row < 5; row++) {
    act(() => { expect(result.current.place({ row, col: 0 })).toBe(true) })
  }
  expect(result.current.selected).toBeNull()
  expect(result.current.isComplete).toBe(true)
})

it('rotates a placed ship in place and rejects an off-board rotation', () => {
  const { result } = renderHook(() => usePlacement(seededRng(7)))
  act(() => result.current.place({ row: 0, col: 0 }))
  act(() => result.current.select('carrier'))
  act(() => result.current.rotate())
  expect(result.current.ships[0].orientation).toBe('vertical')
  act(() => result.current.place({ row: 0, col: 9 }, 'carrier'))
  act(() => result.current.select('carrier'))
  act(() => result.current.rotate())
  expect(result.current.ships.find(s => s.id === 'carrier')!.orientation).toBe('vertical')
  expect(result.current.message).toMatch(/Cannot rotate/)
})

it('placement feedback is refreshed by Randomize, Remove and Clear', () => {
  render(<PlacementScreen rng={seededRng(1)} onStart={() => {}} />)
  fireEvent.click(cell(0, 9))
  expect(screen.getByRole('status')).toHaveTextContent('Cannot place')
  fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
  expect(screen.getByRole('status')).not.toHaveTextContent('Cannot place')
  fireEvent.click(screen.getByRole('button', { name: /Carrier.*Placed/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Remove selected' }))
  expect(screen.getByRole('status')).toHaveTextContent('removed')
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
  expect(screen.getByRole('status')).not.toHaveTextContent('removed')
})

it('screen changes focus the new heading, scroll to top, and allow changing difficulty', () => {
  render(<App rng={seededRng(2)} />)
  fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
  expect(screen.getByRole('heading', { name: 'Take your positions' })).toHaveFocus()
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' })
  fireEvent.click(screen.getByRole('button', { name: 'Change difficulty' }))
  fireEvent.click(screen.getByRole('radio', { name: /Hard/ }))
  fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
  fireEvent.click(screen.getByRole('button', { name: /Start battle/ }))
  expect(screen.getByRole('heading', { name: 'Find. Fire. Sink.' })).toHaveFocus()
  expect(screen.getByText('hard opponent')).toBeInTheDocument()
})

it('declining Restart preserves the current battle', () => {
  vi.mocked(window.confirm).mockReturnValue(false)
  render(<App rng={seededRng(2)} />)
  fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
  fireEvent.click(screen.getByRole('button', { name: /Start battle/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))
  expect(window.confirm).toHaveBeenCalled()
  expect(screen.getByRole('grid', { name: 'Enemy waters' })).toBeInTheDocument()
})

it('newest-first move log counts down from the actual shot number', () => {
  render(<MoveLog entries={[
    { by: 'player', coord: { row: 0, col: 0 }, outcome: 'miss', shipName: null },
    { by: 'ai', coord: { row: 0, col: 1 }, outcome: 'hit', shipName: 'Carrier' },
  ]} />)
  expect(screen.getByRole('list')).toHaveAttribute('reversed')
  expect(screen.getByRole('list')).toHaveAttribute('start', '2')
})

it('game-over overlay can be dismissed with Escape to inspect the revealed boards', () => {
  const ships = randomFleet(seededRng(1))
  const state = {
    ...gameReducer(initialGameState, { type: 'start', playerShips: ships, aiShips: ships }),
    phase: 'over' as const,
    winner: 'player' as const,
    aiBoard: createBoard(ships),
  }
  render(<BattleScreen state={state} fire={() => {}} aiThinking={false} onRestart={() => {}} />)
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Play again' })).toHaveFocus()
  const enemy = screen.getByRole('grid', { name: 'Enemy waters' })
  expect(within(enemy).getAllByRole('button', { name: /revealed/ })).toHaveLength(17)
})
