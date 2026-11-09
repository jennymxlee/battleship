import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { randomFleet, seededRng } from './game'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function begin(strict = false) {
  vi.useFakeTimers()
  const app = <App rng={seededRng(42)} aiDelayMs={600} />
  render(strict ? <StrictMode>{app}</StrictMode> : app)
  fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
  fireEvent.click(screen.getByRole('button', { name: /Start battle/ }))
}
function enemyCells() {
  return within(screen.getByRole('grid', { name: 'Enemy waters' })).getAllByRole('button')
}
function reply() {
  act(() => vi.advanceTimersByTime(600))
}
function ownShots() {
  return within(screen.getByRole('grid', { name: 'Your fleet' }))
    .getAllByRole('button')
    .filter(b => /, (hit|miss|sunk)/.test(b.getAttribute('aria-label')!))
}
function logs() {
  return within(screen.getByRole('list', { name: 'Move log' })).queryAllByRole('listitem')
}

describe('game UI', () => {
  it('randomize and start shows both boards', () => {
    begin()
    expect(screen.getByRole('grid', { name: 'Your fleet' })).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: 'Enemy waters' })).toBeInTheDocument()
    expect(logs()).toHaveLength(0)
  })
  it('StrictMode AI replies exactly once after the delay', () => {
    begin(true)
    fireEvent.click(enemyCells()[0])
    expect(ownShots()).toHaveLength(0)
    act(() => vi.advanceTimersByTime(599))
    expect(ownShots()).toHaveLength(0)
    act(() => vi.advanceTimersByTime(1))
    expect(ownShots()).toHaveLength(1)
    expect(logs()).toHaveLength(2)
    act(() => vi.advanceTimersByTime(6000))
    expect(ownShots()).toHaveLength(1)
    expect(logs()).toHaveLength(2)
  })
  it('ignores shots during AI turn and repeated shots', () => {
    begin()
    fireEvent.click(enemyCells()[0])
    expect(screen.getByText('Enemy is thinking…')).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: 'Enemy waters' })).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(enemyCells()[1])
    expect(logs()).toHaveLength(1)
    reply()
    fireEvent.click(enemyCells()[0])
    expect(logs()).toHaveLength(2)
  })
  it('restart cancels the pending AI shot and clears the new game log', () => {
    begin()
    fireEvent.click(enemyCells()[0])
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }))
    reply()
    expect(screen.getByRole('grid', { name: 'Placement board' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
    fireEvent.click(screen.getByRole('button', { name: /Start battle/ }))
    reply()
    expect(ownShots()).toHaveLength(0)
    expect(logs()).toHaveLength(0)
  })
  it('unmount cancels a pending timer', () => {
    begin(true)
    fireEvent.click(enemyCells()[0])
    expect(vi.getTimerCount()).toBe(1)
    cleanup()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('arrows move grid focus and Enter fires', async () => {
    begin()
    vi.useRealTimers()
    const user = userEvent.setup()
    act(() => enemyCells()[0].focus())
    await user.keyboard('{ArrowRight}')
    expect(enemyCells()[1]).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(logs()).toHaveLength(1)
  })
  it('game over focuses dialog and Play again keeps difficulty', () => {
    begin()
    // Placement consumes the first fleet; start consumes the second.
    const rng = seededRng(42)
    randomFleet(rng)
    const targets = randomFleet(rng).flatMap(s => s.cells)
    for (const coord of targets) {
      fireEvent.click(enemyCells()[coord.row * 10 + coord.col])
      if (screen.queryByRole('dialog')) break
      reply()
    }
    expect(screen.getByRole('dialog', { name: 'You win!' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Play again' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }))
    expect(screen.getByRole('grid', { name: 'Placement board' })).toBeInTheDocument()
    expect(screen.getByText('medium opponent')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start battle/ })).toBeDisabled()
  })
})
