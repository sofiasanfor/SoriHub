// PERFIL
let usuario = obtenerUsuario();
let correoOriginal = usuario?.correo || "";

// CARGAR DATOS
function cargarPerfil() {

    if (!usuario) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("nombreUsuario").innerText =
        usuario.nombre || "Usuario";

    document.getElementById("nombre").value =
        usuario.nombre || "";

    document.getElementById("apellido").value =
        usuario.apellido || "";

    document.getElementById("correo").value =
        usuario.correo || "";

    // Foto
    if (usuario.foto) {
        document.getElementById("fotoPerfil").src =
            usuario.foto;

        document.getElementById("btnEliminarFoto").style.display =
            "inline-block";
    } else {
        document.getElementById("fotoPerfil").src =
            "img/user.png";

        document.getElementById("btnEliminarFoto").style.display =
            "none";
    }

}

// VOLVER
function volverPanel() {
    window.location.href = "admin.html";
}

// GUARDAR PERFIL
async function guardarPerfil() {

    const datos = {
        viejoCorreo: correoOriginal,
        nombre: document.getElementById("nombre").value.trim(),
        apellido: document.getElementById("apellido").value.trim(),
        correo: document.getElementById("correo").value.trim().toLowerCase()
    };

    try {

        const res = await fetch("/actualizar-usuario", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const data = await res.json();

        if (!data.ok) {
            mostrarMensaje(
                data.mensaje || "No fue posible actualizar el perfil."
            );
            return;
        }

        usuario.nombre = datos.nombre;
        usuario.apellido = datos.apellido;
        usuario.correo = datos.correo;

        correoOriginal = datos.correo;

        guardarSesion(
            obtenerToken(),
            usuario
        );

        mostrarMensaje(
            "Perfil actualizado correctamente.",
            "correcto"
        );

        cargarPerfil();

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "Error de conexión con el servidor."
        );

    }

}

// FOTO
function cambiarFoto() {
    document.getElementById("inputFoto").click();
}

async function subirFoto(event) {

    const archivo = event.target.files[0];

    if (!archivo) {
        return;
    }

    const formData = new FormData();

    formData.append("foto", archivo);
    formData.append("correo", usuario.correo);

    try {

        const res = await fetch("/subir-foto", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (!data.ok) {

            mostrarMensaje(
                "No fue posible subir la foto."
            );

            return;

        }

        usuario.foto = data.foto;

        guardarSesion(
            obtenerToken(),
            usuario
        );

        document.getElementById("fotoPerfil").src =
            data.foto;

        document.getElementById("btnEliminarFoto").style.display =
            "inline-block";

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "Error de conexión."
        );

    }

}

async function eliminarFoto() {

    try {

        const res = await fetch("/eliminar-foto", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                correo: usuario.correo
            })
        });

        const data = await res.json();

        if (!data.ok) {

            mostrarMensaje(
                "No fue posible eliminar la foto."
            );

            return;

        }

        usuario.foto = null;

        guardarSesion(
            obtenerToken(),
            usuario
        );

        document.getElementById("fotoPerfil").src =
            "img/user.png";

        document.getElementById("btnEliminarFoto").style.display =
            "none";

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "Error de conexión."
        );

    }

}


// CAMBIAR CONTRASEÑA
function togglePassword() {

    const formulario =
        document.getElementById("formPassword");

    formulario.style.display =
        formulario.style.display === "none"
            ? "flex"
            : "none";

}

function guardarPassword() {

    mostrarMensaje(
        "Esta función será reemplazada por el sistema de recuperación de contraseña.",
        "correcto"
    );

}

function olvido() {
    window.location.href = "recuperar.html";
}

// COLORES
async function aplicarColores() {

    try {

        const colores =
            await fetch("/colores").then(r => r.json());

        const root =
            document.documentElement;

        root.style.setProperty(
            "--color-principal",
            colores.principal
        );

        root.style.setProperty(
            "--color-secundario",
            colores.secundario
        );

        root.style.setProperty(
            "--color-acento",
            colores.acento
        );

        root.style.setProperty(
            "--color-texto",
            colores.texto
        );

        root.style.setProperty(
            "--color-card",
            colores.card
        );

    } catch (error) {

        console.error(error);

    }

}

// INICIO
window.onload = function () {

    cargarPerfil();
    aplicarColores();

};