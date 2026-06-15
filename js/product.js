const API_BASE =
"https://dripint-backend.onrender.com";

let selectedQuantity = 1;

let selectedImage = "";

let productVariants = [];

let selectedColor = "";

let selectedSize = "";

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

        const variantResponse =
            await fetch(
                API_BASE +
                "/product/" +
                productId +
                "/variants"
            );

        productVariants =
            await variantResponse.json();

        if(productVariants.length > 0){

            selectedColor =
                productVariants[0].color;

            selectedSize =
                productVariants[0].size;

        }

        selectedImage =
            product.image_url;

        document.getElementById(
            "productContainer"
        ).innerHTML = `

            <div class="product-detail-grid">

                <div class="product-gallery">

                    <img
                        id="mainProductImage"
                        src="${product.image_url}"
                        alt="${product.product_name}"
                        style="
                            width:100%;
                            border-radius:20px;
                        "
                    >

                </div>

                <div class="product-info">

                    <div class="product-category">
                        ${product.category}
                    </div>

                    <h1>
                        ${product.product_name}
                    </h1>

                    <div class="product-price">
                        ₹${product.price}
                    </div>

                    <div class="stock-badge">
                            ✓ In Stock
                    </div>

                    <div id="colorSection">

                        <h3>Color</h3>

                        <div id="colorOptions">

                            ${
                                [...new Set(
                                    productVariants.map(
                                        v => v.color
                                    )
                                )]
                                .map(color => `
                                    <button
                                        class="variant-btn"
                                        onclick="
                                            selectColor(
                                                '${color}'
                                            )
                                        "
                                    >
                                        ${color}
                                    </button>
                                `)
                                .join("")
                            }

                        </div>

                    </div>

                    <div id="sizeSection">

                        <h3>Size</h3>

                        <select
                            id="sizeSelect"
                            onchange="selectSize()"
                        >

                            ${
                                [...new Set(
                                    productVariants.map(
                                        v => v.size
                                    )
                                )]
                                .map(size => `
                                    <option value="${size}">
                                        ${size}
                                    </option>
                                `)
                                .join("")
                            }

                        </select>

                    </div>

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

                    <div class="product-actions">

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

            </div>

        `;

    } catch (error) {

        console.log(error);

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

function selectColor(color){

    selectedColor = color;

}

function selectSize(){

    selectedSize =
        document.getElementById(
            "sizeSelect"
        ).value;

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
            product.id
    );

    if (existing) {

        existing.quantity +=
            selectedQuantity;

    } else {

        const cartItem = {

            ...product,

            variant_color:
                selectedColor,

            variant_size:
                selectedSize,


            quantity:
                selectedQuantity,



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
        productName ;

    document.getElementById(
        "toastCount"
    ).innerText =
        selectedQuantity +
    " item(s) added to cart";;

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