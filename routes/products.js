// ============================================================
// routes/products.js — Full CRUD API Routes
// ============================================================
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// ─── Helper: Async Error Handler ─────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─── GET /api/products ────────────────────────────────────
// Fetch all products (with optional search & filter)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, category, status, sort = "-createdAt" } = req.query;

    // Build query filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category && category !== "All") filter.category = category;
    if (status && status !== "All") filter.status = status;

    const products = await Product.find(filter).sort(sort);
    const stats = await Product.getStats();

    res.json({
      success: true,
      count: products.length,
      stats,
      data: products,
    });
  })
);

// ─── GET /api/products/:id ────────────────────────────────
// Fetch single product
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  })
);

// ─── POST /api/products ───────────────────────────────────
// Create a new product
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  })
);

// ─── PUT /api/products/:id ────────────────────────────────
// Update an existing product
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      {
        new: true,          // Return updated doc
        runValidators: true, // Run schema validators on update
      }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  })
);

// ─── DELETE /api/products/:id ─────────────────────────────
// Delete a product
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      message: `Product "${product.name}" deleted successfully`,
      data: product,
    });
  })
);

// ─── DELETE /api/products ─────────────────────────────────
// Delete ALL products (use with caution!)
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const result = await Product.deleteMany({});
    res.json({
      success: true,
      message: `${result.deletedCount} products deleted`,
    });
  })
);

// ─── Global Error Handler for this router ─────────────────
router.use((err, req, res, next) => {
  console.error("Route Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for field: ${field}`,
    });
  }

  // Mongoose cast error (invalid ID)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  res.status(500).json({ success: false, message: "Internal server error" });
});

module.exports = router;
