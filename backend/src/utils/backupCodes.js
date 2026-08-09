const bcrypt = require('bcryptjs');

// Checks `code` against a user's stored backup-code hashes. On a match, that
// code is removed (one-time use) and the user is saved. Returns whether it
// matched. Shared between disabling 2FA from Profile and the login-time
// verify-2fa step, so both accept a backup code the same way.
async function consumeBackupCode(user, code) {
  if (!code) return false;
  const hashes = user.twoFactorBackupCodes;
  for (let i = 0; i < hashes.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(code, hashes[i])) {
      const remaining = [...hashes];
      remaining.splice(i, 1);
      user.twoFactorBackupCodes = remaining;
      await user.save();
      return true;
    }
  }
  return false;
}

module.exports = { consumeBackupCode };
