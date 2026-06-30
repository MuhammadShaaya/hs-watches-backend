const express = require("express");
const { authLimiter } = require("../middleware/rate-limit");

const router = express.Router();

router.use("/auth", authLimiter, require("./auth-routes"));
router.use("/products", require("./product-routes"));
router.use("/categories", require("./category-routes"));
router.use("/brands", require("./brand-routes"));
router.use("/orders", require("./order-routes"));
router.use("/reviews", require("./review-routes"));
router.use("/coupons", require("./coupon-routes"));
router.use("/wishlist", require("./wishlist-routes"));
router.use("/customers", require("./customer-routes"));
router.use("/addresses", require("./address-routes"));
router.use("/blog", require("./blog-routes"));
router.use("/notifications", require("./notification-routes"));
router.use("/settings", require("./settings-routes"));
router.use("/reports", require("./report-routes"));
router.use("/invoices", require("./invoice-routes"));
router.use("/media", require("./media-routes"));

router.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

module.exports = router;
