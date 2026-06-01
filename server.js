const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");
// ============================================================
// server.js — Main Entry Point
// ============================================================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const productRoutes = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// ─── API Routes ───────────────────────────────────────────
app.use("/api/products", productRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Inventory API is running",
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Fallback: serve index.html for any non-API route (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── MongoDB Connection ───────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process on DB failure
  }
};

// ─── Start Server ─────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Inventory API: http://localhost:${PORT}/api/products`);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
