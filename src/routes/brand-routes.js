const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/brand-controller");

const router = express.Router();

router.get("/", asyncHandler(ctrl.listBrands));
router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.createBrand));
router.put("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.updateBrand));
router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.deleteBrand));

module.exports = router;
