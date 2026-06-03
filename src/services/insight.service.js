const prisma = require("../config/prisma");

const normalizeRating = (rating) => Math.max(0, Math.min(5, rating || 0));

const computePopularityScore = (college) => {
  return Number(
    (
      (college.views || 0) * 0.4 +
      (college.saves || 0) * 0.3 +
      (college.comparisons || 0) * 0.2 +
      (college.reviewsCount || 0) * 0.1
    ).toFixed(1)
  );
};

const computeRankingScore = (college) => {
  const placementRate = college.placement?.placementRate || 0;
  const averagePackage = (college.placement?.averagePackage || 0) / 100000;
  const highestPackage = (college.placement?.highestPackage || 0) / 100000;
  const popularity = computePopularityScore(college);

  return Number(
    (
      placementRate * 0.18 +
      averagePackage * 0.2 +
      highestPackage * 0.12 +
      normalizeRating(college.rating) * 4 +
      Math.min(college.reviewsCount || 0, 500) * 0.04 +
      popularity * 0.12 +
      (college.saves || 0) * 0.05 +
      (college.discussionCount || 0) * 0.05
    ).toFixed(1)
  );
};

const getRankingSets = (colleges) => {
  const scored = colleges.map((college) => ({
    ...college,
    popularityScore: computePopularityScore(college),
    rankingScore: computeRankingScore(college),
    courseCategories: Array.from(new Set((college.courses || []).map((course) => course.category))),
  }));

  const overall = [...scored].sort((a, b) => b.rankingScore - a.rankingScore);

  const byState = scored.reduce((groups, college) => {
    const key = college.state || "Unknown";
    groups[key] = groups[key] || [];
    groups[key].push(college);
    return groups;
  }, {});

  const byCourse = scored.reduce((groups, college) => {
    college.courseCategories.forEach((category) => {
      groups[category] = groups[category] || [];
      groups[category].push(college);
    });
    return groups;
  }, {});

  Object.keys(byState).forEach((key) => {
    byState[key].sort((a, b) => b.rankingScore - a.rankingScore);
  });

  Object.keys(byCourse).forEach((key) => {
    byCourse[key].sort((a, b) => b.rankingScore - a.rankingScore);
  });

  return { overall, byState, byCourse };
};

const attachRankingMetadata = (college, rankingSets) => {
  const overallRank = rankingSets.overall.findIndex((item) => item.id === college.id) + 1;
  const stateRank = rankingSets.byState[college.state]?.findIndex((item) => item.id === college.id) + 1 || null;
  const courseRank = college.courseCategories
    ? college.courseCategories.map((category) => ({
        category,
        rank: rankingSets.byCourse[category].findIndex((item) => item.id === college.id) + 1,
      }))
    : [];

  return {
    ...college,
    overallRank,
    stateRank,
    courseRank,
    popularityScore: computePopularityScore(college),
    rankingScore: computeRankingScore(college),
  };
};

const getAllCollegesWithDetails = async () => {
  return prisma.college.findMany({
    include: {
      placement: true,
      courses: true,
    },
  });
};

const getCollegeByIdWithDetails = async (idOrSlug) => {
  return prisma.college.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      placement: true,
      courses: true,
    },
  });
};

const getSimilarColleges = async (idOrSlug, limit = 5) => {
  const college = await getCollegeByIdWithDetails(idOrSlug);
  if (!college) return null;

  const candidates = await prisma.college.findMany({
    where: { id: { not: college.id } },
    include: { placement: true, courses: true },
  });

  const targetCategories = new Set((college.courses || []).map((course) => course.category));
  const baseFeeRange = college.feesMax - college.feesMin;

  const scored = candidates.map((item) => {
    let score = 0;
    if (item.city === college.city) score += 35;
    else if (item.state === college.state) score += 18;

    const feeOverlap = Math.max(
      0,
      Math.min(college.feesMax, item.feesMax) - Math.max(college.feesMin, item.feesMin)
    );
    const feeCoverage = feeOverlap / Math.max(1, Math.max(baseFeeRange, item.feesMax - item.feesMin));
    score += feeCoverage * 28;

    score += Math.max(0, 10 - Math.abs((college.rating || 0) - (item.rating || 0))) * 2;

    if (college.placement && item.placement) {
      score += Math.max(0, 14 - Math.abs((college.placement.placementRate || 0) - (item.placement.placementRate || 0))) * 0.8;
      score += Math.max(0, 12 - Math.abs((college.placement.averagePackage || 0) - (item.placement.averagePackage || 0)) / 200000) * 0.7;
    }

    const commonCourseCount = item.courses.filter((course) => targetCategories.has(course.category)).length;
    score += commonCourseCount * 6;

    const sharedTags = new Set(item.courses.map((course) => course.name)).size;
    score += sharedTags * 0.2;

    return { ...item, similarityScore: Number(score.toFixed(1)) };
  });

  return scored.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit);
};

const getTrendingColleges = async (period = "week", limit = 10) => {
  const colleges = await getAllCollegesWithDetails();
  const scored = colleges.map((college) => ({
    ...college,
    popularityScore: computePopularityScore(college),
    trendingScore: Number(
      (
        (college.views || 0) * 0.4 +
        (college.saves || 0) * 0.3 +
        (college.comparisons || 0) * 0.2 +
        (college.reviewsCount || 0) * 0.1
      ).toFixed(1)
    ),
  }));

  return scored.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, limit);
};

const getRankingDetails = async (idOrSlug) => {
  const colleges = await getAllCollegesWithDetails();
  const rankingSets = getRankingSets(colleges);
  const target = await getCollegeByIdWithDetails(idOrSlug);
  if (!target) return null;

  const enriched = attachRankingMetadata({
    ...target,
    courseCategories: Array.from(new Set((target.courses || []).map((course) => course.category))),
  }, rankingSets);

  return {
    ...enriched,
    bestCourse: target.courses?.[0]?.name || "Recommended program",
    overallRankLabel: `#${enriched.overallRank} Best College`,
    stateRankLabel: enriched.stateRank ? `#${enriched.stateRank} Best in ${target.state}` : null,
    courseRank: enriched.courseRank,
  };
};

const examCutoffRatio = {
  EAMCET: 1.0,
  "JEE Main": 0.9,
  "JEE Advanced": 0.7,
};

const getPredictedColleges = async ({ examType, rank, category }) => {
  const effectiveExam = examType && examType.trim() ? examType.trim() : "EAMCET";
  const ratio = examCutoffRatio[effectiveExam] || 0.85;
  const colleges = await getAllCollegesWithDetails();

  const scored = colleges.map((college) => {
    const cutoff = college.cutoffRank || Math.max(1500, college.ranking * 900);
    const rankGap = rank - cutoff;
    const chanceMultiplier = rankGap <= 0 ? 1 : rankGap <= cutoff * 0.15 ? 0.75 : rankGap <= cutoff * 0.35 ? 0.5 : 0.25;
    const placementBonus = (college.placement?.placementRate || 0) * 0.6 + ((college.placement?.averagePackage || 0) / 100000) * 1.2;
    const ratingBonus = (college.rating || 0) * 6;
    const categoryReduction = category
      ? college.courses.some((course) => course.category.toLowerCase() === category.toLowerCase())
        ? 1
        : 0.85
      : 1;
    const score = Math.max(0, 100 - Math.max(0, rankGap) / 20 + placementBonus + ratingBonus) * categoryReduction;
    const expectedCourse = category
      ? college.courses.find((course) => course.category.toLowerCase() === category.toLowerCase())?.name
      : college.courses?.[0]?.name;

    const chance = rankGap <= cutoff * 0.05 ? "High" : rankGap <= cutoff * 0.2 ? "Medium" : "Low";

    return {
      id: college.id,
      slug: college.slug,
      name: college.name,
      shortName: college.shortName,
      state: college.state,
      city: college.city,
      rating: college.rating,
      placementRate: college.placement?.placementRate || 0,
      averagePackage: college.placement?.averagePackage || 0,
      highestPackage: college.placement?.highestPackage || 0,
      feesMin: college.feesMin,
      feesMax: college.feesMax,
      chance,
      expectedBranch: expectedCourse || "Top program",
      score: Number(score.toFixed(1)),
    };
  });

  const filtered = scored
    .filter((college) => !category || college.name.toLowerCase().includes(category.toLowerCase()) || college.expectedBranch.toLowerCase().includes(category.toLowerCase()))
    .sort((a, b) => b.score - a.score);

  return filtered.slice(0, 10);
};

module.exports = {
  getSimilarColleges,
  getTrendingColleges,
  getRankingDetails,
  getPredictedColleges,
  computePopularityScore,
  computeRankingScore,
};
