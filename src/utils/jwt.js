// src/utils/jwt.js
// JWT token generation and verification helpers

const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "fallback_secret_change_in_prod";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate a signed JWT for a given user ID.
 * @param {string} userId
 * @returns {string} token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, SECRET, { expiresIn: EXPIRES_IN });
};

/**
 * Verify and decode a JWT.
 * @param {string} token
 * @returns {{ userId: string }} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = { generateToken, verifyToken };
