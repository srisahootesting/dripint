window.onload = loadSummary;

function loadSummary() {

    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];

    const container =
        document.getElementById(
            "orderSummary"
        );

    let total = 0;

    let html = "";

    cart.forEach(item => {

        const subtotal =
            Number(item.price) *
            item.quantity;

        total += subtotal;

        html += `

            <div
                style="
                    background:white;
                    padding:15px;
                    border-radius:10px;
                    margin-bottom:15px;
                "
            >

                <strong>
                    ${item.product_name}
                </strong>

                <br>

                Qty:
                ${item.quantity}

                <br>

                ₹${subtotal}

            </div>

        `;

    });

    html += `

        <hr>

        <h2>

            Total:
            ₹${total}

        </h2>

    `;

    container.innerHTML = html;

}

function placeOrder() {

    const name =
        document.getElementById(
            "customerName"
        ).value.trim();

    const email =
        document.getElementById(
            "customerEmail"
        ).value.trim();

    const phone =
        document.getElementById(
            "customerPhone"
        ).value.trim();

    const address =
        document.getElementById(
            "customerAddress"
        ).value.trim();

    const city =
        document.getElementById(
            "customerCity"
        ).value.trim();

    const state =
        document.getElementById(
            "customerState"
        ).value.trim();

    const pincode =
        document.getElementById(
            "customerPincode"
        ).value.trim();

    if (
        !name ||
        !email ||
        !phone ||
        !address ||
        !city ||
        !state ||
        !pincode
    ) {

        alert(
            "Please fill all fields."
        );

        return;
    }

    const order = {

        customer: {

            name,
            email,
            phone,
            address,
            city,
            state,
            pincode

        },

        cart:
            JSON.parse(
                localStorage.getItem(
                    "cart"
                )
            ) || []

    };

    localStorage.setItem(
        "last_order",
        JSON.stringify(order)
    );

    localStorage.removeItem(
        "cart"
    );

    alert(
        "Order Placed Successfully!"
    );

    window.location.href =
        "index.html";

}