const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/review-controller");

const router = express.Router();

router.get("/", asyncHandler(ctrl.listReviews));
router.post("/", requireAuth, asyncHandler(ctrl.createReview));
router.post("/:id/helpful", asyncHandler(ctrl.markHelpful));
router.patch("/:id/status", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.updateReviewStatus));
router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.deleteReview));

module.exports = router;
