const API_BASE =
"https://dripint-backend.onrender.com";

let selectedQuantity = 1;

let selectedColor = "White";

let selectedImage = "";

window.onload = async () => {

    updateCartCount();

    const params =
        new URLSearchParams(
            window.location.search
        );

    const productId =
        params.get("id");

    if (!productId) {

        document.getElementById(
            "productContainer"
        ).innerHTML =
            "<h2>Product Not Found</h2>";

        return;

    }

    loadProduct(productId);

};

async function loadProduct(productId) {

    try {

        const response =
            await fetch(
                API_BASE +
                "/product/" +
                productId
            );

        const product =
            await response.json();

        document.getElementById(
            "productContainer"
        ).innerHTML = `

            <div
                style="
                    max-width:1200px;
                    margin:auto;
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:50px;
                    align-items:start;
                "
            >

                <div>

                    <img
                        id="mainProductImage"
                        src="${product.image_url}"
                        alt="${product.product_name}"
                        style="
                            width:100%;
                            border-radius:20px;
                        "
                    >

                    <div
                        class="thumbnail-container"
                    >

                        <div
                            id="whiteThumb"
                            class="thumbnail"
                            style="
                                border:3px solid #0f4db8;
                            "
                            onclick="
                                changeVariant(
                                    'White',
                                    'assets/products/chess-white.jpg'
                                )
                            "
                        >
                            <img
                                src="assets/products/chess-white.jpg"
                            >
                        </div>

                        <div
                            id="blackThumb"
                            class="thumbnail"
                            onclick="
                                changeVariant(
                                    'Black',
                                    'assets/products/chess-black.jpg'
                                )
                            "
                        >
                            <img
                                src="assets/products/chess-black.jpg"
                            >
                        </div>

                    </div>

                    <h3
                        id="selectedColorLabel"
                    >
                        Selected Color: White
                    </h3>

                </div>

                <div>

                    <p>
                        ${product.category}
                    </p>

                    <h1>
                        ${product.product_name}
                    </h1>

                    <h2>
                        ₹${product.price}
                    </h2>

                    <p
                        style="
                            color:green;
                            font-weight:600;
                            margin-bottom:20px;
                        "
                    >
                        ● In Stock
                    </p>

                    <p>
                        ${product.description || "Premium quality apparel from Drip Designs."}
                    </p>

                    <div
                        class="qty-box"
                    >

                        <button
                            class="qty-btn"
                            onclick="decreaseQty()"
                        >
                            -
                        </button>

                        <span
                            id="selectedQty"
                        >
                            1
                        </span>

                        <button
                            class="qty-btn"
                            onclick="increaseQty()"
                        >
                            +
                        </button>

                    </div>

                    <button
                        class="primary-btn"
                        onclick='addToCart(${JSON.stringify(product)})'
                    >
                        Add To Cart
                    </button>

                    <button
                        class="secondary-btn"
                        onclick="buyNow()"
                    >
                        Buy Now
                    </button>

                </div>

            </div>

        `;

    } catch (error) {

        console.log(error);

    }

}

function changeVariant(
    color,
    imagePath
) {

    selectedColor =
        color;

    selectedImage =
        imagePath;

    document.getElementById(
        "mainProductImage"
    ).src =
        imagePath;

    document.getElementById(
        "selectedColorLabel"
    ).innerText =
        "Selected Color: " +
        color;

    document.getElementById(
        "whiteThumb"
    ).style.border =
        "2px solid #ddd";

    document.getElementById(
        "blackThumb"
    ).style.border =
        "2px solid #ddd";

    if (
        color === "White"
    ) {

        document.getElementById(
            "whiteThumb"
        ).style.border =
            "3px solid #0f4db8";

    } else {

        document.getElementById(
            "blackThumb"
        ).style.border =
            "3px solid #0f4db8";

    }

}

function increaseQty() {

    selectedQuantity++;

    document.getElementById(
        "selectedQty"
    ).innerText =
        selectedQuantity;

}

function decreaseQty() {

    if (
        selectedQuantity > 1
    ) {

        selectedQuantity--;

        document.getElementById(
            "selectedQty"
        ).innerText =
            selectedQuantity;

    }

}

function addToCart(product) {

    let cart =
        JSON.parse(
            localStorage.getItem(
                "cart"
            )
        ) || [];

    const existing =
        cart.find(
            item =>
                item.id ===
                    product.id &&
                item.color ===
                    selectedColor
        );

    if (existing) {

        existing.quantity +=
            selectedQuantity;

    } else {

        const cartItem = {

            ...product,

            quantity:
                selectedQuantity,

            color:
                selectedColor,

            image_url:
                selectedImage

        };

        cart.push(
            cartItem
        );

    }

    localStorage.setItem(
        "cart",
        JSON.stringify(
            cart
        )
    );

    updateCartCount();

    showToast(
        product.product_name
    );

}

function updateCartCount() {

    const cart =
        JSON.parse(
            localStorage.getItem(
                "cart"
            )
        ) || [];

    let count = 0;

    cart.forEach(item => {

        count +=
            item.quantity;

    });

    document.getElementById(
        "cartCount"
    ).innerText =
        count;

}

function showToast(
    productName
) {

    document.getElementById(
        "toastProduct"
    ).innerText =
        productName +
        " (" +
        selectedColor +
        ")";

    document.getElementById(
        "toastCount"
    ).innerText =
        "Cart Updated Successfully";

    const toast =
        document.getElementById(
            "toast"
        );

    toast.classList.add(
        "show"
    );

    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 2500);

}

function buyNow() {

    window.location.href =
        "cart.html";

}