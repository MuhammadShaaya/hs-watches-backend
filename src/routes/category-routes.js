const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/category-controller");

const router = express.Router();

router.get("/", asyncHandler(ctrl.listCategories));
router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.createCategory));
router.put("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.updateCategory));
router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.deleteCategory));

module.exports = router;
