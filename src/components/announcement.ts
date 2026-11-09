import { formatCoord } from '../game'
import type { LogEntry } from '../game'

export function describeMove(entry: LogEntry) {
  const shot = `${formatCoord(entry.coord)}: ${entry.outcome === 'miss' ? 'miss.' : 'hit!'}`
  if (entry.outcome !== 'sunk') return shot
  const subject = entry.by === 'player' ? 'You sank their' : 'They sank your'
  return `${shot} ${subject} ${entry.shipName}!`
}

export function announcement(entry: LogEntry) {
  const prefix = entry.by === 'ai' ? 'Enemy shot ' : ''
  return `${prefix}${describeMove(entry)}`
}
