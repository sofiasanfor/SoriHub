// CONFIGURACIÓN
require("dotenv").config({
    path: "./Backend/.env"
});

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/auth");

const app = express();

// CONEXIÓN A MONGODB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB conectado.");
})
.catch((error) => {
    console.log("❌ Error conectando MongoDB");
    console.log(error);
});

// CONFIGURACIÓN EXPRESS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir el Frontend
app.use(express.static(path.join(__dirname, "../Frontend")));


// PÁGINA PRINCIPAL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

// RUTAS DE AUTENTICACIÓN
app.use("/auth", authRoutes);

// INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("");
    console.log("======================================");
    console.log("SoriHub iniciado correctamente.");
    console.log(`Puerto: ${PORT}`);
    console.log("======================================");
});