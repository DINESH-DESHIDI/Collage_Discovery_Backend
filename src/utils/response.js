// src/utils/response.js
// Standardized API response helpers for consistent JSON output

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {*} data - Payload to send
 * @param {string} [message] - Optional success message
 * @param {number} [statusCode=200] - HTTP status code
 */
const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message - Error description
 * @param {number} [statusCode=500] - HTTP status code
 * @param {*} [errors] - Optional field-level errors
 */
const sendError = (res, message = "Something went wrong", statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * Send a paginated response.
 */
const sendPaginated = (res, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
