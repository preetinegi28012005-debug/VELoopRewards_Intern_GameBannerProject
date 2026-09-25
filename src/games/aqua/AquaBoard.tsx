import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { cellFromClientPoint, extendPath, flowDuration, headPosition } from './drawing';
import { cellKey, obstacleKeys, samePoint, type AquaLevel, type AquaPoint } from './levels';

export type AquaGlassState = 'idle' | 'success' | 'fail';

interface AquaBoardProps {
  level: AquaLevel;
  path: AquaPoint[];
  /** Current water level inside the glass, 0-1. */
  fill: number;
  /** True while the water is travelling along the drawn line. */
  flowing: boolean;
  /** Bump to re-run the flow animation for the same line. */
  flowKey: number;
  glassState: AquaGlassState;
  blockedCell: AquaPoint | null;
  leakPoint: AquaPoint | null;
  interactive: boolean;
  onPathChange: (path: AquaPoint[]) => void;
  onPathRelease: (path: AquaPoint[]) => void;
  onObstacleBump: (point: AquaPoint) => void;
  onStartRejected: () => void;
  onFlowComplete: () => void;
}

/** Water running along the drawn line. Owns its animation frame loop. */
function FlowLayer({
  path,
  running,
  runKey,
  onDone,
}: {
  path: AquaPoint[];
  running: boolean;
  runKey: number;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const latestPath = useRef(path);
  const doneRef = useRef(onDone);
  const pointsKey = path.map(cellKey).join('|');
  const duration = flowDuration(path.length);

  useEffect(() => {
    latestPath.current = path;
  }, [path]);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!running || path.length < 2) {
      setProgress(0);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const value = Math.min(1, (now - started) / duration);
      setProgress(value);
      if (value < 1) frame = requestAnimationFrame(tick);
      else doneRef.current();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, runKey, pointsKey, duration, path.length]);

  if (path.length < 2) return null;

  const total = path.length - 1;
  const points = path.map((cell) => `${cell.x + 0.5},${cell.y + 0.5}`).join(' ');
  const head = progress > 0 && progress < 1 ? headPosition(latestPath.current, progress * total) : null;

  return (
    <g className="aqua-flow">
      <polyline
        className="aqua-flow__line"
        points={points}
        strokeDasharray={total}
        strokeDashoffset={total * (1 - progress)}
      />
      {head ? <circle className="aqua-flow__head" cx={head.x} cy={head.y} r={0.16} /> : null}
    </g>
  );
}

/** Direction the pipe points in, derived from the border cell it sits on. */
function pipeRotation(level: AquaLevel): number {
  if (level.source.y === 0) return 0;
  if (level.source.x === level.cols - 1) return 90;
  if (level.source.y === level.rows - 1) return 180;
  return 270;
}

/**
 * The playfield: an SVG board with the water source, the glass and the
 * obstacles. Drawing uses pointer events (mouse, touch and pen) so the line
 * can be dragged with a finger, and the water animates along the drawn cells.
 */
export function AquaBoard({
  level,
  path,
  fill,
  flowing,
  flowKey,
  glassState,
  blockedCell,
  leakPoint,
  interactive,
  onPathChange,
  onPathRelease,
  onObstacleBump,
  onStartRejected,
  onFlowComplete,
}: AquaBoardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drawingRef = useRef(false);
  const latestPath = useRef(path);
  const uid = useId().replace(/:/g, '');
  const gridId = `aqua-grid-${uid}`;
  const clipId = `aqua-clip-${uid}`;
  const blocked = useMemo(() => obstacleKeys(level), [level]);

  useEffect(() => {
    latestPath.current = path;
  }, [path]);

  const cellAt = (event: ReactPointerEvent<SVGSVGElement>): AquaPoint | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return cellFromClientPoint(event.clientX, event.clientY, rect, level.cols, level.rows);
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const cell = cellAt(event);
    if (!cell) return;
    event.preventDefault();

    const current = latestPath.current;
    const end = current[current.length - 1];
    const canStart = current.length === 0 ? samePoint(cell, level.source) : samePoint(cell, end);
    if (!canStart) {
      onStartRejected();
      return;
    }

    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (current.length === 0) {
      latestPath.current = [level.source];
      onPathChange([level.source]);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!interactive || !drawingRef.current) return;
    const cell = cellAt(event);
    if (!cell) return;
    event.preventDefault();

    const result = extendPath(latestPath.current, cell, (point) => blocked.has(cellKey(point)));
    if (result.obstacle) {
      onObstacleBump(cell);
      return;
    }
    if (result.path !== latestPath.current) {
      latestPath.current = result.path;
      onPathChange(result.path);
    }
  };

  const releaseStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onPathRelease(latestPath.current);
  };

  const staticLayer = useMemo(
    () => (
      <>
        <rect className="aqua-field" x={0} y={0} width={level.cols} height={level.rows} />
        <rect
          className="aqua-field__grid"
          x={0}
          y={0}
          width={level.cols}
          height={level.rows}
          fill={`url(#${gridId})`}
        />
        {level.obstacles.map((obstacle) => (
          <g
            key={`${obstacle.x}-${obstacle.y}`}
            className={`aqua-obstacle aqua-obstacle--${obstacle.kind}`}
            transform={`translate(${obstacle.x} ${obstacle.y})`}
          >
            {obstacle.kind === 'stone' ? (
              <>
                <circle className="aqua-obstacle__shape" cx={0.5} cy={0.52} r={0.42} />
                <circle className="aqua-obstacle__shine" cx={0.38} cy={0.4} r={0.13} />
              </>
            ) : null}
            {obstacle.kind === 'block' ? (
              <>
                <rect className="aqua-obstacle__shape" x={0.1} y={0.14} width={0.8} height={0.7} rx={0.09} />
                <path className="aqua-obstacle__line" d="M0.14 0.49 H0.86" />
              </>
            ) : null}
            {obstacle.kind === 'pillar' ? (
              <>
                <rect className="aqua-obstacle__cap" x={0.24} y={0.06} width={0.52} height={0.14} rx={0.06} />
                <rect className="aqua-obstacle__shape" x={0.31} y={0.14} width={0.38} height={0.74} rx={0.1} />
              </>
            ) : null}
            {obstacle.kind === 'wall' ? (
              <>
                <rect className="aqua-obstacle__shape" x={0.02} y={0.3} width={0.96} height={0.4} rx={0.06} />
                <path className="aqua-obstacle__line" d="M0.08 0.5 H0.92" />
              </>
            ) : null}
          </g>
        ))}
        <defs>
          <pattern id={gridId} width={1} height={1} patternUnits="userSpaceOnUse">
            <path className="aqua-field__gridline" d="M1 0 H0 V1" />
          </pattern>
        </defs>
      </>
    ),
    [level, gridId],
  );

  const sourceLayer = useMemo(
    () => (
      <g
        className="aqua-pipe"
        transform={`translate(${level.source.x + 0.5} ${level.source.y + 0.5}) rotate(${pipeRotation(level)})`}
      >
        <circle className="aqua-pipe__glow" cx={0} cy={0.12} r={0.6} />
        <rect className="aqua-pipe__body" x={-0.31} y={-0.95} width={0.62} height={1.4} rx={0.1} />
        <rect className="aqua-pipe__collar" x={-0.39} y={-0.12} width={0.78} height={0.18} rx={0.07} />
        <rect className="aqua-pipe__mouth" x={-0.24} y={0.02} width={0.48} height={0.16} rx={0.06} />
        <circle className="aqua-pipe__drop" cx={0} cy={0.36} r={0.1} />
      </g>
    ),
    [level],
  );

  const glassLayer = useMemo(() => {
    const targetY = -0.58 + 1.16 * (1 - level.targetFill);
    const classes = ['aqua-glass'];
    if (glassState === 'success') classes.push('aqua-glass--success');
    if (glassState === 'fail') classes.push('aqua-glass--fail');

    return (
      <g
        className={classes.join(' ')}
        transform={`translate(${level.glass.x + 0.5} ${level.glass.y + 0.5})`}
      >
        <defs>
          <clipPath id={clipId}>
            <path d="M-0.36 -0.56 L0.36 -0.56 L0.29 0.56 L-0.29 0.56 Z" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect
            className="aqua-glass__water"
            x={-0.4}
            y={-0.6}
            width={0.8}
            height={1.2}
            style={{
              transform: `translateY(0.6px) scaleY(${Math.max(0.02, Math.min(1, fill))}) translateY(-0.6px)`,
            }}
          />
          <circle className="aqua-glass__bubble aqua-glass__bubble--a" cx={-0.13} cy={0.08} r={0.07} />
          <circle className="aqua-glass__bubble aqua-glass__bubble--b" cx={0.11} cy={-0.2} r={0.05} />
        </g>
        <path className="aqua-glass__body" d="M-0.42 -0.62 L0.42 -0.62 L0.34 0.62 L-0.34 0.62 Z" />
        <line className="aqua-glass__target" x1={-0.37} y1={targetY} x2={0.37} y2={targetY} />
        <text className="aqua-glass__label" x={0.46} y={targetY + 0.1}>
          {Math.round(level.targetFill * 100)}%
        </text>
      </g>
    );
  }, [level, fill, glassState, clipId]);

  const pathPoints = path.map((cell) => `${cell.x + 0.5},${cell.y + 0.5}`).join(' ');
  const tip = path[path.length - 1];

  return (
    <div className="aqua-board">
      <svg
        ref={svgRef}
        className="aqua-canvas"
        viewBox={`0 0 ${level.cols} ${level.rows}`}
        style={{ aspectRatio: `${level.cols} / ${level.rows}` }}
        role="application"
        aria-label={`Aqua Fill board, level ${level.index + 1}. Draw from the pipe to the glass.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={releaseStroke}
        onPointerCancel={releaseStroke}
        onContextMenu={(event) => event.preventDefault()}
      >
        {staticLayer}
        {sourceLayer}
        {path.length > 1 ? <polyline className="aqua-path" points={pathPoints} /> : null}
        {tip && !flowing ? (
          <circle className="aqua-path__tip" cx={tip.x + 0.5} cy={tip.y + 0.5} r={0.13} />
        ) : null}
        <FlowLayer path={path} running={flowing} runKey={flowKey} onDone={onFlowComplete} />
        {leakPoint ? (
          <circle className="aqua-leak" cx={leakPoint.x + 0.5} cy={leakPoint.y + 0.5} r={0.22} />
        ) : null}
        {blockedCell ? (
          <circle className="aqua-bump" cx={blockedCell.x + 0.5} cy={blockedCell.y + 0.5} r={0.3} />
        ) : null}
        {glassLayer}
      </svg>
    </div>
  );
}

