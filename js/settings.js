/* ==========================================
   DRIP DESIGNS SETTINGS
========================================== */

const API_BASE =
"https://dripint-backend.onrender.com";

/* ==========================================
   AUTH HELPERS
========================================== */

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
        "Your session has expired. Please login again."
    );

    logout();
}

function getAuthHeaders() {

    return {

        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${getToken()}`
    };
}

async function validateAdminSession() {

    const token =
        getToken();

    if (!token) {

        window.location.href =
            "admin-login.html";

        return false;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/admin/profile`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleUnauthorized();
            return false;
        }

        const data =
            await response.json();

        if (!data.success) {

            handleUnauthorized();
            return false;
        }

        let adminName = "Admin";

        const storedUser =
            localStorage.getItem(
                "admin_user"
            );

        if (storedUser) {

            try {

                const user =
                    JSON.parse(
                        storedUser
                    );

                adminName =
                    user.first_name ||
                    user.name ||
                    adminName;

            } catch (e) {

                console.error(e);
            }
        }

        const adminUserEl =
            document.getElementById(
                "adminUser"
            );

        if (adminUserEl) {

            adminUserEl.innerText =
                adminName;
        }

        return true;

    } catch (error) {

        console.error(error);

        handleUnauthorized();

        return false;
    }
}

/* ==========================================
   PAGE LOAD
========================================== */

window.onload = async function () {

    const isValid =
        await validateAdminSession();

    if (!isValid) {

        return;
    }

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

    await loadSettings();
};

/* ==========================================
   LOAD SETTINGS
========================================== */

async function loadSettings() {

    try {

        const response =
            await fetch(
                `${API_BASE}/admin/settings`,
                {
                    headers: {
                        "Authorization":
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

        if (!data.success) {

            throw new Error(
                data.error ||
                "Failed to load settings"
            );
        }

        const settings =
            data.settings || {};

        setValue(
            "storeName",
            settings.store_name
        );

        setValue(
            "storeEmail",
            settings.store_email
        );

        setValue(
            "supportPhone",
            settings.support_phone
        );

        setValue(
            "whatsappNumber",
            settings.whatsapp_number
        );

        setValue(
            "logoUrl",
            settings.logo_url
        );

        setValue(
            "bannerUrl",
            settings.banner_url
        );

        setValue(
            "instagramUrl",
            settings.instagram_url
        );

        setValue(
            "facebookUrl",
            settings.facebook_url
        );

        setValue(
            "razorpayKey",
            settings.razorpay_key
        );

        setValue(
            "qikinkEmail",
            settings.qikink_email
        );

        setValue(
            "qikinkApiKey",
            settings.qikink_api_key
        );

    } catch (error) {

        console.error(
            "Load Settings Error:",
            error
        );

        showErrorToast(
            "Failed to load settings"
        );
    }
}

/* ==========================================
   SAVE SETTINGS
========================================== */

async function saveSettings() {

    try {

        const payload = {

            store_name:
                getValue(
                    "storeName"
                ),

            store_email:
                getValue(
                    "storeEmail"
                ),

            support_phone:
                getValue(
                    "supportPhone"
                ),

            whatsapp_number:
                getValue(
                    "whatsappNumber"
                ),

            logo_url:
                getValue(
                    "logoUrl"
                ),

            banner_url:
                getValue(
                    "bannerUrl"
                ),

            instagram_url:
                getValue(
                    "instagramUrl"
                ),

            facebook_url:
                getValue(
                    "facebookUrl"
                ),

            razorpay_key:
                getValue(
                    "razorpayKey"
                ),

            qikink_email:
                getValue(
                    "qikinkEmail"
                ),

            qikink_api_key:
                getValue(
                    "qikinkApiKey"
                )

        };

        const response =
            await fetch(
                `${API_BASE}/admin/settings`,
                {
                    method: "PUT",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify(
                            payload
                        )
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

            throw new Error(
                data.error ||
                "Save failed"
            );
        }

        showSuccessToast(
            "Settings saved successfully"
        );

    } catch (error) {

        console.error(
            "Save Settings Error:",
            error
        );

        showErrorToast(
            "Failed to save settings"
        );
    }
}

/* ==========================================
   HELPERS
========================================== */

function getValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {

        return "";
    }

    return element.value.trim();
}

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;
    }

    element.value =
        value || "";
}

/* ==========================================
   SUCCESS TOAST
========================================== */

function showSuccessToast(message) {

    showToast(
        message,
        "#16a34a"
    );
}

/* ==========================================
   ERROR TOAST
========================================== */

function showErrorToast(message) {

    showToast(
        message,
        "#dc2626"
    );
}

/* ==========================================
   TOAST
========================================== */

function showToast(
    message,
    color
) {

    let toast =
        document.getElementById(
            "settingsToast"
        );

    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "settingsToast";

        toast.style.position =
            "fixed";

        toast.style.top =
            "20px";

        toast.style.right =
            "20px";

        toast.style.color =
            "white";

        toast.style.padding =
            "14px 20px";

        toast.style.borderRadius =
            "12px";

        toast.style.boxShadow =
            "0 8px 20px rgba(0,0,0,.15)";

        toast.style.zIndex =
            "99999";

        toast.style.fontWeight =
            "600";

        toast.style.opacity =
            "0";

        toast.style.transition =
            "all .3s ease";

        document.body.appendChild(
            toast
        );
    }

    toast.style.background =
        color;

    toast.innerText =
        message;

    toast.style.opacity =
        "1";

    setTimeout(() => {

        toast.style.opacity =
            "0";

    }, 3000);
}