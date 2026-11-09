import { FLEET, isShipSunk } from '../game'
import type { Board } from '../game'

export function FleetStatus({ board }: { board: Board }) {
  return (
    <ul className="fleet-status" aria-label="Fleet status">
      {FLEET.map(spec => {
        const ship = board.ships.find(s => s.id === spec.id)!
        const sunk = isShipSunk(board, ship)
        return (
          <li key={spec.id} className={sunk ? 'lost' : ''}>
            <span>{spec.name}</span>
            <span>{sunk ? 'Sunk' : 'Afloat'}</span>
          </li>
        )
      })}
    </ul>
  )
}
