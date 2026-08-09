require('dotenv').config();

// Config consumed by the sequelize-cli binary only (migrations/seeders on the CLI side).
// The running app uses ./database.js directly — kept separate so the CLI's required
// shape (per-environment plain objects) doesn't constrain the app's own connection setup.

const usePostgres = process.env.DB_DIALECT === 'postgres';

const postgresConfig = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
  },
  logging: false,
};

const sqliteConfig = {
  dialect: 'sqlite',
  storage: require('path').join(__dirname, '..', '..', 'dev.db'),
  logging: false,
};

const base = usePostgres ? postgresConfig : sqliteConfig;

module.exports = {
  development: base,
  test: usePostgres
    ? { ...postgresConfig, use_env_variable: 'TEST_DATABASE_URL_OR_FALLBACK' }
    : { dialect: 'sqlite', storage: ':memory:', logging: false },
  production: postgresConfig,
};

// `test` falls back to DATABASE_URL if a dedicated TEST_DATABASE_URL isn't set.
if (!process.env.TEST_DATABASE_URL_OR_FALLBACK && process.env.DATABASE_URL) {
  process.env.TEST_DATABASE_URL_OR_FALLBACK = process.env.DATABASE_URL;
}
