// src/middleware/errorHandler.js
// Global error handler — catches anything thrown or passed to next(err)

const { sendError } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Prisma-specific errors
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return sendError(res, `A record with this ${field} already exists.`, 409);
  }

  if (err.code === "P2025") {
    return sendError(res, "Record not found.", 404);
  }

  if (err.code === "P2003") {
    return sendError(res, "Related record not found.", 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token.", 401);
  }

  if (err.name === "TokenExpiredError") {
    return sendError(res, "Token expired.", 401);
  }

  // Validation errors (express-validator)
  if (err.type === "validation") {
    return sendError(res, "Validation failed.", 422, err.errors);
  }

  // Syntax errors in request body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(res, "Invalid JSON in request body.", 400);
  }

  // Default server error
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode < 500 ? err.message : "Internal server error.";
  return sendError(res, message, statusCode);
};

module.exports = errorHandler;
