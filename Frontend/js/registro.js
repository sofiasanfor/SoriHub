window.onload = function () {
    if (haySesion()) {
        window.location.href = "admin.html";
        return;
    }
    document.getElementById("nombre").focus();
};

async function registrar() {
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (!nombre || !apellido || !correo || !password) {
        mostrarMensaje("Completa todos los campos.");
        return;
    }

    if (!correo.includes("@") || !correo.includes(".")) {
        mostrarMensaje("Ingresa un correo válido.");
        return;
    }

    if (password.length < 6) {
        mostrarMensaje("La contraseña debe tener mínimo 6 caracteres.");
        return;
    }

    const datos = {
        nombre,
        apellido,
        correo,
        password
    };

    try {
        const res = await fetch("/auth/registro", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const data = await res.json();

        // Ya existe el correo
        if (data.mensaje === "correo existente") {
            mostrarMensaje("Ya existe una cuenta registrada con ese correo.");
            return;
        }

        // Error general
        if (data.mensaje !== "usuario creado") {
            mostrarMensaje("No fue posible crear la cuenta.");
            return;
        }

        // Mostrar pantalla de éxito

        document.getElementById("formRegistro").style.display = "none";
        document.getElementById("registroExitoso").style.display = "block";

    } catch (error) {
        mostrarMensaje("Error de conexión con el servidor.");
        console.error(error);
    }
}