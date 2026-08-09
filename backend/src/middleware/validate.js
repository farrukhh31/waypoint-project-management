const ApiError = require('../utils/ApiError');

// Usage: validate({ body: zodSchema, params: zodSchema, query: zodSchema })
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      next();
    } catch (err) {
      const details = err.errors?.map((e) => ({ field: e.path.join('.'), message: e.message }));
      next(ApiError.badRequest('Validation failed', details || err.message));
    }
  };
}

module.exports = validate;
