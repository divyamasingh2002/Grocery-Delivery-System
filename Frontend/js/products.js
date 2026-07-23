// products.js
// Fetches all products from the backend and displays them as cards.
// Logged-in customers can add a product to their cart.
//
// Backend endpoints used:
//   GET  /api/products  -> list all products (no auth)
//   POST /api/cart      -> add a product to the cart (auth required)

import {
  apiRequest,
  showMessage,
  escapeHtml,
  formatPrice,
  isLoggedIn,
} from "./common.js";

// Placeholder image used when a product has no image URL.
const PLACEHOLDER_IMG =
  "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400";

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});

// Fetch and render the product grid.
async function loadProducts() {
  const area = document.getElementById("product-area");
  const grid = document.getElementById("product-grid");

  try {
    // GET /api/products -> array of products
    const products = await apiRequest("/products");

    area.style.display = "none";

    if (!products || products.length === 0) {
      area.style.display = "block";
      area.className = "empty-state";
      area.textContent = "No products available right now.";
      return;
    }

    grid.innerHTML = products.map(renderProductCard).join("");

    // Wire up every "Add to Cart" button.
    document.querySelectorAll(".add-cart-btn").forEach((btn) =>
      btn.addEventListener("click", () =>
        addToCart(btn.dataset.id, Number(btn.dataset.qty || 1), btn)
      )
    );

    // Keep the requested quantity in sync with the number input.
    document.querySelectorAll(".qty-input").forEach((input) =>
      input.addEventListener("input", () => {
        const btn = document.querySelector(
          `.add-cart-btn[data-id="${input.dataset.id}"]`
        );
        if (btn) btn.dataset.qty = input.value;
      })
    );
  } catch (err) {
    area.style.display = "block";
    area.className = "empty-state";
    area.textContent = "Unable to load products.";
    showMessage(err.message || "Unable to load products.", "error");
  }
}

// Build the HTML for a single product card.
function renderProductCard(p) {
  const img = p.image || PLACEHOLDER_IMG;
  const available = p.available !== false;
  const unit = p.unit ? " / " + escapeHtml(p.unit) : "";

  const stockBlock = available
    ? `<div class="card-actions">
         <input type="number" min="1" value="1" class="qty-input" data-id="${p._id}" aria-label="Quantity" />
         <button class="btn add-cart-btn" data-id="${p._id}" data-qty="1">Add to Cart</button>
       </div>`
    : `<div class="card-actions">
         <span class="out-of-stock">Out of Stock</span>
       </div>`;

  return `
    <div class="product-card">
      <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" />
      <div class="card-body">
        <h3>${escapeHtml(p.name)}</h3>
        ${p.category ? `<span class="category">${escapeHtml(p.category)}</span>` : ""}
        ${p.description ? `<p class="desc">${escapeHtml(p.description)}</p>` : ""}
        <span class="price">${formatPrice(p.price)}${unit}</span>
      </div>
      ${stockBlock}
    </div>`;
}

// Add a product to the logged-in user's cart.
async function addToCart(productId, quantity, btn) {
  // The cart endpoint requires authentication.
  if (!isLoggedIn()) {
    showMessage("Please login to add items to your cart.", "error");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
    return;
  }

  if (quantity < 1) quantity = 1;

  // Disable the button while the request is in flight.
  if (btn) {
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = "Adding...";
    try {
      // POST /api/cart
      await apiRequest("/cart", {
        method: "POST",
        body: { productId, quantity },
      });
      showMessage("Product added to cart successfully.", "success");
    } catch (err) {
      showMessage(err.message || "Could not add to cart.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  } else {
    try {
      await apiRequest("/cart", {
        method: "POST",
        body: { productId, quantity },
      });
      showMessage("Product added to cart successfully.", "success");
    } catch (err) {
      showMessage(err.message || "Could not add to cart.", "error");
    }
  }
}
