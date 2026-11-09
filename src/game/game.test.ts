import { describe, expect, it } from 'vitest'
import { randomFleet, shipAt } from './board'
import { allCoords } from './coords'
import { gameReducer, initialGameState, type GameState } from './game'
import { seededRng } from './rng'

function startedGame(seed = 1): GameState {
  const rng = seededRng(seed)
  return gameReducer(initialGameState, { type: 'start', playerShips: randomFleet(rng), aiShips: randomFleet(rng) })
}

describe('gameReducer', () => {
  it('starts with the player to move', () => {
    const state = startedGame()
    expect(state.phase).toBe('playing')
    expect(state.turn).toBe('player')
  })

  it('refuses to start with an incomplete fleet', () => {
    const rng = seededRng(1)
    const state = gameReducer(initialGameState, { type: 'start', playerShips: randomFleet(rng).slice(1), aiShips: randomFleet(rng) })
    expect(state).toBe(initialGameState)
  })

  it('alternates turns after every legal shot, hit or miss', () => {
    let state = startedGame()
    state = gameReducer(state, { type: 'fire', by: 'player', coord: { row: 0, col: 0 } })
    expect(state.turn).toBe('ai')
    state = gameReducer(state, { type: 'fire', by: 'ai', coord: { row: 0, col: 0 } })
    expect(state.turn).toBe('player')
  })

  it('ignores shots out of turn', () => {
    const state = startedGame()
    expect(gameReducer(state, { type: 'fire', by: 'ai', coord: { row: 0, col: 0 } })).toBe(state)
  })

  it('ignores a repeat shot and keeps the same player to move', () => {
    let state = startedGame()
    state = gameReducer(state, { type: 'fire', by: 'player', coord: { row: 0, col: 0 } })
    state = gameReducer(state, { type: 'fire', by: 'ai', coord: { row: 0, col: 0 } })
    expect(gameReducer(state, { type: 'fire', by: 'player', coord: { row: 0, col: 0 } })).toBe(state)
  })

  it('ignores shots before the game starts and after it ends', () => {
    expect(gameReducer(initialGameState, { type: 'fire', by: 'player', coord: { row: 0, col: 0 } })).toBe(initialGameState)
  })

  it('declares the player the winner after sinking every AI ship and stops play', () => {
    let state = startedGame(3)
    const targets = state.aiBoard!.ships.flatMap((s) => s.cells)
    const aiShots = [...Array(100).keys()].map((i) => ({ row: Math.floor(i / 10), col: i % 10 }))
    for (const coord of targets) {
      state = gameReducer(state, { type: 'fire', by: 'player', coord })
      if (state.phase === 'over') break
      state = gameReducer(state, { type: 'fire', by: 'ai', coord: aiShots.shift()! })
    }
    expect(state.phase).toBe('over')
    expect(state.winner).toBe('player')
    expect(state.log.at(-1)).toMatchObject({ by: 'player', outcome: 'sunk' })
    expect(gameReducer(state, { type: 'fire', by: state.turn, coord: { row: 9, col: 9 } })).toBe(state)
  })

  it('records sunk ship names in the log', () => {
    let state = startedGame(4)
    const destroyer = state.aiBoard!.ships.find((s) => s.id === 'destroyer')!
    let aiCol = 0
    for (const coord of destroyer.cells) {
      state = gameReducer(state, { type: 'fire', by: 'player', coord })
      state = gameReducer(state, { type: 'fire', by: 'ai', coord: { row: 0, col: aiCol++ } })
    }
    const playerEntries = state.log.filter((e) => e.by === 'player')
    expect(playerEntries.at(-1)).toMatchObject({ outcome: 'sunk', shipName: 'Destroyer' })
  })

  it('declares the AI the winner and rejects further actions', () => {
    let state = startedGame(9)
    const targets = state.playerBoard!.ships.flatMap(s => s.cells)
    const misses = allCoords().filter(coord => !shipAt(state.aiBoard!, coord))
    for (const coord of targets) {
      state = gameReducer(state, { type: 'fire', by: 'player', coord: misses.shift()! })
      state = gameReducer(state, { type: 'fire', by: 'ai', coord })
    }
    expect(state.phase).toBe('over')
    expect(state.winner).toBe('ai')
    expect(gameReducer(state, { type: 'fire', by: 'player', coord: misses[0] })).toBe(state)
  })

  it('derives ship cells from placements, ignoring tampered cells', () => {
    const rng = seededRng(5)
    const playerShips = randomFleet(rng)
    const tampered = playerShips.map((s) => ({ ...s, cells: [] }))
    const state = gameReducer(initialGameState, { type: 'start', playerShips: tampered, aiShips: randomFleet(rng) })
    expect(state.playerBoard!.ships.map((s) => s.cells)).toEqual(playerShips.map((s) => s.cells))
  })

  it('is not affected by later edits to the fleet passed to start', () => {
    const rng = seededRng(6)
    const aiShips = randomFleet(rng)
    const state = gameReducer(initialGameState, { type: 'start', playerShips: randomFleet(rng), aiShips })
    const before = structuredClone(state.aiBoard!.ships)
    aiShips[0].cells[0].row = 99
    aiShips[0].origin.row = 99
    aiShips.pop()
    expect(state.aiBoard!.ships).toEqual(before)
  })

  it('reset returns to placement', () => {
    expect(gameReducer(startedGame(), { type: 'reset' })).toBe(initialGameState)
  })
})
