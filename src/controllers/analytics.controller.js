const { recordEvent, getAnalyticsDashboard } = require("../services/analytics.service");
const { sendSuccess, sendError } = require("../utils/response");

const trackEvent = async (req, res, next) => {
  try {
    const { type, metadata } = req.body;
    if (!type) {
      return sendError(res, "Event type is required.", 400);
    }

    const event = await recordEvent({
      type,
      metadata,
      userId: req.user?.id,
    });

    return sendSuccess(res, event, "Analytics event recorded.", 201);
  } catch (err) {
    next(err);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const { state, course } = req.query;
    const result = await getAnalyticsDashboard({ state, course });
    return sendSuccess(res, result, "Analytics dashboard data returned.");
  } catch (err) {
    next(err);
  }
};

module.exports = { trackEvent, dashboard };
