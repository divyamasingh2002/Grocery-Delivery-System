// admin.js
// Admin panel logic:
//   - List, add, update and delete products
//   - Update an order's status
//
// Backend endpoints used:
//   GET    /api/products
//   POST   /api/products
//   PUT    /api/products/:id
//   DELETE /api/products/:id
//   PUT    /api/orders/:id/status
//
// NOTE: There is currently NO backend endpoint to fetch ALL orders for an
// admin (e.g. GET /api/admin/orders). That is why the admin must type the
// Order ID manually. See the comment in admin.html.

document.addEventListener("DOMContentLoaded", () => {
  // Only admins may use this page.
  if (!requireLogin()) return;
  if (!isAdmin()) {
    document.querySelector(".container").innerHTML =
      `<div class="empty-state"><p>Access denied. Admins only.</p></div>`;
    return;
  }

  loadAdminProducts();

  // Product form submit (add or update).
  document.getElementById("product-form").addEventListener("submit", saveProduct);
  document.getElementById("cancel-edit").addEventListener("click", resetForm);

  // Order status form.
  document.getElementById("status-form").addEventListener("submit", updateOrderStatus);
});

// ---------------- Products ----------------

// Fetch all products and show them in the admin table.
async function loadAdminProducts() {
  const area = document.getElementById("admin-product-area");
  const table = document.getElementById("admin-product-table");
  const tbody = document.getElementById("admin-product-rows");

  try {
    // GET /api/products
    const products = await apiRequest("/products");

    area.style.display = "none";

    if (!products || products.length === 0) {
      area.style.display = "block";
      area.textContent = "No products found. Add one using the form.";
      return;
    }

    table.style.display = "block";

    tbody.innerHTML = products
      .map(
        (p) => `
      <tr class="product-row">
        <td><img src="${escapeHtml(
          p.image ||
            "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=100"
        )}" alt="" /></td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category || "")}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${p.quantity != null ? p.quantity : "-"}</td>
        <td>
          <button class="btn btn-outline edit-btn" data-id="${p._id}">Edit</button>
          <button class="btn btn-danger delete-btn" data-id="${p._id}">Delete</button>
        </td>
      </tr>`
      )
      .join("");

    // Wire up edit and delete buttons.
    document.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", () => editProduct(btn.dataset.id, products))
    );
    document.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", () => deleteProduct(btn.dataset.id))
    );
  } catch (err) {
    area.textContent = "Unable to load products.";
    showMessage(err.message || "Unable to load products.", "error");
  }
}

// Fill the form with an existing product for editing.
function editProduct(id, products) {
  const p = products.find((x) => x._id === id);
  if (!p) return;

  document.getElementById("product-id").value = p._id;
  document.getElementById("p-name").value = p.name || "";
  document.getElementById("p-category").value = p.category || "";
  document.getElementById("p-desc").value = p.description || "";
  document.getElementById("p-price").value = p.price || "";
  document.getElementById("p-qty").value = p.quantity != null ? p.quantity : "";
  document.getElementById("p-unit").value = p.unit || "";
  document.getElementById("p-image").value = p.image || "";
  document.getElementById("p-available").value = p.available ? "true" : "false";

  document.getElementById("form-title").textContent = "Edit Product";
  document.getElementById("save-btn").textContent = "Update Product";
  document.getElementById("cancel-edit").style.display = "inline-block";
}

// Clear the form back to "Add" mode.
function resetForm() {
  document.getElementById("product-form").reset();
  document.getElementById("product-id").value = "";
  document.getElementById("form-title").textContent = "Add Product";
  document.getElementById("save-btn").textContent = "Save Product";
  document.getElementById("cancel-edit").style.display = "none";
}

// Add a new product OR update an existing one.
async function saveProduct(e) {
  e.preventDefault();

  const id = document.getElementById("product-id").value;
  const body = {
    name: document.getElementById("p-name").value.trim(),
    category: document.getElementById("p-category").value.trim(),
    description: document.getElementById("p-desc").value.trim(),
    price: Number(document.getElementById("p-price").value),
    quantity: Number(document.getElementById("p-qty").value || 0),
    unit: document.getElementById("p-unit").value.trim(),
    image: document.getElementById("p-image").value.trim(),
    available: document.getElementById("p-available").value === "true",
  };

  try {
    if (id) {
      // Update existing product: PUT /api/products/:id
      await apiRequest("/products/" + id, { method: "PUT", body });
      showMessage("Product updated.", "success");
    } else {
      // Add new product: POST /api/products
      await apiRequest("/products", { method: "POST", body });
      showMessage("Product added.", "success");
    }

    resetForm();
    loadAdminProducts();
  } catch (err) {
    showMessage(err.message || "Failed to save product.", "error");
  }
}

// Delete a product after confirming.
async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    // DELETE /api/products/:id
    await apiRequest("/products/" + id, { method: "DELETE" });
    showMessage("Product deleted.", "success");
    loadAdminProducts();
  } catch (err) {
    showMessage(err.message || "Failed to delete product.", "error");
  }
}

// ---------------- Order Status ----------------

// Update the status of an order by ID.
async function updateOrderStatus(e) {
  e.preventDefault();

  const id = document.getElementById("order-id").value.trim();
  const status = document.getElementById("order-status").value;

  if (!id) {
    showMessage("Please enter an Order ID.", "error");
    return;
  }

  try {
    // PUT /api/orders/:id/status
    // The backend expects the field name "orderStatus".
    await apiRequest("/orders/" + id + "/status", {
      method: "PUT",
      body: { orderStatus: status },
    });
    showMessage("Order status updated to " + status, "success");
    document.getElementById("status-form").reset();
  } catch (err) {
    showMessage(err.message || "Failed to update order status.", "error");
  }
}
