import type { ReactNode } from 'react';
import { GameCell } from './GameCell';
import type { WormzyLevel, WormzyPoint } from './levels';

interface GameBoardProps {
  level: WormzyLevel;
  worm: WormzyPoint;
  stepKey: number;
  blockedCell: WormzyPoint | null;
  blastCell: WormzyPoint | null;
  interactive: boolean;
  onCellSelect: (x: number, y: number) => void;
  children?: ReactNode;
}

export function GameBoard({
  level,
  worm,
  stepKey,
  blockedCell,
  blastCell,
  interactive,
  onCellSelect,
  children,
}: GameBoardProps) {
  return (
    <div className="wormzy-board" aria-label={`Wormzy board, ${level.size} by ${level.size}`}>
      <div className="wormzy-grid" style={{ ['--wormzy-cols' as string]: String(level.size) }}>
        {level.tiles.map((row, y) =>
          row.map((tile, x) => (
            <GameCell
              key={`${x}-${y}`}
              x={x}
              y={y}
              tile={tile}
              isStart={level.start.x === x && level.start.y === y}
              isGoal={level.goal.x === x && level.goal.y === y}
              hasWorm={worm.x === x && worm.y === y}
              stepKey={stepKey}
              blocked={blockedCell !== null && blockedCell.x === x && blockedCell.y === y}
              blast={blastCell !== null && blastCell.x === x && blastCell.y === y}
              interactive={interactive}
              onSelect={onCellSelect}
            />
          )),
        )}
      </div>
      {children}
    </div>
  );
}
