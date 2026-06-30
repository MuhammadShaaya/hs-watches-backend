const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/settings-controller");

const router = express.Router();

router.get("/", asyncHandler(ctrl.getSettings));
router.put("/", requireAuth, requireRole("ADMIN"), asyncHandler(ctrl.updateSettings));

module.exports = router;
