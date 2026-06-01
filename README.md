# INVNTRY — Full-Stack Inventory Management System
> Built with HTML · CSS · JavaScript · Node.js · Express · MongoDB

---

## 📁 Project Structure

```
inventory-app/
├── server.js              ← Express server entry point
├── package.json           ← Dependencies & scripts
├── .env                   ← Environment variables (MongoDB URI, PORT)
│
├── models/
│   └── Product.js         ← Mongoose schema (auto status, auto SKU)
│
├── routes/
│   └── products.js        ← Full CRUD API: GET, POST, PUT, DELETE
│
└── public/                ← Frontend (served statically by Express)
    ├── index.html         ← Single-page app shell
    ├── manifest.json      ← PWA manifest
    ├── service-worker.js  ← Offline caching
    ├── css/
    │   └── style.css      ← All styles, animations, hover effects
    └── js/
        ├── api.js         ← Fetch API layer (talks to backend)
        ├── ui.js          ← Rendering helpers, toasts, modals
        └── app.js         ← Main CRUD controller
```

---

## 🚀 Step-by-Step Setup Guide

### STEP 1 — Install Node.js

Download from https://nodejs.org (choose LTS version).
Verify installation:
```bash
node --version    # Should show v18+ or v20+
npm --version     # Should show 9+
```

---

### STEP 2 — Install MongoDB

**Option A: Local MongoDB (Recommended for offline)**

1. Download from https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. Start the MongoDB service:
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community

   # Windows — MongoDB runs as a service automatically after install

   # Linux (Ubuntu)
   sudo systemctl start mongod
   sudo systemctl enable mongod   # Auto-start on boot
   ```
4. Verify it's running:
   ```bash
   mongosh   # Should open MongoDB shell — type 'exit' to quit
   ```

**Option B: MongoDB Atlas (Cloud — always available)**

1. Go to https://cloud.mongodb.com
2. Create a free account → Create a free M0 cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/inventoryDB
   ```

---

### STEP 3 — Configure Environment Variables

Open the `.env` file and set your MongoDB URI:

```env
# For LOCAL MongoDB:
MONGO_URI=mongodb://localhost:27017/inventoryDB

# For MongoDB Atlas (cloud):
MONGO_URI=mongodb+srv://yourUser:yourPassword@cluster0.xxxxx.mongodb.net/inventoryDB

PORT=5000
```

> ⚠️  Never commit your .env file to Git. Add it to .gitignore!

---

### STEP 4 — Install Dependencies

Open your terminal in the project folder:
```bash
cd inventory-app
npm install
```

This installs: express, mongoose, cors, dotenv, nodemon

---

### STEP 5 — Run the App

```bash
# Development mode (auto-restarts on file changes):
npm run dev

# Production mode:
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on http://localhost:5000
📦 Inventory API: http://localhost:5000/api/products
```

Open your browser: **http://localhost:5000**

---

## 🔌 How the MongoDB → Fetch API Connection Works

Here's the complete data flow explained step by step:

```
  [Browser]              [Express Server]         [MongoDB]
     │                         │                      │
     │  fetch('/api/products') │                      │
     │────────────────────────►│                      │
     │                         │  Product.find({})    │
     │                         │─────────────────────►│
     │                         │                      │
     │                         │  [documents]         │
     │                         │◄─────────────────────│
     │                         │                      │
     │  { success, data: [] }  │                      │
     │◄────────────────────────│                      │
     │                         │                      │
  [Render UI]
```

### The 4 CRUD Operations via Fetch API:

```javascript
// CREATE  →  POST /api/products
fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'iPhone', category: 'Electronics', quantity: 10, price: 500000 })
})

// READ    →  GET /api/products
fetch('/api/products?category=Electronics&sort=-price')

// UPDATE  →  PUT /api/products/:id
fetch('/api/products/64abc123...', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: 5 })
})

// DELETE  →  DELETE /api/products/:id
fetch('/api/products/64abc123...', { method: 'DELETE' })
```

---

## 📡 API Reference

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | /api/products          | Get all products (filterable)      |
| GET    | /api/products/:id      | Get single product                 |
| POST   | /api/products          | Create new product                 |
| PUT    | /api/products/:id      | Update product                     |
| DELETE | /api/products/:id      | Delete product                     |
| GET    | /api/health            | Server & DB status check           |

### Query Parameters for GET /api/products:
- `?search=iphone`         — Search by name, SKU, description
- `?category=Electronics`  — Filter by category
- `?status=In Stock`       — Filter by stock status
- `?sort=-price`           — Sort (prefix `-` for descending)

---

## ✨ Features

- **Full CRUD** — Create, Read, Update, Delete products
- **Auto Status** — Stock status updates automatically based on quantity
- **Auto SKU** — SKUs generated automatically (e.g. ELE-AB12C)
- **Search & Filter** — Real-time debounced search + filter by category/status
- **Live Stats** — Animated counters for total products, value, items, avg price
- **Offline Ready** — Service Worker caches assets; works without internet
- **PWA** — Installable on mobile/desktop
- **Toast Notifications** — Success/error feedback for every action
- **Confirm Modal** — Animated confirmation before deletion
- **Responsive** — Works on mobile, tablet, desktop
- **Dark Theme** — Industrial dark aesthetic with neon cyan accents

---

## 🐛 Troubleshooting

**"MongoDB Connection Error"**
- Is `mongod` running? Run `sudo systemctl start mongod` (Linux) or check Services (Windows)
- Check your MONGO_URI in `.env` — no spaces, correct password

**"Cannot GET /"**
- Make sure you're in the right directory: `cd inventory-app`
- Run `npm install` first

**Port already in use**
- Change `PORT=5001` in `.env`
- Or kill the process: `lsof -ti:5000 | xargs kill -9` (macOS/Linux)

**Offline not working**
- Service Workers only work on `localhost` or HTTPS
- Open DevTools → Application → Service Workers → check registration
