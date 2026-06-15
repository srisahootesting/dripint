const API_BASE =
"https://dripint-backend.onrender.com";

/* ==========================
   PAGE LOAD
========================== */

window.onload = async () => {

    await loadProducts();

    const token =
    localStorage.getItem("jwt_token");

    if (!token) {
        return;
    }

    try {

        const response =
        await fetch(
            API_BASE + "/profile",
            {
                headers: {
                    Authorization:
                        "Bearer " + token
                }
            }
        );

        if (!response.ok) {

            localStorage.removeItem(
                "jwt_token"
            );

            return;
        }

        const data =
        await response.json();

        showDashboard(
            data.email
        );

    } catch (error) {

        console.log(error);

    }

};

/* ==========================
   LOAD PRODUCTS
========================== */

async function loadProducts() {

    const productGrid =
        document.getElementById(
            "productGrid"
        );

    if (!productGrid) {
        return;
    }

    try {

        const response =
            await fetch(
                API_BASE + "/products"
            );

        const products =
            await response.json();

        productGrid.innerHTML = "";

        if (!products || products.length === 0) {

            productGrid.innerHTML =
                "<p>No products available.</p>";

            return;

        }

        products.forEach(product => {

            productGrid.innerHTML += `
                <div class="product-card">

                    <div class="product-badge">
                        NEW
                    </div>

                    <div class="product-image">
                    <img
                        src="${product.image_url}"
                        onerror="this.src='assets/no-image.png'"
                            alt="${product.product_name}"
                            onerror="this.src='assets/no-image.png'"
                            style="
                                width:100%;
                                height:320px;
                                object-fit:contain;
                                background:white;
                                padding:10px;
                            "
                        >
                        <button
                            class="quick-view-btn"
                            onclick="viewProduct(${product.id})"
                        >
                            Quick View
                        </button>
                    </div>

                    <h3>${product.product_name}</h3>

                    <p class="price">
                        ₹${product.price}
                    </p>

                    <button
                        class="buy-btn"
                        onclick="viewProduct(${product.id})"
                    >
                        View Product
                    </button>

                </div>
            `;

        });

    } catch (error) {

        console.log(
            "Product Load Error:",
            error
        );

    }

}

/* ==========================
   PRODUCT DETAILS
========================== */

function viewProduct(productId) {

    window.location.href =
        "product.html?id=" +
        productId;

}

/* ==========================
   LOGIN MODAL
========================== */

function openLoginModal() {

    document.getElementById(
        "loginModal"
    ).style.display = "block";

}

function closeLoginModal() {

    document.getElementById(
        "loginModal"
    ).style.display = "none";

}

window.onclick = function (event) {

    const modal =
        document.getElementById(
            "loginModal"
        );

    if (event.target === modal) {

        modal.style.display =
            "none";

    }

};

/* ==========================
   SEND OTP
========================== */

async function sendOTP() {

    const email =
        document.getElementById(
            "email"
        ).value.trim();

    const message =
        document.getElementById(
            "message"
        );

    const button =
        document.getElementById(
            "sendOtpBtn"
        );

    if (!email) {

        message.innerText =
            "Please enter your email.";

        return;
    }

    try {

        button.disabled = true;

        button.innerText =
            "Sending OTP...";

        const response =
            await fetch(
                API_BASE + "/send-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email: email
                    })
                }
            );

        const data =
            await response.json();

        message.innerText =
            data.message ||
            data.error;

    } catch (error) {

        message.innerText =
            error.message;

    } finally {

        button.disabled = false;

        button.innerText =
            "Send OTP";

    }

}

/* ==========================
   VERIFY OTP
========================== */

async function verifyOTP() {

    const email =
        document.getElementById(
            "email"
        ).value.trim();

    const otp =
        document.getElementById(
            "otp"
        ).value.trim();

    const message =
        document.getElementById(
            "message"
        );

    const button =
        document.getElementById(
            "verifyOtpBtn"
        );

    if (!otp) {

        message.innerText =
            "Please enter OTP.";

        return;
    }

    try {

        button.disabled = true;

        button.innerText =
            "Verifying...";

        const response =
            await fetch(
                API_BASE + "/verify-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        otp: otp
                    })
                }
            );

        const data =
            await response.json();

        if (data.token) {

            localStorage.setItem(
                "jwt_token",
                data.token
            );

            showDashboard(
                data.email
            );

        } else {

            message.innerText =
                data.error ||
                "Verification Failed";

        }

    } catch (error) {

        message.innerText =
            error.message;

    } finally {

        button.disabled = false;

        button.innerText =
            "Verify & Login";

    }

}

/* ==========================
   DASHBOARD
========================== */

function showDashboard(email) {

    document.getElementById(
        "loginSection"
    ).style.display =
        "none";

    document.getElementById(
        "dashboard"
    ).style.display =
        "block";

    document.getElementById(
        "userEmail"
    ).innerText =
        email;

}

/* ==========================
   LOGOUT
========================== */

function logout() {

    localStorage.removeItem(
        "jwt_token"
    );

    location.reload();

}


function toggleMenu(){

    document
    .getElementById("mobileMenu")
    .classList
    .toggle("active");

    document
    .getElementById("menuOverlay")
    .classList
    .toggle("active");

}

window.addEventListener(
    "scroll",
    function(){

        const header =
        document.querySelector(
            ".header"
        );

        if(window.scrollY > 50){

            header.classList.add(
                "scrolled"
            );

        }else{

            header.classList.remove(
                "scrolled"
            );

        }

    }
);