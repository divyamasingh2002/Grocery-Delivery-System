// auth.js
// Handles the Login and Register forms.
// Both forms send requests to the Express backend:
//   POST /api/users/register
//   POST /api/users/login
// On success the JWT token and user details are saved in localStorage.

import { showMessage, isLoggedIn,apiRequest, saveAuth, getCurrentUser  } from "./common.js";

document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, redirect based on role.
  if (isLoggedIn()) {
    redirectByRole();
    return;
  }

  // ---------------- Register form ----------------
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Collect form values.
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const phone = document.getElementById("phone").value.trim();
      const address = document.getElementById("address").value.trim();

      try {
        // Call backend: POST /api/users/register
        const data = await apiRequest("/users/register", {
          method: "POST",
          body: { name, email, password, phone, address },
        });

        showMessage("Registration successful! Please login.", "success");

        // Redirect to login page after a short delay.
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      } catch (err) {
        // Show a friendly error message.
        console.log("on line 45");
        
        showMessage(err.message || "Registration failed.", "error");
      }
    });
  }

  // ---------------- Login form ----------------
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      try {
        // Call backend: POST /api/users/login
        const data = await apiRequest("/users/login", {
          method: "POST",
          body: { email, password },
        });

        // Backend returns { token, user }.
        // Save token and user info in localStorage exactly as received.
        saveAuth(data.token, data.user);

        showMessage("Login successful!", "success");

        // Redirect based on role after a short delay.
        setTimeout(() => {
          redirectByRole();
        }, 1000);
      } catch (err) {
        console.log("I am on line 77");
        
        showMessage(err.message || "Invalid email or password.", "error");
      }
    });
  }
});

// Redirect the user to the right page based on their role.
//   customer -> products.html
//   admin    -> admin.html
//   delivery-> orders.html
function redirectByRole() {
  const user = getCurrentUser();
  const role = user && user.role ? user.role : "customer";

  if (role === "admin") {
    window.location.href = "admin.html";
  } else if (role === "delivery") {
    window.location.href = "orders.html";
  } else {
    window.location.href = "products.html";
  }
}
