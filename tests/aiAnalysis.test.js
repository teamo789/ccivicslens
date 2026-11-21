const test = require("node:test");
const assert = require("node:assert/strict");
const { fallbackClassifier } = require("../services/aiAnalysisService");
const { getDepartmentForCategory } = require("../services/departmentService");

test("fallback classifies an English road complaint", () => {
  const result = fallbackClassifier("A large pothole is blocking the road");
  assert.equal(result.category, "Roads");
  assert.equal(result.responsibleDepartment, "Public Works Department");
  assert.equal(result.detectedLanguage, "English");
  assert.equal(result.analysisMethod, "Fallback keyword classifier");
});

test("fallback detects Kannada text", () => {
  const result = fallbackClassifier("ನಮ್ಮ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಹೊಂಡ ಇದೆ");
  assert.equal(result.category, "Roads");
  assert.equal(result.detectedLanguage, "Kannada");
});

test("emergency wording receives a high impact severity", () => {
  const result = fallbackClassifier("There is a fire near the market");
  assert.equal(result.category, "Public Safety");
  assert.equal(result.severity, "Critical");
  assert.equal(result.priorityScore, 92);
});

test("department routing covers every complaint category", () => {
  assert.equal(getDepartmentForCategory("Waste"), "Sanitation Department");
  assert.equal(getDepartmentForCategory("Water"), "Water Supply Department");
  assert.equal(getDepartmentForCategory("Trees"), "Horticulture Department");
  assert.equal(getDepartmentForCategory("Unknown"), "Municipal Grievance Department");
});
