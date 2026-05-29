// src/routes/college.routes.js

const express = require("express");
const router = express.Router();

const {
  listColleges,
  searchColleges,
  compareColleges,
  getCollege,
} = require("../controllers/college.controller");

// GET /api/colleges          — paginated list with filters
router.get("/", listColleges);

// GET /api/colleges/search   — search alias (must be before /:id)
router.get("/search", searchColleges);

// GET /api/colleges/compare  — comparison endpoint
router.get("/compare", compareColleges);

// GET /api/colleges/:id      — single college by slug or id
router.get("/:id", getCollege);

module.exports = router;
