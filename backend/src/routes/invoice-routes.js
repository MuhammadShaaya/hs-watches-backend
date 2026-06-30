const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/invoice-controller");

const router = express.Router();

router.get("/:id", requireAuth, asyncHandler(ctrl.generateInvoice));

module.exports = router;
