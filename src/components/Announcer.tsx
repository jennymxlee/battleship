import type { LogEntry } from '../game'
import { announcement } from './announcement'

export function Announcer({ entry }: { entry?: LogEntry }) {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {entry ? announcement(entry) : ''}
    </div>
  )
}
