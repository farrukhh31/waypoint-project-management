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
