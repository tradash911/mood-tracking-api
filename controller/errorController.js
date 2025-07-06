import AppError from "../utils/appError.js";
import { errorDev, errorProd } from "../utils/errorTypes.js";

/*global process, a*/
function handleCastError(error) {
  const message = `Invalid ${error.path} : ${error.value}`;
  return new AppError(message, 400);
}

function handleDuplicateFields(error) {
  const keyValue = error.keyValue || error?.cause?.keyValue;
  const field = Object.keys(keyValue)[0];
  const value = keyValue[field];
  const message = `The ${field} ${value} is already taken.`;

  return new AppError(message, 400);
}
function handleValidationError(error) {
  const message = error.message;
  return new AppError(message, 400);
}
function handleJWTError(error) {
  return new AppError("Please log in again!", 401);
}
function handleTokenExpiredError(error) {
  return new AppError("Your session expired!", 401);
}
export function globalErrorHandler(error, req, res, next) {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  let err = Object.create(error);

  if (process.env.NODE_ENV === "development") {
    errorDev(error, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.name === "CastError") err = handleCastError(err);
    if ((err.code || err?.cause?.code) === 11000) {
      err = handleDuplicateFields(err);
    }
    if (err.name === "ValidationError") err = handleValidationError(err);
    if (err.name === "JsonWebTokenError") err = handleJWTError(err);
    if (err.name === "TokenExpiredError") err = handleTokenExpiredError(err);
    errorProd(err, res);
  }
}
