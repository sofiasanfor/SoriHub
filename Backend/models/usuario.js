const mongoose = require("mongoose");

const Usuario = mongoose.model("Usuario", {
    nombre: {
        type: String,
        required: true,
        trim: true
    },

    apellido: {
        type: String,
        required: true,
        trim: true
    },

    correo: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    fotoPerfil: {
        type: String,
        default: ""
    },

   rol: {
    type: String,
    enum: [
        "usuario",
        "operador",
        "administrador",
        "superadministrador"
    ],
    default: "usuario"
    },

   estado: {
    type: String,
    enum: [
        "pendiente",
        "activo",
        "suspendido"
    ],
    default: "pendiente"
},

    fechaRegistro: {
        type: Date,
        default: Date.now
    },

    ultimoAcceso: {
        type: Date,
        default: null
    },

    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        default: null
    },

    tokenRecuperacion: {
    type: String,
    default: ""
    },

    expiraTokenRecuperacion: {
    type: Date,
    default: null
    }

});

module.exports = Usuario;