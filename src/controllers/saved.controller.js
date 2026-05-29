// src/controllers/saved.controller.js
// Handles HTTP layer for saving/un-saving colleges

const { saveCollege, getSavedColleges, unsaveCollege } = require("../services/saved.service");
const { sendSuccess, sendError } = require("../utils/response");

/**
 * POST /api/saved
 * Body: { collegeId }
 */
const save = async (req, res, next) => {
  try {
    const { collegeId } = req.body;

    if (!collegeId) {
      return sendError(res, "collegeId is required.", 400);
    }

    const record = await saveCollege(req.user.id, collegeId);
    return sendSuccess(res, record, "College saved to your list.", 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/saved
 */
const getSaved = async (req, res, next) => {
  try {
    const colleges = await getSavedColleges(req.user.id);
    return sendSuccess(res, colleges, "Saved colleges fetched.");
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/saved/:id
 * :id is the SavedCollege record ID
 */
const removeSaved = async (req, res, next) => {
  try {
    const { id } = req.params;
    await unsaveCollege(req.user.id, id);
    return sendSuccess(res, null, "College removed from your saved list.");
  } catch (err) {
    next(err);
  }
};

module.exports = { save, getSaved, removeSaved };
