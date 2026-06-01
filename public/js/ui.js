// ============================================================
// js/ui.js — UI Helpers: Toast, Modal, Rendering Utilities
// ============================================================

// ─── Toast Notifications ──────────────────────────────────
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById("toastContainer");
  },

  show(message, type = "info", duration = 3500) {
    const icons = { success: "✓", error: "✕", info: "ℹ" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-msg">${message}</span>
    `;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("removing");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }, duration);
  },

  success: (msg) => Toast.show(msg, "success"),
  error:   (msg) => Toast.show(msg, "error", 5000),
  info:    (msg) => Toast.show(msg, "info"),
};

// ─── Confirm Modal ─────────────────────────────────────────
const Modal = {
  overlay: null,
  confirmBtn: null,
  cancelBtn: null,
  bodyEl: null,
  _resolve: null,

  init() {
    this.overlay    = document.getElementById("modalOverlay");
    this.confirmBtn = document.getElementById("modalConfirm");
    this.cancelBtn  = document.getElementById("modalCancel");
    this.bodyEl     = document.getElementById("modalBody");

    this.confirmBtn.addEventListener("click", () => this._close(true));
    this.cancelBtn.addEventListener("click",  () => this._close(false));
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this._close(false);
    });
  },

  /**
   * Show confirm modal and return a promise resolving to true/false
   * @param {string} message
   */
  confirm(message = "This action cannot be undone.") {
    this.bodyEl.textContent = message;
    this.overlay.classList.add("active");
    return new Promise((resolve) => { this._resolve = resolve; });
  },

  _close(result) {
    this.overlay.classList.remove("active");
    if (this._resolve) { this._resolve(result); this._resolve = null; }
  },
};

// ─── Render Helpers ───────────────────────────────────────

function statusBadge(status) {
  const map = {
    "In Stock":     "badge-in",
    "Low Stock":    "badge-low",
    "Out of Stock": "badge-out",
  };
  return `<span class="badge ${map[status] || 'badge-out'}">${status}</span>`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n) {
  return new Intl.NumberFormat("en-NG").format(n);
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/**
 * Render a product card for the grid view
 */
function renderProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.id = product._id;
  card.innerHTML = `
    <div class="product-card-header">
      <div class="product-name">${escapeHtml(product.name)}</div>
      <div class="product-actions">
        <button class="btn btn-icon edit" title="Edit" onclick="App.openEdit('${product._id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-icon delete" title="Delete" onclick="App.confirmDelete('${product._id}', '${escapeHtml(product.name)}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="product-meta">
      <div class="product-row">
        <span class="cat-badge">${product.category}</span>
        ${statusBadge(product.status)}
      </div>
      <div class="product-row">
        <span class="product-row-label">Quantity</span>
        <span class="product-row-value">${formatNumber(product.quantity)} units</span>
      </div>
      ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ""}
      <div class="product-price">${formatCurrency(product.price)}</div>
      <div class="product-sku">SKU: ${product.sku || "—"} · ${timeAgo(product.createdAt)}</div>
    </div>
  `;
  return card;
}

/**
 * Render a product row for the dashboard table
 */
function renderTableRow(product) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><strong>${escapeHtml(product.name)}</strong></td>
    <td style="font-size:0.72rem;color:var(--text-muted)">${product.sku || "—"}</td>
    <td><span class="cat-badge">${product.category}</span></td>
    <td>${formatNumber(product.quantity)}</td>
    <td>${formatCurrency(product.price)}</td>
    <td>${statusBadge(product.status)}</td>
  `;
  return tr;
}

/**
 * Sanitize output — prevent XSS
 */
function escapeHtml(str = "") {
  const el = document.createElement("div");
  el.textContent = str;
  return el.innerHTML;
}

// Expose
window.Toast  = Toast;
window.Modal  = Modal;
window.UI = { renderProductCard, renderTableRow, statusBadge, formatCurrency, formatNumber, escapeHtml };
