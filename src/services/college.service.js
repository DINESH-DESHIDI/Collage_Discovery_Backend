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

module.exports = { getColleges, getCollegeById, getCollegesForComparison };
