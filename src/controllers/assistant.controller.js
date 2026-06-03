const { answerQuestion } = require("../services/assistant.service");
const { sendSuccess, sendError } = require("../utils/response");

const assistant = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== "string") {
      return sendError(res, "Please send a question to the assistant.", 400);
    }

    const result = await answerQuestion(question);
    return sendSuccess(res, result, "Assistant response generated.");
  } catch (err) {
    next(err);
  }
};

module.exports = { assistant };
