const API_BASE =
    "https://dripint-backend.onrender.com";

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

                Color:
                ${item.color}

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

async function placeOrder() {

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

    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];

    if (cart.length === 0) {

        alert(
            "Cart is empty."
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/create-order`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({

                        customer: {

                            name,
                            email,
                            phone,
                            address,
                            city,
                            state,
                            pincode

                        },

                        items: cart

                    })
                }
            );

        const result =
            await response.json();

        if (!result.success) {

            alert(
                result.error ||
                "Order creation failed."
            );

            return;
        }

        localStorage.removeItem(
            "cart"
        );

        localStorage.setItem(
            "order_number",
            result.order_number
        );

        window.location.href =
            "success.html";

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to place order."
        );

    }

}