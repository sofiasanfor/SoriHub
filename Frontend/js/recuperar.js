window.onload = function () {
    if (haySesion()) {
        window.location.href = "admin.html";
        return;
    }
    document.getElementById("correo").focus();
};

async function recuperar() {
    const correo = document
        .getElementById("correo")
        .value
        .trim()
        .toLowerCase();

    if (!correo) {
        mostrarMensaje(
            "Ingresa tu correo electrónico."
        );
        return;
    }

    if (!correo.includes("@") || !correo.includes(".")) {
        mostrarMensaje(
            "Ingresa un correo válido."
        );
        return;
    }

    const datos = {
        correo
    };

    try {
        const res = await fetch("/auth/recuperar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const data = await res.json();
        if (data.mensaje === "correo no encontrado") {
            mostrarMensaje(
                "No existe ninguna cuenta registrada con ese correo."
            );
            return;
        }

        if (data.mensaje !== "correo encontrado") {
            mostrarMensaje(
                "No fue posible procesar la solicitud."
            );
            return;
        }

        document.getElementById("formRecuperar").style.display = "none";
        document.getElementById("correoEnviado").style.display = "block";

    } catch (error) {
        mostrarMensaje(
            "Error de conexión con el servidor."
        );
        console.error(error);
    }
}