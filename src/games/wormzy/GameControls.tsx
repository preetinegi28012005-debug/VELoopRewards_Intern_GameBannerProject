import type { WormzyDirection } from './levels';

interface GameControlsProps {
  onMove: (direction: WormzyDirection) => void;
  disabled: boolean;
}

const BUTTONS: { direction: WormzyDirection; glyph: string; label: string; className: string }[] = [
  { direction: 'up', glyph: '↑', label: 'Move up', className: 'wormzy-dir--up' },
  { direction: 'left', glyph: '←', label: 'Move left', className: 'wormzy-dir--left' },
  { direction: 'down', glyph: '↓', label: 'Move down', className: 'wormzy-dir--down' },
  { direction: 'right', glyph: '→', label: 'Move right', className: 'wormzy-dir--right' },
];

/** Touch-friendly direction pad — every button really moves the worm. */
export function GameControls({ onMove, disabled }: GameControlsProps) {
  return (
    <div className="wormzy-controls">
      <p className="wormzy-controls__label">Controls</p>
      <div className="wormzy-pad">
        {BUTTONS.map((button) => (
          <button
            key={button.direction}
            type="button"
            className={`wormzy-dir ${button.className}`}
            onClick={() => onMove(button.direction)}
            disabled={disabled}
            aria-label={button.label}
          >
            <span aria-hidden="true">{button.glyph}</span>
          </button>
        ))}
      </div>
      <p className="wormzy-controls__hint">Arrow keys or W A S D · or tap a cell next to Wormzy</p>
    </div>
  );
}
