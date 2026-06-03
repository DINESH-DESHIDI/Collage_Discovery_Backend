const prisma = require("../config/prisma");

const getQuestions = async ({ page = 1, limit = 10, sort = "recent" }) => {
  const skip = (page - 1) * limit;
  const orderBy = sort === "active" ? { answers: { _count: "desc" } } : { createdAt: "desc" };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      skip,
      take: limit,
      orderBy,
      include: {
        answers: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    }),
    prisma.question.count(),
  ]);

  return { questions, total, page, limit };
};

const getQuestionById = async (id) => {
  return prisma.question.findUnique({
    where: { id },
    include: {
      answers: {
        orderBy: { upvotes: "desc" },
      },
    },
  });
};

const createQuestion = async ({ title, body, tags, userId, userName, collegeId }) => {
  const question = await prisma.question.create({
    data: {
      title,
      body,
      tags: tags || [],
      authorName: userName || "Anonymous",
      authorId: userId,
      collegeId,
    },
  });

  if (collegeId) {
    await prisma.college.update({
      where: { id: collegeId },
      data: { discussionCount: { increment: 1 } },
    });
  }

  return question;
};

const createAnswer = async (questionId, { body, userId, userName }) => {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    const err = new Error("Question not found.");
    err.statusCode = 404;
    throw err;
  }

  return prisma.answer.create({
    data: {
      body,
      authorName: userName || "Anonymous",
      authorId: userId,
      questionId,
    },
  });
};

const upvoteAnswer = async (answerId) => {
  const answer = await prisma.answer.update({
    where: { id: answerId },
    data: { upvotes: { increment: 1 } },
  });
  return answer;
};

const getDiscussionOverview = async () => {
  const topQuestions = await prisma.question.findMany({
    orderBy: { answers: { _count: "desc" } },
    take: 5,
    include: { answers: true },
  });

  const recentQuestions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { answers: true },
  });

  const contributors = await prisma.answer.groupBy({
    by: ["authorName"],
    _count: { _all: true },
    orderBy: { _count: { _all: "desc" } },
    take: 5,
  });

  return {
    topQuestions,
    recentQuestions,
    topContributors: contributors.map((item) => ({
      username: item.authorName || "Anonymous",
      contributions: item._count._all,
    })),
  };
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  createAnswer,
  upvoteAnswer,
  getDiscussionOverview,
};
