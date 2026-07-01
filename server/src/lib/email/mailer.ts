// Provider-independent email interface. The rest of the app depends only on `Mailer`,
// never on a specific vendor, so transports can be swapped without code changes.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface Mailer {
  readonly name: string;
  send(msg: EmailMessage): Promise<void>;
}

// Password-reset email content. Deliberately minimal — no internal system details,
// no user data beyond the reset link, no token echoed anywhere but the link itself.
export function passwordResetMessage(to: string, resetUrl: string): EmailMessage {
  return {
    to,
    subject: 'Reset your SolarCS password',
    text:
      'We received a request to reset your SolarCS Command Center password.\n\n' +
      `Reset your password: ${resetUrl}\n\n` +
      'This link can be used once and expires in 1 hour. ' +
      'If you did not request this, you can ignore this email.',
    html:
      '<p>We received a request to reset your SolarCS Command Center password.</p>' +
      `<p><a href="${resetUrl}">Reset your password</a></p>` +
      '<p>This link can be used once and expires in 1&nbsp;hour. ' +
      'If you did not request this, you can ignore this email.</p>',
  };
}
