import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import type { LogEntry } from '../game'
import { Announcer } from './Announcer'
import { MoveLog } from './MoveLog'

afterEach(cleanup)

it('names the enemy once in the log while retaining the spoken announcement prefix', () => {
  const entry: LogEntry = {
    by: 'ai',
    coord: { row: 1, col: 3 },
    outcome: 'miss',
    shipName: null,
  }
  const { container } = render(
    <>
      <MoveLog entries={[entry]} />
      <Announcer entry={entry} />
    </>,
  )
  expect(screen.getByRole('listitem')).toHaveTextContent(/^Enemy · D2: miss\.$/)
  expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(/^Enemy shot D2: miss\.$/)
})

it('retains all entries newest first, including sinking details', () => {
  const entries: LogEntry[] = Array.from({ length: 88 }, (_, index) => ({
    by: 'player',
    coord: { row: Math.floor(index / 10), col: index % 10 },
    outcome: 'miss',
    shipName: null,
  }))
  entries[87] = { by: 'ai', coord: { row: 6, col: 1 }, outcome: 'sunk', shipName: 'Cruiser' }
  render(<MoveLog entries={entries} />)
  const items = within(screen.getByRole('list', { name: 'Move log' })).getAllByRole('listitem')
  expect(items).toHaveLength(88)
  expect(items[0]).toHaveTextContent('Enemy · B7: hit! They sank your Cruiser!')
  expect(items[87]).toHaveTextContent('You · A1: miss.')
})

it('shows the empty log message', () => {
  render(<MoveLog entries={[]} />)
  expect(screen.getByText('No shots fired. The ocean is quiet.')).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})
