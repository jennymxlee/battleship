import type { Board, Coord } from '../game'
import { battleCellDisplay } from './cellDisplay'
import { FleetStatus } from './FleetStatus'
import { Grid } from './Grid'

interface BoardPanelProps {
  board: Board
  own: boolean
  disabled: boolean
  reveal: boolean
  fire: (coord: Coord) => void
}

export function BoardPanel({ board, own, disabled, reveal, fire }: BoardPanelProps) {
  const title = own ? 'Your fleet' : 'Enemy waters'
  return (
    <section className="panel board-panel">
      <h3>{title}</h3>
      <p className="board-caption">{own ? 'Defend your home waters' : 'Select a square to fire'}</p>
      <Grid
        label={title}
        disabled={own || disabled}
        onActivate={own ? undefined : fire}
        cell={coord => battleCellDisplay(board, coord, own, reveal)}
      />
      <FleetStatus board={board} />
    </section>
  )
}
