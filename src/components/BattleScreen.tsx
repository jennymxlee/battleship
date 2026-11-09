import type { Coord, GameState } from '../game'
import { Announcer } from './Announcer'
import { BoardPanel } from './BoardPanel'
import { GameOverDialog } from './GameOverDialog'
import { MoveLog } from './MoveLog'

interface BattleScreenProps {
  state: GameState
  fire: (coord: Coord) => void
  aiThinking: boolean
  onRestart: () => void
}

export function BattleScreen({ state, fire, aiThinking, onRestart }: BattleScreenProps) {
  const { playerBoard, aiBoard } = state
  if (!playerBoard || !aiBoard) return null
  const over = state.phase === 'over'
  let status = 'Your turn — choose a target.'
  if (aiThinking) status = 'Enemy is thinking…'
  if (over) status = 'Battle complete'
  return (
    <section>
      <div className="battle-heading">
        <div>
          <p className="eyebrow">03 / Engagement</p>
          <h2>Find. Fire. Sink.</h2>
        </div>
        <button onClick={onRestart}>Restart</button>
      </div>
      <p className="turn-status" role="status">
        {status}
      </p>
      <div className="boards">
        <BoardPanel board={playerBoard} own disabled reveal={over} fire={fire} />
        <BoardPanel board={aiBoard} own={false} disabled={aiThinking || over} reveal={over} fire={fire} />
      </div>
      <MoveLog entries={state.log} />
      <Announcer entry={state.log.at(-1)} />
      {over && <GameOverDialog won={state.winner === 'player'} onAgain={onRestart} />}
    </section>
  )
}
