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


        // =========================
        // Validações
        // =========================

        if (
            !descricao ||
            !tipo ||
            valor === undefined ||
            !dia_vencimento
        ) {
            return res.status(400).json({
                message:
                    "Preencha os campos obrigatórios."
            });
        }


        if (
            tipo !== "income" &&
            tipo !== "expense" &&
            tipo !== "saved"
        ) {
            return res.status(400).json({
                message:
                    "Tipo de lançamento inválido."
            });
        }


        const valorNumerico =
            Number(valor);


        if (
            Number.isNaN(valorNumerico) ||
            valorNumerico <= 0
        ) {
            return res.status(400).json({
                message:
                    "Informe um valor válido."
            });
        }


        const dia =
            Number(dia_vencimento);


        if (
            Number.isNaN(dia) ||
            dia < 1 ||
            dia > 31
        ) {
            return res.status(400).json({
                message:
                    "O dia deve estar entre 1 e 31."
            });
        }


        if (
            status_padrao &&
            status_padrao !== "paid" &&
            status_padrao !== "pending"
        ) {
            return res.status(400).json({
                message:
                    "Status padrão inválido."
            });
        }


        try {

            if (categoria_id) {

                const categoria =
                    await database("categorias")
                        .where({
                            id: categoria_id,
                            usuario_id:
                                req.usuarioId
                        })
                        .first();


                if (!categoria) {
                    return res.status(404).json({
                        message:
                            "Categoria não encontrada."
                    });
                }
            }


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

                        valor:
                            valorNumerico,

                        dia_vencimento:
                            dia,

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


            const fixoCriado =
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
                        "f.id",
                        fixoId
                    )
                    .where(
                        "f.usuario_id",
                        req.usuarioId
                    )
                    .first();


            return res.status(201).json({
                message:
                    "Fixo criado com sucesso.",

                fixo:
                    fixoCriado
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


            // =========================
            // Validar tipo
            // =========================

            if (
                tipo !== undefined &&
                tipo !== "income" &&
                tipo !== "expense" &&
                tipo !== "saved"
            ) {
                return res.status(400).json({
                    message:
                        "Tipo de lançamento inválido."
                });
            }


            // =========================
            // Validar valor
            // =========================

            if (
                valor !== undefined &&
                (
                    Number.isNaN(
                        Number(valor)
                    ) ||
                    Number(valor) <= 0
                )
            ) {
                return res.status(400).json({
                    message:
                        "Informe um valor válido."
                });
            }


            // =========================
            // Validar dia
            // =========================

            if (
                dia_vencimento !== undefined
            ) {

                const dia =
                    Number(
                        dia_vencimento
                    );


                if (
                    Number.isNaN(dia) ||
                    dia < 1 ||
                    dia > 31
                ) {
                    return res.status(400).json({
                        message:
                            "O dia deve estar entre 1 e 31."
                    });
                }
            }


            // =========================
            // Validar status
            // =========================

            if (
                status_padrao !== undefined &&
                status_padrao !== "paid" &&
                status_padrao !== "pending"
            ) {
                return res.status(400).json({
                    message:
                        "Status padrão inválido."
                });
            }


            // =========================
            // Validar categoria
            // =========================

            if (
                categoria_id !== undefined &&
                categoria_id !== null &&
                categoria_id !== ""
            ) {

                const categoria =
                    await database("categorias")
                        .where({
                            id: categoria_id,
                            usuario_id:
                                req.usuarioId
                        })
                        .first();


                if (!categoria) {
                    return res.status(404).json({
                        message:
                            "Categoria não encontrada."
                    });
                }
            }


            await database("fixos")
                .where({
                    id: fixoId,
                    usuario_id:
                        req.usuarioId
                })
                .update({
                    descricao:
                        descricao !== undefined
                            ? descricao.trim()
                            : fixo.descricao,

                    tipo:
                        tipo ??
                        fixo.tipo,

                    valor:
                        valor !== undefined
                            ? Number(valor)
                            : fixo.valor,

                    categoria_id:
                        categoria_id === undefined
                            ? fixo.categoria_id
                            : categoria_id || null,

                    dia_vencimento:
                        dia_vencimento !== undefined
                            ? Number(
                                dia_vencimento
                            )
                            : fixo.dia_vencimento,

                    forma_pagamento:
                        forma_pagamento !== undefined
                            ? forma_pagamento
                            : fixo.forma_pagamento,

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