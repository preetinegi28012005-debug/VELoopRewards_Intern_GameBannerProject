import type { WormzyTile } from './levels';

interface GameCellProps {
  x: number;
  y: number;
  tile: WormzyTile;
  isStart: boolean;
  isGoal: boolean;
  hasWorm: boolean;
  stepKey: number;
  blocked: boolean;
  blast: boolean;
  interactive: boolean;
  onSelect: (x: number, y: number) => void;
}

function cellLabel(tile: WormzyTile, isGoal: boolean): string {
  if (isGoal) return 'goal cell';
  if (tile === 'stone') return 'stone obstacle';
  if (tile === 'bomb') return 'bomb — avoid it';
  return 'open path';
}

export function GameCell({
  x,
  y,
  tile,
  isStart,
  isGoal,
  hasWorm,
  stepKey,
  blocked,
  blast,
  interactive,
  onSelect,
}: GameCellProps) {
  const classes = ['wormzy-cell'];
  if (tile === 'stone') classes.push('wormzy-cell--stone');
  else if (tile === 'bomb') classes.push('wormzy-cell--bomb');
  else classes.push('wormzy-cell--open');
  if (isGoal) classes.push('wormzy-cell--goal');
  if (isStart) classes.push('wormzy-cell--start');
  if (blocked) classes.push('wormzy-cell--blocked');
  if (blast) classes.push('wormzy-cell--blast');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={() => onSelect(x, y)}
      disabled={!interactive}
      aria-label={`Column ${x + 1}, row ${y + 1}: ${cellLabel(tile, isGoal)}`}
    >
      {tile === 'bomb' ? <span className="wormzy-bomb" aria-hidden="true" /> : null}
      {isGoal && !hasWorm ? (
        <span className="wormzy-goal" aria-hidden="true">
          ★
        </span>
      ) : null}
      {hasWorm ? (
        <span key={stepKey} className="wormzy-worm" aria-hidden="true">
          <span className="wormzy-worm__eye wormzy-worm__eye--left" />
          <span className="wormzy-worm__eye wormzy-worm__eye--right" />
        </span>
      ) : null}
    </button>
  );
}
