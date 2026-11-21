/**
 * CivicLens - Application Bootstrap, Auth & Session Manager
 * Member 1: Frontend Architecture & UI
 */

const CIVIC_AUTH_KEY = "civiclens_auth_session_v1";

const DEMO_CREDENTIALS = {
  citizen: {
    email: "citizen@civiclens.org",
    password: "citizen123",
    name: "Alex Rivera",
    role: "citizen",
    phone: "+1 (555) 382-9014",
    ward: "Ward 4"
  },
  officer: {
    email: "officer@civiclens.gov",
    password: "officer123",
    name: "Officer Sarah Chen",
    role: "officer",
    badge: "MUNI-8042",
    department: "Central Municipal Dispatch"
  }
};

class CivicAuthManager {
  constructor() {
    this.currentUser = this.loadSession();
  }

  loadSession() {
    try {
      const raw = localStorage.getItem(CIVIC_AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("[CivicAuth] Failed to load auth session", e);
      return null;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isOfficer() {
    return this.currentUser && this.currentUser.role === "officer";
  }

  isCitizen() {
    return this.currentUser && this.currentUser.role === "citizen";
  }

  /**
   * Log in a user by role and credentials.
   * Supports demo credentials or any test email/password provided for hackathon testing.
   */
  async login(email, password, role) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanRole = role || "citizen";
    if (window.API_CONFIG && window.API_CONFIG.USE_BACKEND) {
      try {
        const backendUser = await window.CivicAPI.login(cleanEmail, password);
        const normalizedRole = backendUser.role === "MUNICIPAL_OFFICER" ? "officer" : "citizen";
        if (normalizedRole !== cleanRole) throw new Error("Credentials do not match the selected role");
        const userData = {
          email: backendUser.username,
          name: backendUser.name,
          role: normalizedRole,
          badge: normalizedRole === "officer" ? "MUNI-8042" : undefined,
          department: normalizedRole === "officer" ? "Central Municipal Dispatch" : undefined,
          phone: DEMO_CREDENTIALS.citizen.phone,
          ward: DEMO_CREDENTIALS.citizen.ward,
          loggedInAt: new Date().toISOString()
        };
        this.currentUser = userData;
        localStorage.setItem(CIVIC_AUTH_KEY, JSON.stringify(userData));
        return userData;
      } catch (error) {
        throw error;
      }
    }

    let userData = null;
    if (cleanRole === "officer") {
      userData = {
        email: cleanEmail || DEMO_CREDENTIALS.officer.email,
        name: DEMO_CREDENTIALS.officer.name,
        role: "officer",
        badge: DEMO_CREDENTIALS.officer.badge,
        department: DEMO_CREDENTIALS.officer.department,
        loggedInAt: new Date().toISOString()
      };
    } else {
      userData = {
        email: cleanEmail || DEMO_CREDENTIALS.citizen.email,
        name: DEMO_CREDENTIALS.citizen.name,
        role: "citizen",
        phone: DEMO_CREDENTIALS.citizen.phone,
        ward: DEMO_CREDENTIALS.citizen.ward,
        loggedInAt: new Date().toISOString()
      };
    }

    this.currentUser = userData;
    localStorage.setItem(CIVIC_AUTH_KEY, JSON.stringify(userData));
    return userData;
  }

  /**
   * 1-Click Demo Login for hackathon judges
   */
  demoLogin(role = "citizen") {
    const demo = DEMO_CREDENTIALS[role] || DEMO_CREDENTIALS.citizen;
    return this.login(demo.email, demo.password, role);
  }

  /**
   * Log out current user and return to landing / login page
   */
  logout() {
    this.currentUser = null;
    localStorage.removeItem(CIVIC_AUTH_KEY);
    if (window.CivicAPI) window.CivicAPI.logout();
    window.location.href = "index.html";
  }
}

class CivicApplication {
  constructor() {
    this.auth = new CivicAuthManager();
    this.toastContainer = null;
    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.setupToasts();
      this.updateAIStatusBadge();
      this.setupResetButton();
      this.setupCommandSidebar();
      this.handlePageAuth();
    });
  }

  /**
   * Accurately reflects AI status:
   * Displays 'Demo AI / Fallback Mode' when local heuristics are used.
   * Only displays 'Live Backend AI Active' when backend integration is configured.
   */
  updateAIStatusBadge() {
    const badges = document.querySelectorAll(".ai-status-indicator");
    const isLive = window.API_CONFIG && window.API_CONFIG.USE_BACKEND;

    badges.forEach(badge => {
      if (isLive) {
        badge.className = "ai-pill ai-pill-live";
        badge.innerHTML = `
          <span class="pulse-indicator pulse-live"></span>
          <span>Live Backend AI Active</span>
        `;
        badge.title = "Live AI Backend API Connected";
      } else {
        badge.className = "ai-pill ai-pill-fallback";
        badge.innerHTML = `
          <span class="pulse-indicator pulse-fallback"></span>
          <span>Demo AI / Fallback Mode</span>
        `;
        badge.title = "Local Demo AI with Keyword Heuristics & Deterministic Triage";
      }
    });
  }

  setupToasts() {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    this.toastContainer = container;
  }

  showToast(title, message, type = "info", duration = 4000) {
    if (!this.toastContainer) this.setupToasts();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = "";
    if (type === "success") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === "error") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === "warning") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
      this.dismissToast(toast);
    });

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      this.dismissToast(toast);
    }, duration);
  }

  dismissToast(toast) {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(15px) scale(0.95)";
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 280);
  }

  setupCommandSidebar() {
    const collapseBtn = document.getElementById("sidebarCollapseBtn");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => {
        document.body.classList.toggle("sidebar-collapsed");
      });
    }

    document.querySelectorAll(".sidebar-link").forEach(link => {
      link.addEventListener("click", () => {
        document.querySelectorAll(".sidebar-link").forEach(item => item.classList.remove("active"));
        link.classList.add("active");
        const action = link.dataset.action;
        if (action === "active" && document.getElementById("tabQueueActive")) {
          document.getElementById("tabQueueActive").click();
          document.querySelector(".queue-tabs-container").scrollIntoView({ behavior: "smooth" });
        } else if (action === "resolved" && document.getElementById("tabQueueResolved")) {
          document.getElementById("tabQueueResolved").click();
          document.querySelector(".queue-tabs-container").scrollIntoView({ behavior: "smooth" });
        } else if (action === "triage") {
          document.getElementById("dashboardSearchInput")?.focus();
        } else if (action === "analytics") {
          document.querySelector(".stats-grid")?.scrollIntoView({ behavior: "smooth" });
          this.showToast("Live analytics", "Dashboard totals are calculated from the current complaint dataset.", "info");
        } else if (action === "departments") {
          document.getElementById("complaintsGrid")?.scrollIntoView({ behavior: "smooth" });
        } else {
          document.querySelector(".dashboard-header")?.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  setupResetButton() {
    const resetBtns = document.querySelectorAll(".btn-reset-demo-action");
    resetBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Reset all complaints back to initial hackathon seed data?")) {
          window.CivicAPI.resetToSeedData();
          if (window.CivicDashboard) {
            window.CivicDashboard.loadComplaints();
          }
          if (window.renderCitizenTickets) {
            window.renderCitizenTickets();
          }
          this.showToast("Database Restored", "Reset to original civic issues with AI scores.", "info");
        }
      });
    });
  }

  /**
   * Enforces role-based views and guards between index.html and submit.html
   */
  handlePageAuth() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const user = this.auth.getCurrentUser();

    // Universal Logout Button Binding
    document.querySelectorAll(".btn-auth-logout").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.auth.logout();
      });
    });

    // Universal Current User Badge Binding
    document.querySelectorAll(".auth-user-display").forEach(el => {
      if (user) {
        if (user.role === "officer") {
          el.innerHTML = `🛡️ <strong>${user.name}</strong> <span class="badge" style="background:#e0e7ff; color:#3730a3; margin-left:4px;">${user.badge || "Officer"}</span>`;
        } else {
          el.innerHTML = `👤 <strong>${user.name}</strong> <span class="badge" style="background:#f1f5f9; color:#475569; margin-left:4px;">Citizen</span>`;
        }
      }
    });

    // --------------------------------------------------------------------
    // Scenario A: On submit.html (Citizen Complaint Portal)
    // --------------------------------------------------------------------
    if (currentPage === "submit.html") {
      // Citizen portal requires login
      if (!user) {
        // Not logged in -> redirect to login page
        window.location.href = "index.html?error=login_required";
        return;
      }

      // If user is logged in as Citizen, ensure officer management features are completely absent
      if (user.role === "citizen") {
        document.querySelectorAll(".officer-only-link").forEach(el => el.classList.add("hidden"));
      } else if (user.role === "officer") {
        document.querySelectorAll(".officer-only-link").forEach(el => el.classList.remove("hidden"));
      }

      // Initialize Citizen Submission Form & Citizen Tracker
      if (window.ComplaintFormHandler) {
        window.ComplaintForm = new window.ComplaintFormHandler();
      }
      if (typeof window.initCitizenTracker === "function") {
        window.initCitizenTracker();
      }
      return;
    }

    // --------------------------------------------------------------------
    // Scenario B: On index.html (Login / Landing Page or Officer Dashboard)
    // --------------------------------------------------------------------
    if (currentPage === "index.html" || currentPage === "") {
      const landingSection = document.getElementById("landingLoginSection");
      const dashboardSection = document.getElementById("officerDashboardSection");
      const navAuthActions = document.getElementById("navOfficerControls");

      if (!user) {
        // NOT LOGGED IN -> Show Login & Landing Page
        if (landingSection) landingSection.classList.remove("hidden");
        if (dashboardSection) dashboardSection.classList.add("hidden");
        if (navAuthActions) navAuthActions.classList.add("hidden");

        this.initLandingLoginPage();
      } else if (user.role === "citizen") {
        // CITIZEN LOGGED IN -> Redirect to Citizen Portal (No access to officer dashboard)
        window.location.href = "submit.html";
      } else if (user.role === "officer") {
        // OFFICER LOGGED IN -> Show Municipal Officer Dashboard
        if (landingSection) landingSection.classList.add("hidden");
        if (dashboardSection) dashboardSection.classList.remove("hidden");
        if (navAuthActions) navAuthActions.classList.remove("hidden");

        // Initialize Officer Dashboard
        if (window.CivicDashboardController) {
          window.CivicDashboard = new window.CivicDashboardController();
        }
        if (window.ComplaintFormHandler) {
          window.ComplaintForm = new window.ComplaintFormHandler();
        }
      }
    }
  }

  /**
   * Initializes the Landing & Login UI controls on index.html
   */
  initLandingLoginPage() {
    let selectedRole = "citizen";
    const roleBtns = document.querySelectorAll(".role-select-tab");
    const roleLabelText = document.getElementById("loginRoleTitle");
    const roleDescText = document.getElementById("loginRoleDesc");
    const emailInput = document.getElementById("loginEmailInput");
    const passwordInput = document.getElementById("loginPasswordInput");
    const loginForm = document.getElementById("landingLoginForm");

    // Role switcher tabs
    roleBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        roleBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedRole = btn.getAttribute("data-role");

        if (selectedRole === "officer") {
          if (roleLabelText) roleLabelText.textContent = "Municipal Officer Login";
          if (roleDescText) roleDescText.textContent = "Access command center, automated triage queues, and municipal dispatch management.";
          if (emailInput) {
            emailInput.placeholder = "officer@civiclens.gov";
            emailInput.value = DEMO_CREDENTIALS.officer.email;
          }
          if (passwordInput) passwordInput.value = DEMO_CREDENTIALS.officer.password;
        } else {
          if (roleLabelText) roleLabelText.textContent = "Citizen Portal Login";
          if (roleDescText) roleDescText.textContent = "Report community hazards, upload photo evidence, and track real-time resolution progress.";
          if (emailInput) {
            emailInput.placeholder = "citizen@civiclens.org";
            emailInput.value = DEMO_CREDENTIALS.citizen.email;
          }
          if (passwordInput) passwordInput.value = DEMO_CREDENTIALS.citizen.password;
        }
      });
    });

    // 1-Click Demo Login Buttons
    document.querySelectorAll(".btn-demo-quick-login").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const role = btn.getAttribute("data-role") || "citizen";
        try {
          await this.auth.login(
            role === "officer" ? DEMO_CREDENTIALS.officer.email : DEMO_CREDENTIALS.citizen.email,
            role === "officer" ? DEMO_CREDENTIALS.officer.password : DEMO_CREDENTIALS.citizen.password,
            role
          );
        } catch (error) {
          this.showToast("Login Failed", error.message, "error");
          return;
        }
        
        if (role === "officer") {
          this.showToast("Officer Login Successful", `Welcome, ${DEMO_CREDENTIALS.officer.name} (${DEMO_CREDENTIALS.officer.badge}).`, "success");
          setTimeout(() => {
            window.location.href = "index.html";
          }, 300);
        } else {
          this.showToast("Citizen Login Successful", `Welcome, ${DEMO_CREDENTIALS.citizen.name}. Redirecting to Citizen Portal...`, "success");
          setTimeout(() => {
            window.location.href = "submit.html";
          }, 300);
        }
      });
    });

    // Form submit
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";
        let user;
        try {
          user = await this.auth.login(email, password, selectedRole);
        } catch (error) {
          this.showToast("Login Failed", error.message, "error");
          return;
        }
        
        if (selectedRole === "officer") {
          this.showToast("Officer Authorized", `Welcome, ${user.name}.`, "success");
          setTimeout(() => {
            window.location.href = "index.html";
          }, 300);
        } else {
          this.showToast("Citizen Authenticated", `Welcome, ${user.name}. Redirecting to Citizen Portal...`, "success");
          setTimeout(() => {
            window.location.href = "submit.html";
          }, 300);
        }
      });
    }

    // Auto-fill default citizen demo values on page load
    if (emailInput && !emailInput.value) emailInput.value = DEMO_CREDENTIALS.citizen.email;
    if (passwordInput && !passwordInput.value) passwordInput.value = DEMO_CREDENTIALS.citizen.password;
  }
}

// Global Application and Auth Instances
window.CivicApp = new CivicApplication();
window.CivicAuth = window.CivicApp.auth;
window.DEMO_CREDENTIALS = DEMO_CREDENTIALS;
