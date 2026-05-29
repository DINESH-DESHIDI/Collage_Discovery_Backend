// src/controllers/auth.controller.js
// Handles HTTP layer for signup, login, and profile

const { registerUser, loginUser } = require("../services/auth.service");
const { sendSuccess, sendError } = require("../utils/response");

/**
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser({ name, email, password });
    return sendSuccess(res, result, "Account created successfully.", 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    return sendSuccess(res, result, "Logged in successfully.");
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/profile
 * Returns the authenticated user's profile (token required).
 */
const getProfile = async (req, res) => {
  return sendSuccess(res, req.user, "Profile fetched.");
};

module.exports = { signup, login, getProfile };
