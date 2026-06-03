const express = require("express");
const router = express.Router();
const { assistant } = require("../controllers/assistant.controller");

router.post("/", assistant);

module.exports = router;
