import { DIFFICULTIES } from './index'
import { simulate } from './simulate'

console.log('| Difficulty | Avg | Median | Max | Mean move (ms) | Max move (ms) |')
console.log('| --- | ---: | ---: | ---: | ---: | ---: |')
for (const { id } of DIFFICULTIES) {
  const stats = simulate(id)
  console.log(`| ${id} | ${stats.avg.toFixed(2)} | ${stats.median} | ${stats.max} | ${(stats.moveMilliseconds / stats.moveCount).toFixed(3)} | ${stats.maxMoveMilliseconds.toFixed(3)} |`)
}
