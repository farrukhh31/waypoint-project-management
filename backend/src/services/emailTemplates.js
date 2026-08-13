// Turns a raw notification (type + message + link) into a real, branded
// email: a type-appropriate subject line, an HTML body with a CTA button
// back to the app, and a plain-text fallback for clients that don't render
// HTML. Centralized here so every call site (schedulers, controllers) gets
// the same look without duplicating markup.

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// Subject line + accent color + short label per notification type. Falls
// back to a generic "notification" look for any type not listed here, so a
// new NotificationType never breaks email sending.
const TYPE_META = {
  TASK_ASSIGNED: { subject: 'New task assigned to you', label: 'Task assigned', color: '#2f5d8a' },
  TASK_STATUS_CHANGED: { subject: 'Task status updated', label: 'Status update', color: '#2f5d8a' },
  DISCUSSION_ADDED: { subject: 'New comment on your work', label: 'New comment', color: '#2f5d8a' },
  DEADLINE_APPROACHING: { subject: 'Deadline coming up', label: 'Deadline reminder', color: '#c1483d' },
  PROJECT_ASSIGNED: { subject: "You've been added to a project", label: 'Project update', color: '#2f5d8a' },
  MEMBER_ADDED: { subject: "You've been added to a project", label: 'Project update', color: '#2f5d8a' },
  TASK_SUBMITTED: { subject: 'Task submitted for review', label: 'Review needed', color: '#e2a33b' },
  TASK_APPROVED: { subject: 'Task approved', label: 'Approved', color: '#2f9e63' },
  TASK_CHANGES_REQUESTED: { subject: 'Changes requested on your task', label: 'Changes requested', color: '#c1483d' },
  PROJECT_SUBMITTED: { subject: 'Project submitted for approval', label: 'Approval needed', color: '#e2a33b' },
  PROJECT_APPROVED: { subject: 'Project approved', label: 'Approved', color: '#2f9e63' },
  PROJECT_CHANGES_REQUESTED: { subject: 'Changes requested on your project', label: 'Changes requested', color: '#c1483d' },
  MEETING_INVITE: { subject: "You're invited to a meeting", label: 'Meeting invite', color: '#2f5d8a' },
  MEETING_REMINDER: { subject: 'Meeting starting soon', label: 'Meeting reminder', color: '#c1483d' },
  MEETING_CANCELLED: { subject: 'Meeting cancelled', label: 'Meeting cancelled', color: '#8a8a8a' },
};

const DEFAULT_META = { subject: 'New notification from Waypoint', label: 'Notification', color: '#2f5d8a' };

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {object} opts
 * @param {string} opts.type - NotificationType
 * @param {string} opts.message - plain-language notification body
 * @param {string} [opts.link] - app-relative path, e.g. "/tasks/123"
 * @param {string} [opts.recipientName]
 * @returns {{ subject: string, text: string, html: string }}
 */
function buildNotificationEmail({ type, message, link, recipientName }) {
  const meta = TYPE_META[type] || DEFAULT_META;
  const url = link ? `${CLIENT_URL}${link.startsWith('/') ? link : `/${link}`}` : CLIENT_URL;
  const greetingName = recipientName ? escapeHtml(recipientName.split(' ')[0]) : 'there';

  const text = [`Hi ${recipientName ? recipientName.split(' ')[0] : 'there'},`, '', message, '', `Open Waypoint: ${url}`].join('\n');

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f1ea;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ea;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e1d6;">
            <tr>
              <td style="background-color:#1f2a37;padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.02em;">Waypoint</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 8px 28px;">
                <span style="display:inline-block;background-color:${meta.color}1a;color:${meta.color};font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;">${escapeHtml(meta.label)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 0 28px;">
                <p style="margin:0 0 4px 0;color:#1f2a37;font-size:15px;">Hi ${greetingName},</p>
                <p style="margin:0;color:#1f2a37;font-size:15px;line-height:1.5;">${escapeHtml(message)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 32px 28px;">
                <a href="${url}" style="display:inline-block;background-color:${meta.color};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;">Open in Waypoint</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 24px 28px;border-top:1px solid #ede9df;">
                <p style="margin:0;color:#8a8578;font-size:12px;">You're receiving this because email notifications are enabled on your Waypoint account. You can turn them off anytime in Settings &rarr; Notifications.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { subject: meta.subject, text, html };
}

module.exports = { buildNotificationEmail };
