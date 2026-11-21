/**
 * CivicLens - Citizen Complaint Submission & Status Tracking
 * Member 1: Frontend Architecture & UI
 * Handles step-by-step form validation, photo drag-and-drop & preview, GPS Geolocation, and citizen ticket tracking.
 */

class ComplaintFormHandler {
  constructor() {
    this.form = document.getElementById("complaintForm");
    this.modal = document.getElementById("submitModal");
    this.openBtn = document.getElementById("openSubmitModalBtn");
    this.closeBtns = document.querySelectorAll(".close-submit-modal-btn");
    
    // Photo elements
    this.dropzone = document.getElementById("photoDropzone");
    this.fileInput = document.getElementById("photoInput");
    this.previewContainer = document.getElementById("photoPreviewContainer");
    this.previewImg = document.getElementById("previewThumbImg");
    this.previewFilename = document.getElementById("previewFilename");
    this.previewFilesize = document.getElementById("previewFilesize");
    this.removePhotoBtn = document.getElementById("removePhotoBtn");

    // Location elements
    this.locationInput = document.getElementById("locationInput");
    this.locateBtn = document.getElementById("getCurrentLocationBtn");
    this.locationPill = document.getElementById("locationCoordPill");
    this.locationPillText = document.getElementById("locationCoordText");

    // Sample presets for quick judge demos
    this.presetBtns = document.querySelectorAll(".demo-preset-btn");

    this.currentPhotoBase64 = null;
    this.currentCoords = null;

    this.init();
  }

  init() {
    if (!this.form) return;

    // Modal triggers (if running inside modal on dashboard)
    if (this.openBtn) {
      this.openBtn.addEventListener("click", () => this.openModal());
    }
    this.closeBtns.forEach(btn => {
      btn.addEventListener("click", () => this.closeModal());
    });

    // Close on backdrop click
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    // Photo drag & drop
    this.initPhotoUpload();

    // Geolocation
    this.initLocationPicker();

    // Demo Presets (enables judges to autofill realistic test complaints in 1 click)
    this.initDemoPresets();

    // Form submit
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  openModal() {
    if (!this.modal) return;
    this.modal.classList.add("active");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      const titleInput = document.getElementById("complaintTitle");
      if (titleInput) titleInput.focus();
    }, 100);
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  /* ========================================================================
     Photo Upload & Drag-and-Drop Handlers
     ======================================================================== */
  initPhotoUpload() {
    if (!this.dropzone || !this.fileInput) return;

    this.dropzone.addEventListener("click", () => this.fileInput.click());

    this.fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        this.processFile(e.target.files[0]);
      }
    });

    ["dragenter", "dragover"].forEach(evtName => {
      this.dropzone.addEventListener(evtName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach(evtName => {
      this.dropzone.addEventListener(evtName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove("dragover");
      });
    });

    this.dropzone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files[0]) {
        this.processFile(dt.files[0]);
      }
    });

    if (this.removePhotoBtn) {
      this.removePhotoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.clearPhoto();
      });
    }
  }

  processFile(file) {
    if (!file.type.startsWith("image/")) {
      window.CivicApp.showToast("Invalid File", "Please upload an image file (PNG, JPG, WebP).", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      window.CivicApp.showToast("File Too Large", "Maximum image size is 10 MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentPhotoBase64 = e.target.result;
      this.previewImg.src = this.currentPhotoBase64;
      this.previewFilename.textContent = file.name;
      this.previewFilesize.textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      
      this.dropzone.classList.add("hidden");
      this.previewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }

  clearPhoto() {
    this.currentPhotoBase64 = null;
    if (this.fileInput) this.fileInput.value = "";
    if (this.previewImg) this.previewImg.src = "";
    if (this.previewFilename) this.previewFilename.textContent = "";
    if (this.previewFilesize) this.previewFilesize.textContent = "";
    if (this.previewContainer) this.previewContainer.classList.add("hidden");
    if (this.dropzone) this.dropzone.classList.remove("hidden");
  }

  /* ========================================================================
     Location & GPS Handlers
     ======================================================================== */
  initLocationPicker() {
    if (!this.locateBtn || !this.locationInput) return;

    this.locateBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        window.CivicApp.showToast("GPS Unavailable", "Geolocation is not supported by your browser.", "warning");
        return;
      }

      this.locateBtn.classList.add("locating");
      this.locateBtn.innerHTML = `
        <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2 A 10 10 0 0 1 22 12" stroke-width="3"/>
        </svg>
        Locating...
      `;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.currentCoords = {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5))
          };

          if (!this.locationInput.value) {
            this.locationInput.value = `Near Municipal Grid (${this.currentCoords.lat}, ${this.currentCoords.lng})`;
          }

          if (this.locationPill && this.locationPillText) {
            this.locationPillText.textContent = `GPS: ${this.currentCoords.lat}, ${this.currentCoords.lng} (±${Math.round(pos.coords.accuracy)}m)`;
            this.locationPill.classList.remove("hidden");
          }

          this.resetLocateBtn(true);
          window.CivicApp.showToast("Location Captured", "GPS coordinates pinpointed successfully.", "success");
        },
        (err) => {
          console.warn("[GPS] Geolocation error:", err.message);
          this.currentCoords = { lat: 37.7749, lng: -122.4194 };
          if (!this.locationInput.value) {
            this.locationInput.value = "Central Municipal District, Ward 4";
          }
          if (this.locationPill && this.locationPillText) {
            this.locationPillText.textContent = `GPS: 37.7749, -122.4194`;
            this.locationPill.classList.remove("hidden");
          }
          this.resetLocateBtn(false);
          window.CivicApp.showToast("Location Set", "Applied civic center reference for demonstration.", "info");
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    });
  }

  resetLocateBtn(success) {
    this.locateBtn.classList.remove("locating");
    this.locateBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="22" y1="12" x2="18" y2="12"/>
        <line x1="6" y1="12" x2="2" y2="12"/>
        <line x1="12" y1="6" x2="12" y2="2"/>
        <line x1="12" y1="22" x2="12" y2="18"/>
      </svg>
      ${success ? "Location Found" : "Use My Location"}
    `;
  }

  /* ========================================================================
     Hackathon Judge Demo Quick Presets
     ======================================================================== */
  initDemoPresets() {
    this.presetBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-preset");
        if (type === "pothole") {
          document.getElementById("complaintTitle").value = "Exposed Rebar in Main Street Pothole";
          document.getElementById("complaintCategory").value = "Roads & Infrastructure";
          document.getElementById("complaintDesc").value = "Deep fissure in left lane right before the bridge. Cars swerving dangerously into oncoming traffic.";
          this.locationInput.value = "104 North Main Street at River Bridge, Ward 3";
          this.currentCoords = { lat: 37.7725, lng: -122.4180 };
          this.setDemoPhoto("Deep Asphalt Trench", "road");
        } else if (type === "wire") {
          document.getElementById("complaintTitle").value = "Sparking Overhead Cable Over Sidewalk";
          document.getElementById("complaintCategory").value = "Electricity & Lighting";
          document.getElementById("complaintDesc").value = "Cable snapped during high winds and is dangling 4 feet above the pedestrian walkway with intermittent sparks.";
          this.locationInput.value = "Pine Street & 12th Avenue, Ward 5";
          this.currentCoords = { lat: 37.7850, lng: -122.4100 };
          this.setDemoPhoto("Live Sparking Cable", "electric");
        } else if (type === "drain") {
          document.getElementById("complaintTitle").value = "Severe Storm Drain Overflow Submerging Sidewalk";
          document.getElementById("complaintCategory").value = "Water Supply & Drainage";
          document.getElementById("complaintDesc").value = "Gutter drain completely obstructed by silt. Water level rising quickly towards commercial shop thresholds.";
          this.locationInput.value = "300 Market Promenade, Ward 1";
          this.currentCoords = { lat: 37.7810, lng: -122.4040 };
          this.setDemoPhoto("Storm Drain Silt Blockage", "water");
        }

        if (this.locationPill && this.locationPillText) {
          this.locationPillText.textContent = `GPS: ${this.currentCoords.lat}, ${this.currentCoords.lng}`;
          this.locationPill.classList.remove("hidden");
        }

        window.CivicApp.showToast("Example Loaded", `Loaded sample ${type} details for fast testing.`, "info");
      });
    });
  }

  setDemoPhoto(title, iconType) {
    const svgDataUri = window.CivicMockData.generateIssueSvg(
      title,
      '<stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/>',
      iconType
    );
    this.currentPhotoBase64 = svgDataUri;
    this.previewImg.src = svgDataUri;
    this.previewFilename.textContent = `${iconType}_evidence_capture.svg`;
    this.previewFilesize.textContent = "1.8 MB (Verified)";
    this.dropzone.classList.add("hidden");
    this.previewContainer.classList.remove("hidden");
  }

  /* ========================================================================
     Form Submission Handler
     ======================================================================== */
  async handleSubmit(e) {
    e.preventDefault();

    const title = document.getElementById("complaintTitle").value.trim();
    const category = document.getElementById("complaintCategory").value;
    const description = document.getElementById("complaintDesc").value.trim();
    const location = this.locationInput.value.trim();
    
    // Auto-fill from citizen session if available
    const currentUser = window.CivicAuth ? window.CivicAuth.getCurrentUser() : null;
    const nameInput = document.getElementById("citizenName");
    const phoneInput = document.getElementById("citizenPhone");
    const citizenName = nameInput ? nameInput.value.trim() : (currentUser ? currentUser.name : "");
    const citizenPhone = phoneInput ? phoneInput.value.trim() : (currentUser ? currentUser.phone : "");
    const anonCheckbox = document.getElementById("anonymousCheckbox");
    const isAnonymous = anonCheckbox ? anonCheckbox.checked : false;

    if (!title || !category || !description || !location) {
      window.CivicApp.showToast("Required Fields Missing", "Please provide a title, category, location, and description.", "warning");
      return;
    }

    const submitBtn = this.form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2 A 10 10 0 0 1 22 12" stroke-width="3"/>
      </svg>
      Submitting Complaint...
    `;

    try {
      const payload = {
        title,
        category,
        description,
        location,
        coordinates: this.currentCoords || { lat: 37.7749, lng: -122.4194 },
        photo: this.currentPhotoBase64,
        name: citizenName,
        phone: citizenPhone,
        isAnonymous
      };

      // Call API Service
      const result = await window.CivicAPI.submitComplaint(payload);

      // Reset form & UI
      this.form.reset();
      this.clearPhoto();
      this.currentCoords = null;
      if (this.locationPill) this.locationPill.classList.add("hidden");
      this.closeModal();

      // Show high-impact success alert with Ticket ID
      window.CivicApp.showToast(
        `Ticket Created: ${result.id}`,
        `Complaint logged successfully. Assigned to: ${result.aiTriage.department}.`,
        "success",
        6000
      );

      // If a ticket confirmation banner exists on submit.html, display it
      const confirmBanner = document.getElementById("submissionSuccessBanner");
      if (confirmBanner) {
        confirmBanner.classList.remove("hidden");
        const ticketIdEl = document.getElementById("newTicketIdDisplay");
        const deptEl = document.getElementById("newTicketDeptDisplay");
        if (ticketIdEl) ticketIdEl.textContent = result.id;
        if (deptEl) deptEl.textContent = `Assigned to: ${result.aiTriage.department}`;
        confirmBanner.scrollIntoView({ behavior: "smooth" });
      }

      // Refresh Citizen Tracker on submit.html
      if (typeof window.renderCitizenTickets === "function") {
        window.renderCitizenTickets();
      }

      // Refresh Dashboard on index.html if active
      if (window.CivicDashboard) {
        window.CivicDashboard.loadComplaints(result.id);
      }
    } catch (err) {
      console.error("[Submit] Error submitting complaint:", err);
      window.CivicApp.showToast("Submission Error", err.message || "Failed to submit complaint.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
}

/* ==========================================================================
   Citizen Ticket Tracker Component (for submit.html)
   Allows citizens to track their complaints, view statuses, and see Ticket IDs
   ========================================================================== */
window.initCitizenTracker = function() {
  const trackerContainer = document.getElementById("citizenTicketsList");
  const searchInput = document.getElementById("ticketSearchInput");
  const filterStatusSelect = document.getElementById("ticketStatusFilter");
  const totalCountBadge = document.getElementById("citizenTotalTicketsCount");

  if (!trackerContainer) return;

  async function renderTickets() {
    try {
      const q = searchInput ? searchInput.value.trim().toLowerCase() : "";
      const statusFilter = filterStatusSelect ? filterStatusSelect.value : "all";

      let allComplaints = await window.CivicAPI.getComplaints({});
      
      if (totalCountBadge) {
        totalCountBadge.textContent = `${allComplaints.length} Total Reports`;
      }

      // Apply filtering
      let list = allComplaints;
      if (statusFilter && statusFilter !== "all") {
        list = list.filter(c => c.status === statusFilter);
      }
      if (q) {
        list = list.filter(c => 
          c.id.toLowerCase().includes(q) ||
          (c.title && c.title.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q))
        );
      }

      if (list.length === 0) {
        trackerContainer.innerHTML = `
          <div class="empty-state" style="padding: 2.5rem 1rem;">
            <div class="empty-icon" style="width:44px; height:44px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h4 style="font-size:1.05rem; font-weight:700; margin-bottom:0.25rem;">No Complaints Found</h4>
            <p style="font-size:0.84rem; color:var(--text-muted);">Try adjusting your search query or status filter.</p>
          </div>
        `;
        return;
      }

      trackerContainer.innerHTML = list.map(item => {
        const timeAgo = formatTimeAgo(item.createdAt);
        const dept = item.aiTriage && item.aiTriage.department ? item.aiTriage.department : "Public Works";
        const st = (item.status || "submitted").toLowerCase();

        // Citizen friendly stage mapping
        const isReceived = true;
        const isTriaged = st === "triaged" || st === "in_progress" || st === "resolved";
        const isInProgress = st === "in_progress" || st === "resolved";
        const isResolved = st === "resolved";

        return `
          <div class="citizen-ticket-card priority-${item.severity}">
            <div class="citizen-ticket-thumb-wrap">
              <img class="citizen-ticket-thumb" src="${item.photo}" alt="${escapeHtml(item.title)}" />
            </div>

            <div class="citizen-ticket-info">
              <div class="citizen-ticket-header">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                  <span class="complaint-id" title="Your Official Ticket ID">${item.id}</span>
                  <span class="badge badge-category">${item.category}</span>
                  ${renderSeverityBadge(item.severity)}
                </div>
                ${renderStatusBadge(item.status)}
              </div>

              <h4 class="citizen-ticket-title">${escapeHtml(item.title)}</h4>
              <p class="citizen-ticket-desc">${escapeHtml(item.description)}</p>

              <!-- Plain English Progression Pipeline -->
              <div class="citizen-progress-pipeline">
                <span class="pipeline-step ${isReceived ? 'completed' : ''}">✓ Received</span>
                <span class="pipeline-arrow">→</span>
                <span class="pipeline-step ${isTriaged ? 'completed' : (st === 'submitted' ? 'active' : '')}">🔍 Under Review</span>
                <span class="pipeline-arrow">→</span>
                <span class="pipeline-step ${st === 'in_progress' ? 'active' : (isResolved ? 'completed' : '')}">👷 In Progress</span>
                <span class="pipeline-arrow">→</span>
                <span class="pipeline-step ${isResolved ? 'completed' : ''}">✅ Resolved</span>
              </div>

              <div class="citizen-ticket-footer">
                <div class="citizen-ticket-meta">
                  <span>📍 ${escapeHtml(item.location)}</span>
                  <span>⏱️ ${timeAgo}</span>
                  <span>🏢 ${escapeHtml(dept)}</span>
                </div>
                <button type="button" class="btn-copy-ticket" onclick="navigator.clipboard.writeText('${item.id}'); window.CivicApp.showToast('Copied', 'Ticket ID ${item.id} copied to clipboard.', 'info');">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy Ticket ID
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    } catch (err) {
      console.error("[CitizenTracker] Error rendering tickets:", err);
      trackerContainer.innerHTML = `<p style="color:var(--sev-critical-text); padding:1rem;">Failed to load complaints.</p>`;
    }
  }

  function formatTimeAgo(iso) {
    if (!iso) return "Recently";
    const diff = Math.floor((new Date() - new Date(iso)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function renderSeverityBadge(sev) {
    const s = (sev || "medium").toLowerCase();
    return `<span class="badge badge-sev-${s}"><span class="badge-dot"></span>${s}</span>`;
  }

  function renderStatusBadge(st) {
    const s = (st || "submitted").toLowerCase();
    let label = "Complaint Received";
    if (s === "triaged") label = "Under Review";
    else if (s === "in_progress") label = "In Progress";
    else if (s === "resolved") label = "Resolved";
    return `<span class="badge badge-status-${s}">${label}</span>`;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(renderTickets, 200);
    });
  }

  if (filterStatusSelect) {
    filterStatusSelect.addEventListener("change", renderTickets);
  }

  window.renderCitizenTickets = renderTickets;
  renderTickets();
};

window.ComplaintFormHandler = ComplaintFormHandler;
