const { getComplaints } = require("../services/storageService");

function getStats(req, res) {
  const complaints = getComplaints();
  const total = complaints.length;
  const resolved = complaints.filter((item) => item.status === "Resolved").length;
  const active = complaints.filter((item) => item.status !== "Resolved").length;
  const average = total
    ? complaints.reduce((sum, item) => sum + (Number(item.priorityScore) || 0), 0) / total
    : 0;
  res.json({
    success: true,
    data: {
      totalIngested: total,
      totalComplaints: total,
      activeComplaints: active,
      criticalComplaints: complaints.filter((item) => item.severity === "Critical").length,
      highComplaints: complaints.filter((item) => item.severity === "High").length,
      pendingComplaints: complaints.filter((item) => item.status === "Pending").length,
      resolvedComplaints: resolved,
      averageAiPriorityScore: Math.round(average * 10) / 10,
      resolutionRate: total ? Math.round((resolved / total) * 1000) / 10 : 0,
    },
  });
}

module.exports = { getStats };
