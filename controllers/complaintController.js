const path = require("path");
const multer = require("multer");
const { randomUUID } = require("crypto");
const { getComplaints, saveComplaints } = require("../services/storageService");
const { analyseComplaint } = require("../services/aiAnalysisService");
const { findDuplicate } = require("../services/duplicateService");
const { getDepartmentForCategory } = require("../services/departmentService");

const uploadDir = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${randomUUID()}-${safeName}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      const error = new Error("Only JPG, PNG and WebP images are allowed");
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
});

function severityRank(severity) {
  return { Critical: 4, High: 3, Medium: 2, Low: 1 }[severity] || 0;
}

function ticketId() {
  return `CL-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function categoryLabel(category) {
  return {
    Roads: "Roads & Infrastructure",
    Electricity: "Electricity & Lighting",
    Water: "Water Supply & Drainage",
    Drainage: "Water Supply & Drainage",
    Waste: "Sanitation & Waste",
    "Public Safety": "Public Safety & Hazards",
    Trees: "Parks & Environment",
    Other: "Public Safety & Hazards",
  }[category] || "Public Safety & Hazards";
}

function frontendComplaint(record) {
  const severity = String(record.severity || "Low").toLowerCase();
  const statusMap = { Pending: "submitted", "In Progress": "in_progress", Resolved: "resolved" };
  return {
    id: record.ticketId || record.id,
    _backendId: record.id,
    title: record.title || record.summary || record.text,
    description: record.text,
    category: record.categoryLabel || categoryLabel(record.category),
    severity,
    status: statusMap[record.status] || "submitted",
    location: record.location,
    coordinates: record.coordinates || { lat: 37.7749, lng: -122.4194 },
    photo: record.imageUrl || record.photo || null,
    aiTriage: {
      score: record.priorityScore,
      severity,
      urgencyRationale: record.severityExplanation,
      department: record.responsibleDepartment,
      duplicateRisk: record.possibleDuplicateOf ? "Medium (Possible duplicate)" : "Low",
      visionTags: record.detectedLanguage ? [record.detectedLanguage, "Municipal Complaint"] : ["Municipal Complaint"],
      estimatedResolutionHours: severity === "critical" ? 2 : (severity === "high" ? 6 : 24),
      analysisMethod: record.analysisMethod,
    },
    citizen: record.citizen || {
      name: record.submittedBy || "Concerned Resident",
      phone: record.phone || "",
      isAnonymous: false,
    },
    createdAt: record.createdAt,
    resolvedAt: record.resolvedAt,
  };
}

async function createComplaint(req, res) {
  const text = req.body.title
    ? `${req.body.title}. ${req.body.description || req.body.text || ""}`.trim()
    : (req.body.text || req.body.description || req.body.complaint);
  const location = req.body.location;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ success: false, error: "Complaint text is required" });
  }
  if (!location || !String(location).trim()) {
    return res.status(400).json({ success: false, error: "Location is required" });
  }

  const complaints = getComplaints();
  const analysis = await analyseComplaint(String(text).trim());
  const department = getDepartmentForCategory(analysis.category);
  const imageUrl = req.file
    ? `/uploads/${req.file.filename}`
    : (typeof req.body.photo === "string"
      ? req.body.photo
      : (typeof req.body.image === "string" ? req.body.image : null));

  const complaint = {
    id: randomUUID(),
    ticketId: ticketId(),
    text: String(text).trim(),
    title: req.body.title ? String(req.body.title).trim() : null,
    description: req.body.description ? String(req.body.description).trim() : null,
    categoryLabel: req.body.category ? String(req.body.category).trim() : null,
    coordinates: req.body.coordinates || null,
    phone: req.body.phone || "",
    citizen: {
      name: req.body.isAnonymous ? "Anonymous Citizen" : (req.body.name || req.user.name || "Concerned Resident"),
      phone: req.body.phone || "",
      isAnonymous: Boolean(req.body.isAnonymous),
    },
    location: String(location).trim(),
    imageUrl,
    userId: req.user.sub,
    submittedBy: req.user.name,
    status: "Pending",
    category: analysis.category,
    severity: analysis.severity,
    severityExplanation: analysis.severityExplanation,
    responsibleDepartment: department,
    summary: analysis.summary,
    priorityScore: analysis.priorityScore,
    suggestedAction: analysis.suggestedAction,
    detectedLanguage: analysis.detectedLanguage,
    analysisMethod: analysis.analysisMethod,
    possibleDuplicateOf: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const duplicate = findDuplicate(complaints, complaint);
  if (duplicate) complaint.possibleDuplicateOf = duplicate.id;
  complaints.push(complaint);
  saveComplaints(complaints);

  res.status(201).json({
    success: true,
    data: frontendComplaint({ ...complaint, possibleDuplicateOf: complaint.possibleDuplicateOf }),
  });
}

function listComplaints(req, res) {
  let complaints = getComplaints();
  if (req.user.role === "CITIZEN") {
    complaints = complaints.filter((item) => item.userId === req.user.sub);
  }
  complaints.sort((a, b) => {
    const severityDifference = severityRank(b.severity) - severityRank(a.severity);
    return severityDifference || (b.priorityScore || 0) - (a.priorityScore || 0);
  });
  res.json({ success: true, data: complaints.map(frontendComplaint) });
}

function getComplaint(req, res) {
  const complaint = getComplaints().find((item) => item.id === req.params.id || item.ticketId === req.params.id);
  if (!complaint) return res.status(404).json({ success: false, error: "Complaint not found" });
  if (req.user.role === "CITIZEN" && complaint.userId !== req.user.sub) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  res.json({ success: true, data: frontendComplaint(complaint) });
}

function updateStatus(req, res) {
  const allowed = ["Pending", "In Progress", "Resolved"];
  const statusAliases = {
    pending: "Pending",
    submitted: "Pending",
    triaged: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
  };
  const status = statusAliases[String(req.body.status || "").toLowerCase()] || req.body.status;
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, error: "Status must be Pending, In Progress or Resolved" });
  }
  const complaints = getComplaints();
  const complaint = complaints.find((item) => item.id === req.params.id || item.ticketId === req.params.id);
  if (!complaint) return res.status(404).json({ success: false, error: "Complaint not found" });
  complaint.status = status;
  complaint.updatedAt = new Date().toISOString();
  if (status === "Resolved") complaint.resolvedAt = complaint.updatedAt;
  if (status !== "Resolved") delete complaint.resolvedAt;
  saveComplaints(complaints);
  res.json({ success: true, data: frontendComplaint(complaint) });
}

function reopenComplaint(req, res) {
  const complaints = getComplaints();
  const complaint = complaints.find((item) => item.id === req.params.id || item.ticketId === req.params.id);
  if (!complaint) return res.status(404).json({ success: false, error: "Complaint not found" });
  complaint.status = "In Progress";
  complaint.updatedAt = new Date().toISOString();
  delete complaint.resolvedAt;
  saveComplaints(complaints);
  res.json({ success: true, data: frontendComplaint(complaint) });
}

function assignDepartment(req, res) {
  const department = String(req.body.department || "").trim();
  if (!department) return res.status(400).json({ success: false, error: "department is required" });
  const complaints = getComplaints();
  const complaint = complaints.find((item) => item.id === req.params.id || item.ticketId === req.params.id);
  if (!complaint) return res.status(404).json({ success: false, error: "Complaint not found" });
  complaint.responsibleDepartment = department;
  complaint.updatedAt = new Date().toISOString();
  saveComplaints(complaints);
  res.json({ success: true, data: complaint });
}

function deleteComplaint(req, res) {
  const complaints = getComplaints();
  const index = complaints.findIndex((item) => item.id === req.params.id || item.ticketId === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: "Complaint not found" });
  complaints.splice(index, 1);
  saveComplaints(complaints);
  res.json({ success: true, data: { deletedId: req.params.id } });
}

module.exports = {
  imageUpload,
  createComplaint,
  listComplaints,
  getComplaint,
  updateStatus,
  reopenComplaint,
  assignDepartment,
  deleteComplaint,
};
