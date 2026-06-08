const API_BASE =
"https://dripint-backend.onrender.com";

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


async function sendOTP(){

    const email =
    document.getElementById("email").value;

    if(!email){

        document.getElementById(
            "message"
        ).innerText =
        "Please enter email";

        return;
    }

    try{

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

        document.getElementById(
            "message"
        ).innerText =
        data.message || data.error;

    }catch(error){

        document.getElementById(
            "message"
        ).innerText =
        error.message;

    }
}


async function verifyOTP(){

    const email =
    document.getElementById("email").value;

    const otp =
    document.getElementById("otp").value;

    if(!otp){

        document.getElementById(
            "message"
        ).innerText =
        "Please enter OTP";

        return;
    }

    try{

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

            document.getElementById(
                "message"
            ).innerText =
            data.error || "Verification Failed";

        }

    }catch(error){

        document.getElementById(
            "message"
        ).innerText =
        error.message;

    }
}


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


function logout(){

    localStorage.removeItem(
        "jwt_token"
    );

    location.reload();

}