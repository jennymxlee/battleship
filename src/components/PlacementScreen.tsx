import { useState } from 'react'
import { sameCoord } from '../game'
import type { Coord, PlacedShip, Rng } from '../game'
import { usePlacement } from '../hooks/usePlacement'
import { usePlacementDrag } from '../hooks/usePlacementDrag'
import { Grid } from './Grid'
import { ShipTray } from './ShipTray'
import { placementCellDisplay } from './cellDisplay'

export function PlacementScreen({ rng, onStart }: { rng: Rng; onStart: (ships: PlacedShip[]) => void }) {
  const placement = usePlacement(rng)
  const drag = usePlacementDrag(placement)
  const [hover, setHover] = useState<Coord | null>(null)
  const [message, setMessage] = useState('Select a ship, then choose its starting square.')
  const origin = drag.dragging ? drag.origin : hover
  const preview = origin ? placement.preview(origin) : null

  function activate(coord: Coord) {
    const ship = placement.ships.find(s => s.cells.some(c => sameCoord(c, coord)))
    if (ship && ship.id !== placement.selected) {
      placement.select(ship.id)
      setMessage(`${ship.name} selected. Choose a new position.`)
      return
    }
    const placed = placement.place(coord)
    setMessage(placed ? 'Ship placed.' : 'Cannot place here: overlapping or outside the board.')
  }

  return (
    <section
      {...drag.handlers}
      onKeyDown={event => {
        if (event.key.toLowerCase() !== 'r' || event.ctrlKey || event.metaKey || event.altKey) return
        event.preventDefault()
        placement.rotate()
      }}
    >
      <p className="eyebrow">02 / Fleet deployment</p>
      <h2>Take your positions</h2>
      <p>Place your five ships. Ships may touch, but cannot overlap.</p>
      <div className="placement-layout">
        <div className="panel board-panel placement-board">
          <h3>Your waters</h3>
          <Grid
            label="Placement board"
            onHover={setHover}
            onActivate={activate}
            cell={coord => placementCellDisplay(placement.ships, coord, preview)}
          />
        </div>
        <aside className="panel">
          <h3>Ship manifest</h3>
          <ShipTray ships={placement.ships} selected={placement.selected} onSelect={placement.select} />
          <div className="actions">
            <button onClick={placement.rotate}>Rotate (R): {placement.orientation}</button>
            <button onClick={placement.remove}>Remove selected</button>
            <button onClick={placement.randomize}>Randomize</button>
            <button onClick={placement.clear}>Clear</button>
          </div>
          <p role="status">{message}</p>
          <button
            className="primary"
            disabled={!placement.isComplete}
            onClick={() => onStart(placement.ships)}
          >
            Start battle →
          </button>
        </aside>
      </div>
    </section>
  )
}
