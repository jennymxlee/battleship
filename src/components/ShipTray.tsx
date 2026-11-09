import { FLEET } from '../game'
import type { PlacedShip, ShipId } from '../game'

interface ShipTrayProps {
  ships: PlacedShip[]
  selected: ShipId | null
  onSelect: (id: ShipId) => void
}

export function ShipTray({ ships, selected, onSelect }: ShipTrayProps) {
  return (
    <div className="ship-tray">
      {FLEET.map(ship => (
        <button
          key={ship.id}
          data-ship-id={ship.id}
          aria-pressed={selected === ship.id}
          onClick={() => onSelect(ship.id)}
        >
          <span>{ship.name}</span>
          <span aria-hidden="true">
            {Array.from({ length: ship.length }, (_, index) => (
              <span key={index} data-segment={index}>
                ▪
              </span>
            ))}
          </span>
          <small>{ships.some(s => s.id === ship.id) ? 'Placed · reposition' : 'Awaiting orders'}</small>
        </button>
      ))}
    </div>
  )
}
