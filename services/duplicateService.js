function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function tokens(value) {
  return new Set(normalize(value).split(" ").filter((word) => word.length > 2));
}

function similarity(a, b) {
  const first = tokens(a);
  const second = tokens(b);
  if (!first.size || !second.size) return 0;
  let overlap = 0;
  for (const token of first) if (second.has(token)) overlap += 1;
  return overlap / Math.max(first.size, second.size);
}

function findDuplicate(complaints, complaint) {
  const location = normalize(complaint.location);
  return complaints.find((existing) => {
    if (existing.status === "Resolved") return false;
    if (existing.category !== complaint.category) return false;
    if (normalize(existing.location) !== location) return false;
    return similarity(existing.text, complaint.text) >= 0.55;
  }) || null;
}

module.exports = { findDuplicate };
