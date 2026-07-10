// SESIÓN

function guardarSesion(token, usuario){
     localStorage.setItem(
        "token",
        token
    );

    localStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
    );
}

function obtenerToken(){
    return localStorage.getItem("token");
}

function obtenerUsuario(){
    const usuario = localStorage.getItem("usuario");
    if(!usuario){
        return null;
    }
    return JSON.parse(usuario);
}

function haySesion(){
    return obtenerToken() !== null;
}

function cerrarSesion(){
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    window.location.href = "index.html";
}