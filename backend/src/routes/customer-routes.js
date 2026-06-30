const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/customer-controller");

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN", "MANAGER"));
router.get("/", asyncHandler(ctrl.listCustomers));
router.get("/:id", asyncHandler(ctrl.getCustomer));
router.patch("/:id/toggle-block", asyncHandler(ctrl.toggleBlockCustomer));
router.delete("/:id", asyncHandler(ctrl.deleteCustomer));

module.exports = router;
