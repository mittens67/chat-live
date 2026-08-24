const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
const errorHandler = (err, req, res, next) => {
  //Any success status still set on the response is wrong for an error body,
  //not just 200 - a throw after res.status(201) would otherwise report success
  const statusCode = res.statusCode < 400 ? 500 : res.statusCode;

  //Mongoose validation and cast failures are client errors, not server errors
  const isClientError =
    err.name === "ValidationError" || err.name === "CastError";

  const finalStatus = statusCode === 500 && isClientError ? 400 : statusCode;

  //Without this a production 500 leaves no trace anywhere
  if (finalStatus >= 500) {
    console.error(err);
  }

  res.status(finalStatus);
  res.json({
    message: err.message,
    //Fail closed: only expose stacks when explicitly in development, so an
    //unset or misspelled NODE_ENV hides them rather than leaking them
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
