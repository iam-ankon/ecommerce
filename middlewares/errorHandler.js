const notFound = (req, res, next) => {
  const error = new Error(`Not Found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "Error" : err.stack,
  });
};

module.exports = { notFound, errorHandler };
