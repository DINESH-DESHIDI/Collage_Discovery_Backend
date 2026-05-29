// src/validators/review.validator.js
// Validation rules for submitting a review

const { body } = require("express-validator");

const reviewRules = [
  body("collegeId")
    .trim()
    .notEmpty()
    .withMessage("College ID is required."),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Review title is required.")
    .isLength({ max: 120 })
    .withMessage("Title must be under 120 characters."),

  body("body")
    .trim()
    .notEmpty()
    .withMessage("Review body is required.")
    .isLength({ min: 20 })
    .withMessage("Review must be at least 20 characters."),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required.")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5."),
];

module.exports = { reviewRules };
