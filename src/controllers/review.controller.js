// src/controllers/review.controller.js
// Handles HTTP layer for college reviews

const { createReview, getCollegeReviews } = require("../services/review.service");
const { sendSuccess, sendPaginated } = require("../utils/response");

/**
 * POST /api/reviews
 * Body: { collegeId, title, body, rating }
 */
const postReview = async (req, res, next) => {
  try {
    const { collegeId, title, body, rating } = req.body;

    const review = await createReview(
      req.user.id,
      req.user.name,
      { collegeId, title, body, rating }
    );

    return sendSuccess(res, review, "Review submitted successfully.", 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reviews/:collegeId
 * Query params: page, limit
 */
const getReviews = async (req, res, next) => {
  try {
    const { collegeId } = req.params;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10", 10)));

    const { reviews, total } = await getCollegeReviews(collegeId, page, limit);
    return sendPaginated(res, reviews, total, page, limit);
  } catch (err) {
    next(err);
  }
};

module.exports = { postReview, getReviews };
