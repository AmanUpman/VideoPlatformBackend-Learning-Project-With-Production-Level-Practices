// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     return await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    return await fn(req, res, next);
  } catch (error) {
    // PROBLEM:
    // In the original code, we used "error.code" to set the HTTP response status.
    // However, "error.code" is not always a number. Sometimes it can be a string.
    // For example:
    // - "ENOENT" means "Error NO ENTry" (file or resource not found).
    // - Other common codes: "ECONNREFUSED" (connection refused), etc.
    
    // Express.js expects a **numeric** status code (like 400, 500, etc.)
    // inside res.status(). If we pass a string (like "ENOENT"),
    // Express will throw a crash error: "ERR_HTTP_INVALID_STATUS_CODE".

    // SOLUTION:
    // - Use "error.statusCode" instead of "error.code".
    // - Check if "statusCode" is a valid number.
    // - If not, safely default to 500 (Internal Server Error).

    // This guarantees that the server never crashes even if the error is weird.
    const statusCode = typeof error.statusCode === "number" ? error.statusCode : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//ANOTHER METHORD
// const asyncHandler = (requestHandler) => {
//   return (req, res, next) => {
//     Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
//   }
// }

export { asyncHandler }

