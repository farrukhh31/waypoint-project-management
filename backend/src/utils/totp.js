const crypto = require('crypto');

// Hand-rolled TOTP (RFC 6238) / base32 (RFC 4648) so two-factor auth doesn't
// need a third-party package like `speakeasy` or `otplib` — everything here
// is Node's built-in crypto plus plain bit-twiddling. Compatible with Google
// Authenticator, Authy, 1Password, etc. (SHA1, 6 digits, 30s step — the
// universal default those apps assume when no other params are given).

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');

  let output = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder) {
    const lastChunk = bits.slice(bits.length - remainder).padEnd(5, '0');
    output += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return output;
}

function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// Generates a fresh base32 shared secret (20 bytes = 160 bits, the standard
// TOTP secret size — matches what Google Authenticator etc. expect).
function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

// HOTP (RFC 4226) — the counter-based primitive TOTP is built on.
function hotp(secretBuffer, counter, digits = 6) {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secretBuffer).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binCode % 10 ** digits).padStart(digits, '0');
}

function generateTOTP(base32Secret, { step = 30, digits = 6, forTime = Date.now() } = {}) {
  const counter = Math.floor(forTime / 1000 / step);
  return hotp(base32Decode(base32Secret), counter, digits);
}

// Accepts the current code plus one step on either side, so a slightly
// slow/fast phone clock (or the second it takes to type the code) doesn't
// spuriously fail a correct entry.
function verifyTOTP(token, base32Secret, { step = 30, digits = 6, window = 1 } = {}) {
  if (!/^\d{6}$/.test(String(token || ''))) return false;
  const counter = Math.floor(Date.now() / 1000 / step);
  const secretBuffer = base32Decode(base32Secret);

  for (let drift = -window; drift <= window; drift++) {
    const candidate = hotp(secretBuffer, counter + drift, digits);
    if (crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(String(token)))) return true;
  }
  return false;
}

// Standard otpauth:// URI — authenticator apps that support "enter setup key
// manually" also accept pasting/scanning this as raw text in some clients,
// and it documents the exact parameters we're using either way.
function buildOtpAuthUri({ secret, accountName, issuer = 'Waypoint' }) {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${label}?${params.toString()}`;
}

module.exports = { generateSecret, generateTOTP, verifyTOTP, buildOtpAuthUri, base32Encode, base32Decode };
