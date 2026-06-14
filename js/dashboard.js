const API_BASE =
    "https://dripint-backend.onrender.com";

/* =========================================
   ADMIN AUTH
========================================= */

const adminToken =
    localStorage.getItem(
        "admin_token"
    );

const adminUser =
    JSON.parse(
        localStorage.getItem(
            "admin_user"
        ) || "{}"
    );

if (!adminToken) {

    window.location.href =
        "admin-login.html";

}

/* =========================================
   ADMIN INIT
========================================= */

function initializeAdmin() {

    const adminUserElement =
        document.getElementById(
            "adminUser"
        );

    if (
        adminUserElement &&
        adminUser &&
        adminUser.first_name
    ) {

        adminUserElement.textContent =
            adminUser.first_name;

    }

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logout
        );

    }

}

function logout() {

    localStorage.removeItem(
        "admin_token"
    );

    localStorage.removeItem(
        "admin_user"
    );

    window.location.href =
        "admin-login.html";

}

/* =========================================
   AUTHORIZED FETCH
========================================= */

async function authorizedFetch(
    url,
    options = {}
) {

    const headers = {

        ...(options.headers || {}),

        Authorization:
            `Bearer ${adminToken}`

    };

    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );

    if (
        response.status === 401 ||
        response.status === 403
    ) {

        localStorage.removeItem(
            "admin_token"
        );

        localStorage.removeItem(
            "admin_user"
        );

        window.location.href =
            "admin-login.html";

        throw new Error(
            "Session expired"
        );

    }

    return response;

}

let allOrders = [];
let filteredOrders = [];
let currentFilter = "ALL";

window.onload = () => {

    initializeAdmin();

    initializeFilters();

    initializeSearch();

    loadOrders();

};

/* =========================================
   STATUS BADGES
========================================= */

function getStatusBadge(status) {

    switch (status) {

        case "PENDING":
            return "status-badge pending";

        case "CONFIRMED":
            return "status-badge confirmed";

        case "IN_PRODUCTION":
            return "status-badge production";

        case "SHIPPED":
            return "status-badge shipped";

        case "DELIVERED":
            return "status-badge delivered";

        case "CANCELLED":
            return "status-badge cancelled";

        default:
            return "status-badge";
    }

}

/* =========================================
   LOAD ORDERS
========================================= */

async function loadOrders() {

    try {

        const response =
            await authorizedFetch(
                `${API_BASE}/admin/orders`
            );

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                "Unable to load orders"
            );

        }

        allOrders =
            data.orders || [];

        filteredOrders =
            [...allOrders];

        calculateKPIs();

        renderOrders();

    }
    catch (error) {

        console.error(error);

        document.getElementById(
            "ordersTable"
        ).innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="empty-state">
                        Unable to load orders.
                    </div>

                </td>

            </tr>

        `;

    }

}

/* =========================================
   KPI CALCULATIONS
========================================= */

function calculateKPIs() {

    const totalOrders =
        allOrders.length;

    const pendingOrders =
        allOrders.filter(
            o => o.order_status === "PENDING"
        ).length;

    const deliveredOrders =
        allOrders.filter(
            o => o.order_status === "DELIVERED"
        ).length;

    const totalRevenue =
        allOrders.reduce(
            (sum, order) =>
                sum +
                parseFloat(
                    order.order_total || 0
                ),
            0
        );

    document.getElementById(
        "totalOrders"
    ).textContent =
        totalOrders;

    document.getElementById(
        "pendingOrders"
    ).textContent =
        pendingOrders;

    document.getElementById(
        "deliveredOrders"
    ).textContent =
        deliveredOrders;

    document.getElementById(
        "totalRevenue"
    ).textContent =
        `₹${totalRevenue.toFixed(2)}`;

}

/* =========================================
   TABLE RENDER
========================================= */

function renderOrders() {

    const tbody =
        document.getElementById(
            "ordersTable"
        );

    if (
        filteredOrders.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="empty-state">
                        No orders found
                    </div>

                </td>

            </tr>

        `;

        return;

    }

    let html = "";

    filteredOrders.forEach(order => {

        html += `

            <tr>

                <td>
                    <strong>
                        ${order.order_number}
                    </strong>
                </td>

                <td>
                    ${order.customer_name}
                </td>

                <td>
                    ${order.customer_phone}
                </td>

                <td>
                    ₹${parseFloat(
                        order.order_total || 0
                    ).toFixed(2)}
                </td>

                <td>

                    <span
                        class="${getStatusBadge(
                            order.order_status
                        )}"
                    >

                        ${formatStatus(
                            order.order_status
                        )}

                    </span>

                </td>

                <td>

                    ${formatDate(
                        order.created_at
                    )}

                </td>

                <td>

                    <button
                        class="action-btn"
                        onclick="viewOrder(${order.id})"
                    >
                        View Order
                    </button>

                </td>

            </tr>

        `;

    });

    tbody.innerHTML = html;

}

/* =========================================
   FILTERS
========================================= */

function initializeFilters() {

    document
        .querySelectorAll(
            ".filter-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".filter-btn"
                        )
                        .forEach(btn =>
                            btn.classList.remove(
                                "active"
                            )
                        );

                    button.classList.add(
                        "active"
                    );

                    currentFilter =
                        button.dataset.status;

                    applyFilters();

                }
            );

        });

}

/* =========================================
   SEARCH
========================================= */

function initializeSearch() {

    document
        .getElementById(
            "searchInput"
        )
        .addEventListener(
            "input",
            applyFilters
        );

}

/* =========================================
   APPLY FILTERS
========================================= */

function applyFilters() {

    const searchValue =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .trim()
            .toLowerCase();

    filteredOrders =
        allOrders.filter(order => {

            const matchesStatus =
                currentFilter === "ALL"
                    ? true
                    : order.order_status ===
                      currentFilter;

            const matchesSearch =

                order.order_number
                    ?.toLowerCase()
                    .includes(searchValue)

                ||

                order.customer_name
                    ?.toLowerCase()
                    .includes(searchValue)

                ||

                order.customer_phone
                    ?.toLowerCase()
                    .includes(searchValue);

            return (
                matchesStatus &&
                matchesSearch
            );

        });

    renderOrders();

}

/* =========================================
   VIEW ORDER MODAL V2
========================================= */

async function viewOrder(orderId) {

    try {

        const response =
            await authorizedFetch(
                `${API_BASE}/admin/order/${orderId}`
            );

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                "Unable to load order"
            );

        }

        const order =
            data.order;

        const items =
            data.items || [];

        let itemsHtml = "";

        items.forEach(item => {

            itemsHtml += `

                <tr>

                    <td>

                        <strong>
                            ${item.product_name}
                        </strong>

                        <br>

                        <small>
                            ${item.color || ""}
                        </small>

                    </td>

                    <td>
                        ${item.quantity}
                    </td>

                    <td>
                        ₹${parseFloat(
                            item.price || 0
                        ).toFixed(2)}
                    </td>

                    <td>
                        ₹${parseFloat(
                            item.subtotal || 0
                        ).toFixed(2)}
                    </td>

                </tr>

            `;

        });

        document.getElementById(
            "orderDetails"
        ).innerHTML = `

            <div class="order-header">

                <div class="order-header-left">

                    <h2>
                        ${order.order_number}
                    </h2>

                    <div class="order-meta">

                        Created:
                        ${formatDate(
                            order.created_at
                        )}

                    </div>

                </div>

                <div>

                    <span
                        class="${getStatusBadge(
                            order.order_status
                        )}"
                    >

                        ${formatStatus(
                            order.order_status
                        )}

                    </span>

                </div>

            </div>

            <div class="summary-grid">

                <div class="summary-card">

                    <div class="summary-title">
                        Order Number
                    </div>

                    <div class="summary-value">
                        ${order.order_number}
                    </div>

                </div>

                <div class="summary-card">

                    <div class="summary-title">
                        Order Date
                    </div>

                    <div class="summary-value">
                        ${formatDate(
                            order.created_at
                        )}
                    </div>

                </div>

                <div class="summary-card">

                    <div class="summary-title">
                        Status
                    </div>

                    <div class="summary-value">
                        ${formatStatus(
                            order.order_status
                        )}
                    </div>

                </div>

                <div class="summary-card">

                    <div class="summary-title">
                        Total Amount
                    </div>

                    <div class="summary-value">
                        ₹${parseFloat(
                            order.order_total || 0
                        ).toFixed(2)}
                    </div>

                </div>

            </div>

            <div class="order-grid">

                <div class="section-card">

                    <div class="section-title">
                        Customer Details
                    </div>

                    <div class="info-item">

                        <div class="info-label">
                            Name
                        </div>

                        <div class="info-value">
                            ${order.customer_name}
                        </div>

                    </div>

                    <div class="info-item">

                        <div class="info-label">
                            Email
                        </div>

                        <div class="info-value">
                            ${order.customer_email}
                        </div>

                    </div>

                    <div class="info-item">

                        <div class="info-label">
                            Phone
                        </div>

                        <div class="info-value">
                            ${order.customer_phone}
                        </div>

                    </div>

                </div>

                <div class="section-card">

                    <div class="section-title">
                        Shipping Address
                    </div>

                    <div class="info-item">

                        <div class="info-label">
                            Address
                        </div>

                        <div class="info-value">
                            ${order.address}
                        </div>

                    </div>

                    <div class="info-item">

                        <div class="info-label">
                            City
                        </div>

                        <div class="info-value">
                            ${order.city}
                        </div>

                    </div>

                    <div class="info-item">

                        <div class="info-label">
                            State
                        </div>

                        <div class="info-value">
                            ${order.state}
                        </div>

                    </div>

                    <div class="info-item">

                        <div class="info-label">
                            Pincode
                        </div>

                        <div class="info-value">
                            ${order.pincode}
                        </div>

                    </div>

                </div>

            </div>

            <div class="items-card">

                <div class="items-header">
                    Order Items
                </div>

                <div style="overflow-x:auto;">

                    <table class="items-table">

                        <thead>

                            <tr>

                                <th>Product</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Line Total</th>

                            </tr>

                        </thead>

                        <tbody>

                            ${itemsHtml}

                        </tbody>

                    </table>

                </div>

            </div>

            <div class="timeline-card">

                <div class="section-title">
                    Order Timeline
                </div>

                <div class="timeline-status">

                    <div class="timeline-dot"></div>

                    Current Status:
                    ${formatStatus(
                        order.order_status
                    )}

                </div>

            </div>

            <div class="order-actions">

                <div class="section-title">
                    Update Status
                </div>

                <select
                    id="statusSelect"
                    class="status-select"
                >

                    <option value="PENDING">
                        PENDING
                    </option>

                    <option value="CONFIRMED">
                        CONFIRMED
                    </option>

                    <option value="IN_PRODUCTION">
                        IN_PRODUCTION
                    </option>

                    <option value="SHIPPED">
                        SHIPPED
                    </option>

                    <option value="DELIVERED">
                        DELIVERED
                    </option>

                    <option value="CANCELLED">
                        CANCELLED
                    </option>

                </select>

                <button
                    class="save-status-btn"
                    onclick="updateStatus(${order.id})"
                >

                    Save Status

                </button>

            </div>

        `;

        document.getElementById(
            "statusSelect"
        ).value =
            order.order_status;

        document.getElementById(
            "orderModal"
        ).style.display =
            "block";

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to load order."
        );

    }

}

/* =========================================
   UPDATE STATUS
========================================= */

async function updateStatus(orderId) {

    const status =
        document.getElementById(
            "statusSelect"
        ).value;

    try {

        const response =
            await authorizedFetch(
                `${API_BASE}/admin/order-status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({

                        order_id:
                            orderId,

                        status:
                            status

                    })
                }
            );

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.error ||
                "Update Failed"
            );

            return;

        }

        alert(
            "Status Updated Successfully"
        );

        closeModal();

        await loadOrders();

    }
    catch (error) {

        console.error(error);

        alert(
            "Update Failed"
        );

    }

}

/* =========================================
   MODAL
========================================= */

function closeModal() {

    document.getElementById(
        "orderModal"
    ).style.display =
        "none";

}

window.onclick = function(event) {

    const modal =
        document.getElementById(
            "orderModal"
        );

    if (
        event.target === modal
    ) {

        closeModal();

    }

};

/* =========================================
   HELPERS
========================================= */

function formatDate(dateString) {

    return new Date(
        dateString
    ).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}

function formatStatus(status) {

    switch (status) {

        case "IN_PRODUCTION":
            return "PRODUCTION";

        default:
            return status;
    }

}