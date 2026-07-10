// MENSAJES

function mostrarMensaje(texto, tipo = "error") {

    const mensaje = document.getElementById("mensaje");

    if (!mensaje) {
        return;
    }

    mensaje.innerText = texto;
    mensaje.className = "mensaje " + tipo;
    mensaje.style.display = "block";

    setTimeout(() => {
        mensaje.style.display = "none";
    }, 4000);

}