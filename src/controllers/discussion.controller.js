const {
  getQuestions,
  getQuestionById,
  createQuestion,
  createAnswer,
  upvoteAnswer,
  getDiscussionOverview,
} = require("../services/discussion.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

const questions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "recent" } = req.query;
    const result = await getQuestions({ page: Number(page), limit: Number(limit), sort });
    return sendPaginated(res, result.questions, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

const questionDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await getQuestionById(id);
    if (!question) {
      return sendError(res, "Question not found.", 404);
    }
    return sendSuccess(res, question, "Question fetched.");
  } catch (err) {
    next(err);
  }
};

const askQuestion = async (req, res, next) => {
  try {
    const { title, body, tags, collegeId } = req.body;
    if (!title || !body) {
      return sendError(res, "Title and body are required.", 400);
    }

    const question = await createQuestion({
      title,
      body,
      tags,
      collegeId,
      userId: req.user?.id,
      userName: req.user?.name,
    });
    return sendSuccess(res, question, "Question posted.", 201);
  } catch (err) {
    next(err);
  }
};

const answerQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    if (!body) {
      return sendError(res, "Answer body is required.", 400);
    }
    const answer = await createAnswer(id, {
      body,
      userId: req.user?.id,
      userName: req.user?.name,
    });
    return sendSuccess(res, answer, "Answer submitted.", 201);
  } catch (err) {
    next(err);
  }
};

const voteAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const answer = await upvoteAnswer(id);
    return sendSuccess(res, answer, "Answer upvoted.");
  } catch (err) {
    next(err);
  }
};

const overview = async (req, res, next) => {
  try {
    const result = await getDiscussionOverview();
    return sendSuccess(res, result, "Discussion overview returned.");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  questions,
  questionDetail,
  askQuestion,
  answerQuestion,
  voteAnswer,
  overview,
};
