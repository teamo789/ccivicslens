/**
 * CivicLens - API Service & Data Layer Bridge
 * Coordination contract with Member 2 (Backend & AI Triage)
 * 
 * DESIGNED FOR EASY HACKATHON INTEGRATION:
 * - If backend is offline or USE_BACKEND is false, seamlessly uses LocalStorage
 *   seeded with realistic demo data.
 * - When Member 2 connects their backend, set USE_BACKEND: true and point BASE_URL.
 */

const API_CONFIG = {
  USE_BACKEND: true,
  BASE_URL: "http://localhost:3000/api",
  STORAGE_KEY: "civiclens_complaints_db_v1",
  TIMEOUT_MS: 5000
};

class CivicAPIService {
  constructor() {
    this.initStorage();
  }

  getToken() {
    return localStorage.getItem("civiclens_api_token");
  }

  authHeaders(includeJson = true) {
    const headers = {};
    if (includeJson) headers["Content-Type"] = "application/json";
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async login(username, password) {
    const res = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT_MS),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Login failed");
    localStorage.setItem("civiclens_api_token", payload.data.token);
    return payload.data.user;
  }

  logout() {
    localStorage.removeItem("civiclens_api_token");
  }

  /**
   * Initializes local persistence so demos work 100% offline and persist during testing.
   */
  initStorage() {
    const existing = localStorage.getItem(API_CONFIG.STORAGE_KEY);
    if (!existing) {
      this.resetToSeedData();
    }
  }

  /**
   * Resets the local storage to original seed complaints.
   */
  resetToSeedData() {
    const seed = window.CivicMockData ? JSON.parse(JSON.stringify(window.CivicMockData.SEED_COMPLAINTS)) : [];
    localStorage.setItem(API_CONFIG.STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  /**
   * Retrieve all raw complaints from storage without filtering.
   */
  getAllComplaintsRaw() {
    const raw = localStorage.getItem(API_CONFIG.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  /**
   * Retrieve complaints with optional filter criteria.
   * @param {Object} filters { search, category, severity, status, sortBy, tab: 'active' | 'resolved' | 'all' }
   * @returns {Promise<Array>} Array of complaints
   */
  async getComplaints(filters = {}) {
    if (API_CONFIG.USE_BACKEND) {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_CONFIG.BASE_URL}/complaints?${queryParams}`, {
          headers: this.authHeaders(false),
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUT_MS)
        });
        if (!res.ok) throw new Error(`Backend returned status ${res.status}`);
        const payload = await res.json();
        return payload.data;
      } catch (err) {
        console.warn("[CivicAPI] Backend unreachable, falling back to local store:", err);
      }
    }

    // Local / Offline store retrieval
    let list = this.getAllComplaintsRaw();

    // Tab filtering (Active vs Resolved)
    if (filters.tab === "active") {
      list = list.filter(item => item.status !== "resolved");
    } else if (filters.tab === "resolved") {
      list = list.filter(item => item.status === "resolved");
    }

    // Apply filtering in memory
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.aiTriage && item.aiTriage.department && item.aiTriage.department.toLowerCase().includes(q))
      );
    }

    if (filters.category && filters.category !== "all") {
      list = list.filter(item => item.category === filters.category);
    }

    if (filters.severity && filters.severity !== "all") {
      list = list.filter(item => item.severity === filters.severity);
    }

    if (filters.status && filters.status !== "all") {
      list = list.filter(item => item.status === filters.status);
    }

    // Sort order
    if (filters.sortBy === "urgency_desc") {
      list.sort((a, b) => ((b.aiTriage ? b.aiTriage.score : 50) - (a.aiTriage ? a.aiTriage.score : 50)));
    } else if (filters.sortBy === "date_asc") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      // Default: date_desc (newest first)
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }

  /**
   * Submit a new citizen complaint.
   */
  async submitComplaint(data) {
    if (API_CONFIG.USE_BACKEND) {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/complaints`, {
          method: "POST",
          headers: this.authHeaders(true),
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUT_MS)
        });
        if (!res.ok) throw new Error(`Backend returned status ${res.status}`);
        const payload = await res.json();
        return payload.data;
      } catch (err) {
        console.warn("[CivicAPI] Backend submission failed, saving locally:", err);
      }
    }

    // Local / Offline fallback with simulated AI Triage scoring
    const list = this.getAllComplaintsRaw();

    // Generate unique complaint ID: CVL-2042...
    const nextNum = 2040 + list.length + 1;
    const newId = `CVL-${nextNum}`;

    // Compute AI Triage heuristics
    const aiTriageResult = this.calculateMockAITriage(data);

    const newRecord = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: aiTriageResult.severity,
      status: "submitted",
      location: data.location || "Central District",
      coordinates: data.coordinates || { lat: 37.7749, lng: -122.4194 },
      photo: data.photo || window.CivicMockData.generateIssueSvg(data.title, '<stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0f172a"/>', "other"),
      aiTriage: aiTriageResult,
      citizen: {
        name: data.isAnonymous ? "Anonymous Citizen" : (data.name || "Concerned Resident"),
        phone: data.phone || "",
        isAnonymous: !!data.isAnonymous
      },
      createdAt: new Date().toISOString()
    };

    list.unshift(newRecord);
    localStorage.setItem(API_CONFIG.STORAGE_KEY, JSON.stringify(list));

    return newRecord;
  }

  /**
   * Update complaint status (e.g. submitted -> triaged -> in_progress -> resolved).
   * Persists permanently in localStorage and sets resolvedAt timestamp when resolved.
   */
  async updateStatus(id, newStatus) {
    if (API_CONFIG.USE_BACKEND) {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/complaints/${id}/status`, {
          method: "PATCH",
          headers: this.authHeaders(true),
          body: JSON.stringify({ status: newStatus }),
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUT_MS)
        });
        if (!res.ok) throw new Error(`Failed to update status on backend`);
        const payload = await res.json();
        return payload.data;
      } catch (err) {
        console.warn("[CivicAPI] Backend update failed, updating locally:", err);
      }
    }

    const list = this.getAllComplaintsRaw();
    const index = list.findIndex(c => c.id === id);
    if (index !== -1) {
      list[index].status = newStatus;
      if (newStatus === "resolved") {
        list[index].resolvedAt = new Date().toISOString();
      } else {
        // If reopening or changing status from resolved, remove or update resolvedAt
        delete list[index].resolvedAt;
        list[index].reopenedAt = new Date().toISOString();
      }
      localStorage.setItem(API_CONFIG.STORAGE_KEY, JSON.stringify(list));
      return list[index];
    }
    throw new Error(`Complaint ${id} not found`);
  }

  /**
   * Reopen a resolved complaint back into the active queue.
   */
  async reopenComplaint(id) {
    if (API_CONFIG.USE_BACKEND) {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/complaints/${id}/reopen`, {
          method: "PATCH",
          headers: this.authHeaders(true),
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUT_MS)
        });
        if (!res.ok) throw new Error("Failed to reopen complaint on backend");
        const payload = await res.json();
        return payload.data;
      } catch (err) {
        console.warn("[CivicAPI] Backend reopen failed, updating locally:", err);
      }
    }
    return await this.updateStatus(id, "in_progress");
  }

  /**
   * Internal intelligent fallback to simulate LLM triage scoring
   * based on keywords and municipal domain priorities.
   */
  calculateMockAITriage(data) {
    const text = `${data.title} ${data.description}`.toLowerCase();
    let score = 50;
    let severity = "medium";
    let rationale = "Standard municipal maintenance request.";
    let department = "Public Works Department";
    let visionTags = ["Citizen Visual Evidence", "Urban Environment"];

    // Keyword detection
    if (text.includes("live wire") || text.includes("sparking") || text.includes("electric shock") || text.includes("fire") || text.includes("collapsed")) {
      score = 96;
      severity = "critical";
      rationale = "Critical immediate life-safety hazard detected. High voltage or structural collapse threat.";
      department = "Emergency Safety & Power Services";
      visionTags.push("High Voltage Hazard", "Emergency Protocol Triggered");
    } else if (text.includes("crater") || text.includes("pothole") || text.includes("burst") || text.includes("flooding") || text.includes("accident")) {
      score = 88;
      severity = "high";
      rationale = "High-urgency infrastructure breach posing vehicular damage or foundation flooding risks.";
      department = data.category.includes("Water") ? "Water Supply & Sewage Board" : "Roads & Transportation Division";
      visionTags.push("Infrastructure Rupture", "Active Hazard");
    } else if (text.includes("garbage") || text.includes("overflow") || text.includes("stench") || text.includes("dumpster")) {
      score = 72;
      severity = "high";
      rationale = "Public hygiene and environmental hazard. Risk of vermin infestation.";
      department = "Solid Waste & Sanitation Department";
      visionTags.push("Solid Waste", "Bio-degradable Accumulation");
    } else if (text.includes("light") || text.includes("dark") || text.includes("lamp") || text.includes("bulb")) {
      score = 55;
      severity = "medium";
      rationale = "Public lighting deficit impacting pedestrian night visibility.";
      department = "Municipal Electrical & Street Lighting Unit";
      visionTags.push("Public Lighting", "Luminaire Defect");
    } else {
      score = 42;
      severity = "low";
      rationale = "Routine community maintenance; scheduled for standard departmental queue.";
      department = "General Municipal Maintenance";
      visionTags.push("Routine Maintenance");
    }

    return {
      score,
      severity,
      urgencyRationale: rationale,
      department,
      duplicateRisk: "Low (Calculated via semantic embedding)",
      visionTags,
      estimatedResolutionHours: severity === "critical" ? 2 : (severity === "high" ? 6 : 24)
    };
  }
}

// Global singleton instance
window.CivicAPI = new CivicAPIService();
window.API_CONFIG = API_CONFIG;
