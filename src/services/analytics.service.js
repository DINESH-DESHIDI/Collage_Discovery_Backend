const prisma = require("../config/prisma");

const recordEvent = async ({ type, userId, metadata }) => {
  return prisma.analyticsEvent.create({
    data: {
      type,
      userId,
      metadata: metadata || {},
    },
  });
};

const buildTrendSeries = (colleges, filter = {}) => {
  const years = [2021, 2022, 2023, 2024, 2025];
  const series = years.map((year, index) => {
    const multiplier = 0.9 + index * 0.03;
    const selected = colleges.filter((college) => {
      if (filter.state && college.state !== filter.state) return false;
      if (filter.course && !(college.courses || []).some((course) => course.category === filter.course)) return false;
      return true;
    });

    const avgPackage = selected.reduce((sum, college) => sum + (college.placement?.averagePackage || 0) * multiplier, 0) / Math.max(1, selected.length);
    const highestPackage = selected.reduce((sum, college) => sum + (college.placement?.highestPackage || 0) * multiplier, 0) / Math.max(1, selected.length);
    const placementRate = selected.reduce((sum, college) => sum + (college.placement?.placementRate || 0), 0) / Math.max(1, selected.length);
    const companyVisits = selected.flatMap((college) => college.placement?.topRecruiters || []);

    return {
      year: String(year),
      averagePackage: Math.round(avgPackage),
      highestPackage: Math.round(highestPackage),
      placementRate: Number(placementRate.toFixed(1)),
      companyVisitCount: companyVisits.length,
    };
  });

  return series;
};

const getAnalyticsDashboard = async ({ state, course }) => {
  const colleges = await prisma.college.findMany({
    include: { placement: true, courses: true },
  });

  const filtered = colleges.filter((college) => {
    if (state && college.state !== state) return false;
    if (course && !(college.courses || []).some((c) => c.category === course)) return false;
    return true;
  });

  const trends = buildTrendSeries(filtered, { state, course });
  const popularity = filtered
    .map((college) => ({
      id: college.id,
      name: college.name,
      views: college.views || 0,
      saves: college.saves || 0,
      comparisons: college.comparisons || 0,
      reviews: college.reviewsCount || 0,
      score: (college.views || 0) * 0.4 + (college.saves || 0) * 0.3 + (college.comparisons || 0) * 0.2 + (college.reviewsCount || 0) * 0.1,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return {
    trends,
    topTrendingColleges: popularity,
    filters: {
      state: state || null,
      course: course || null,
    },
  };
};

module.exports = { recordEvent, getAnalyticsDashboard };
