const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const ctrl = require("../controllers/order-controller");

const router = express.Router();

// Checkout supports both guest and authenticated users
router.post("/", optionalAuth, asyncHandler(ctrl.createOrder));
router.get("/track/:orderNumber", asyncHandler(ctrl.getOrderByNumber));

router.get("/", requireAuth, asyncHandler(ctrl.listOrders));
router.get("/:id", requireAuth, asyncHandler(ctrl.getOrder));
router.patch("/:id/status", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.updateOrderStatus));

module.exports = router;
