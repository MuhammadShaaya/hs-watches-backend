const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/address-controller");

const router = express.Router();

router.use(requireAuth);
router.get("/", asyncHandler(ctrl.listAddresses));
router.post("/", asyncHandler(ctrl.createAddress));
router.patch("/:id/default", asyncHandler(ctrl.setDefaultAddress));
router.delete("/:id", asyncHandler(ctrl.deleteAddress));

module.exports = router;
