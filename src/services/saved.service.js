// src/services/saved.service.js
// Business logic for saving and un-saving colleges per user

const prisma = require("../config/prisma");

/**
 * Save a college for a user.
 * Returns the new saved record, or the existing one if already saved.
 */
const saveCollege = async (userId, collegeId) => {
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

  const existing = await prisma.savedCollege.findUnique({
    where: { userId_collegeId: { userId, collegeId: college.id } },
  });

  if (existing) return existing;

  return prisma.savedCollege.create({
    data: { userId, collegeId: college.id },
    include: { college: { include: { placement: true } } },
  });
};

/**
 * Get all colleges saved by a user.
 */
const getSavedColleges = async (userId) => {
  const saved = await prisma.savedCollege.findMany({
    where: { userId },
    orderBy: { savedAt: "desc" },
    include: {
      college: {
        include: { placement: true },
      },
    },
  });

  return saved.map((s) => ({ ...s.college, savedAt: s.savedAt, savedId: s.id }));
};

/**
 * Remove a saved college by its SavedCollege record ID.
 */
const unsaveCollege = async (userId, savedId) => {
  const record = await prisma.savedCollege.findUnique({ where: { id: savedId } });

  if (!record) {
    const err = new Error("Saved record not found.");
    err.statusCode = 404;
    throw err;
  }

  if (record.userId !== userId) {
    const err = new Error("You can only remove your own saved colleges.");
    err.statusCode = 403;
    throw err;
  }

  await prisma.savedCollege.delete({ where: { id: savedId } });
  return true;
};

module.exports = { saveCollege, getSavedColleges, unsaveCollege };
