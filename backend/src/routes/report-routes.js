const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/report-controller");

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN", "MANAGER"));
router.get("/dashboard", asyncHandler(ctrl.getDashboardStats));
router.get("/revenue", asyncHandler(ctrl.getRevenueReport));
router.get("/top-products", asyncHandler(ctrl.getTopProducts));

module.exports = router;
