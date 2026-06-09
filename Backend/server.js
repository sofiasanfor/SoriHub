require("dotenv").config();
const mongoose = require("mongoose");

const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("SoriTech Backend funcionando 🚀");
});

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("✅ MongoDB conectado");
})
.catch((error) => {
    console.error("❌ Error MongoDB:", error);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});