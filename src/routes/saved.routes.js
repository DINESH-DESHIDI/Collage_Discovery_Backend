// src/routes/saved.routes.js

const express = require("express");
const router = express.Router();

const { save, getSaved, removeSaved } = require("../controllers/saved.controller");
const { requireAuth } = require("../middleware/auth");

// All saved routes require authentication
router.use(requireAuth);

// POST /api/saved       — save a college
router.post("/", save);

// GET  /api/saved       — get all saved colleges for logged-in user
router.get("/", getSaved);

// DELETE /api/saved/:id — remove a saved college by record ID
router.delete("/:id", removeSaved);

module.exports = router;
