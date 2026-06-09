require("dotenv").config();
const mongoose = require("mongoose");
const cloudinary = require("./config/cloudinary");
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

app.get("/cloudinary-test", async (req, res) => {
    try {
        const result = await cloudinary.api.ping();

        res.json({
            success: true,
            message: "Cloudinary conectado",
            result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});