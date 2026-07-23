// cart.js
// Fetches the logged-in user's cart from the backend, displays the items,
// calculates totals and handles "Place Order".
//
// Backend endpoints used:
//   GET  /api/cart     -> get the user's cart
//   POST /api/orders   -> place a new order
import {
  apiRequest,
  showMessage,
  escapeHtml,
  formatPrice,
  isAdmin,
  isDelivery,
  requireLogin,
  getUser,
} from "./common.js";
const DELIVERY_CHARGE = 40; // flat delivery charge for this project

document.addEventListener("DOMContentLoaded", () => {
  // Cart page requires login.
  if (!requireLogin()) return;

  loadCart();

  // Modal buttons.
  document.getElementById("cancel-order").addEventListener("click", closeOrderModal);
  document.getElementById("order-form").addEventListener("submit", placeOrder);
});

// Fetch and display the cart.
async function loadCart() {
  const area = document.getElementById("cart-area");
  const content = document.getElementById("cart-content");

  try {
    // GET /api/cart
    const cart = await apiRequest("/cart");

    area.style.display = "none";

    // Cart may come back as { items: [...] } or as an array.
    const items = cart.items || cart || [];

    if (items.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <p>Your cart is empty.</p>
          <a href="products.html" class="btn">Continue Shopping</a>
        </div>`;
      return;
    }

    renderCart(items);
  } catch (err) {
    area.style.display = "none";
    content.innerHTML = `<div class="empty-state">Unable to load cart.</div>`;
    showMessage(err.message || "Unable to load cart.", "error");
  }
}

// Render the cart table and summary.
function renderCart(items) {
  const content = document.getElementById("cart-content");
  let subtotal = 0;

  const rows = items
    .map((item) => {
      const product = item.product || item.productId || item;
      const name = product.name || "Product";
      const price = product.price || 0;
      const qty = item.quantity || 1;
      const lineTotal = price * qty;
      subtotal += lineTotal;

      const img =
        product.image ||
        "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400";

      return `
        <tr>
          <td><img src="${escapeHtml(img)}" class="cart-thumb" alt="${escapeHtml(name)}" /></td>
          <td>${escapeHtml(name)}</td>
          <td>${formatPrice(price)}</td>
          <td>${qty}</td>
          <td>${formatPrice(lineTotal)}</td>
        </tr>`;
    })
    .join("");

  const total = subtotal + DELIVERY_CHARGE;

  content.innerHTML = `
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Product</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="cart-summary">
      <div class="row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="row"><span>Delivery</span><span>${formatPrice(DELIVERY_CHARGE)}</span></div>
      <div class="row total"><span>Grand Total</span><span>${formatPrice(total)}</span></div>
      <button class="btn" id="place-order-btn" style="width:100%;margin-top:14px;">Place Order</button>
    </div>
  `;

  document.getElementById("place-order-btn").addEventListener("click", openOrderModal);
}

// Open the "Place Order" modal.
function openOrderModal() {
  // Pre-fill address from saved user info if available.
  const user = getUser();
  document.getElementById("order-modal").classList.add("active");
}

// Close the modal.
function closeOrderModal() {
  document.getElementById("order-modal").classList.remove("active");
}

// Submit the order to the backend.
async function placeOrder(e) {
  e.preventDefault();

  const deliveryAddress = document.getElementById("delivery-address").value.trim();
  const paymentMethod = document.getElementById("payment-method").value;

  if (!deliveryAddress) {
    showMessage("Please enter a delivery address.", "error");
    return;
  }

  try {
    // POST /api/orders
    await apiRequest("/orders", {
      method: "POST",
      body: { deliveryAddress, paymentMethod },
    });

    closeOrderModal();
    showMessage("Order placed successfully!", "success");

    // Redirect to My Orders page.
    setTimeout(() => {
      window.location.href = "orders.html";
    }, 1500);
  } catch (err) {
    showMessage(err.message || "Failed to place order.", "error");
  }
}
