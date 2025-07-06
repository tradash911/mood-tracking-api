export function errorDev(error, res) {
  res.status(error.statusCode).json({
    status: error.statusCode,
    error,
    message: error.message,
    stack: error.stack,
  });
}
export function errorProd(error, res) {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.message,
    });
  } else {
    /* console.error("ERROR", error); */
    res.status(500).json({
      status: "error",
      message: error,
    });
  }
}
