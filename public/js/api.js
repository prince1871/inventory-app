// ============================================================
// js/api.js — Fetch API Layer (Frontend ↔ Backend Bridge)
// All communication with the Express/MongoDB backend lives here
// ============================================================

const API_BASE = "/api";

// ─── Core Fetch Wrapper ───────────────────────────────────
/**
 * Generic request handler.
 * Handles JSON parsing, errors, and offline detection.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Throw structured error from server
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (err) {
    // Distinguish network errors from API errors
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Network error — check your connection or server");
    }
    throw err;
  }
}

// ─── Products API ─────────────────────────────────────────

/**
 * GET /api/products
 * Fetch all products with optional filters
 * @param {Object} params - { search, category, status, sort }
 */
async function getProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.search)   query.set("search",   params.search);
  if (params.category && params.category !== "All") query.set("category", params.category);
  if (params.status   && params.status !== "All")   query.set("status",   params.status);
  if (params.sort)     query.set("sort",     params.sort);

  const qs = query.toString();
  return request(`/products${qs ? "?" + qs : ""}`);
}

/**
 * GET /api/products/:id
 * Fetch a single product by ID
 */
async function getProduct(id) {
  return request(`/products/${id}`);
}

/**
 * POST /api/products
 * Create a new product
 * @param {Object} productData - { name, category, quantity, price, description }
 */
async function createProduct(productData) {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
}

/**
 * PUT /api/products/:id
 * Update an existing product
 * @param {string} id - MongoDB ObjectId
 * @param {Object} updates - Fields to update
 */
async function updateProduct(id, updates) {
  return request(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * DELETE /api/products/:id
 * Delete a product by ID
 */
async function deleteProduct(id) {
  return request(`/products/${id}`, { method: "DELETE" });
}

/**
 * GET /api/health
 * Check server & DB connection status
 */
async function checkHealth() {
  return request("/health");
}

// Export for use in other JS files
window.API = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  checkHealth,
};
