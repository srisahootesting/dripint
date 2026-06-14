const API_BASE =
"https://dripint-backend.onrender.com";

let users = [];

/* ==========================
AUTH HELPERS
========================== */

function getToken() {

    return localStorage.getItem(
        "admin_token"
    );
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

function handleUnauthorized() {

    alert(
        "Session expired. Please login again."
    );

    logout();
}

/* ==========================
PAGE LOAD
========================== */

window.onload = async () => {

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

    const addUserBtn =
        document.getElementById(
            "addUserBtn"
        );

    if (addUserBtn) {

        addUserBtn.addEventListener(
            "click",
            openUserModal
        );
    }

    const saveUserBtn =
        document.getElementById(
            "saveUserBtn"
        );

    if (saveUserBtn) {

        saveUserBtn.addEventListener(
            "click",
            createUser
        );
    }

    await validateSession();

    await loadUsers();
};

/* ==========================
SESSION CHECK
========================== */

async function validateSession() {

    const token =
        getToken();

    if (!token) {

        window.location.href =
            "admin-login.html";

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/admin/profile`,
                {
                    headers: {
                        Authorization:
                        `Bearer ${token}`
                    }
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleUnauthorized();
            return;
        }

        const data =
            await response.json();

        if (!data.success) {

            handleUnauthorized();
            return;
        }

        const adminUser =
            document.getElementById(
                "adminUser"
            );

        if (
            adminUser &&
            data.admin
        ) {

            adminUser.innerText =
                data.admin.first_name;
        }

    } catch (error) {

        console.error(error);

        handleUnauthorized();
    }
}

/* ==========================
LOAD USERS
========================== */

async function loadUsers() {

    try {

        const response =
            await fetch(
                `${API_BASE}/admin/users`,
                {
                    headers: {
                        Authorization:
                        `Bearer ${getToken()}`
                    }
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleUnauthorized();
            return;
        }

        const data =
            await response.json();

        users =
            data.users || [];

        renderUsers();

        updateKpis();

    } catch (error) {

        console.error(error);
    }
}

/* ==========================
KPIs
========================== */

function updateKpis() {

    document.getElementById(
        "totalUsers"
    ).innerText =
        users.length;

    document.getElementById(
        "activeUsers"
    ).innerText =
        users.filter(
            x => x.is_active == 1
        ).length;

    document.getElementById(
        "disabledUsers"
    ).innerText =
        users.filter(
            x => x.is_active == 0
        ).length;

    document.getElementById(
        "adminUsers"
    ).innerText =
        users.filter(
            x => x.role === "ADMIN"
        ).length;
}

/* ==========================
TABLE
========================== */

function renderUsers() {

    const table =
        document.getElementById(
            "usersTable"
        );

    if (!table) {

        return;
    }

    table.innerHTML = "";

    users.forEach(user => {

        table.innerHTML += `
        <tr>

            <td>${user.id}</td>

            <td>
                ${user.first_name}
                ${user.last_name}
            </td>

            <td>
                ${user.email}
            </td>

            <td>
                ${user.role}
            </td>

            <td>
                ${
                    user.is_active == 1
                    ? "ACTIVE"
                    : "DISABLED"
                }
            </td>

            <td>
                ${user.created_at || ""}
            </td>

            <td>
                ${user.last_login || ""}
            </td>

            <td>

                Manage

            </td>

        </tr>
        `;
    });
}

/* ==========================
MODAL
========================== */

function openUserModal() {

    document.getElementById(
        "userModal"
    ).style.display =
        "block";
}

function closeUserModal() {

    document.getElementById(
        "userModal"
    ).style.display =
        "none";
}

/* ==========================
CREATE USER
========================== */

async function createUser() {

    try {

        const payload = {

            first_name:
                document.getElementById(
                    "firstName"
                ).value,

            last_name:
                document.getElementById(
                    "lastName"
                ).value,

            email:
                document.getElementById(
                    "email"
                ).value,

            password:
                document.getElementById(
                    "password"
                ).value,

            role:
                document.getElementById(
                    "role"
                ).value
        };

        const response =
            await fetch(
                `${API_BASE}/admin/user`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                        "application/json",

                        Authorization:
                        `Bearer ${getToken()}`
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.error
            );

            return;
        }

        alert(
            "User created successfully"
        );

        closeUserModal();

        await loadUsers();

    } catch (error) {

        console.error(error);

        alert(
            "Failed to create user"
        );
    }
}