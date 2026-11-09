import { createBoard, fireAt, randomFleet, toTargetView } from '../board'
import { seededRng } from '../rng'
import { chooseAiShot, type Difficulty } from './index'

export function simulate(difficulty: Difficulty, games = 200, seed = 42) {
  if (!Number.isInteger(games) || games < 1) throw new Error('games must be a positive integer')
  const shotCounts: number[] = []
  let moveMilliseconds = 0
  let maxMoveMilliseconds = 0
  for (let game = 0; game < games; game++) {
    let board = createBoard(randomFleet(seededRng(seed + game)))
    const rng = seededRng(seed + game + 0x100000)
    let shots = 0
    let view = toTargetView(board)
    while (view.remainingShips.length) {
      const start = performance.now()
      const coord = chooseAiShot(difficulty, view, rng)
      const elapsed = performance.now() - start
      moveMilliseconds += elapsed
      maxMoveMilliseconds = Math.max(maxMoveMilliseconds, elapsed)
      if (view.cells[coord.row]?.[coord.col] !== 'unknown') throw new Error('AI chose a revealed cell')
      const result = fireAt(board, coord)
      if (!result.ok) throw new Error(`Invalid AI shot: ${result.reason}`)
      board = result.board
      shots++
      if (shots > 100) throw new Error('Game exceeded 100 shots')
      view = toTargetView(board)
    }
    shotCounts.push(shots)
  }
  const sorted = [...shotCounts].sort((a, b) => a - b)
  const moveCount = shotCounts.reduce((sum, shots) => sum + shots, 0)
  return {
    shotCounts,
    avg: moveCount / games,
    median: (sorted[Math.floor((games - 1) / 2)] + sorted[Math.floor(games / 2)]) / 2,
    max: sorted[games - 1],
    moveCount,
    moveMilliseconds,
    maxMoveMilliseconds,
  }
}
