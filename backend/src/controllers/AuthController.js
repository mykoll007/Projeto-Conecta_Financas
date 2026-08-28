const database = require("../database/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class AuthController {

    // =========================
    // Criar usuário
    // =========================
    async criarUsuario(req, res) {
        const {
            nome,
            email,
            senha,
            telefone,
            profissao
        } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                message: "Nome, e-mail e senha são obrigatórios."
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                message: "A senha deve possuir pelo menos 6 caracteres."
            });
        }

        try {
            const emailNormalizado =
                email.trim().toLowerCase();

            const usuarioExistente = await database("usuarios")
                .where("email", emailNormalizado)
                .first();

            if (usuarioExistente) {
                return res.status(409).json({
                    message: "Este e-mail já está cadastrado."
                });
            }

            const senhaHash = await bcrypt.hash(senha, 12);

            const [usuarioId] = await database("usuarios")
                .insert({
                    nome: nome.trim(),
                    email: emailNormalizado,
                    senha: senhaHash,
                    telefone: telefone || null,
                    profissao: profissao || null,
                    criado_em: database.fn.now(),
                    atualizado_em: database.fn.now()
                });

            // Configuração padrão
            await database("configuracoes")
                .insert({
                    usuario_id: usuarioId,
                    orcamento_mensal: 0,
                    moeda: "BRL",
                    tema: "light",
                    forma_pagamento_padrao: "Pix",
                    inicio_mes: 1,
                    incluir_pendencias: true,
                    confirmar_exclusao: true,
                    animacoes: true,
                    modo_compacto: false
                });

            // Categorias padrão
            const categoriasPadrao = [
                {
                    usuario_id: usuarioId,
                    nome: "Alimentação",
                    cor: "#e84c3d"
                },
                {
                    usuario_id: usuarioId,
                    nome: "Moradia",
                    cor: "#3385d6"
                },
                {
                    usuario_id: usuarioId,
                    nome: "Transporte",
                    cor: "#e9a319"
                },
                {
                    usuario_id: usuarioId,
                    nome: "Saúde",
                    cor: "#8854d0"
                },
                {
                    usuario_id: usuarioId,
                    nome: "Lazer",
                    cor: "#21a366"
                },
                {
                    usuario_id: usuarioId,
                    nome: "Salário",
                    cor: "#087747"
                },
                {
                    usuario_id: usuarioId,
                    nome: "Reservas",
                    cor: "#2563eb"
                },
                {
                    usuario_id: usuarioId,
                    nome: "Outros",
                    cor: "#95a19a"
                }
            ];

            await database("categorias")
                .insert(categoriasPadrao);

            return res.status(201).json({
                message: "Usuário criado com sucesso.",
                usuarioId
            });

        } catch (error) {
            console.error(
                "Erro ao criar usuário:",
                error
            );

            return res.status(500).json({
                message: "Erro ao criar usuário."
            });
        }
    }


    // =========================
    // Login
    // =========================
    async autenticarUsuario(req, res) {
        const {
            email,
            senha
        } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                message: "Informe o e-mail e a senha."
            });
        }

        try {
            const usuario = await database("usuarios")
                .where(
                    "email",
                    email.trim().toLowerCase()
                )
                .first();

            if (!usuario) {
                return res.status(401).json({
                    message: "E-mail ou senha incorretos."
                });
            }

            const senhaCorreta =
                await bcrypt.compare(
                    senha,
                    usuario.senha
                );

            if (!senhaCorreta) {
                return res.status(401).json({
                    message: "E-mail ou senha incorretos."
                });
            }

            const token = jwt.sign(
                {
                    usuarioId: usuario.id
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

            return res.status(200).json({
                message: "Login realizado com sucesso.",
                token,

                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    telefone: usuario.telefone,
                    profissao: usuario.profissao
                }
            });

        } catch (error) {
            console.error(
                "Erro ao autenticar usuário:",
                error
            );

            return res.status(500).json({
                message: "Erro ao realizar login."
            });
        }
    }


    // =========================
    // Usuário logado
    // =========================
    async listarUsuarioLogado(req, res) {
        try {
            const usuario = await database("usuarios")
                .select(
                    "id",
                    "nome",
                    "email",
                    "telefone",
                    "profissao",
                    "criado_em"
                )
                .where(
                    "id",
                    req.usuarioId
                )
                .first();

            if (!usuario) {
                return res.status(404).json({
                    message: "Usuário não encontrado."
                });
            }

            return res.status(200).json(usuario);

        } catch (error) {
            console.error(
                "Erro ao buscar usuário:",
                error
            );

            return res.status(500).json({
                message: "Erro ao buscar usuário."
            });
        }
    }


    // =========================
    // Atualizar perfil
    // =========================
    async atualizarPerfil(req, res) {
        const {
            nome,
            email,
            telefone,
            profissao
        } = req.body;

        if (!nome || !email) {
            return res.status(400).json({
                message: "Nome e e-mail são obrigatórios."
            });
        }

        try {
            const emailEmUso = await database("usuarios")
                .where(
                    "email",
                    email.trim().toLowerCase()
                )
                .whereNot(
                    "id",
                    req.usuarioId
                )
                .first();

            if (emailEmUso) {
                return res.status(409).json({
                    message: "Este e-mail já está sendo utilizado."
                });
            }

            await database("usuarios")
                .where(
                    "id",
                    req.usuarioId
                )
                .update({
                    nome: nome.trim(),
                    email: email.trim().toLowerCase(),
                    telefone: telefone || null,
                    profissao: profissao || null,
                    atualizado_em: database.fn.now()
                });

            return res.status(200).json({
                message: "Perfil atualizado com sucesso."
            });

        } catch (error) {
            console.error(
                "Erro ao atualizar perfil:",
                error
            );

            return res.status(500).json({
                message: "Erro ao atualizar perfil."
            });
        }
    }
}

module.exports = new AuthController();