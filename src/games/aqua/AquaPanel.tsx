import type { AquaLevel } from './levels';

interface AquaPanelProps {
  level: AquaLevel;
  /** Cells currently drawn by the player. */
  pathCells: number;
  /** Live preview of how much water the drawn line would deliver. */
  projectedFill: number;
  canReset: boolean;
  disabled: boolean;
  onReset: () => void;
}

/** Right-hand (desktop) / below-board (mobile) information and control panel. */
export function AquaPanel({
  level,
  pathCells,
  projectedFill,
  canReset,
  disabled,
  onReset,
}: AquaPanelProps) {
  const target = Math.round(level.targetFill * 100);
  const projected = Math.round(projectedFill * 100);
  const meetsTarget = pathCells > 1 && projectedFill >= level.targetFill;
  const fillClass = pathCells <= 1 ? 'aqua-meter__value' : meetsTarget ? 'aqua-meter__value aqua-meter__value--good' : 'aqua-meter__value aqua-meter__value--warn';

  return (
    <aside className="aqua-panel">
      <section className="aqua-panel__block">
        <h2 className="aqua-panel__title">Level {level.index + 1} goal</h2>
        <p className="aqua-panel__text">
          Draw a line from the pipe to the glass. Shorter lines arrive with more water, so steer
          around the obstacles and stay close to the best route.
        </p>
        <div className="aqua-meters">
          <div className="aqua-meter">
            <small>Glass target</small>
            <span className="aqua-meter__value">{target}%</span>
          </div>
          <div className="aqua-meter">
            <small>Best route</small>
            <span className="aqua-meter__value">{level.optimalCells} cells</span>
          </div>
          <div className="aqua-meter">
            <small>Your line</small>
            <span className={fillClass}>
              {pathCells > 0 ? `${pathCells} cells` : '—'}
            </span>
          </div>
          <div className="aqua-meter">
            <small>Water arriving</small>
            <span className={fillClass}>{pathCells > 1 ? `${projected}%` : '—'}</span>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="aqua-reset"
        onClick={onReset}
        disabled={disabled || !canReset}
      >
        ↻ Reset path
      </button>

      <section className="aqua-panel__block">
        <h2 className="aqua-panel__title">How to fill</h2>
        <ol className="aqua-steps">
          <li>Press on the pipe and drag to draw your water line.</li>
          <li>Drag back over your line to undo, or reset the whole path.</li>
          <li>Finish on the glass to let the water flow and fill it.</li>
        </ol>
      </section>

      <section className="aqua-panel__block">
        <h2 className="aqua-panel__title">Legend</h2>
        <ul className="aqua-legend">
          <li>
            <span className="aqua-legend__swatch aqua-legend__swatch--pipe" /> Water source
          </li>
          <li>
            <span className="aqua-legend__swatch aqua-legend__swatch--glass" /> Glass
          </li>
          <li>
            <span className="aqua-legend__swatch aqua-legend__swatch--stone" /> Obstacle
          </li>
        </ul>
      </section>
    </aside>
  );
}
