// src/controllers/college.controller.js
// Handles HTTP layer for college listing, detail, search, and comparison

const {
  getColleges,
  getCollegeById,
  getCollegesForComparison,
} = require("../services/college.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

/**
 * GET /api/colleges
 * Query params: page, limit, search, state, type, minRating, minFees, maxFees, sort
 */
const listColleges = async (req, res, next) => {
  try {
    const { colleges, total, page, limit } = await getColleges(req.query);
    return sendPaginated(res, colleges, total, page, limit);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/colleges/search
 * Convenience alias — same logic as listColleges with search param
 */
const searchColleges = async (req, res, next) => {
  try {
    const { colleges, total, page, limit } = await getColleges(req.query);
    return sendPaginated(res, colleges, total, page, limit);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/colleges/compare
 * Query param: ids — comma-separated college IDs or slugs
 * Example: /api/colleges/compare?ids=iit-bombay,iit-delhi,bits-pilani
 */
const compareColleges = async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return sendError(res, "Provide college IDs as ?ids=id1,id2,id3", 400);
    }

    const idList = ids.split(",").map((id) => id.trim()).filter(Boolean).slice(0, 4);
    if (idList.length < 2) {
      return sendError(res, "Provide at least 2 college IDs to compare.", 400);
    }

    const colleges = await getCollegesForComparison(idList);
    return sendSuccess(res, colleges, "Comparison data fetched.");
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/colleges/:id
 * :id can be a slug (e.g. "iit-bombay") or a cuid
 */
const getCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const college = await getCollegeById(id);

    if (!college) {
      return sendError(res, "College not found.", 404);
    }

    return sendSuccess(res, college, "College fetched.");
  } catch (err) {
    next(err);
  }
};

module.exports = { listColleges, searchColleges, compareColleges, getCollege };
