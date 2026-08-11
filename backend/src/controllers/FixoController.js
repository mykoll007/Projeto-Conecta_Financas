const database = require("../database/connection");

class FixoController {

    async listarFixos(req, res) {
        try {
            const fixos =
                await database("fixos as f")
                    .leftJoin(
                        "categorias as c",
                        "f.categoria_id",
                        "c.id"
                    )
                    .select(
                        "f.*",
                        "c.nome as categoria",
                        "c.cor as categoria_cor"
                    )
                    .where(
                        "f.usuario_id",
                        req.usuarioId
                    )
                    .orderBy(
                        "f.dia_vencimento",
                        "asc"
                    );

            return res.status(200).json(fixos);

        } catch (error) {
            console.error(
                "Erro ao listar fixos:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao listar fixos."
            });
        }
    }


    async criarFixo(req, res) {
            console.log("===== POST /FIXOS =====");
    console.log("usuarioId:", req.usuarioId);
    console.log("BODY:", req.body);
    
        const {
            descricao,
            tipo,
            valor,
            categoria_id,
            dia_vencimento,
            forma_pagamento,
            status_padrao,
            ativo
        } = req.body;

        if (
            !descricao ||
            !tipo ||
            !valor ||
            !dia_vencimento
        ) {
            return res.status(400).json({
                message:
                    "Preencha os campos obrigatórios."
            });
        }

        if (
            dia_vencimento < 1 ||
            dia_vencimento > 31
        ) {
            return res.status(400).json({
                message:
                    "O dia deve estar entre 1 e 31."
            });
        }

        try {
            const [fixoId] =
                await database("fixos")
                    .insert({
                        usuario_id:
                            req.usuarioId,

                        categoria_id:
                            categoria_id || null,

                        descricao:
                            descricao.trim(),

                        tipo,

                        valor,

                        dia_vencimento,

                        forma_pagamento:
                            forma_pagamento || null,

                        status_padrao:
                            status_padrao || "pending",

                        ativo:
                            ativo === undefined
                                ? true
                                : ativo,

                        criado_em:
                            database.fn.now(),

                        atualizado_em:
                            database.fn.now()
                    });

            return res.status(201).json({
                message:
                    "Fixo criado com sucesso.",

                fixoId
            });

        } catch (error) {
            console.error(
                "Erro ao criar fixo:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao criar fixo."
            });
        }
    }


    async atualizarFixo(req, res) {
        const {
            fixoId
        } = req.params;

        try {
            const fixo =
                await database("fixos")
                    .where({
                        id: fixoId,
                        usuario_id:
                            req.usuarioId
                    })
                    .first();

            if (!fixo) {
                return res.status(404).json({
                    message:
                        "Fixo não encontrado."
                });
            }

            const {
                descricao,
                tipo,
                valor,
                categoria_id,
                dia_vencimento,
                forma_pagamento,
                status_padrao,
                ativo
            } = req.body;

            await database("fixos")
                .where({
                    id: fixoId,
                    usuario_id:
                        req.usuarioId
                })
                .update({
                    descricao:
                        descricao ?? fixo.descricao,

                    tipo:
                        tipo ?? fixo.tipo,

                    valor:
                        valor ?? fixo.valor,

                    categoria_id:
                        categoria_id === undefined
                            ? fixo.categoria_id
                            : categoria_id,

                    dia_vencimento:
                        dia_vencimento ??
                        fixo.dia_vencimento,

                    forma_pagamento:
                        forma_pagamento ??
                        fixo.forma_pagamento,

                    status_padrao:
                        status_padrao ??
                        fixo.status_padrao,

                    ativo:
                        ativo === undefined
                            ? fixo.ativo
                            : ativo,

                    atualizado_em:
                        database.fn.now()
                });

            return res.status(200).json({
                message:
                    "Fixo atualizado com sucesso."
            });

        } catch (error) {
            console.error(
                "Erro ao atualizar fixo:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao atualizar fixo."
            });
        }
    }


    async atualizarStatus(req, res) {
        const {
            fixoId
        } = req.params;

        const {
            ativo
        } = req.body;

        try {
            const fixo =
                await database("fixos")
                    .where({
                        id: fixoId,
                        usuario_id:
                            req.usuarioId
                    })
                    .first();

            if (!fixo) {
                return res.status(404).json({
                    message:
                        "Fixo não encontrado."
                });
            }

            await database("fixos")
                .where({
                    id: fixoId,
                    usuario_id:
                        req.usuarioId
                })
                .update({
                    ativo,
                    atualizado_em:
                        database.fn.now()
                });

            return res.status(200).json({
                message:
                    ativo
                        ? "Fixo ativado."
                        : "Fixo desativado."
            });

        } catch (error) {
            console.error(
                "Erro ao atualizar status:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao atualizar status."
            });
        }
    }


    async excluirFixo(req, res) {
        const {
            fixoId
        } = req.params;

        try {
            const fixo =
                await database("fixos")
                    .where({
                        id: fixoId,
                        usuario_id:
                            req.usuarioId
                    })
                    .first();

            if (!fixo) {
                return res.status(404).json({
                    message:
                        "Fixo não encontrado."
                });
            }

            await database("fixos")
                .where({
                    id: fixoId,
                    usuario_id:
                        req.usuarioId
                })
                .delete();

            return res.status(200).json({
                message:
                    "Fixo excluído com sucesso."
            });

        } catch (error) {
            console.error(
                "Erro ao excluir fixo:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao excluir fixo."
            });
        }
    }
}

module.exports =
    new FixoController();