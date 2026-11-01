import { isProd } from './env.js';

const RESEND_URL = 'https://api.resend.com/emails';
const { RESEND_API_KEY, EMAIL_FROM } = process.env;

export const emailConfigured = Boolean(RESEND_API_KEY && EMAIL_FROM);

function linkEmailHtml({ heading, body, url, label, footer }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#0a0a0c;font-family:Arial,Helvetica,sans-serif;color:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141418;border-top:3px solid #ffd23f;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 20px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ffd23f;">TheGamingGrimoire</p>
                <h1 style="margin:0 0 12px;font-size:24px;color:#ffffff;">${heading}</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#c8c8d0;">${body}</p>
                <a href="${url}" style="display:inline-block;padding:14px 24px;background:#ffd23f;color:#0a0a0c;font-weight:bold;font-size:16px;text-decoration:none;">${label}</a>
                <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#8a8a94;">${footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function deliver({ to, subject, html, text, url }) {
  if (!emailConfigured) {
    // Local development has no mail provider, so the link goes to the server log. Links are secrets: never log them in production.
    if (isProd) console.error(`Email not sent (${subject}): set RESEND_API_KEY and EMAIL_FROM.`);
    else console.log(`\n[email] ${subject} for ${to}\n[email] ${url}\n`);
    return;
  }
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
}

// Not awaited by callers: a request for a real account must take as long as one for an unknown
// email (or reset requests would reveal who has an account), and a mail outage must not fail signup.
function send(message) {
  deliver(message).catch((err) => console.error(`Email not sent (${message.subject}):`, err.message));
}

export function sendVerificationLink(to, url) {
  const subject = 'Verify your email';
  send({
    to,
    subject,
    url,
    text: `Welcome to TheGamingGrimoire. Verify your email to finish setting up your account:\n\n${url}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    html: linkEmailHtml({
      heading: 'Verify your email',
      body: 'Welcome to TheGamingGrimoire. Confirm this address to finish setting up your account.',
      url,
      label: 'Verify email',
      footer: 'This link expires in 24 hours. If you didn’t create an account, you can ignore this email.',
    }),
  });
}

export function sendPasswordResetLink(to, url) {
  const subject = 'Reset your password';
  send({
    to,
    subject,
    url,
    text: `Someone asked to reset the password for your TheGamingGrimoire account. Choose a new password here:\n\n${url}\n\nThis link expires in 1 hour. If this wasn't you, you can ignore this email and your password won't change.`,
    html: linkEmailHtml({
      heading: 'Reset your password',
      body: 'Someone asked to reset the password for your account. Use the button below to choose a new one.',
      url,
      label: 'Reset password',
      footer: 'This link expires in 1 hour. If this wasn’t you, you can ignore this email and your password won’t change.',
    }),
  });
}
