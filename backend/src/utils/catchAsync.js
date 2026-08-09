// Wraps an async controller/route handler so any thrown error or rejected
// promise is automatically forwarded to Express's error-handling middleware.
module.exports = function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
