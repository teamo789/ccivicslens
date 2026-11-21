const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const complaints = require("../controllers/complaintController");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("CITIZEN"),
  complaints.imageUpload.single("image"),
  complaints.createComplaint
);
router.get("/", authenticate, complaints.listComplaints);
router.get("/:id", authenticate, complaints.getComplaint);
router.patch(
  "/:id/status",
  authenticate,
  authorize("MUNICIPAL_OFFICER"),
  complaints.updateStatus
);
router.patch(
  "/:id/reopen",
  authenticate,
  authorize("MUNICIPAL_OFFICER"),
  complaints.reopenComplaint
);
router.patch(
  "/:id/department",
  authenticate,
  authorize("MUNICIPAL_OFFICER"),
  complaints.assignDepartment
);
router.delete(
  "/:id",
  authenticate,
  authorize("MUNICIPAL_OFFICER"),
  complaints.deleteComplaint
);

module.exports = router;
