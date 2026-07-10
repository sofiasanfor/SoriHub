const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/usuario");

const verificarToken = require("../middlewares/verificarToken");

// REGISTRO
router.post("/registro", async (req, res) => {

    try {
        let nombre = req.body.nombre.trim();
        let apellido = req.body.apellido.trim();
        let correo = req.body.correo.trim().toLowerCase();
        let password = req.body.password;

        // Verificar correo existente
        let existe = await Usuario.findOne({ correo });
        console.log("Existe:", existe);

        if (existe) {
            console.log("Correo repetido");
            return res.json({
                mensaje: "correo existente"
            });
        }

        const passwordEncriptada = await bcrypt.hash(password, 10);
        
        // Crear usuario
        let nuevoUsuario = new Usuario({
            nombre,
            apellido,
            correo,
            password: passwordEncriptada,
            rol: "usuario",
            estado: "pendiente",
            fotoPerfil: "",
            ultimoAcceso: null,
            creadoPor: null
        });

        await nuevoUsuario.save();
        res.json({
            mensaje: "usuario creado"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: "error"
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {

    try {
        let correo = req.body.correo.trim().toLowerCase();
        let password = req.body.password;
        let usuario = await Usuario.findOne({ correo });

if (!usuario) {
    return res.json({
        mensaje: "credenciales incorrectas"
    });
}

const coincide = await bcrypt.compare(password, usuario.password);

if (!coincide) {
    return res.json({
        mensaje: "credenciales incorrectas"
    });
}

console.log("Estado del usuario:", usuario.estado);

if (usuario.estado === "pendiente") {
    return res.json({
        mensaje: "pendiente"
    });
}

if (usuario.estado === "suspendido") {
    return res.json({
        mensaje: "suspendido"
    });
}

const token = jwt.sign(
    {
        id: usuario._id,
        rol: usuario.rol,
        estado: usuario.estado
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "8h"
    }
);

        // Actualizar último acceso
        usuario.ultimoAcceso = new Date();
        await usuario.save();

        const usuarioSeguro = {
        _id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        fotoPerfil: usuario.fotoPerfil,
        rol: usuario.rol,
        estado: usuario.estado,
        fechaRegistro: usuario.fechaRegistro,
        ultimoAcceso: usuario.ultimoAcceso
    };

    res.json({
    mensaje: "login correcto",
    token,
    usuario: usuarioSeguro
});

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: "error"
        });
    }
});

// VERIFICAR SESIÓN
router.get( "/sesion", verificarToken, async (req, res) => {

    try {
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(401).json({
                activa: false,
                mensaje: "Usuario no encontrado"
            });
        }

        if (usuario.estado !== "activo") {
            return res.status(401).json({
                activa: false,
                mensaje: "Usuario inactivo"
            });
        }

        res.json({
            activa: true,
            usuario: {
                _id: usuario._id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo,
                fotoPerfil: usuario.fotoPerfil,
                rol: usuario.rol,
                estado: usuario.estado
            }
        });

    } catch (error) {
        return res.status(401).json({
            activa: false,
            mensaje: "Token inválido"
        });
    }
});

module.exports = router;