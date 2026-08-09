// bcrypt cost factor. 12 is a reasonable modern default (10 is bcrypt's old default and
// is now considered light); raise further only if your infra can absorb the added
// hashing latency on every login/register/password-change request.
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

module.exports = { BCRYPT_SALT_ROUNDS };
