import { useEffect, useRef } from 'react'

export function GameOverDialog({ won, onAgain }: { won: boolean; onAgain: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="dialog-backdrop">
      <div
        className="panel game-over"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        ref={ref}
        tabIndex={-1}
        onKeyDown={event => {
          if (event.key !== 'Tab') return
          event.preventDefault()
          ref.current?.querySelector('button')?.focus()
        }}
      >
        <p className="eyebrow">Mission complete</p>
        <h2 id="result-title">{won ? 'You win!' : 'You lose'}</h2>
        <p>
          {won
            ? 'Their fleet is resting on the ocean floor.'
            : 'Your fleet fought bravely. A new mission awaits.'}
        </p>
        <button className="primary" onClick={onAgain}>
          Play again
        </button>
      </div>
    </div>
  )
}
