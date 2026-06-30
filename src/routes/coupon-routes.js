const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/coupon-controller");

const router = express.Router();

router.post("/validate", asyncHandler(ctrl.validateCoupon));
router.get("/", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.listCoupons));
router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.createCoupon));
router.put("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.updateCoupon));
router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.deleteCoupon));

module.exports = router;
