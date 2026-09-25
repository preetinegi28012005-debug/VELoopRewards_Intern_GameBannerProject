import gameCoinImage from '../../assets/game_coin.jpeg';
import tokenImage from '../../assets/multi_token.jpeg';
import { ARCADE_COINS, TOKEN_META } from '../../config/currencies';
import type { CurrencyKey } from '../../types/models';

export function TokenIcon({ className = 'currency-icon' }: { className?: string }) {
  return <img className={className} src={tokenImage} alt="" aria-hidden="true" />;
}

export function CoinIcon({ className = 'currency-icon' }: { className?: string }) {
  return <img className={className} src={gameCoinImage} alt="" aria-hidden="true" />;
}

const CURRENCY_IMAGES: Partial<Record<CurrencyKey, string>> = {
  ...Object.fromEntries(ARCADE_COINS.map((coin) => [coin.key, coin.image])),
  tokens: TOKEN_META.image,
};

/** Renders the matching coin artwork for any wallet currency. */
export function CurrencyIcon({
  currency,
  className = 'currency-icon',
}: {
  currency: CurrencyKey;
  className?: string;
}) {
  const image = CURRENCY_IMAGES[currency];
  if (!image) return null;
  return <img className={className} src={image} alt="" aria-hidden="true" />;
}

export function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none">
      <rect x="3.5" y="6.5" width="17" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 9.5l5 2.5-5 2.5v-5z" fill="currentColor" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none">
      <path
        d="M18.7 15.5c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.2-.8.9-.9 1.1-.2.2-.4.2-.7.1-.9-.4-1.8-1-2.5-1.8-.7-.7-1.2-1.6-1.7-2.5-.1-.2 0-.4.1-.6.1-.2.2-.4.3-.6.1-.1.1-.3 0-.4-.1-.1-.7-1.7-.9-2.2-.2-.5-.4-.4-.7-.4h-.6c-.2 0-.5.1-.7.4-.2.3-.8 1.1-.8 2.7 0 1.6.8 3.1 1 3.3.2.3 2.5 3.9 6.1 5.3.8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.4.2-1.4-.1-.1-.2-.1-.5-.3z"
        fill="currentColor"
      />
      <path
        d="M12 2.4A9.6 9.6 0 0 0 4.2 16L3 20.8l5-1.2A9.6 9.6 0 1 0 12 2.4z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none">
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 10.2v6.3M8 7.7v.1M11.1 16.5v-3.5c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v3.5M11.1 10.2v6.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PremiumGamerAvatar() {
  return (
    <div className="premium-avatar" aria-hidden="true">
      <div className="premium-avatar__ring">
        <div className="premium-avatar__inner">
          <div className="premium-avatar__headphones" />
          <div className="premium-avatar__hair" />
          <div className="premium-avatar__face">
            <span className="premium-avatar__eye premium-avatar__eye--left" />
            <span className="premium-avatar__eye premium-avatar__eye--right" />
            <span className="premium-avatar__smile" />
          </div>
          <div className="premium-avatar__neck" />
          <div className="premium-avatar__body">
            <div className="premium-avatar__shirt" />
            <div className="premium-avatar__arm premium-avatar__arm--left" />
            <div className="premium-avatar__arm premium-avatar__arm--right" />
            <div className="premium-avatar__controller" />
          </div>
        </div>
      </div>
    </div>
  );
}
