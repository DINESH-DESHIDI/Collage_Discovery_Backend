// src/services/auth.service.js
// Business logic for user registration and login

const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { generateToken } = require("../utils/jwt");

/**
 * Register a new user.
 * Hashes the password, creates the user record, and returns a token.
 */
const registerUser = async ({ name, email, password }) => {
  // Check for existing account
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("An account with this email already exists.");
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const avatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundType=gradientLinear`;

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, avatar },
    select: { id: true, name: true, email: true, avatar: true, createdAt: true },
  });

  const token = generateToken(user.id);
  return { user, token };
};

/**
 * Authenticate an existing user with email + password.
 */
const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user.id);
  const { password: _, ...safeUser } = user;

  return { user: safeUser, token };
};

module.exports = { registerUser, loginUser };
