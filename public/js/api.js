// ============================================================
// js/api.js — Fetch API Layer with JWT Auth
// ============================================================
const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("inv_token");
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // If token expired, log out
    if (response.status === 401) {
      localStorage.removeItem("inv_token");
      localStorage.removeItem("inv_user");
      location.reload();
      return;
    }

    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Network error — check your connection");
    }
    throw err;
  }
}

async function getProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.search)   query.set("search",   params.search);
  if (params.category && params.category !== "All") query.set("category", params.category);
  if (params.status   && params.status   !== "All") query.set("status",   params.status);
  if (params.sort)     query.set("sort",     params.sort);
  const qs = query.toString();
  return request(`/products${qs ? "?" + qs : ""}`);
}

async function getProduct(id)            { return request(`/products/${id}`); }
async function createProduct(data)       { return request("/products", { method: "POST", body: JSON.stringify(data) }); }
async function updateProduct(id, data)   { return request(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }); }
async function deleteProduct(id)         { return request(`/products/${id}`, { method: "DELETE" }); }
async function checkHealth()             { return request("/health"); }

window.API = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, checkHealth };
