const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const ctrl = require("../controllers/product-controller");

const router = express.Router();

// Public
router.get("/", optionalAuth, asyncHandler(ctrl.listProducts));
router.get("/slug/:slug", asyncHandler(ctrl.getProductBySlug));
router.get("/:id", asyncHandler(ctrl.getProductById));

// Admin / Manager only
router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.createProduct));
router.put("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.updateProduct));
router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.deleteProduct));
router.post("/bulk-delete", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.bulkDeleteProducts));
router.get("/export/csv", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.bulkExportProducts));

module.exports = router;
