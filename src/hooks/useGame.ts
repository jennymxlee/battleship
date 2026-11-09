import { useEffect, useReducer } from 'react'
import { chooseAiShot, gameReducer, initialGameState, randomFleet, toTargetView } from '../game'
import type { Coord, Difficulty, PlacedShip, Rng } from '../game'

export function useGame(difficulty: Difficulty, rng: Rng = Math.random, aiDelayMs = 600) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState)
  const { phase, turn, log, playerBoard } = state
  useEffect(() => {
    if (phase !== 'playing' || turn !== 'ai' || !playerBoard) return
    const timer = setTimeout(() => {
      dispatch({ type: 'fire', by: 'ai', coord: chooseAiShot(difficulty, toTargetView(playerBoard), rng) })
    }, aiDelayMs)
    return () => clearTimeout(timer)
  }, [phase, turn, log.length, playerBoard, difficulty, rng, aiDelayMs])
  return {
    state,
    aiThinking: phase === 'playing' && turn === 'ai',
    start: (playerShips: PlacedShip[]) => dispatch({ type: 'start', playerShips, aiShips: randomFleet(rng) }),
    fire: (coord: Coord) => dispatch({ type: 'fire', by: 'player', coord }),
    reset: () => dispatch({ type: 'reset' }),
  }
}
