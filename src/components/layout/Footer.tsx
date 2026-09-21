import { useState } from 'react';
import { resetAllLocalData } from '../../services/walletService';
import { useActionLock } from '../../hooks/useActionLock';
import { Modal } from '../ui/Modal';
import { InstagramIcon, LinkedInIcon, WhatsAppIcon, YouTubeIcon } from '../ui/Icons';

const socials = [
  { label: 'Instagram', href: 'https://instagram.com', Icon: InstagramIcon },
  { label: 'YouTube', href: 'https://youtube.com', Icon: YouTubeIcon },
  { label: 'WhatsApp', href: 'https://wa.me/919876543210', Icon: WhatsAppIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com', Icon: LinkedInIcon },
];

export function Footer() {
  const [open, setOpen] = useState(false);
  const { run } = useActionLock();

  return (
    <footer className="footer">
      <div className="footer__brand-block">
        <div className="footer__brand">VELOOP</div>
        <p className="footer__copy">Developed by Preeti Negi</p>
      </div>

      <div className="footer__socials" aria-label="Social media links">
        {socials.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="footer__social"
            aria-label={label}
            title={label}
          >
            <Icon />
          </a>
        ))}
      </div>

      <button type="button" className="text-btn footer__reset" onClick={() => setOpen(true)}>
        Reset local data
      </button>

      <Modal
        open={open}
        title="Reset local data?"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() =>
                void run(async () => {
                  await resetAllLocalData();
                  setOpen(false);
                })
              }
            >
              Restore demo state
            </button>
          </>
        }
      >
        <p>
          This clears wallet changes, game history, redemptions, contact submissions and guide
          progress on this device. Demo balances will be restored. This cannot be undone.
        </p>
      </Modal>
    </footer>
  );
}
