// src/routes/auth.routes.js

const express = require("express");
const router = express.Router();

const { signup, login, getProfile } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");
const { signupRules, loginRules } = require("../validators/auth.validator");
const validate = require("../middleware/validate");

// POST /api/auth/signup
router.post("/signup", signupRules, validate, signup);

// POST /api/auth/login
router.post("/login", loginRules, validate, login);

// GET /api/auth/profile  (protected)
router.get("/profile", requireAuth, getProfile);

module.exports = router;
