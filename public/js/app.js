// ============================================================
// js/app.js — Main Application Controller
// Navigation, CRUD operations, form handling, state
// ============================================================

const App = (() => {
  // ─── State ───────────────────────────────────────────────
  let products = [];
  let currentSection = "dashboard";
  let deleteTarget = null; // { id, name }

  // ─── DOM References ───────────────────────────────────────
  const dom = {
    get productsGrid()       { return document.getElementById("productsGrid"); },
    get productsEmpty()      { return document.getElementById("productsEmpty"); },
    get dashboardTableBody() { return document.getElementById("dashboardTableBody"); },
    get productForm()        { return document.getElementById("productForm"); },
    get editId()             { return document.getElementById("editId"); },
    get formTitle()          { return document.getElementById("formTitle"); },
    get formSub()            { return document.getElementById("formSub"); },
    get submitBtn()          { return document.getElementById("submitBtn"); },
    get submitBtnText()      { return document.getElementById("submitBtnText"); },
    get submitSpinner()      { return document.getElementById("submitSpinner"); },
    get globalSearch()       { return document.getElementById("globalSearch"); },
    get filterCategory()     { return document.getElementById("filterCategory"); },
    get filterStatus()       { return document.getElementById("filterStatus"); },
    get filterSort()         { return document.getElementById("filterSort"); },
    get dbStatus()           { return document.getElementById("dbStatus"); },
    get dbStatusText()       { return document.getElementById("dbStatusText"); },
    get offlineBadge()       { return document.getElementById("offlineBadge"); },
    get menuToggle()         { return document.getElementById("menuToggle"); },
    get sidebar()            { return document.getElementById("sidebar"); },
  };

  // ─── Init ─────────────────────────────────────────────────
  async function init() {
    Toast.init();
    Modal.init();
    registerServiceWorker();
    setupOfflineDetection();
    setupNavigation();
    setupForm();
    setupFilters();
    setupMobileMenu();
    await checkDBStatus();
    await loadProducts();
  }

  // ─── Service Worker ───────────────────────────────────────
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("✅ Service Worker registered"))
        .catch((err) => console.warn("SW registration failed:", err));
    }
  }

  // ─── Offline Detection ────────────────────────────────────
  function setupOfflineDetection() {
    const update = () => {
      dom.offlineBadge.style.display = navigator.onLine ? "none" : "flex";
    };
    window.addEventListener("online",  update);
    window.addEventListener("offline", update);
    update();
  }

  // ─── DB Health Check ──────────────────────────────────────
  async function checkDBStatus() {
    try {
      const res = await API.checkHealth();
      if (res.db === "Connected") {
        dom.dbStatus.className = "status-dot connected";
        dom.dbStatusText.textContent = "DB Connected";
      } else {
        dom.dbStatus.className = "status-dot error";
        dom.dbStatusText.textContent = "DB Error";
      }
    } catch {
      dom.dbStatus.className = "status-dot error";
      dom.dbStatusText.textContent = "Server Offline";
    }
  }

  // ─── Navigation ───────────────────────────────────────────
  function setupNavigation() {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        navigateTo(section);
        // Close mobile sidebar
        dom.sidebar.classList.remove("open");
      });
    });
  }

  window.navigateTo = function (section) {
    // Update nav active state
    document.querySelectorAll(".nav-item").forEach((n) => {
      n.classList.toggle("active", n.dataset.section === section);
    });
    // Show section
    document.querySelectorAll(".section").forEach((s) => {
      s.classList.toggle("active", s.id === `section-${section}`);
    });
    currentSection = section;

    // Refresh data when switching sections
    if (section === "dashboard" || section === "products") loadProducts();
    if (section === "add") resetForm();
  };

  // ─── Mobile Menu ─────────────────────────────────────────
  function setupMobileMenu() {
    dom.menuToggle.addEventListener("click", () => {
      dom.sidebar.classList.toggle("open");
    });
    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!dom.sidebar.contains(e.target) && !dom.menuToggle.contains(e.target)) {
        dom.sidebar.classList.remove("open");
      }
    });
  }

  // ─── Filters ─────────────────────────────────────────────
  function setupFilters() {
    let searchTimer;

    dom.globalSearch.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadProducts, 350); // Debounce
    });

    dom.filterCategory.addEventListener("change", loadProducts);
    dom.filterStatus.addEventListener("change",   loadProducts);
    dom.filterSort.addEventListener("change",     loadProducts);

    document.getElementById("clearFilters").addEventListener("click", () => {
      dom.globalSearch.value   = "";
      dom.filterCategory.value = "All";
      dom.filterStatus.value   = "All";
      dom.filterSort.value     = "-createdAt";
      loadProducts();
    });
  }

  // ─── CRUD: Read (Load Products) ───────────────────────────
  async function loadProducts() {
    const params = {
      search:   dom.globalSearch.value.trim(),
      category: dom.filterCategory.value,
      status:   dom.filterStatus.value,
      sort:     dom.filterSort.value,
    };

    try {
      const res = await API.getProducts(params);
      products = res.data;
      updateStats(res.stats);
      renderProducts(products);
      renderDashboardTable(products.slice(0, 5));
    } catch (err) {
      Toast.error(`Failed to load products: ${err.message}`);
    }
  }

  // ─── Render Products Grid ─────────────────────────────────
  function renderProducts(list) {
    dom.productsGrid.innerHTML = "";
    if (!list.length) {
      dom.productsEmpty.style.display = "flex";
      dom.productsGrid.style.display  = "none";
      return;
    }
    dom.productsEmpty.style.display = "none";
    dom.productsGrid.style.display  = "grid";

    list.forEach((p, i) => {
      const card = UI.renderProductCard(p);
      card.style.animationDelay = `${i * 0.04}s`;
      dom.productsGrid.appendChild(card);
    });
  }

  // ─── Render Dashboard Table ───────────────────────────────
  function renderDashboardTable(list) {
    const tbody = dom.dashboardTableBody;
    tbody.innerHTML = "";
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No products yet — add your first one!</td></tr>`;
      return;
    }
    list.forEach((p, i) => {
      const row = UI.renderTableRow(p);
      row.style.animationDelay = `${i * 0.05}s`;
      tbody.appendChild(row);
    });
  }

  // ─── Update Stats Cards ───────────────────────────────────
  function updateStats(stats) {
    animateCount("statTotalProducts", stats.totalProducts || 0);
    animateCount("statTotalItems",    stats.totalItems    || 0);
    document.getElementById("statTotalValue").textContent = UI.formatCurrency(stats.totalValue || 0);
    document.getElementById("statAvgPrice").textContent   = UI.formatCurrency(stats.avgPrice   || 0);
  }

  function animateCount(id, target) {
    const el = document.getElementById(id);
    const start = parseInt(el.textContent) || 0;
    const duration = 600;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      el.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ─── CRUD: Create & Update (Form) ─────────────────────────
  function setupForm() {
    dom.productForm.addEventListener("submit", handleFormSubmit);
    document.getElementById("resetFormBtn").addEventListener("click", resetForm);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name:        document.getElementById("fname").value.trim(),
      category:    document.getElementById("fcategory").value,
      quantity:    parseInt(document.getElementById("fquantity").value),
      price:       parseFloat(document.getElementById("fprice").value),
      description: document.getElementById("fdescription").value.trim(),
    };

    const id = dom.editId.value;
    setSubmitLoading(true);

    try {
      if (id) {
        // ── UPDATE ──
        await API.updateProduct(id, payload);
        Toast.success(`"${payload.name}" updated successfully!`);
      } else {
        // ── CREATE ──
        await API.createProduct(payload);
        Toast.success(`"${payload.name}" added to inventory!`);
      }
      resetForm();
      navigateTo("products");
    } catch (err) {
      Toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  }

  function validateForm() {
    let valid = true;
    const fields = [
      { id: "fname",      errId: "err-name",     check: (v) => v.trim().length > 0,   msg: "Product name is required" },
      { id: "fcategory",  errId: "err-category",  check: (v) => v !== "",               msg: "Please select a category" },
      { id: "fquantity",  errId: "err-quantity",  check: (v) => v >= 0 && v !== "",     msg: "Valid quantity required (≥ 0)" },
      { id: "fprice",     errId: "err-price",     check: (v) => v >= 0 && v !== "",     msg: "Valid price required (≥ 0)" },
    ];

    fields.forEach(({ id, errId, check, msg }) => {
      const el  = document.getElementById(id);
      const err = document.getElementById(errId);
      if (!check(el.value)) {
        el.classList.add("error");
        err.textContent = msg;
        valid = false;
        el.addEventListener("input", () => { el.classList.remove("error"); err.textContent = ""; }, { once: true });
      }
    });

    return valid;
  }

  function setSubmitLoading(loading) {
    dom.submitBtn.disabled      = loading;
    dom.submitBtnText.style.display  = loading ? "none" : "inline";
    dom.submitSpinner.style.display  = loading ? "inline-block" : "none";
  }

  function resetForm() {
    dom.productForm.reset();
    dom.editId.value = "";
    dom.formTitle.textContent = "Add Product";
    dom.formSub.textContent   = "Fill in the details below";
    dom.submitBtnText.textContent = "Save Product";
    document.querySelectorAll(".form-error").forEach((e) => (e.textContent = ""));
    document.querySelectorAll(".form-group input, .form-group select, .form-group textarea")
      .forEach((el) => el.classList.remove("error"));
  }

  // ─── CRUD: Edit (Populate Form) ───────────────────────────
  async function openEdit(id) {
    navigateTo("add");
    try {
      const res = await API.getProduct(id);
      const p   = res.data;
      dom.editId.value = p._id;
      document.getElementById("fname").value       = p.name;
      document.getElementById("fcategory").value   = p.category;
      document.getElementById("fquantity").value   = p.quantity;
      document.getElementById("fprice").value      = p.price;
      document.getElementById("fdescription").value = p.description || "";
      dom.formTitle.textContent = "Edit Product";
      dom.formSub.textContent   = `Editing: ${p.name}`;
      dom.submitBtnText.textContent = "Update Product";
    } catch (err) {
      Toast.error(`Could not load product: ${err.message}`);
    }
  }

  // ─── CRUD: Delete ─────────────────────────────────────────
  async function confirmDelete(id, name) {
    const confirmed = await Modal.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await API.deleteProduct(id);
      Toast.success(`"${name}" deleted successfully`);

      // Animate card removal
      const card = document.querySelector(`.product-card[data-id="${id}"]`);
      if (card) {
        card.style.transition = "all 0.3s ease";
        card.style.opacity    = "0";
        card.style.transform  = "scale(0.9)";
        setTimeout(() => card.remove(), 300);
      }

      await loadProducts(); // Refresh stats
    } catch (err) {
      Toast.error(`Delete failed: ${err.message}`);
    }
  }

  // ─── Expose Public Interface ──────────────────────────────
  return { init, openEdit, confirmDelete };
})();

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", App.init);
