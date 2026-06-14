const API_BASE =
    "https://dripint-backend.onrender.com";

/* =========================================
   AUTO REDIRECT IF ALREADY LOGGED IN
========================================= */

const existingToken =
    localStorage.getItem(
        "admin_token"
    );

if (existingToken) {

    window.location.href =
        "dashboard.html";

}

/* =========================================
   LOGIN FORM
========================================= */

document
    .getElementById(
        "loginForm"
    )
    .addEventListener(
        "submit",
        adminLogin
    );

/* =========================================
   ADMIN LOGIN
========================================= */

async function adminLogin(event) {

    event.preventDefault();

    const email =
        document
            .getElementById(
                "email"
            )
            .value
            .trim();

    const password =
        document
            .getElementById(
                "password"
            )
            .value
            .trim();

    const loginBtn =
        document.getElementById(
            "loginBtn"
        );

    const errorBox =
        document.getElementById(
            "errorBox"
        );

    errorBox.style.display =
        "none";

    loginBtn.disabled = true;

    loginBtn.classList.add(
        "loading"
    );

    loginBtn.textContent =
        "Signing In...";

    try {

        const response =
            await fetch(
                `${API_BASE}/admin/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        email:
                            email,

                        password:
                            password

                    })

                }
            );

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                data.error ||
                "Login failed"
            );

        }

        localStorage.setItem(

            "admin_token",

            data.token

        );

        localStorage.setItem(

            "admin_user",

            JSON.stringify(
                data.admin
            )

        );

        loginBtn.textContent =
            "Success...";

        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 500);

    }
    catch (error) {

        errorBox.style.display =
            "block";

        errorBox.textContent =
            error.message;

        loginBtn.disabled =
            false;

        loginBtn.classList.remove(
            "loading"
        );

        loginBtn.textContent =
            "Login";

    }

}