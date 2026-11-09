import { DIFFICULTIES } from '../game'
import type { Difficulty } from '../game'

export function DifficultyPicker({
  value,
  onChange,
  onContinue,
}: {
  value: Difficulty
  onChange: (value: Difficulty) => void
  onContinue: () => void
}) {
  return (
    <section className="setup panel">
      <p className="eyebrow">01 / Mission briefing</p>
      <h2>Choose your opponent</h2>
      <p>Read the waters. Find their fleet. Make every shot count.</p>
      <fieldset>
        <legend>Difficulty</legend>
        <div className="difficulty-options">
          {DIFFICULTIES.map(d => (
            <label className={`difficulty ${value === d.id ? 'selected' : ''}`} key={d.id}>
              <input
                type="radio"
                name="difficulty"
                value={d.id}
                checked={value === d.id}
                onChange={() => onChange(d.id)}
              />
              <strong>{d.label}</strong>
              <span>{d.description}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button className="primary" onClick={onContinue}>
        Continue →
      </button>
    </section>
  )
}
