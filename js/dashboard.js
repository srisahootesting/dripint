const API_BASE =
    "https://dripint-backend.onrender.com";

let allOrders = [];
let filteredOrders = [];
let currentFilter = "ALL";

window.onload = () => {

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
            await fetch(
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
                        order.order_total
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
                        onclick="
                            viewOrder(
                                ${order.id}
                            )
                        "
                    >
                        View
                    </button>

                </td>

            </tr>

        `;

    });

    tbody.innerHTML = html;

}

/* =========================================
   FILTER BUTTONS
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

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    searchInput.addEventListener(
        "input",
        () => {

            applyFilters();

        }
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
                    .includes(
                        searchValue
                    )

                ||

                order.customer_name
                    ?.toLowerCase()
                    .includes(
                        searchValue
                    )

                ||

                order.customer_phone
                    ?.toLowerCase()
                    .includes(
                        searchValue
                    );

            return (
                matchesStatus &&
                matchesSearch
            );

        });

    renderOrders();

}

/* =========================================
   VIEW ORDER
========================================= */

async function viewOrder(orderId) {

    try {

        const response =
            await fetch(
                `${API_BASE}/admin/order/${orderId}`
            );

        const data =
            await response.json();

        const order =
            data.order;

        let productsHtml = "";

        data.items.forEach(item => {

            productsHtml += `

                <div class="product-card">

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                        "
                    >

                        <div>

                            <strong>
                                ${item.product_name}
                            </strong>

                            <br>

                            Color:
                            ${item.color}

                        </div>

                        <div>

                            Qty:
                            ${item.quantity}

                            <br>

                            ₹${item.subtotal}

                        </div>

                    </div>

                </div>

            `;

        });

        document.getElementById(
            "orderDetails"
        ).innerHTML = `

            <h2
                style="
                    margin-bottom:25px;
                "
            >

                ${order.order_number}

            </h2>

            <div class="info-grid">

                <div class="section-card">

                    <div class="section-title">
                        Customer Information
                    </div>

                    <strong>Name</strong>
                    <br>
                    ${order.customer_name}

                    <br><br>

                    <strong>Email</strong>
                    <br>
                    ${order.customer_email}

                    <br><br>

                    <strong>Phone</strong>
                    <br>
                    ${order.customer_phone}

                </div>

                <div class="section-card">

                    <div class="section-title">
                        Shipping Address
                    </div>

                    ${order.address}
                    <br><br>

                    ${order.city}
                    <br>

                    ${order.state}
                    -
                    ${order.pincode}

                </div>

            </div>

            <div class="section-card">

                <div class="section-title">
                    Products
                </div>

                ${productsHtml}

            </div>

            <div class="section-card">

                <div class="summary-row">

                    <strong>
                        Order Total
                    </strong>

                    <strong>
                        ₹${order.order_total}
                    </strong>

                </div>

                <div class="summary-row">

                    <strong>
                        Status
                    </strong>

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
                class="action-btn"
                style="
                    width:100%;
                    padding:14px;
                "
                onclick="
                    updateStatus(
                        ${order.id}
                    )
                "
            >
                Update Status
            </button>

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
            await fetch(
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