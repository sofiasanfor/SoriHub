async function login(){

    let correo = document.getElementById("correo").value
    let password = document.getElementById("password").value

    if(!correo || !password){
        mostrarMensaje("Completa todos los campos")
        return
    }

    let datos = {
        correo,
        password
    }

    let res = await fetch("/login",{
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

localStorage.setItem("token", data.token);

localStorage.setItem("usuario", JSON.stringify(data.usuario));

window.location = "admin.html";

    localStorage.setItem("usuario",JSON.stringify(data.usuario))
    if(data.usuario.rol==="admin"){
        window.location="admin.html"
    }else{
        window.location="index.html"
    }
}

window.onload=function(){

    let usuario=localStorage.getItem("usuario")
    if(usuario){
        window.location="index.html"
    }

}

function mostrarMensaje(texto,tipo="error"){

    let msg=document.getElementById("mensaje")
    msg.innerText=texto
    msg.className="mensaje "+tipo
    msg.style.display="block"
    setTimeout(()=>{
        msg.style.display="none"
    },3000)

}