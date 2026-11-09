import { useState } from 'react'
import type { Difficulty, Rng } from './game'
import { useGame } from './hooks/useGame'
import { DifficultyPicker } from './components/DifficultyPicker'
import { PlacementScreen } from './components/PlacementScreen'
import { BattleScreen } from './components/BattleScreen'

export default function App({ rng = Math.random, aiDelayMs = 600 }: { rng?: Rng; aiDelayMs?: number }) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [setup, setSetup] = useState(true)
  const game = useGame(difficulty, rng, aiDelayMs)
  let screen = <BattleScreen {...game} onRestart={game.reset} />
  if (game.state.phase === 'placement') {
    screen = <PlacementScreen rng={rng} onStart={game.start} />
  }
  if (setup) {
    screen = (
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
      {screen}
      <footer>
        Command the waters.<span>• miss &nbsp; ✕ hit &nbsp; ▧ sunk</span>
      </footer>
    </main>
  )
}
