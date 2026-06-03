const express = require("express");
const router = express.Router();
const {
  predictor,
  similarColleges,
  trending,
  rankingDetails,
} = require("../controllers/insight.controller");

router.get("/predict", predictor);
router.get("/colleges/:id/similar", similarColleges);
router.get("/colleges/:id/rankings", rankingDetails);
router.get("/trending", trending);

module.exports = router;
