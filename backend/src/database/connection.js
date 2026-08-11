require("dotenv").config();

const knex = require("knex")({
    client: "mysql2",

    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT)
    },

    pool: {
        min: 2,
        max: 10
    }
});

// Teste da conexão
knex.raw("SELECT 1")
    .then(() => {
        console.log("✅ Conectado ao MySQL com sucesso!");
    })
    .catch((err) => {
        console.error("❌ Erro ao conectar ao MySQL:", err.message);
    });

module.exports = knex;