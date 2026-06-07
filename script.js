function register() {

    let email = document.getElementById("registerEmail").value;
    let password = document.getElementById("registerPassword").value;

    if(email === "" || password === ""){
        document.getElementById("registerMessage").innerText =
        "Please enter email and password";
        return;
    }

    let users =
    JSON.parse(localStorage.getItem("users")) || [];

    let existingUser =
    users.find(user => user.email === email);

    if(existingUser){
        document.getElementById("registerMessage").innerText =
        "User already exists";
        return;
    }

    users.push({
        email: email,
        password: password
    });

    localStorage.setItem(
        "users",
        JSON.stringify(users)
    );

    document.getElementById("registerMessage").innerText =
    "Account Created Successfully";
}

function login() {

    let email =
    document.getElementById("loginEmail").value;

    let password =
    document.getElementById("loginPassword").value;

    let users =
    JSON.parse(localStorage.getItem("users")) || [];

    let user = users.find(
        u => u.email === email &&
        u.password === password
    );

    if(user){

        document.getElementById("loginMessage").innerText =
        "Login Successful";

        window.location.href =
        "welcome.html";

    } else {

        document.getElementById("loginMessage").innerText =
        "Invalid Email or Password";

    }
}