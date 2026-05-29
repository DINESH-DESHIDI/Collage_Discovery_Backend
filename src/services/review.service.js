// src/services/review.service.js
// Business logic for college reviews

const prisma = require("../config/prisma");

/**
 * Create a new review and update the college's rating + reviewsCount.
 */
const createReview = async (userId, userName, { collegeId, title, body, rating }) => {
  // Resolve slug → id if needed
  const college = await prisma.college.findFirst({
    where: { OR: [{ id: collegeId }, { slug: collegeId }] },
    select: { id: true },
  });

  if (!college) {
    const err = new Error("College not found.");
    err.statusCode = 404;
    throw err;
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      title,
      body,
      rating: parseFloat(rating),
      author: userName,
      collegeId: college.id,
      userId,
    },
  });

  // Recalculate college average rating
  const aggregate = await prisma.review.aggregate({
    where: { collegeId: college.id },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.college.update({
    where: { id: college.id },
    data: {
      rating: Math.round((aggregate._avg.rating || rating) * 10) / 10,
      reviewsCount: aggregate._count,
    },
  });

  return review;
};

/**
 * Get paginated reviews for a specific college.
 */
const getCollegeReviews = async (collegeId, page = 1, limit = 10) => {
  const college = await prisma.college.findFirst({
    where: { OR: [{ id: collegeId }, { slug: collegeId }] },
    select: { id: true },
  });

  if (!college) {
    const err = new Error("College not found.");
    err.statusCode = 404;
    throw err;
  }

  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { collegeId: college.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { collegeId: college.id } }),
  ]);

  return { reviews, total, page, limit };
};

module.exports = { createReview, getCollegeReviews };
