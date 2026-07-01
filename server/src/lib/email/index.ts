import type { Mailer, EmailMessage } from './mailer';
import { isProduction } from '../config';

export type { Mailer, EmailMessage };
export { passwordResetMessage } from './mailer';

// ── Test transport (non-delivering) ────────────────────────────────────────────────
// Captures messages in memory for assertions. NEVER used in production.
const sent: EmailMessage[] = [];
export const testMailer: Mailer = {
  name: 'test',
  async send(msg) { sent.push(msg); },
};
export function sentTestEmails(): readonly EmailMessage[] { return sent; }
export function clearTestEmails(): void { sent.length = 0; }

// ── Resend transport (HTTP API — no SMTP dependency) ────────────────────────────────
// Provider-independent seam: swap for SES/Postmark/etc. by adding another Mailer.
function resendMailer(): Mailer {
  return {
    name: 'resend',
    async send(msg) {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.EMAIL_FROM;
      if (!apiKey || !from) throw new Error('email transport not configured');
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text }),
      });
      if (!res.ok) throw new Error(`email provider responded ${res.status}`);
    },
  };
}

// Selects the transport from EMAIL_TRANSPORT. Production must use a real provider —
// the console/test transports are never selected there.
export function getMailer(): Mailer {
  const kind = (process.env.EMAIL_TRANSPORT ?? (isProduction() ? 'resend' : 'test')).toLowerCase();
  if (kind === 'resend') return resendMailer();
  if (isProduction()) {
    // Never fall back to a non-delivering/console transport in production.
    throw new Error('EMAIL_TRANSPORT must be a real provider (e.g. "resend") in production.');
  }
  return testMailer;
}

// Startup notice when production email delivery is not fully configured.
export function warnIfEmailNotConfigured(): void {
  if (!isProduction()) return;
  if ((process.env.EMAIL_TRANSPORT ?? '').toLowerCase() !== 'resend' || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn('[startup] NOTICE: production email transport is not fully configured (EMAIL_TRANSPORT/RESEND_API_KEY/EMAIL_FROM). Password-reset emails will not be delivered until configured.');
  }
}
