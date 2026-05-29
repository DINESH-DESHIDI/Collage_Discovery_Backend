// src/middleware/auth.js
// JWT authentication middleware — protects routes that require a logged-in user

const { verifyToken } = require("../utils/jwt");
const prisma = require("../config/prisma");
const { sendError } = require("../utils/response");

/**
 * Middleware: require a valid Bearer token.
 * Attaches req.user on success.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authentication required. Please log in.", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!user) {
      return sendError(res, "User no longer exists.", 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, "Session expired. Please log in again.", 401);
    }
    return sendError(res, "Invalid authentication token.", 401);
  }
};

/**
 * Middleware: optionally attach user from token (no error if missing).
 * Useful for routes that behave differently for guests vs authenticated users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (user) req.user = user;
  } catch (_) {
    // silently ignore invalid tokens for optional auth
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
