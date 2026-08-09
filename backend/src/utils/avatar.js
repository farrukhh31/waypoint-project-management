// Deterministic placeholder avatar for seed/demo accounts. DiceBear's
// public API needs no key and always returns the same image for the same
// seed string, so re-running the seed gives every demo user a stable
// (but distinct) avatar instead of a broken image or random reshuffles.
function randomAvatarUrl(seed) {
  const encoded = encodeURIComponent(seed || Math.random().toString(36).slice(2));
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encoded}`;
}

module.exports = { randomAvatarUrl };