// ============================================================
// models/Product.js — Mongoose Schema & Model
// ============================================================
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Electronics", "Clothing", "Food", "Tools", "Furniture", "Other"],
      default: "Other",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Pre-save Middleware ──────────────────────────────────
// Automatically set status based on quantity
productSchema.pre("save", function (next) {
  if (this.quantity === 0) {
    this.status = "Out of Stock";
  } else if (this.quantity <= 10) {
    this.status = "Low Stock";
  } else {
    this.status = "In Stock";
  }

  // Auto-generate SKU if not provided
  if (!this.sku) {
    const prefix = this.category.substring(0, 3).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.sku = `${prefix}-${rand}`;
  }

  next();
});

// Same logic for findOneAndUpdate
productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.quantity !== undefined) {
    if (update.quantity === 0) {
      update.status = "Out of Stock";
    } else if (update.quantity <= 10) {
      update.status = "Low Stock";
    } else {
      update.status = "In Stock";
    }
  }
  next();
});

// ─── Static Methods ───────────────────────────────────────
productSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        totalItems: { $sum: "$quantity" },
        avgPrice: { $avg: "$price" },
      },
    },
  ]);
  return stats[0] || { totalProducts: 0, totalValue: 0, totalItems: 0, avgPrice: 0 };
};

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
