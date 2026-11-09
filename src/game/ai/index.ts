import type { Coord, Rng, TargetView } from '../types'
import { easyShot } from './easy'
import { mediumShot } from './medium'
import { hardShot } from './hard'

export { unknownCells } from './easy'

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTIES: readonly { id: Difficulty; label: string; description: string }[] = [
  { id: 'easy', label: 'Easy', description: 'Fires at random.' },
  { id: 'medium', label: 'Medium', description: 'Hunts on a checkerboard, then targets around hits.' },
  { id: 'hard', label: 'Hard', description: 'Fires where remaining ships are most likely to be.' },
]

/**
 * Chooses the AI's next shot from what it can see. Stateless by design: everything
 * the AI knows comes from `view`, so there is no AI memory to go stale between games.
 * Must always return an 'unknown' cell while any exist.
 */
export function chooseAiShot(difficulty: Difficulty, view: TargetView, rng: Rng): Coord {
  return { easy: easyShot, medium: mediumShot, hard: hardShot }[difficulty](view, rng)
}
