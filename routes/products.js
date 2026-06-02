// ============================================================
// routes/products.js — CRUD Routes (User Separated)
// ============================================================
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// All routes below are protected — user must be logged in
router.use(protect);

// ─── GET /api/products ────────────────────────────────────
router.get("/", asyncHandler(async (req, res) => {
  const { search, category, status, sort = "-createdAt" } = req.query;

  const filter = { owner: req.user._id };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku:  { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (category && category !== "All") filter.category = category;
  if (status   && status   !== "All") filter.status   = status;

  const products = await Product.find(filter).sort(sort);

  const stats = await Product.aggregate([
    { $match: { owner: req.user._id } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalValue:    { $sum: { $multiply: ["$price", "$quantity"] } },
        totalItems:    { $sum: "$quantity" },
        avgPrice:      { $avg: "$price" },
      },
    },
  ]);

  res.json({
    success: true,
    count: products.length,
    stats: stats[0] || { totalProducts: 0, totalValue: 0, totalItems: 0, avgPrice: 0 },
    data: products,
  });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, data: product });
}));

router.post("/", asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ success: true, message: "Product created successfully", data: product });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, message: "Product updated successfully", data: product });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, message: `"${product.name}" deleted successfully` });
}));

router.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }
  res.status(500).json({ success: false, message: "Internal server error" });
});

module.exports = router;
