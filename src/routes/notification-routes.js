const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/notification-controller");

const router = express.Router();

router.use(requireAuth);
router.get("/", asyncHandler(ctrl.listNotifications));
router.patch("/:id/read", asyncHandler(ctrl.markRead));
router.patch("/mark-all-read", asyncHandler(ctrl.markAllRead));

module.exports = router;
