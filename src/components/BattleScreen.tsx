import { useLayoutEffect, useRef, useState } from 'react'
import type { Coord, GameState } from '../game'
import { announcement } from './announcement'
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
  const [showResult, setShowResult] = useState(true)
  const again = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => {
    if (!showResult) again.current?.focus()
  }, [showResult])
  const { playerBoard, aiBoard } = state
  if (!playerBoard || !aiBoard) return null
  const over = state.phase === 'over'
  let status = 'Your turn — choose a target.'
  if (aiThinking) status = 'Enemy is thinking…'
  if (over) status = 'Battle complete'
  return (
    <section>
      <div inert={over && showResult}>
        <div className="battle-heading">
          <div>
            <p className="eyebrow">03 / Engagement</p>
            <h2>Find. Fire. Sink.</h2>
          </div>
          <button
            ref={again}
            onClick={() => {
              if (over || window.confirm('Discard this battle and return to placement?')) onRestart()
            }}
          >
            {over ? 'Play again' : 'Restart'}
          </button>
        </div>
        <div className="turn-status" role="status" aria-atomic="true">
          <span>{status}</span>
          {state.log.at(-1) && <small>{announcement(state.log.at(-1)!)}</small>}
        </div>
        <div className="boards">
          <BoardPanel board={playerBoard} own disabled reveal={over} fire={fire} />
          <BoardPanel board={aiBoard} own={false} disabled={aiThinking || over} reveal={over} fire={fire} />
        </div>
        <MoveLog entries={state.log} />
      </div>
      {over && showResult && (
        <GameOverDialog
          won={state.winner === 'player'}
          onAgain={onRestart}
          onClose={() => setShowResult(false)}
        />
      )}
    </section>
  )
}
