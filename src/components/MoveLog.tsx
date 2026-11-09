import type { LogEntry } from '../game'
import { announcement } from './announcement'

export function MoveLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section className="panel move-log">
      <h3>
        Move log <small> / {entries.length} shots</small>
      </h3>
      <ol aria-label="Move log">
        {[...entries].reverse().map((entry, i) => (
          <li key={entries.length - i}>
            {entry.by === 'player' ? 'You' : 'Enemy'} · {announcement(entry)}
          </li>
        ))}
      </ol>
      {!entries.length && <p>No shots fired. The ocean is quiet.</p>}
    </section>
  )
}
