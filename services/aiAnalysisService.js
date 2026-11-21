const { getDepartmentForCategory } = require("./departmentService");

const categories = ["Roads", "Waste", "Water", "Electricity", "Drainage", "Trees", "Public Safety", "Other"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function detectedLanguage(text) {
  return /[\u0C80-\u0CFF]/.test(text) ? "Kannada" : "English";
}

function fallbackClassifier(text) {
  const value = text.toLowerCase();
  let category = "Other";
  const groups = [
    ["Electricity", /electric|power|wire|light|ವಿದ್ಯುತ್|ಬೆಳಕು/g],
    ["Roads", /road|pothole|street|ರಸ್ತೆ|ಹೊಂಡ/g],
    ["Waste", /garbage|trash|waste|ಕಸ/g],
    ["Water", /water|pipe|leak|ನೀರು|ಕೊಳವೆ/g],
    ["Drainage", /drain|sewer|overflow|ಚರಂಡಿ/g],
    ["Trees", /tree|branch|horticulture|ಮರ/g],
    ["Public Safety", /accident|danger|unsafe|theft|crime|fire|ಅಪಾಯ|ಅಗ್ನಿ/g],
  ];
  for (const [name, pattern] of groups) {
    if (pattern.test(value)) {
      category = name;
      break;
    }
  }

  let severity = "Low";
  let priorityScore = 25;
  if (/critical|fatal|fire|collapse|accident|major|emergency|ತುರ್ತು|ಅಪಾಯ/g.test(value)) {
    severity = "Critical";
    priorityScore = 92;
  } else if (/danger|unsafe|risk|worsening|many|overflow|large/g.test(value)) {
    severity = "High";
    priorityScore = 76;
  } else if (/blocked|broken|leak|pothole|damaged|problem|ಹೊಂಡ/g.test(value)) {
    severity = "Medium";
    priorityScore = 55;
  }

  const explanation = {
    Critical: "Immediate danger or severe impact is reported.",
    High: "The issue may affect safety or several residents.",
    Medium: "The issue may disrupt local services and needs prompt repair.",
    Low: "The issue appears limited and has low immediate risk.",
  }[severity];

  const summaryText = text.trim().replace(/\s+/g, " ");
  const summary = summaryText.length > 120 ? `${summaryText.slice(0, 117)}...` : summaryText;
  const department = getDepartmentForCategory(category);
  return {
    category,
    severity,
    severityExplanation: explanation,
    responsibleDepartment: department,
    summary,
    priorityScore,
    suggestedAction: `Inspect the reported issue, verify its location, and coordinate resolution through the ${department}.`,
    detectedLanguage: detectedLanguage(text),
    analysisMethod: "Fallback keyword classifier",
  };
}

async function generativeAnalysis(text) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const prompt = `Analyse this municipal complaint and return only valid JSON:
category (Roads|Waste|Water|Electricity|Drainage|Trees|Public Safety|Other),
severity (Low|Medium|High|Critical), severityExplanation, responsibleDepartment,
summary, priorityScore (integer 0-100), suggestedAction, detectedLanguage (English|Kannada).
Consider public safety, affected people, urgency, infrastructure damage, and worsening risk.
Do not classify ordinary issues as Critical.
Complaint: ${text}`;

  const response = await fetch(
    process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are a precise municipal complaint triage assistant." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!response.ok) throw new Error(`Generative AI API returned ${response.status}`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  const parsed = typeof content === "string" ? JSON.parse(content) : content;
  if (!parsed || !categories.includes(parsed.category)) throw new Error("Invalid AI response");

  const severity = ["Low", "Medium", "High", "Critical"].includes(parsed.severity) ? parsed.severity : "Low";
  const category = parsed.category;
  return {
    category,
    severity,
    severityExplanation: String(parsed.severityExplanation || "Severity assessed from complaint impact."),
    responsibleDepartment: String(parsed.responsibleDepartment || getDepartmentForCategory(category)),
    summary: String(parsed.summary || text.slice(0, 120)),
    priorityScore: clamp(Number(parsed.priorityScore) || 0, 0, 100),
    suggestedAction: String(parsed.suggestedAction || "Inspect and coordinate a response."),
    detectedLanguage: detectedLanguage(text),
    analysisMethod: "Generative AI",
  };
}

async function analyseComplaint(text) {
  try {
    const generated = await generativeAnalysis(text);
    if (generated) return generated;
  } catch (error) {
    console.warn(`Generative AI unavailable; using fallback: ${error.message}`);
  }
  return fallbackClassifier(text);
}

module.exports = { analyseComplaint, fallbackClassifier };
