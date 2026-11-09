import type { LogEntry } from '../game'
import { describeMove } from './announcement'

export function MoveLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section className="panel move-log">
      <h3>
        Move log <small> / {entries.length} {entries.length === 1 ? 'shot' : 'shots'}</small>
      </h3>
      <ol aria-label="Move log" reversed start={entries.length}>
        {[...entries].reverse().map((entry, i) => (
          <li key={entries.length - i}>
            {entry.by === 'player' ? 'You' : 'Enemy'} · {describeMove(entry)}
          </li>
        ))}
      </ol>
      {!entries.length && <p>No shots fired. The ocean is quiet.</p>}
    </section>
  )
}
