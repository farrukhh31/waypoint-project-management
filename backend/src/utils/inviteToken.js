const crypto = require('crypto');

// Invite links carry a high-entropy random token. We only ever persist its
// SHA-256 hash (same reasoning as not storing plaintext passwords) — a
// database read can't be turned into a working invite link.
function generateInviteToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

function hashInviteToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

module.exports = { generateInviteToken, hashInviteToken, INVITE_EXPIRY_MS };
