/* ==========================================
   DRIP DESIGNS SETTINGS
========================================== */

const SETTINGS_KEY =
"drip_designs_settings";

/* ==========================================
   PAGE LOAD
========================================== */

window.onload = function () {

    loadSettings();
};

/* ==========================================
   LOAD SETTINGS
========================================== */

function loadSettings() {

    const savedSettings =
        localStorage.getItem(
            SETTINGS_KEY
        );

    if (!savedSettings) {

        return;
    }

    try {

        const settings =
            JSON.parse(savedSettings);

        setValue(
            "storeName",
            settings.storeName
        );

        setValue(
            "storeEmail",
            settings.storeEmail
        );

        setValue(
            "supportPhone",
            settings.supportPhone
        );

        setValue(
            "whatsappNumber",
            settings.whatsappNumber
        );

        setValue(
            "logoUrl",
            settings.logoUrl
        );

        setValue(
            "bannerUrl",
            settings.bannerUrl
        );

        setValue(
            "instagramUrl",
            settings.instagramUrl
        );

        setValue(
            "facebookUrl",
            settings.facebookUrl
        );

        setValue(
            "razorpayKey",
            settings.razorpayKey
        );

        setValue(
            "qikinkEmail",
            settings.qikinkEmail
        );

        setValue(
            "qikinkApiKey",
            settings.qikinkApiKey
        );

    } catch (error) {

        console.error(
            "Settings load error:",
            error
        );
    }
}

/* ==========================================
   SAVE SETTINGS
========================================== */

function saveSettings() {

    try {

        const settings = {

            storeName:
                getValue(
                    "storeName"
                ),

            storeEmail:
                getValue(
                    "storeEmail"
                ),

            supportPhone:
                getValue(
                    "supportPhone"
                ),

            whatsappNumber:
                getValue(
                    "whatsappNumber"
                ),

            logoUrl:
                getValue(
                    "logoUrl"
                ),

            bannerUrl:
                getValue(
                    "bannerUrl"
                ),

            instagramUrl:
                getValue(
                    "instagramUrl"
                ),

            facebookUrl:
                getValue(
                    "facebookUrl"
                ),

            razorpayKey:
                getValue(
                    "razorpayKey"
                ),

            qikinkEmail:
                getValue(
                    "qikinkEmail"
                ),

            qikinkApiKey:
                getValue(
                    "qikinkApiKey"
                )

        };

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(settings)
        );

        showSuccessToast(
            "Settings saved successfully"
        );

    } catch (error) {

        console.error(error);

        alert(
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

        toast.style.background =
            "#16a34a";

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

    toast.innerText =
        message;

    toast.style.opacity =
        "1";

    setTimeout(() => {

        toast.style.opacity =
            "0";

    }, 3000);
}