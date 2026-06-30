const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/wishlist-controller");

const router = express.Router();

router.use(requireAuth);
router.get("/", asyncHandler(ctrl.getWishlist));
router.post("/toggle", asyncHandler(ctrl.toggleWishlistItem));

module.exports = router;
