import { describe, expect, it } from 'vitest'
import { createBoard, fireAt, randomFleet, toTargetView } from '../board'
import { seededRng } from '../rng'
import { chooseAiShot, DIFFICULTIES } from '.'

describe('chooseAiShot', () => {
  for (const { id } of DIFFICULTIES) {
    it(`${id}: never repeats a shot and always finishes within 100 shots`, () => {
      const rng = seededRng(42)
      for (let game = 0; game < 20; game++) {
        let board = createBoard(randomFleet(rng))
        let shots = 0
        while (toTargetView(board).remainingShips.length > 0) {
          const coord = chooseAiShot(id, toTargetView(board), rng)
          const result = fireAt(board, coord)
          expect(result.ok).toBe(true)
          if (!result.ok) break
          board = result.board
          shots++
        }
        expect(shots).toBeLessThanOrEqual(100)
      }
    })
  }
})
