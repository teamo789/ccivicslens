const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const { getStats } = require("../controllers/dashboardController");

const router = express.Router();
router.get("/stats", authenticate, authorize("MUNICIPAL_OFFICER"), getStats);

module.exports = router;
