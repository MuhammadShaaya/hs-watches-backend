const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ctrl = require("../controllers/media-controller");

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN", "MANAGER"));

router.post("/upload", upload.array("files", 50), asyncHandler(ctrl.uploadFiles));
router.post("/upload-url", asyncHandler(ctrl.uploadFromUrl));
router.delete("/:publicId", asyncHandler(ctrl.deleteMedia));

module.exports = router;
