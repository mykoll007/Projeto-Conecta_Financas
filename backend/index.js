require("dotenv").config();

const express = require("express");
const cors = require("cors");

const routes = require("./src/routes/routes");
const database = require("./src/database/connection");

const app = express();


// =========================
// Configurações
// =========================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =========================
// Rotas
// =========================

app.use("/api", routes);


// Rota inicial
app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "API do Conecta Finanças funcionando."
    });
});


// Testar conexão com o banco
app.get("/api/status", async (req, res) => {
    try {
        await database.raw("SELECT 1");

        return res.status(200).json({
            success: true,
            api: "online",
            database: "conectado"
        });

    } catch (error) {
        console.error(
            "Erro ao testar banco:",
            error
        );

        return res.status(500).json({
            success: false,
            api: "online",
            database: "desconectado"
        });
    }
});


// =========================
// Rota não encontrada
// =========================

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "Rota não encontrada."
    });
});


// =========================
// Middleware de erro
// =========================

app.use((error, req, res, next) => {
    console.error(
        "Erro interno:",
        error
    );

    return res.status(500).json({
        success: false,
        message: "Erro interno do servidor."
    });
});


// =========================
// Iniciar servidor
// =========================

const PORT =
    Number(process.env.PORT) || 5000;

async function iniciarServidor() {
    try {
        await database.raw("SELECT 1");

        console.log(
            "✅ Conectado ao MySQL com sucesso!"
        );

        app.listen(PORT, () => {
            console.log(
                `🚀 Servidor rodando em http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "❌ Erro ao conectar ao MySQL:",
            error.message
        );

        process.exit(1);
    }
}

iniciarServidor();