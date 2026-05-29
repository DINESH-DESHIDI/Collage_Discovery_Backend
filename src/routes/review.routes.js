// src/routes/review.routes.js

const express = require("express");
const router = express.Router();

const { postReview, getReviews } = require("../controllers/review.controller");
const { requireAuth } = require("../middleware/auth");
const { reviewRules } = require("../validators/review.validator");
const validate = require("../middleware/validate");

// POST /api/reviews            — submit a review (auth required)
router.post("/", requireAuth, reviewRules, validate, postReview);

// GET  /api/reviews/:collegeId — fetch reviews for a college (public)
router.get("/:collegeId", getReviews);

module.exports = router;
