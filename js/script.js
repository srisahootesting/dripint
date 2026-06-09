const API_BASE =
"https://dripint-backend.onrender.com";

/* ==========================
   PAGE LOAD
========================== */

window.onload = async () => {

    const token =
    localStorage.getItem("jwt_token");

    if(!token){
        return;
    }

    try{

        const response =
        await fetch(
            API_BASE + "/profile",
            {
                headers:{
                    Authorization:
                    "Bearer " + token
                }
            }
        );

        if(!response.ok){

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

    }catch(error){

        console.log(error);

    }

};

/* ==========================
   LOGIN MODAL
========================== */

function openLoginModal(){

    document.getElementById(
        "loginModal"
    ).style.display = "block";

}

function closeLoginModal(){

    document.getElementById(
        "loginModal"
    ).style.display = "none";

}

window.onclick = function(event){

    const modal =
    document.getElementById(
        "loginModal"
    );

    if(event.target === modal){

        modal.style.display =
        "none";

    }

};

/* ==========================
   SEND OTP
========================== */

async function sendOTP(){

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

    if(!email){

        message.innerText =
        "Please enter your email.";

        return;
    }

    try{

        button.disabled = true;
        button.innerText =
        "Sending OTP...";

        const response =
        await fetch(
            API_BASE + "/send-otp",
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({
                    email:email
                })
            }
        );

        const data =
        await response.json();

        message.innerText =
        data.message ||
        data.error;

    }catch(error){

        message.innerText =
        error.message;

    }finally{

        button.disabled = false;

        button.innerText =
        "Send OTP";

    }

}

/* ==========================
   VERIFY OTP
========================== */

async function verifyOTP(){

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

    if(!otp){

        message.innerText =
        "Please enter OTP.";

        return;
    }

    try{

        button.disabled = true;

        button.innerText =
        "Verifying...";

        const response =
        await fetch(
            API_BASE + "/verify-otp",
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({
                    email:email,
                    otp:otp
                })
            }
        );

        const data =
        await response.json();

        if(data.token){

            localStorage.setItem(
                "jwt_token",
                data.token
            );

            showDashboard(
                data.email
            );

        }else{

            message.innerText =
            data.error ||
            "Verification Failed";

        }

    }catch(error){

        message.innerText =
        error.message;

    }finally{

        button.disabled = false;

        button.innerText =
        "Verify & Login";

    }

}

/* ==========================
   DASHBOARD
========================== */

function showDashboard(email){

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

function logout(){

    localStorage.removeItem(
        "jwt_token"
    );

    location.reload();

}