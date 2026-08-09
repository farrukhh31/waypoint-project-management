const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Builds a safe Sequelize `order` array from user-supplied query params.
 * Never passes the raw column name through — it must be in `allowedFields`,
 * which closes off arbitrary-identifier / SQL-injection-via-order-by risk.
 */
function buildSort(sortBy, order, allowedFields, defaultField) {
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  const direction = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return [[field, direction]];
}

/** Case-insensitive partial match, using native ILIKE on Postgres and LIKE elsewhere. */
function containsInsensitive(value) {
  const op = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
  return { [op]: `%${value}%` };
}

/** Normalizes page/limit query params into safe integers with sane bounds. */
function paginationParams(page, limit, { maxLimit = 100, defaultLimit = 20 } = {}) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || defaultLimit, 1), maxLimit);
  return { page: pageNum, limit: limitNum, offset: (pageNum - 1) * limitNum };
}

function paginationMeta(page, limit, total) {
  return { page, limit, total, pages: Math.ceil(total / limit) || 1 };
}

module.exports = { buildSort, containsInsensitive, paginationParams, paginationMeta };
