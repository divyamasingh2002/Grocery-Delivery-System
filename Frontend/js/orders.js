// orders.js
// Fetches the logged-in user's orders from the backend and displays them.
// Admin and delivery users additionally see a status dropdown on each order.
//
// Backend endpoints used:
//   GET /api/orders            -> current user's orders (auth required)
//   PUT /api/orders/:id/status -> update order status (admin / delivery)
//
// NOTE: GET /api/orders returns only the current user's orders. There is no
// backend endpoint to list ALL orders, so admins/delivery users can only
// update the status of orders they can already see here.

import {
  apiRequest,
  showMessage,
  escapeHtml,
  formatPrice,
  isAdmin,
  isDelivery,
  requireLogin,
} from "./common.js";

// Maps an order status string to the CSS badge class used in style.css.
const STATUS_BADGE = {
  Placed: "placed",
  Confirmed: "confirmed",
  Preparing: "preparing",
  "Out for Delivery": "out_for_delivery",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

// The full list of statuses a status can be changed to.
const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

document.addEventListener("DOMContentLoaded", () => {
  // Orders page requires login.
  if (!requireLogin()) return;

  loadOrders();
});

// Fetch and render the user's orders.
async function loadOrders() {
  const area = document.getElementById("orders-area");
  const list = document.getElementById("orders-list");

  try {
    // GET /api/orders -> array of orders, newest first
    const orders = await apiRequest("/orders");

    area.style.display = "none";

    if (!orders || orders.length === 0) {
      area.style.display = "block";
      area.className = "empty-state";
      area.innerHTML = `
        <p>You have no orders yet.</p>
        <a href="products.html" class="btn">Start Shopping</a>`;
      return;
    }

    list.innerHTML = orders.map(renderOrderCard).join("");

    // Wire up status dropdowns (only present for admin/delivery users).
    document.querySelectorAll(".status-select").forEach((select) =>
      select.addEventListener("change", () =>
        updateOrderStatus(select.dataset.id, select.value, select)
      )
    );
  } catch (err) {
    area.style.display = "block";
    area.className = "empty-state";
    area.textContent = "Unable to load orders.";
    showMessage(err.message || "Unable to load orders.", "error");
  }
}

// Build the HTML for a single order.
function renderOrderCard(order) {
  const date = new Date(order.createdAt).toLocaleDateString();
  const badgeClass = STATUS_BADGE[order.orderStatus] || "placed";

  const itemsHtml = (order.items || [])
    .map((item) => {
      // Orders store a snapshot of the product name and price.
      const name = item.name || (item.product && item.product.name) || "Product";
      const price = item.price != null ? item.price : item.product && item.product.price;
      const qty = item.quantity || 1;
      return `<li>${escapeHtml(name)} &times; ${qty} — ${formatPrice(
        (price || 0) * qty
      )}</li>`;
    })
    .join("");

  // Admin and delivery users can update the status of an order.
  const canUpdateStatus = isAdmin() || isDelivery();
  const statusControl = canUpdateStatus
    ? `<div class="inline-form" style="margin-top:12px;">
         <label for="status-${order._id}" style="font-size:0.85rem;">Update status:</label>
         <select id="status-${order._id}" class="status-select" data-id="${order._id}">
           ${ORDER_STATUSES.map(
             (s) =>
               `<option value="${s}" ${s === order.orderStatus ? "selected" : ""}>${s}</option>`
           ).join("")}
         </select>
       </div>`
    : "";

  return `
    <div class="table-card" style="margin-bottom:18px;">
      <div style="padding:16px 20px;">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;">
          <strong>Order #${escapeHtml(order._id)}</strong>
          <span class="badge ${badgeClass}">${escapeHtml(order.orderStatus)}</span>
        </div>
        <p style="font-size:0.9rem;color:#666;margin-bottom:10px;">Placed on ${date}</p>
        <ul style="margin:0 0 12px 18px;font-size:0.9rem;">${itemsHtml}</ul>
        <p style="font-size:0.9rem;margin-bottom:6px;">
          <strong>Total:</strong> ${formatPrice(order.totalAmount)}
        </p>
        <p style="font-size:0.9rem;margin-bottom:6px;">
          <strong>Delivery Address:</strong> ${escapeHtml(order.deliveryAddress)}
        </p>
        <p style="font-size:0.9rem;margin-bottom:6px;">
          <strong>Payment:</strong> ${escapeHtml(order.paymentMethod)}
          (${escapeHtml(order.paymentStatus)})
        </p>
        ${statusControl}
      </div>
    </div>`;
}

// Update the status of an order (admin / delivery only).
async function updateOrderStatus(orderId, status, select) {
  try {
    select.disabled = true;
    // PUT /api/orders/:id/status — backend expects the "orderStatus" field.
    await apiRequest("/orders/" + orderId + "/status", {
      method: "PUT",
      body: { orderStatus: status },
    });
    showMessage("Order status updated to " + status, "success");
    // Reload so the badge reflects the new status.
    loadOrders();
  } catch (err) {
    showMessage(err.message || "Failed to update order status.", "error");
    // Revert the dropdown to the previous value by reloading.
    loadOrders();
  } finally {
    select.disabled = false;
  }
}
