// Fails fast at boot if required configuration is missing or looks unsafe, instead of
// letting the app start and produce confusing errors (or silent security holes) later.
const REQUIRED = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const INSECURE_DEFAULTS = new Set([
  'dev_access_secret_change_in_production_9f8a7d6c',
  'dev_refresh_secret_change_in_production_1b2c3d4e',
]);

module.exports = function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key] || !process.env[key].trim());
  if (missing.length) {
    console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
    process.exit(1);
  }

  for (const key of REQUIRED) {
    if (process.env[key].length < 16) {
      console.error(`${key} is too short to be a safe signing secret (need 16+ chars).`);
      process.exit(1);
    }
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const usingInsecureDefault = REQUIRED.some((key) => INSECURE_DEFAULTS.has(process.env[key]));
    if (usingInsecureDefault) {
      console.error(
        'Refusing to start in production with the sample dev JWT secrets. Set real JWT_ACCESS_SECRET / JWT_REFRESH_SECRET values.'
      );
      process.exit(1);
    }
    if (process.env.DB_DIALECT !== 'postgres') {
      console.error('Refusing to start in production on SQLite. Set DB_DIALECT=postgres and DATABASE_URL.');
      process.exit(1);
    }
    if (!process.env.CLIENT_URL) {
      console.warn('CLIENT_URL is not set — CORS will fall back to http://localhost:5173.');
    }
  }
};
