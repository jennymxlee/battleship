import { allShipsSunk, createBoard, fireAt, isCompleteFleet } from './board'
import type { Board, Coord, PlacedShip, ShotOutcome } from './types'

export type Phase = 'placement' | 'playing' | 'over'
export type Player = 'player' | 'ai'

export interface LogEntry {
  by: Player
  coord: Coord
  outcome: ShotOutcome
  shipName: string | null
}

export interface GameState {
  phase: Phase
  turn: Player
  /** The human's fleet; the AI fires at this board. */
  playerBoard: Board | null
  /** The AI's fleet; the human fires at this board. */
  aiBoard: Board | null
  winner: Player | null
  log: LogEntry[]
}

export type GameAction =
  | { type: 'start'; playerShips: PlacedShip[]; aiShips: PlacedShip[] }
  | { type: 'fire'; by: Player; coord: Coord }
  | { type: 'reset' }

export const initialGameState: GameState = {
  phase: 'placement',
  turn: 'player',
  playerBoard: null,
  aiBoard: null,
  winner: null,
  log: [],
}

/**
 * Pure game rules. Illegal actions (firing out of turn, firing twice at a cell,
 * starting with an invalid fleet) return the unchanged state object.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'reset':
      return initialGameState

    case 'start': {
      if (state.phase !== 'placement') return state
      if (!isCompleteFleet(action.playerShips) || !isCompleteFleet(action.aiShips)) return state
      return {
        ...initialGameState,
        phase: 'playing',
        playerBoard: createBoard(action.playerShips),
        aiBoard: createBoard(action.aiShips),
      }
    }

    case 'fire': {
      if (state.phase !== 'playing' || state.turn !== action.by) return state
      const target = action.by === 'player' ? state.aiBoard : state.playerBoard
      if (!target) return state

      const result = fireAt(target, action.coord)
      if (!result.ok) return state

      const entry: LogEntry = {
        by: action.by,
        coord: action.coord,
        outcome: result.outcome,
        shipName: result.ship?.name ?? null,
      }
      const won = allShipsSunk(result.board)
      return {
        ...state,
        playerBoard: action.by === 'ai' ? result.board : state.playerBoard,
        aiBoard: action.by === 'player' ? result.board : state.aiBoard,
        phase: won ? 'over' : 'playing',
        winner: won ? action.by : null,
        turn: won ? state.turn : action.by === 'player' ? 'ai' : 'player',
        log: [...state.log, entry],
      }
    }
  }
}
