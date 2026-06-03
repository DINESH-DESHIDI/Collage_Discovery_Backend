// src/services/college.service.js
// All college query logic — search, filter, pagination, and individual lookups

const prisma = require("../config/prisma");

// Full set of relations to include when returning a college
const COLLEGE_INCLUDE = {
  placement: true,
  courses: true,
  reviews: {
    orderBy: { createdAt: "desc" },
    take: 20,
  },
};

/**
 * Build a dynamic Prisma `where` clause from query params.
 */
const buildWhereClause = ({ search, state, type, minRating, minFees, maxFees }) => {
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortName: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { state: { contains: search, mode: "insensitive" } },
    ];
  }

  if (state) {
    where.state = { contains: state, mode: "insensitive" };
  }

  if (type) {
    where.type = { contains: type, mode: "insensitive" };
  }

  if (minRating) {
    where.rating = { gte: parseFloat(minRating) };
  }

  if (minFees || maxFees) {
    where.feesMin = {};
    if (minFees) where.feesMin.gte = parseInt(minFees, 10);
    if (maxFees) where.feesMax = { lte: parseInt(maxFees, 10) };
  }

  return where;
};

/**
 * Build a Prisma `orderBy` clause from query params.
 */
const buildOrderBy = (sort) => {
  const map = {
    ranking: { ranking: "asc" },
    rating: { rating: "desc" },
    feesAsc: { feesMin: "asc" },
    feesDesc: { feesMin: "desc" },
    newest: { established: "desc" },
  };
  return map[sort] || { ranking: "asc" };
};

/**
 * Get paginated list of colleges with optional filters.
 */
const getColleges = async (query) => {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || "10", 10)));
  const skip = (page - 1) * limit;

  const where = buildWhereClause(query);
  const orderBy = buildOrderBy(query.sort);

  const [colleges, total] = await Promise.all([
    prisma.college.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { placement: true },
    }),
    prisma.college.count({ where }),
  ]);

  return { colleges, total, page, limit };
};

/**
 * Get a single college by its slug or cuid.
 * Returns null if not found (no throw — handled in controller).
 */
const getCollegeById = async (idOrSlug) => {
  // Try slug first (human-readable URLs), fall back to cuid
  const college = await prisma.college.findFirst({
    where: {
      OR: [{ slug: idOrSlug }, { id: idOrSlug }],
    },
    include: COLLEGE_INCLUDE,
  });

  return college;
};

/**
 * Get multiple colleges by their IDs/slugs — used for comparison.
 */
const getCollegesForComparison = async (ids) => {
  if (!ids || ids.length === 0) return [];

  const colleges = await prisma.college.findMany({
    where: {
      OR: ids.map((id) => ({ id })).concat(ids.map((id) => ({ slug: id }))),
    },
    include: COLLEGE_INCLUDE,
  });

  return colleges;
};

/**
 * Predict colleges based on rank, category, and exam type
 */
const predictColleges = async ({ rank, category, examType }) => {
  const colleges = await prisma.college.findMany({
    include: {
      placement: true,
      courses: true,
    },
  });

  const getChanceLabel = (score) => {
    if (score >= 85) return "High";
    if (score >= 65) return "Medium";
    return "Low";
  };

  const results = colleges.map((college) => {
    const cutoff = college.cutoffRank || Math.max(1200, college.ranking * 800);
    const rankDiff = rank - cutoff;
    let rankFactor = 0;
    if (rankDiff <= 0) {
      rankFactor = 100 - Math.min(50, Math.abs(rankDiff) / 100);
    } else {
      rankFactor = Math.max(0, 100 - rankDiff / 50);
    }

    const ratingFactor = (college.rating || 0) * 7;
    const placementFactor = ((college.placement?.placementRate || 0) / 100) * 30;

    const hasCategoryCourse = category
      ? college.courses.some((c) => c.category.toLowerCase() === category.toLowerCase())
      : false;

    const categoryBonus = category ? (hasCategoryCourse ? 12 : 0) : 8;
    const examBonus = examType === "JEE Advanced" ? 5 : examType === "JEE Main" ? 3 : 0;

    const rawScore = rankFactor + ratingFactor + placementFactor + categoryBonus + examBonus;
    const score = Math.min(100, Math.max(0, rawScore));

    let expectedBranch = "Top program";
    if (category && hasCategoryCourse) {
      const match = college.courses.find((c) => c.category.toLowerCase() === category.toLowerCase());
      if (match) expectedBranch = match.name;
    } else if (college.courses && college.courses.length > 0) {
      expectedBranch = college.courses[0].name;
    }

    return {
      id: college.id,
      slug: college.slug,
      name: college.name,
      shortName: college.shortName,
      city: college.city,
      state: college.state,
      logo: college.logo,
      rating: college.rating,
      feesMin: college.feesMin,
      feesMax: college.feesMax,
      ranking: college.ranking,
      type: college.type,
      placement: college.placement,
      score,
      chance: getChanceLabel(score),
      expectedBranch,
    };
  });

  return results.sort((a, b) => b.score - a.score);
};

module.exports = { getColleges, getCollegeById, getCollegesForComparison, predictColleges };
