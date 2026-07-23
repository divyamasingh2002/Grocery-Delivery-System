// common.js
// Shared helper functions used on every page:
//   - API_URL  : base URL of the Express backend
//   - apiRequest() : wrapper around fetch() that adds the JWT token
//   - navbar rendering, logout, auth guards
//   - small UI helpers (showMessage, formatPrice)
//
// This file is loaded on every HTML page so the navbar and helper
// functions are always available.

// Base URL of the Express + MongoDB backend API.
// Change this one line if the backend runs somewhere else.
const API_URL = "http://localhost:5000/api";

// ---------------------------------------------------------------------------
// Authentication helpers (LocalStorage)
// ---------------------------------------------------------------------------

// Returns the saved JWT token (or null if not logged in).
export function getToken() {
  return localStorage.getItem("token");
}

// Returns the saved user object (or null).
export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// Is the visitor logged in?
export function isLoggedIn() {
  return !!getToken();
}

// Is the logged-in user an admin?
export function isAdmin() {
  const user = getUser();
  return user && user.role === "admin";
}

// Is the logged-in user a delivery user?
export function isDelivery() {
  const user = getUser();
  return user && user.role === "delivery";
}

// Returns the current logged-in user object (or null).
// Alias for getUser() to match the naming used in the API spec.
export function getCurrentUser() {
  return getUser();
}

// Build the standard auth + JSON headers used for protected requests.
export function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token,
  };
}

// Save token + user after login or register.
export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// Logout: clear storage and go to login page.
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// Redirect to login page if the visitor is not logged in.
// Used on Cart and Orders pages.
export function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Reusable API request function
// ---------------------------------------------------------------------------

// Wrapper around fetch() that:
//   - adds the Authorization: Bearer <token> header
//   - sets JSON content type for requests with a body
//   - returns parsed JSON
//   - throws a friendly Error on network/HTTP problems
export async function apiRequest(path, options = {}) {
  const url = API_URL + path;
  const headers = options.headers || {};

  // Attach JWT token if the user is logged in.
  const token = getToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  // If we are sending a body, mark it as JSON.
  if (options.body) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    // Network error / backend not running.
    throw new Error("Cannot connect to the server. Is the backend running?");
  }

  // Try to parse JSON response (backend always returns JSON).
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // ignore non-JSON responses
  }

  if (!response.ok) {
    // Use the message from the backend if present, otherwise a default.
    const msg = (data && data.message) || "Something went wrong. Please try again.";
    throw new Error(msg);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

// Format a number as Indian Rupees, e.g. 120 -> "₹120".
export function formatPrice(amount) {
  return "₹" + Number(amount || 0);
}

// Show a short message inside an element with id "message".
// type = "success" | "error" | "info"
export function showMessage(text, type = "success") {
  const box = document.getElementById("message");
  if (!box) {
    alert(text);
    return;
  }
  box.textContent = text;
  box.className = "message " + type;
  box.style.display = "block";
  // Auto-hide after 4 seconds.
  setTimeout(() => {
    box.style.display = "none";
  }, 4000);
}

// Escape user/back-end text before injecting into innerHTML (prevents XSS).
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------------------------------------------------------------------
// Navbar (rendered by JS so it can change with login state)
// ---------------------------------------------------------------------------

export function renderNavbar() {
  const nav = document.getElementById("navbar");
  if (!nav) return;

  const logged = isLoggedIn();
  const admin = isAdmin();
  const delivery = isDelivery();

  // Links change depending on the user's role.
  //  - Logged out: Home, Products, Login, Register
  //  - Customer:   Home, Products, Cart, My Orders, Logout
  //  - Admin:      Home, Products, Cart, My Orders, Admin Panel, Logout
  //  - Delivery:   Home, Orders, Logout
  let links = `
    <a href="index.html">Home</a>
  `;

  // Delivery users do not shop, so they do not see Products/Cart.
  if (!delivery) {
    links += `<a href="products.html">Products</a>`;
  }

  if (logged) {
    if (!delivery) {
      links += `<a href="cart.html">Cart</a>`;
    }
    links += `<a href="orders.html">My Orders</a>`;
    if (admin) {
      links += `<a href="admin.html">Admin Panel</a>`;
    }
    links += `<a href="#" id="logout-link">Logout</a>`;
  } else {
    links += `<a href="login.html">Login</a>`;
    links += `<a href="register.html">Register</a>`;
  }

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="brand">FreshCart</a>
      <nav class="nav-links">${links}</nav>
    </div>
  `;

  // Wire up the logout link.
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
}

// Render the shared footer.
export function renderFooter() {
  const footer = document.getElementById("footer");
  if (!footer) return;
  footer.innerHTML = `
    <p>Grocery Delivery System | MCA Minor Project</p>
  `;
}

// Run on every page once the DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  renderFooter();
});
