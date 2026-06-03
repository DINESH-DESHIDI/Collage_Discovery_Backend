const express = require("express");
const router = express.Router();
const { trackEvent, dashboard } = require("../controllers/analytics.controller");
const { requireAuth } = require("../middleware/auth");

router.post("/events", requireAuth, trackEvent);
router.get("/dashboard", dashboard);

module.exports = router;
