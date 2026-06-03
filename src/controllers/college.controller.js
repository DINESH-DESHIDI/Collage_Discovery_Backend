const {
  getColleges,
  getCollegeById,
  getCollegesForComparison,
  predictColleges,
} = require("../services/college.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");


const listColleges = async (req, res, next) => {
  try {
    const { colleges, total, page, limit } = await getColleges(req.query);
    return sendPaginated(res, colleges, total, page, limit);
  } catch (err) {
    next(err);
  }
};


const searchColleges = async (req, res, next) => {
  try {
    const { colleges, total, page, limit } = await getColleges(req.query);
    return sendPaginated(res, colleges, total, page, limit);
  } catch (err) {
    next(err);
  }
};


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

const predictCollegesController = async (req, res, next) => {
  try {
    const { rank, category, examType } = req.query;
    if (!rank) {
      return sendError(res, "Rank parameter is required for prediction.", 400);
    }

    const results = await predictColleges({
      rank: Math.max(1, Number(rank) || 1),
      category: category || "",
      examType: examType || "EAMCET",
    });

    return sendSuccess(res, results, "Predictions generated successfully.");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listColleges,
  searchColleges,
  compareColleges,
  getCollege,
  predictColleges: predictCollegesController,
};
