const { Sequelize } = require('sequelize');
const path = require('path');

// Dev: SQLite (zero external setup).
// Production: set DB_DIALECT=postgres + DATABASE_URL and install `pg`.
// Sequelize's model code below does not need to change between dialects.

let sequelize;

if (process.env.DB_DIALECT === 'postgres') {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
      // Neon's serverless compute can suspend or drop idle connections at
      // any time. Without keepAlive, that shows up as an uncaught
      // 'Connection terminated unexpectedly' error that crashes the whole
      // process instead of just recycling the pooled connection.
      keepAlive: true,
    },
    pool: {
      max: 5,
      min: 0,
      // Recycle connections *before* Neon's own idle timeout can kill them
      // out from under Sequelize — this is what actually prevents the crash,
      // not just keepAlive alone.
      idle: 10000,
      acquire: 30000,
      evict: 10000,
    },
    retry: {
      max: 3,
      match: [/ConnectionError/, /ConnectionRefusedError/, /ConnectionTimedOutError/, /TimeoutError/],
    },
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', '..', 'dev.db'),
    logging: false,
  });
}

module.exports = sequelize;
