const express = require("express");
const router = express.Router();
const {
  questions,
  questionDetail,
  askQuestion,
  answerQuestion,
  voteAnswer,
  overview,
} = require("../controllers/discussion.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/overview", overview);
router.get("/", questions);
router.get("/:id", questionDetail);
router.post("/", requireAuth, askQuestion);
router.post("/:id/answers", requireAuth, answerQuestion);
router.patch("/answers/:id/upvote", requireAuth, voteAnswer);

module.exports = router;
