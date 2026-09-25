interface TimerProps {
  seconds: number;
  totalSeconds?: number;
  live: boolean;
  /** CSS class prefix so each game can theme the timer (e.g. "wormzy", "aqua"). */
  prefix?: string;
}

/** Level countdown, e.g. TIME: 10 → 9 → 8 … with a warning state under 4 seconds. */
export function Timer({ seconds, totalSeconds = 10, live, prefix = 'arcade' }: TimerProps) {
  const ratio = Math.max(0, Math.min(1, totalSeconds <= 0 ? 0 : seconds / totalSeconds));
  const classes = [`${prefix}-timer`];
  if (!live) classes.push(`${prefix}-timer--idle`);
  if (live && seconds <= 3) classes.push(`${prefix}-timer--low`);

  return (
    <span
      className={classes.join(' ')}
      role="timer"
      aria-label={`Level timer: ${seconds} seconds left`}
    >
      <span className={`${prefix}-timer__value`}>TIME: {seconds}</span>
      <span className={`${prefix}-timer__bar`} aria-hidden="true">
        <span className={`${prefix}-timer__fill`} style={{ width: `${ratio * 100}%` }} />
      </span>
    </span>
  );
}
