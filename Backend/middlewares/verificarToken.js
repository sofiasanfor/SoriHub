const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                mensaje: "No autorizado"
            });
        }

        const token = authHeader.split(" ")[1];
        const datos = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = datos;
        next();

    } catch (error) {
        return res.status(401).json({
            mensaje: "Token inválido"
        });
    }
}

module.exports = verificarToken;