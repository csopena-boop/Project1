function errorHandler(err, req, res, _next) {
console.error(err);
const status = err.status || 500;
res.status(status).json({ message: err.publicMessage || 'Something went wrong' });
}


module.exports = { errorHandler };