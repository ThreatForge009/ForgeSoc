const nodemailer = require('nodemailer');

/**
 * Slack: create an Incoming Webhook (https://api.slack.com/messaging/webhooks)
 * and set SLACK_WEBHOOK_URL in .env.
 *
 * Email: set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/ALERT_EMAIL_TO in .env.
 * Works with any standard SMTP provider (Gmail app password, SendGrid,
 * Mailgun, AWS SES, your own mail server, etc.).
 *
 * Both send real messages the moment they're configured — nothing simulated.
 * They just can't be exercised inside the sandbox this was built in (no
 * outbound network to slack.com or arbitrary SMTP hosts there).
 */

const isSlackConfigured = () => Boolean(process.env.SLACK_WEBHOOK_URL);
const isEmailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.ALERT_EMAIL_TO);
const isConfigured = () => ({ slack: isSlackConfigured(), email: isEmailConfigured() });

const sendSlack = async (text) => {
  if (!isSlackConfigured()) return { sent: false, reason: 'SLACK_WEBHOOK_URL not set' };

  try {
    const res = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return { sent: res.ok, status: res.status };
  } catch (err) {
    return { sent: false, error: err.message };
  }
};

let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
};

const sendEmail = async ({ subject, text }) => {
  if (!isEmailConfigured()) return { sent: false, reason: 'SMTP_HOST / ALERT_EMAIL_TO not set' };

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || 'forgesoc@localhost',
      to: process.env.ALERT_EMAIL_TO,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err.message };
  }
};

/** Fire both channels for a given alert/incident, whichever are configured. */
const notify = async ({ title, body }) => {
  const results = {};
  if (isSlackConfigured()) results.slack = await sendSlack(`*${title}*\n${body}`);
  if (isEmailConfigured()) results.email = await sendEmail({ subject: title, text: body });
  return results;
};

module.exports = { notify, sendSlack, sendEmail, isConfigured };
