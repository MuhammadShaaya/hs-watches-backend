const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const ctrl = require("../controllers/blog-controller");

const router = express.Router();

router.get("/", asyncHandler(ctrl.listPosts));
router.get("/:slug", asyncHandler(ctrl.getPostBySlug));
router.post("/:slug/comments", optionalAuth, asyncHandler(ctrl.addComment));

router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.createPost));
router.put("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.updatePost));
router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), asyncHandler(ctrl.deletePost));

module.exports = router;
