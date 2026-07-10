async function login(){

    let correo = document.getElementById("correo").value
    .trim().toLowerCase();
    let password = document.getElementById("password").value;

    if(!correo || !password){
        mostrarMensaje("Completa todos los campos")
        return;
    }
    try{
        
    let datos = {
        correo,
        password
    }

    let res = await fetch("/auth/login",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(datos)
    })

    let data = await res.json()

    if (data.mensaje === "pendiente") {
    mostrarMensaje(
        "Tu cuenta está pendiente de aprobación por un administrador."
    );
    return;
    }
if (data.mensaje === "suspendido") {
    mostrarMensaje(
        "Tu cuenta ha sido suspendida."
    );
    return;
}

if (data.mensaje === "credenciales incorrectas") {
    mostrarMensaje(
        "Correo o contraseña incorrectos."
    );

    document.getElementById("password").value = "";
    document.getElementById("password").focus();
    return;
}
    guardarSesion(
    data.token,
    data.usuario
);

    window.location.href = "admin.html";

}catch(error){
        mostrarMensaje(
            "Error de conexión con el servidor."
        );
        console.error(error);
    }
}

window.onload = function () {
    if (haySesion()) {
        window.location.href = "admin.html";
        return;
    }
    document.getElementById("correo").focus();
}