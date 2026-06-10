window.onload = loadCart;

function loadCart() {

    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];

    const container =
        document.getElementById(
            "cartContainer"
        );

    if (cart.length === 0) {

        container.innerHTML = `

            <div
                style="
                    text-align:center;
                    padding:80px;
                "
            >

                <h2>
                    Your Cart Is Empty
                </h2>

                <br>

                <a href="index.html">

                    <button
                        class="primary-btn"
                    >
                        Continue Shopping
                    </button>

                </a>

            </div>

        `;

        return;

    }

    let total = 0;

    let html = `

        <div
            style="
                display:grid;
                grid-template-columns:
                2fr 1fr;
                gap:30px;
            "
        >

            <div>

    `;

    cart.forEach((item, index) => {

        const subtotal =
            Number(item.price) *
            item.quantity;

        total += subtotal;

        html += `

            <div
                style="
                    background:white;
                    border-radius:20px;
                    padding:20px;
                    margin-bottom:20px;
                    display:flex;
                    gap:20px;
                    align-items:center;
                    box-shadow:
                    0 4px 20px rgba(
                        0,0,0,0.05
                    );
                "
            >

                <img
                    src="${item.image_url}"
                    style="
                        width:130px;
                        border-radius:15px;
                    "
                >

                <div
                    style="
                        flex:1;
                    "
                >

                    <h3>
                        ${item.product_name}
                    </h3>

                    <p
                        style="
                            margin:8px 0;
                            color:#666;
                        "
                    >
                        Color:
                        <span
                            style="
                                background:#f3f3f3;
                                padding:4px 10px;
                                border-radius:20px;
                            "
                        >
                            ${item.color}
                        </span>
                    </p>

                    <p>
                        ₹${item.price}
                    </p>

                    <br>

                    <div>

                        <button
                            onclick="
                                decreaseQty(${index})
                            "
                        >
                            −
                        </button>

                        <strong
                            style="
                                margin:0 15px;
                            "
                        >
                            ${item.quantity}
                        </strong>

                        <button
                            onclick="
                                increaseQty(${index})
                            "
                        >
                            +
                        </button>

                    </div>

                    <br>

                    <strong>

                        Subtotal:
                        ₹${subtotal}

                    </strong>

                </div>

                <button
                    onclick="
                        removeItem(${index})
                    "
                    style="
                        background:#ff4d4f;
                        color:white;
                        border:none;
                        padding:10px 16px;
                        border-radius:10px;
                        cursor:pointer;
                    "
                >
                    Remove
                </button>

            </div>

        `;

    });

    html += `

            </div>

            <div>

                <div
                    style="
                        background:white;
                        padding:25px;
                        border-radius:20px;
                        position:sticky;
                        top:20px;
                        box-shadow:
                        0 4px 20px rgba(
                            0,0,0,0.05
                        );
                    "
                >

                    <h2>
                        Order Summary
                    </h2>

                    <hr>

                    <h3>
                        Total:
                        ₹${total}
                    </h3>

                    <br>

                    <button
                        class="primary-btn"
                        style="
                            width:100%;
                        "
                        onclick="
                            checkout()
                        "
                    >
                        Proceed To Checkout
                    </button>

                </div>

            </div>

        </div>

    `;

    container.innerHTML = html;

}

function increaseQty(index) {

    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];

    cart[index].quantity++;

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    loadCart();

}

function decreaseQty(index) {

    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];

    if (
        cart[index].quantity > 1
    ) {

        cart[index].quantity--;

    }

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    loadCart();

}

function removeItem(index) {

    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];

    cart.splice(index, 1);

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    loadCart();

}

function checkout() {

    window.location.href =
        "checkout.html";

}