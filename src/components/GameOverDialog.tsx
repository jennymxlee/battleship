import { useEffect, useRef } from 'react'

export function GameOverDialog({ won, onAgain, onClose }: { won: boolean; onAgain: () => void; onClose: () => void }) {
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
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
            return
          }
          if (event.key !== 'Tab') return
          const buttons = ref.current?.querySelectorAll('button')
          if (!buttons?.length) return
          const first = buttons[0], last = buttons[buttons.length - 1]
          if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) {
            event.preventDefault()
            first.focus()
          }
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
        <button onClick={onClose}>View boards</button>
      </div>
    </div>
  )
}
