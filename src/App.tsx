import { useLayoutEffect, useRef, useState } from 'react'
import type { Difficulty, Rng } from './game'
import { useGame } from './hooks/useGame'
import { DifficultyPicker } from './components/DifficultyPicker'
import { PlacementScreen } from './components/PlacementScreen'
import { BattleScreen } from './components/BattleScreen'

export default function App({ rng = Math.random, aiDelayMs = 600 }: { rng?: Rng; aiDelayMs?: number }) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [setup, setSetup] = useState(true)
  const game = useGame(difficulty, rng, aiDelayMs)
  const content = useRef<HTMLDivElement>(null)
  const screen = setup ? 'setup' : game.state.phase === 'placement' ? 'placement' : 'battle'
  useLayoutEffect(() => {
    const heading = content.current?.querySelector('h2')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [screen])
  let view = <BattleScreen {...game} onRestart={game.reset} />
  if (game.state.phase === 'placement') {
    view = (
      <>
        <button className="change-difficulty" onClick={() => setSetup(true)}>Change difficulty</button>
        <PlacementScreen rng={rng} onStart={game.start} />
      </>
    )
  }
  if (setup) {
    view = (
      <DifficultyPicker value={difficulty} onChange={setDifficulty} onContinue={() => setSetup(false)} />
    )
  }
  return (
    <main className="app">
      <header className="masthead">
        <div>
          <p className="eyebrow">Naval strategy / 10 × 10</p>
          <h1>
            BATTLESHIP<span aria-hidden="true"> +</span>
          </h1>
        </div>
        <span className="mission-tag">{setup ? 'Mission control' : `${difficulty} opponent`}</span>
      </header>
      <div ref={content}>{view}</div>
      <footer>
        Command the waters.<span>• miss &nbsp; ✕ hit &nbsp; ▧ sunk</span>
      </footer>
    </main>
  )
}
