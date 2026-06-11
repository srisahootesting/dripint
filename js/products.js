const API_BASE =
"https://dripint-backend.onrender.com";

let allProducts = [];
let filteredProducts = [];
let isEditMode = false;

/* ==========================
PAGE LOAD
========================== */

window.onload = async () => {

    await loadProducts();

    document
        .getElementById("searchInput")
        .addEventListener(
            "input",
            handleSearch
        );

    document
        .getElementById("productForm")
        .addEventListener(
            "submit",
            saveProduct
        );
};

/* ==========================
LOAD PRODUCTS
========================== */

async function loadProducts() {

    try {

        const response = await fetch(
            `${API_BASE}/admin/products`
        );

        const data = await response.json();

        if (!data.success) {

            alert("Failed to load products");
            return;
        }

        allProducts = data.products;
        filteredProducts = [...allProducts];

        updateKPIs();
        renderProducts();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load products."
        );
    }
}

/* ==========================
KPI CARDS
========================== */

function updateKPIs() {

    const total =
        allProducts.length;

    const active =
        allProducts.filter(
            p => p.status === "ACTIVE"
        ).length;

    const inactive =
        allProducts.filter(
            p => p.status === "INACTIVE"
        ).length;

    document.getElementById(
        "totalProducts"
    ).innerText = total;

    document.getElementById(
        "activeProducts"
    ).innerText = active;

    document.getElementById(
        "inactiveProducts"
    ).innerText = inactive;
}

/* ==========================
SEARCH
========================== */

function handleSearch() {

    const keyword =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    filteredProducts =
        allProducts.filter(product => {

            return (

                (product.product_name || "")
                    .toLowerCase()
                    .includes(keyword)

                ||

                (product.category || "")
                    .toLowerCase()
                    .includes(keyword)

                ||

                (product.qikink_product_id || "")
                    .toLowerCase()
                    .includes(keyword)

            );

        });

    renderProducts();
}

/* ==========================
RENDER PRODUCTS
========================== */

function renderProducts() {

    const tbody =
        document.getElementById(
            "productsTableBody"
        );

    if (
        filteredProducts.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    No Products Found
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = "";

    filteredProducts.forEach(product => {

        const imageUrl =
            product.image_url ||
            "https://via.placeholder.com/60";

        const statusClass =
            product.status === "ACTIVE"
                ? "status-active"
                : "status-inactive";

        const toggleText =
            product.status === "ACTIVE"
                ? "Deactivate"
                : "Activate";

        tbody.innerHTML += `

            <tr>

                <td>

                    <img
                        src="${imageUrl}"
                        class="product-image"
                        alt="Product">

                </td>

                <td>

                    <div class="product-name">
                        ${product.product_name || ""}
                    </div>

                </td>

                <td>

                    <div class="product-category">
                        ${product.category || ""}
                    </div>

                </td>

                <td>

                    ${product.qikink_product_id || ""}

                </td>

                <td>

                    ₹${parseFloat(
                        product.price || 0
                    ).toFixed(2)}

                </td>

                <td>

                    <span
                        class="status-badge ${statusClass}">

                        ${product.status}

                    </span>

                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            class="btn-edit"
                            onclick="editProduct(${product.id})">

                            Edit

                        </button>

                        <button
                            class="btn-toggle"
                            onclick="toggleStatus(
                                ${product.id},
                                '${product.status}'
                            )">

                            ${toggleText}

                        </button>

                    </div>

                </td>

            </tr>

        `;
    });
}

/* ==========================
OPEN ADD MODAL
========================== */

function openAddProductModal() {

    isEditMode = false;

    document.getElementById(
        "modalTitle"
    ).innerText = "Add Product";

    document.getElementById(
        "productForm"
    ).reset();

    document.getElementById(
        "productId"
    ).value = "";

    document.getElementById(
        "productModal"
    ).style.display = "flex";
}

/* ==========================
CLOSE MODAL
========================== */

function closeProductModal() {

    document.getElementById(
        "productModal"
    ).style.display = "none";
}

/* ==========================
EDIT PRODUCT
========================== */

async function editProduct(id) {

    try {

        const response = await fetch(
            `${API_BASE}/admin/product/${id}`
        );

        const data =
            await response.json();

        if (!data.success) {

            alert(
                "Unable to load product."
            );

            return;
        }

        const p =
            data.product;

        isEditMode = true;

        document.getElementById(
            "modalTitle"
        ).innerText = "Edit Product";

        document.getElementById(
            "productId"
        ).value = p.id;

        document.getElementById(
            "qikinkProductId"
        ).value =
            p.qikink_product_id || "";

        document.getElementById(
            "productName"
        ).value =
            p.product_name || "";

        document.getElementById(
            "category"
        ).value =
            p.category || "";

        document.getElementById(
            "description"
        ).value =
            p.description || "";

        document.getElementById(
            "imageUrl"
        ).value =
            p.image_url || "";

        document.getElementById(
            "price"
        ).value =
            p.price || "";

        document.getElementById(
            "status"
        ).value =
            p.status || "ACTIVE";

        document.getElementById(
            "productModal"
        ).style.display = "flex";

    } catch (error) {

        console.error(error);

        alert(
            "Failed to load product."
        );
    }
}

/* ==========================
SAVE PRODUCT
========================== */

async function saveProduct(event) {

    event.preventDefault();

    try {

        const payload = {

            id:
                document
                    .getElementById(
                        "productId"
                    )
                    .value,

            qikink_product_id:
                document
                    .getElementById(
                        "qikinkProductId"
                    )
                    .value,

            product_name:
                document
                    .getElementById(
                        "productName"
                    )
                    .value,

            category:
                document
                    .getElementById(
                        "category"
                    )
                    .value,

            description:
                document
                    .getElementById(
                        "description"
                    )
                    .value,

            image_url:
                document
                    .getElementById(
                        "imageUrl"
                    )
                    .value,

            price:
                document
                    .getElementById(
                        "price"
                    )
                    .value,

            status:
                document
                    .getElementById(
                        "status"
                    )
                    .value
        };

        const endpoint =
            isEditMode
                ? "/admin/product"
                : "/admin/product";

        const method =
            isEditMode
                ? "PUT"
                : "POST";

        const response =
            await fetch(
                API_BASE + endpoint,
                {
                    method,
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(
                        payload
                    )
                }
            );

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.error ||
                "Save failed"
            );

            return;
        }

        closeProductModal();

        await loadProducts();

        alert(
            isEditMode
                ? "Product updated successfully"
                : "Product created successfully"
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to save product."
        );
    }
}

/* ==========================
TOGGLE STATUS
========================== */

async function toggleStatus(
    productId,
    currentStatus
) {

    const newStatus =
        currentStatus === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE";

    const confirmAction =
        confirm(
            `Change product status to ${newStatus}?`
        );

    if (!confirmAction) {

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/admin/product-status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        product_id:
                            productId,

                        status:
                            newStatus

                    })
                }
            );

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.error ||
                "Status update failed"
            );

            return;
        }

        await loadProducts();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to update status."
        );
    }
}