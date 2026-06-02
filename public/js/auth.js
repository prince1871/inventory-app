// ============================================================
// js/auth.js — Authentication Controller
// ============================================================
const Auth = (() => {

  // ─── Helpers ─────────────────────────────────────────────
  function isLoggedIn() {
    return !!localStorage.getItem("inv_token");
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("inv_user")) || {};
    } catch {
      return {};
    }
  }

  function saveSession(data) {
    localStorage.setItem("inv_token", data.token);
    localStorage.setItem("inv_user", JSON.stringify({
      _id:   data._id,
      name:  data.name,
      email: data.email,
    }));
  }

  function clearSession() {
    localStorage.removeItem("inv_token");
    localStorage.removeItem("inv_user");
  }

  // ─── Show/Hide screens ────────────────────────────────────
  function showAuth() {
    document.getElementById("authScreen").style.display = "flex";
    document.getElementById("app").style.display = "none";
  }

  function showApp() {
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("app").style.display = "flex";

    // Populate user info in sidebar
    const user = getUser();
    const name  = user.name  || "User";
    const email = user.email || "";
    document.getElementById("userName").textContent  = name;
    document.getElementById("userEmail").textContent = email;
    document.getElementById("userAvatar").textContent = name.charAt(0).toUpperCase();
  }

  // ─── Tab switching ────────────────────────────────────────
  function setupTabs() {
    const tabLogin  = document.getElementById("tabLogin");
    const tabSignup = document.getElementById("tabSignup");
    const loginForm  = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    tabLogin.addEventListener("click", () => {
      tabLogin.classList.add("active");
      tabSignup.classList.remove("active");
      loginForm.style.display  = "flex";
      signupForm.style.display = "none";
      document.getElementById("loginError").textContent = "";
    });

    tabSignup.addEventListener("click", () => {
      tabSignup.classList.add("active");
      tabLogin.classList.remove("active");
      signupForm.style.display = "flex";
      loginForm.style.display  = "none";
      document.getElementById("signupError").textContent = "";
    });
  }

  // ─── Login ────────────────────────────────────────────────
  function setupLogin() {
    const form = document.getElementById("loginForm");
    const btn  = document.getElementById("loginBtn");
    const err  = document.getElementById("loginError");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = "";

      const email    = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!email || !password) {
        err.textContent = "Please fill in all fields.";
        return;
      }

      btn.disabled = true;
      btn.textContent = "Signing in…";

      try {
        const res  = await fetch("/api/auth/login", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          err.textContent = data.message || "Login failed.";
          return;
        }

        saveSession(data.data);
        showApp();
        App.init();
      } catch {
        err.textContent = "Network error — is the server running?";
      } finally {
        btn.disabled = false;
        btn.textContent = "Sign In";
      }
    });
  }

  // ─── Signup ───────────────────────────────────────────────
  function setupSignup() {
    const form = document.getElementById("signupForm");
    const btn  = document.getElementById("signupBtn");
    const err  = document.getElementById("signupError");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = "";

      const name     = document.getElementById("signupName").value.trim();
      const email    = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;

      if (!name || !email || !password) {
        err.textContent = "Please fill in all fields.";
        return;
      }
      if (password.length < 6) {
        err.textContent = "Password must be at least 6 characters.";
        return;
      }

      btn.disabled = true;
      btn.textContent = "Creating account…";

      try {
        const res  = await fetch("/api/auth/signup", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ name, email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          err.textContent = data.message || "Signup failed.";
          return;
        }

        saveSession(data.data);
        showApp();
        App.init();
      } catch {
        err.textContent = "Network error — is the server running?";
      } finally {
        btn.disabled = false;
        btn.textContent = "Create Account";
      }
    });
  }

  // ─── Logout ───────────────────────────────────────────────
  function setupLogout() {
    document.getElementById("logoutBtn").addEventListener("click", () => {
      clearSession();
      showAuth();
    });
  }

  // ─── Init ─────────────────────────────────────────────────
  function init() {
    setupTabs();
    setupLogin();
    setupSignup();
    setupLogout();

    if (isLoggedIn()) {
      showApp();
    } else {
      showAuth();
    }
  }

  return { init, isLoggedIn, getUser, clearSession };
})();