import type { ReactNode } from 'react';
import type { GameConfig } from '../../types/models';
import image1 from '../../assets/1.jpeg';
import image2 from '../../assets/2.jpeg';
import image3 from '../../assets/3.jpeg';
import image4 from '../../assets/4.jpeg';
import image5 from '../../assets/5.jpeg';
import image6 from '../../assets/6.jpeg';
import image7 from '../../assets/7.jpeg';
import image8 from '../../assets/8.jpeg';
import image9 from '../../assets/9.jpeg';
import image10 from '../../assets/10.jpeg';
import image11 from '../../assets/11.jpeg';
import image12 from '../../assets/12.jpeg';
import image13 from '../../assets/13.jpeg';

const GAME_IMAGES: Record<string, string> = {
  'speed-tapper': image1,
  'memory-match': image2,
  'number-rush': image3,
  'color-reflex': image4,
  'catch-the-coin': image5,
  'pulse-runner': image6,
  'neon-maze': image7,
  'orbit-puzzle': image8,
  'storm-strike': image9,
  'echo-beat': image10,
  'vault-breaker': image11,
  'prism-drift': image12,
  'titan-trail': image13,
};

function Frame({ id, accent, children }: { id: string; accent: string; children: ReactNode }) {
  const gid = `art-${id}`;
  return (
    <svg className="game-art" viewBox="0 0 360 200" role="img">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0d1118" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect width="360" height="200" rx="18" fill={`url(#${gid})`} />
      <rect x="14" y="14" width="332" height="172" rx="14" fill="rgba(7,10,16,0.28)" />
      {children}
    </svg>
  );
}

export function GameArt({ game }: { game: GameConfig }) {
  const { art, accent, name } = game;
  const imageSrc = GAME_IMAGES[game.slug] || GAME_IMAGES[game.id];

  if (imageSrc) {
    return (
      <svg className="game-art" viewBox="0 0 360 200" role="img" aria-label={`${name} artwork`}>
        <defs>
          <linearGradient id={`art-${game.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0d1118" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <rect width="360" height="200" rx="18" fill={`url(#art-${game.id})`} />
        <image
          href={imageSrc}
          x="14"
          y="14"
          width="332"
          height="172"
          preserveAspectRatio="xMidYMid slice"
        />
      </svg>
    );
  }

  return (
    <Frame id={game.id} accent={accent}>
      <title>{`${name} artwork`}</title>
      {art === 'tap' && (
        <>
          <circle cx="120" cy="108" r="38" fill="#fff" opacity="0.9" />
          <circle cx="230" cy="78" r="22" fill="#fff" opacity="0.55" />
          <circle cx="268" cy="132" r="16" fill="#fff" opacity="0.4" />
        </>
      )}
      {art === 'memory' && (
        <>
          <rect x="78" y="58" width="70" height="88" rx="10" fill="#fff" opacity="0.92" />
          <rect x="162" y="58" width="70" height="88" rx="10" fill="#fff" opacity="0.45" />
          <rect x="246" y="58" width="46" height="88" rx="10" fill="#fff" opacity="0.25" />
        </>
      )}
      {art === 'numbers' && (
        <text
          x="70"
          y="128"
          fill="#fff"
          fontSize="64"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight="800"
        >
          247
        </text>
      )}
      {art === 'color' && (
        <>
          <circle cx="118" cy="104" r="32" fill="#ff5d8f" />
          <circle cx="180" cy="104" r="32" fill="#5d8bff" />
          <circle cx="242" cy="104" r="32" fill="#35d39a" />
        </>
      )}
      {art === 'coin' && (
        <>
          <circle cx="180" cy="100" r="42" fill="#f3d36b" />
          <circle cx="180" cy="100" r="28" fill="none" stroke="#7a5a12" strokeWidth="4" />
        </>
      )}
      {art === 'runner' && (
        <path
          d="M70 140 L130 70 L180 118 L250 52 L300 110"
          fill="none"
          stroke="#fff"
          strokeWidth="8"
          strokeLinecap="round"
        />
      )}
      {art === 'maze' && (
        <path d="M80 60h200v80H140v30h140" fill="none" stroke="#fff" strokeWidth="10" />
      )}
      {art === 'orbit' && (
        <>
          <ellipse cx="180" cy="100" rx="90" ry="36" fill="none" stroke="#fff" strokeWidth="4" />
          <circle cx="180" cy="100" r="16" fill="#fff" />
          <circle cx="270" cy="100" r="8" fill="#fff" />
        </>
      )}
      {art === 'storm' && <path d="M190 40 L140 108 h50 l-40 56 90-78 h-52 z" fill="#fff" />}
      {art === 'beat' && (
        <path
          d="M70 120 h40 l18-50 22 80 24-60 16 30 h90"
          fill="none"
          stroke="#fff"
          strokeWidth="8"
          strokeLinecap="round"
        />
      )}
      {art === 'vault' && (
        <circle cx="180" cy="104" r="48" fill="none" stroke="#fff" strokeWidth="10" />
      )}
      {art === 'prism' && <path d="M180 48 L260 148 H100 Z" fill="#fff" opacity="0.85" />}
      {art === 'titan' && (
        <path
          d="M80 150 L140 90 L190 126 L280 54"
          fill="none"
          stroke="#fff"
          strokeWidth="10"
          strokeLinecap="round"
        />
      )}
    </Frame>
  );
}
