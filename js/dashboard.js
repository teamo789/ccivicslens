/**
 * CivicLens - Officer Dashboard Controller
 * Member 1: Frontend Architecture & UI
 * Handles Active vs. Resolved triage queues, dynamic KPIs, filters, cards/table views, and case reopening.
 */

class CivicDashboardController {
  constructor() {
    this.currentTab = "active"; // 'active' | 'resolved'
    this.viewMode = "grid"; // 'grid' | 'table'

    this.filters = {
      search: "",
      category: "all",
      severity: "all",
      status: "all",
      sortBy: "date_desc"
    };

    this.complaints = [];
    this.allComplaintsCache = [];
    this.selectedComplaint = null;

    // DOM Containers
    this.gridContainer = document.getElementById("complaintsGrid");
    this.tableContainer = document.getElementById("complaintsTableContainer");
    this.tableBody = document.getElementById("complaintsTableBody");
    this.emptyState = document.getElementById("emptyStateContainer");
    this.resultsCountEl = document.getElementById("resultsCount");

    // Queue Tab Elements
    this.tabActiveBtn = document.getElementById("tabQueueActive");
    this.tabResolvedBtn = document.getElementById("tabQueueResolved");
    this.activeBadgeCount = document.getElementById("tabActiveCount");
    this.resolvedBadgeCount = document.getElementById("tabResolvedCount");

    // Stat metric elements
    this.statTotal = document.getElementById("statTotalComplaints");
    this.statCritical = document.getElementById("statCriticalCount");
    this.statAvgScore = document.getElementById("statAvgScore");
    this.statResolved = document.getElementById("statResolvedRate");

    // Filter controls
    this.searchInput = document.getElementById("dashboardSearchInput");
    this.searchClearBtn = document.getElementById("searchClearBtn");
    this.categorySelect = document.getElementById("categoryFilterSelect");
    this.statusSelect = document.getElementById("statusFilterSelect");
    this.sortSelect = document.getElementById("sortBySelect");
    this.severityChips = document.querySelectorAll(".severity-chip");
    this.resetFiltersBtn = document.getElementById("resetFiltersBtn");

    // View toggles
    this.btnViewGrid = document.getElementById("btnViewGrid");
    this.btnViewTable = document.getElementById("btnViewTable");

    // Detail Modal Elements
    this.detailModal = document.getElementById("detailDossierModal");
    this.detailModalBody = document.getElementById("detailModalBody");
    this.closeDetailBtns = document.querySelectorAll(".close-detail-modal-btn");

    this.init();
  }

  init() {
    this.initEventListeners();
    this.loadComplaints();
  }

  initEventListeners() {
    // Queue Tab Switching (Active vs Resolved)
    if (this.tabActiveBtn) {
      this.tabActiveBtn.addEventListener("click", () => {
        this.switchQueueTab("active");
      });
    }
    if (this.tabResolvedBtn) {
      this.tabResolvedBtn.addEventListener("click", () => {
        this.switchQueueTab("resolved");
      });
    }

    // Search with debounce
    if (this.searchInput) {
      let timeout = null;
      this.searchInput.addEventListener("input", (e) => {
        clearTimeout(timeout);
        const val = e.target.value.trim();
        if (this.searchClearBtn) {
          this.searchClearBtn.style.display = val ? "block" : "none";
        }
        timeout = setTimeout(() => {
          this.filters.search = val;
          this.loadComplaints();
        }, 220);
      });

      if (this.searchClearBtn) {
        this.searchClearBtn.addEventListener("click", () => {
          this.searchInput.value = "";
          this.searchClearBtn.style.display = "none";
          this.filters.search = "";
          this.loadComplaints();
        });
      }
    }

    // Category Select
    if (this.categorySelect) {
      this.categorySelect.addEventListener("change", (e) => {
        this.filters.category = e.target.value;
        this.loadComplaints();
      });
    }

    // Status Select
    if (this.statusSelect) {
      this.statusSelect.addEventListener("change", (e) => {
        this.filters.status = e.target.value;
        this.loadComplaints();
      });
    }

    // Sort Select
    if (this.sortSelect) {
      this.sortSelect.addEventListener("change", (e) => {
        this.filters.sortBy = e.target.value;
        this.loadComplaints();
      });
    }

    // Severity Chips
    this.severityChips.forEach(chip => {
      chip.addEventListener("click", () => {
        this.severityChips.forEach(c => {
          c.classList.remove("active", "active-critical", "active-high", "active-medium", "active-low");
        });
        const sev = chip.getAttribute("data-severity");
        this.filters.severity = sev;

        if (sev === "critical") chip.classList.add("active-critical");
        else if (sev === "high") chip.classList.add("active-high");
        else if (sev === "medium") chip.classList.add("active-medium");
        else if (sev === "low") chip.classList.add("active-low");
        else chip.classList.add("active");

        this.loadComplaints();
      });
    });

    // Reset Filters button
    if (this.resetFiltersBtn) {
      this.resetFiltersBtn.addEventListener("click", () => {
        this.resetAllFilters();
      });
    }

    // View switchers
    if (this.btnViewGrid && this.btnViewTable) {
      this.btnViewGrid.addEventListener("click", () => this.switchView("grid"));
      this.btnViewTable.addEventListener("click", () => this.switchView("table"));
    }

    // Detail Modal Close
    this.closeDetailBtns.forEach(btn => {
      btn.addEventListener("click", () => this.closeDetailModal());
    });
    if (this.detailModal) {
      this.detailModal.addEventListener("click", (e) => {
        if (e.target === this.detailModal) this.closeDetailModal();
      });
    }
  }

  switchQueueTab(tabName) {
    this.currentTab = tabName;
    if (tabName === "active") {
      this.tabActiveBtn.classList.add("active");
      this.tabResolvedBtn.classList.remove("active");
    } else {
      this.tabResolvedBtn.classList.add("active");
      this.tabActiveBtn.classList.remove("active");
    }
    this.loadComplaints();
  }

  resetAllFilters() {
    this.filters = {
      search: "",
      category: "all",
      severity: "all",
      status: "all",
      sortBy: "date_desc"
    };

    if (this.searchInput) {
      this.searchInput.value = "";
      if (this.searchClearBtn) this.searchClearBtn.style.display = "none";
    }
    if (this.categorySelect) this.categorySelect.value = "all";
    if (this.statusSelect) this.statusSelect.value = "all";
    if (this.sortSelect) this.sortSelect.value = "date_desc";

    this.severityChips.forEach(c => {
      c.classList.remove("active", "active-critical", "active-high", "active-medium", "active-low");
      if (c.getAttribute("data-severity") === "all") c.classList.add("active");
    });

    this.loadComplaints();
    window.CivicApp.showToast("Filters Cleared", "Reset filter settings.", "info");
  }

  switchView(mode) {
    this.viewMode = mode;
    if (mode === "grid") {
      this.btnViewGrid.classList.add("active");
      this.btnViewTable.classList.remove("active");
      this.gridContainer.classList.remove("hidden");
      this.tableContainer.classList.add("hidden");
    } else {
      this.btnViewTable.classList.add("active");
      this.btnViewGrid.classList.remove("active");
      this.tableContainer.classList.remove("hidden");
      this.gridContainer.classList.add("hidden");
    }
  }

  /* ========================================================================
     Load & Render
     ======================================================================== */
  async loadComplaints(highlightId = null) {
    try {
      // 1. Fetch ALL complaints dynamically to compute accurate global KPIs
      this.allComplaintsCache = await window.CivicAPI.getComplaints({});
      
      // 2. Compute dynamic KPIs
      this.updateKPIMetrics(this.allComplaintsCache);

      // 3. Fetch complaints for the currently selected queue tab (Active vs. Resolved)
      const queryFilters = {
        ...this.filters,
        tab: this.currentTab // 'active' or 'resolved'
      };
      this.complaints = await window.CivicAPI.getComplaints(queryFilters);

      // 4. Update Tab badge counters
      const activeCount = this.allComplaintsCache.filter(c => c.status !== "resolved").length;
      const resolvedCount = this.allComplaintsCache.filter(c => c.status === "resolved").length;
      if (this.activeBadgeCount) this.activeBadgeCount.textContent = activeCount;
      if (this.resolvedBadgeCount) this.resolvedBadgeCount.textContent = resolvedCount;

      // 5. Update Filter chips counts
      this.updateFilterCounts(this.currentTab === "active" 
        ? this.allComplaintsCache.filter(c => c.status !== "resolved")
        : this.allComplaintsCache.filter(c => c.status === "resolved")
      );

      // 6. Render View
      this.render(highlightId);
    } catch (err) {
      console.error("[Dashboard] Error loading complaints:", err);
      window.CivicApp.showToast("Data Error", "Unable to load complaints list.", "error");
    }
  }

  /**
   * Calculates dynamic statistics accurately:
   * - Total complaints submitted: dynamically count all records in storage
   * - Critical/High active complaints: count unresolved cases with critical or high severity
   * - Average priority score: average AI score across active cases
   * - Resolution rate: percentage of all complaints marked resolved
   */
  updateKPIMetrics(allItems) {
    const total = allItems.length;
    const activeItems = allItems.filter(c => c.status !== "resolved");
    const resolvedItems = allItems.filter(c => c.status === "resolved");

    const criticalHighActive = activeItems.filter(c => c.severity === "critical" || c.severity === "high").length;
    const resolvedCount = resolvedItems.length;
    const resolvedPct = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
    
    // Average AI triage score for active issues
    const activeScores = activeItems.map(c => (c.aiTriage ? c.aiTriage.score : 50));
    const avgScore = activeScores.length > 0 
      ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length) 
      : 0;

    if (this.statTotal) this.statTotal.textContent = total;
    if (this.statCritical) this.statCritical.textContent = criticalHighActive;
    if (this.statAvgScore) this.statAvgScore.textContent = `${avgScore}/100`;
    if (this.statResolved) this.statResolved.textContent = `${resolvedPct}%`;
  }

  updateFilterCounts(items) {
    const counts = {
      all: items.length,
      critical: items.filter(i => i.severity === "critical").length,
      high: items.filter(i => i.severity === "high").length,
      medium: items.filter(i => i.severity === "medium").length,
      low: items.filter(i => i.severity === "low").length
    };

    this.severityChips.forEach(chip => {
      const sev = chip.getAttribute("data-severity");
      const countEl = chip.querySelector(".chip-count");
      if (countEl && counts[sev] !== undefined) {
        countEl.textContent = counts[sev];
      }
    });

    if (this.resultsCountEl) {
      const tabLabel = this.currentTab === "active" ? "active" : "resolved";
      this.resultsCountEl.textContent = `${this.complaints.length} ${tabLabel} issue${this.complaints.length === 1 ? '' : 's'} displayed`;
    }
  }

  render(highlightId = null) {
    if (!this.complaints || this.complaints.length === 0) {
      if (this.gridContainer) this.gridContainer.classList.add("hidden");
      if (this.tableContainer) this.tableContainer.classList.add("hidden");
      if (this.emptyState) {
        this.emptyState.classList.remove("hidden");
        const emptyTitle = this.emptyState.querySelector(".empty-title");
        const emptySub = this.emptyState.querySelector(".empty-subtitle");
        if (this.currentTab === "resolved") {
          if (emptyTitle) emptyTitle.textContent = "No Resolved Cases";
          if (emptySub) emptySub.textContent = "When complaints are marked as Resolved, they will appear permanently in this archive.";
        } else {
          if (emptyTitle) emptyTitle.textContent = "No Active Complaints Found";
          if (emptySub) emptySub.textContent = "Try adjusting your search keywords or clearing severity/category filters.";
        }
      }
      return;
    }

    if (this.emptyState) this.emptyState.classList.add("hidden");

    if (this.viewMode === "grid") {
      this.gridContainer.classList.remove("hidden");
      this.tableContainer.classList.add("hidden");
      this.renderGrid(highlightId);
    } else {
      this.tableContainer.classList.remove("hidden");
      this.gridContainer.classList.add("hidden");
      this.renderTable(highlightId);
    }
  }

  /* ========================================================================
     Grid Cards Render
     ======================================================================== */
  renderGrid(highlightId) {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = "";

    this.complaints.forEach(item => {
      const card = document.createElement("div");
      card.className = `complaint-card priority-${item.severity}`;
      if (item.id === highlightId) {
        card.style.animation = "pulse-highlight 1.5s ease-out";
      }

      const timeAgo = this.formatRelativeTime(item.createdAt);
      const score = item.aiTriage ? item.aiTriage.score : 50;
      const isResolved = item.status === "resolved";

      card.innerHTML = `
        <div class="card-media-wrapper">
          <img class="card-img" src="${item.photo}" alt="${item.title}" loading="lazy" />
          <div class="card-media-badge-overlay">
            ${this.renderSeverityBadge(item.severity)}
            <span class="card-ai-score-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              AI Score: ${score}
            </span>
          </div>
        </div>

        <div class="card-body">
          <div class="card-header-info">
            <span class="complaint-id">${item.id}</span>
            <span class="complaint-time">${timeAgo}</span>
          </div>

          <h3 class="complaint-title" title="${this.escapeHtml(item.title)}">${this.escapeHtml(item.title)}</h3>
          <p class="complaint-desc">${this.escapeHtml(item.description)}</p>

          <div class="card-location-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span class="text-truncate" title="${this.escapeHtml(item.location)}">${this.escapeHtml(item.location)}</span>
          </div>

          <div class="triage-indicator-bar" title="Priority Confidence: ${score}%">
            <div class="triage-indicator-fill fill-${item.severity}" style="width: ${score}%;"></div>
          </div>
          
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem;">
            <span class="badge badge-category">${item.category}</span>
            ${this.renderStatusBadge(item.status)}
          </div>
        </div>

        <div class="card-footer">
          <div class="card-footer-actions">
            <button class="btn btn-secondary btn-sm btn-open-detail" data-id="${item.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Triage Dossier
            </button>
            
            ${isResolved ? `
              <button class="btn btn-sm btn-reopen-case" data-id="${item.id}" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                Reopen Case
              </button>
            ` : `
              <div class="select-wrapper">
                <select class="custom-select quick-status-select" data-id="${item.id}">
                  <option value="submitted" ${item.status === 'submitted' ? 'selected' : ''}>Submitted</option>
                  <option value="triaged" ${item.status === 'triaged' ? 'selected' : ''}>Triaged</option>
                  <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                  <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>✓ Mark Resolved</option>
                </select>
              </div>
            `}
          </div>
        </div>
      `;

      // Event: Open Dossier
      card.querySelector(".btn-open-detail").addEventListener("click", () => {
        this.openDetailModal(item);
      });

      // Event: Quick Status Change
      const statusSelect = card.querySelector(".quick-status-select");
      if (statusSelect) {
        statusSelect.addEventListener("change", async (e) => {
          const newStatus = e.target.value;
          await this.handleStatusUpdate(item.id, newStatus);
        });
      }

      // Event: Reopen Case
      const reopenBtn = card.querySelector(".btn-reopen-case");
      if (reopenBtn) {
        reopenBtn.addEventListener("click", async () => {
          await this.handleReopenCase(item.id);
        });
      }

      this.gridContainer.appendChild(card);
    });
  }

  /* ========================================================================
     Table View Render
     ======================================================================== */
  renderTable(highlightId) {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = "";

    this.complaints.forEach(item => {
      const tr = document.createElement("tr");
      if (item.id === highlightId) {
        tr.style.backgroundColor = "#eff6ff";
      }

      const score = item.aiTriage ? item.aiTriage.score : 50;
      const timeAgo = this.formatRelativeTime(item.createdAt);
      const isResolved = item.status === "resolved";

      tr.innerHTML = `
        <td><img class="table-thumb" src="${item.photo}" alt="" /></td>
        <td><strong class="complaint-id">${item.id}</strong></td>
        <td class="table-title-cell">
          <div class="table-title-main" title="${this.escapeHtml(item.title)}">${this.escapeHtml(item.title)}</div>
          <div class="table-location-sub">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${this.escapeHtml(item.location)}
          </div>
        </td>
        <td><span class="badge badge-category">${item.category}</span></td>
        <td>${this.renderSeverityBadge(item.severity)}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <strong>${score}</strong>
            <div class="triage-indicator-bar" style="width: 50px; margin-bottom: 0;">
              <div class="triage-indicator-fill fill-${item.severity}" style="width: ${score}%;"></div>
            </div>
          </div>
        </td>
        <td>${this.renderStatusBadge(item.status)}</td>
        <td><span style="font-size: 0.78rem; color: var(--text-muted);">${timeAgo}</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            <button class="btn btn-secondary btn-sm btn-open-detail" data-id="${item.id}" title="Inspect Issue">
              Inspect
            </button>
            ${isResolved ? `
              <button class="btn btn-sm btn-reopen-case" data-id="${item.id}" title="Reopen Case" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a; padding: 0.35rem 0.55rem;">
                Reopen
              </button>
            ` : `
              <button class="btn btn-sm btn-resolve-quick" data-id="${item.id}" title="Quick Resolve" style="background:#dcfce7; color:#166534; border:1px solid #bbf7d0; padding: 0.35rem 0.55rem;">
                ✓ Resolve
              </button>
            `}
          </div>
        </td>
      `;

      tr.querySelector(".btn-open-detail").addEventListener("click", () => {
        this.openDetailModal(item);
      });

      const reopenBtn = tr.querySelector(".btn-reopen-case");
      if (reopenBtn) {
        reopenBtn.addEventListener("click", async () => {
          await this.handleReopenCase(item.id);
        });
      }

      const quickResolveBtn = tr.querySelector(".btn-resolve-quick");
      if (quickResolveBtn) {
        quickResolveBtn.addEventListener("click", async () => {
          await this.handleStatusUpdate(item.id, "resolved");
        });
      }

      this.tableBody.appendChild(tr);
    });
  }

  /* ========================================================================
     Detail Dossier Modal
     ======================================================================== */
  openDetailModal(item) {
    this.selectedComplaint = item;
    if (!this.detailModal || !this.detailModalBody) return;

    const score = item.aiTriage ? item.aiTriage.score : 50;
    const rationale = item.aiTriage ? item.aiTriage.urgencyRationale : "Evaluated by Municipal AI classifier.";
    const department = item.aiTriage ? item.aiTriage.department : "Public Works Authority";
    const tags = item.aiTriage && item.aiTriage.visionTags ? item.aiTriage.visionTags : ["Visual Capture Verified"];
    const dupRisk = item.aiTriage ? item.aiTriage.duplicateRisk : "None";
    const citizenName = item.citizen ? item.citizen.name : "Anonymous";
    const citizenContact = item.citizen && item.citizen.phone ? item.citizen.phone : "Unlisted";

    this.detailModalBody.innerHTML = `
      <div class="detail-grid">
        <div class="detail-photo-pane">
          <img class="detail-photo" src="${item.photo}" alt="${item.title}" />
        </div>
        
        <div class="detail-content-pane">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <span class="complaint-id" style="font-size: 0.9rem;">${item.id}</span>
              ${this.renderSeverityBadge(item.severity)}
            </div>
            <h2 style="font-size: 1.25rem; margin-bottom: 0.4rem;">${this.escapeHtml(item.title)}</h2>
            <p style="font-size: 0.88rem; line-height: 1.5; color: var(--text-secondary); margin-bottom: 0.75rem;">
              ${this.escapeHtml(item.description)}
            </p>
          </div>

          <div class="detail-ai-box">
            <div class="detail-score-row">
              <span class="detail-section-title">AI Triage Priority Assessment</span>
              <span class="detail-score-val" style="color: ${item.severity === 'critical' ? '#dc2626' : (item.severity === 'high' ? '#ea580c' : '#2563eb')}">
                ${score}<span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">/100</span>
              </span>
            </div>
            <div class="triage-indicator-bar" style="height: 8px; margin-bottom: 0.65rem;">
              <div class="triage-indicator-fill fill-${item.severity}" style="width: ${score}%;"></div>
            </div>
            <p style="font-size: 0.82rem; color: #4338ca; background: #eef2ff; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.6rem;">
              <strong>Rationale:</strong> ${rationale}
            </p>
            <div style="font-size: 0.78rem; display: flex; flex-direction: column; gap: 0.3rem;">
              <div><strong>Routing Recommendation:</strong> ${department}</div>
              <div><strong>Duplicate Hazard Risk:</strong> ${dupRisk}</div>
            </div>
          </div>

          <div>
            <div class="detail-section-title">Computer Vision Detections</div>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
              ${tags.map(t => `<span class="badge" style="background:#f1f5f9; color:#334155;"># ${t}</span>`).join('')}
            </div>
          </div>

          <div>
            <div class="detail-section-title">Incident Location & Reporter</div>
            <p style="font-size: 0.82rem; margin-bottom: 0.2rem;"><strong>Location:</strong> ${this.escapeHtml(item.location)}</p>
            <p style="font-size: 0.82rem; margin-bottom: 0.2rem;"><strong>Coordinates:</strong> ${item.coordinates.lat}, ${item.coordinates.lng}</p>
            <p style="font-size: 0.82rem;"><strong>Reported By:</strong> ${citizenName} (${citizenContact})</p>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <div class="detail-section-title">Dispatch Status Lifecycle</div>
            <div class="detail-status-bar">
              <button class="btn btn-sm btn-secondary modal-status-btn" data-status="submitted" ${item.status === 'submitted' ? 'style="border-color:var(--primary); font-weight:700;"' : ''}>
                Submitted
              </button>
              <button class="btn btn-sm btn-secondary modal-status-btn" data-status="triaged" ${item.status === 'triaged' ? 'style="border-color:var(--primary); font-weight:700;"' : ''}>
                Triaged
              </button>
              <button class="btn btn-sm btn-secondary modal-status-btn" data-status="in_progress" ${item.status === 'in_progress' ? 'style="border-color:var(--primary); font-weight:700;"' : ''}>
                In Progress
              </button>
              <button class="btn btn-sm btn-primary modal-status-btn" data-status="resolved" ${item.status === 'resolved' ? 'style="background:#16a34a;"' : ''}>
                ✓ Mark Resolved
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind status update buttons inside modal
    this.detailModalBody.querySelectorAll(".modal-status-btn").forEach(b => {
      b.addEventListener("click", async () => {
        const nextStatus = b.getAttribute("data-status");
        await this.handleStatusUpdate(item.id, nextStatus);
        this.closeDetailModal();
      });
    });

    this.detailModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeDetailModal() {
    if (!this.detailModal) return;
    this.detailModal.classList.remove("active");
    document.body.style.overflow = "";
    this.selectedComplaint = null;
  }

  /**
   * Status change handler.
   * When marked resolved:
   * - Saves permanently in application data
   * - Removes complaint from active cases queue
   * - Updates statistics immediately
   */
  async handleStatusUpdate(id, newStatus) {
    try {
      const updated = await window.CivicAPI.updateStatus(id, newStatus);
      
      if (newStatus === "resolved") {
        window.CivicApp.showToast(
          "Complaint Resolved", 
          `Case ${id} marked as Resolved and moved to the Resolved Cases Archive.`, 
          "success"
        );
      } else {
        window.CivicApp.showToast(
          "Status Updated", 
          `Case ${id} marked as ${newStatus.replace('_', ' ').toUpperCase()}.`, 
          "info"
        );
      }

      // Re-load complaints to update active/resolved queues and statistics immediately
      await this.loadComplaints();
    } catch (err) {
      console.error("[Dashboard] Status update failed:", err);
      window.CivicApp.showToast("Update Failed", err.message, "error");
    }
  }

  /**
   * Reopens a resolved complaint back into the active queue
   */
  async handleReopenCase(id) {
    try {
      await window.CivicAPI.reopenComplaint(id);
      window.CivicApp.showToast(
        "Case Reopened", 
        `Case ${id} has been restored to the Active Complaints Queue (In Progress).`, 
        "success"
      );
      // Reload immediately
      await this.loadComplaints(id);
    } catch (err) {
      console.error("[Dashboard] Reopen case failed:", err);
      window.CivicApp.showToast("Reopen Failed", err.message, "error");
    }
  }

  /* ========================================================================
     Badge & Formatting Helpers
     ======================================================================== */
  renderSeverityBadge(severity) {
    const sev = (severity || "medium").toLowerCase();
    return `
      <span class="badge badge-sev-${sev}">
        <span class="badge-dot"></span>
        ${sev}
      </span>
    `;
  }

  renderStatusBadge(status) {
    const s = (status || "submitted").toLowerCase();
    const label = s.replace("_", " ");
    return `<span class="badge badge-status-${s}">${label}</span>`;
  }

  formatRelativeTime(isoString) {
    if (!isoString) return "Recently";
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    const days = Math.floor(diffSecs / 86400);
    return `${days}d ago`;
  }

  escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

window.CivicDashboardController = CivicDashboardController;
