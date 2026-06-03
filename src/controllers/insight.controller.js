const {
  getPredictedColleges,
  getSimilarColleges,
  getTrendingColleges,
  getRankingDetails,
} = require("../services/insight.service");
const { sendSuccess, sendError } = require("../utils/response");

const predictor = async (req, res, next) => {
  try {
    const { examType, rank, category } = req.query;
    const parsedRank = parseInt(rank, 10);
    if (!examType || Number.isNaN(parsedRank) || parsedRank <= 0) {
      return sendError(res, "examType and valid rank are required.", 400);
    }

    const result = await getPredictedColleges({ examType, rank: parsedRank, category });
    return sendSuccess(res, result, "Predicted colleges returned.");
  } catch (err) {
    next(err);
  }
};

const similarColleges = async (req, res, next) => {
  try {
    const { id } = req.params;
    const colleges = await getSimilarColleges(id);
    if (!colleges) {
      return sendError(res, "College not found.", 404);
    }
    return sendSuccess(res, colleges, "Similar colleges fetched.");
  } catch (err) {
    next(err);
  }
};

const trending = async (req, res, next) => {
  try {
    const { period } = req.query;
    const colleges = await getTrendingColleges(period);
    return sendSuccess(res, colleges, "Trending colleges fetched.");
  } catch (err) {
    next(err);
  }
};

const rankingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ranking = await getRankingDetails(id);
    if (!ranking) {
      return sendError(res, "College not found.", 404);
    }
    return sendSuccess(res, ranking, "Ranking details fetched.");
  } catch (err) {
    next(err);
  }
};

module.exports = { predictor, similarColleges, trending, rankingDetails };
