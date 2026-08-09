const nodemailer = require('nodemailer');

// Sends real email through a Gmail account via SMTP.
//
// Setup (required env vars):
//   GMAIL_USER            the Gmail address to send from, e.g. waypoint.app@gmail.com
//   GMAIL_APP_PASSWORD    a 16-character Google "App Password" — NOT your normal
//                          Gmail login password. Gmail blocks plain-password SMTP
//                          logins for security, so you must generate an App
//                          Password instead:
//                            1. Turn on 2-Step Verification on the Google account:
//                               https://myaccount.google.com/security
//                            2. Go to https://myaccount.google.com/apppasswords
//                            3. Create an app password (name it e.g. "Waypoint"),
//                               copy the 16-char code it gives you.
//                            4. Set GMAIL_APP_PASSWORD to that code (no spaces).
//   MAIL_FROM_NAME         (optional) display name, defaults to "Waypoint"
//
// If these env vars aren't set, mail sending is skipped and the message is
// just logged instead — so local dev works without a Gmail account.

let transporter = null;
let warnedMissingConfig = false;

function isConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

/**
 * Send an email. Falls back to console logging if Gmail isn't configured,
 * so the app still runs in dev/test without real credentials.
 * @param {object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.text - plain-text body
 * @param {string} [opts.html] - optional HTML body
 */
async function sendMail({ to, subject, text, html }) {
  if (!isConfigured()) {
    if (!warnedMissingConfig) {
      console.warn(
        '[mailService] GMAIL_USER / GMAIL_APP_PASSWORD not set — emails will be logged, not sent. See src/services/mailService.js for setup steps.'
      );
      warnedMissingConfig = true;
    }
    console.log(`\n📧  [mail not sent — no Gmail config] To: ${to}\n    Subject: ${subject}\n    ${text}\n`);
    return { simulated: true };
  }

  const fromName = process.env.MAIL_FROM_NAME || 'Waypoint';

  const info = await getTransporter().sendMail({
    from: `"${fromName}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });

  return { simulated: false, messageId: info.messageId };
}

module.exports = { sendMail, isConfigured };