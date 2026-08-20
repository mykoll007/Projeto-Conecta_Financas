const database = require("../database/connection");

class MovimentacaoController {

    // =====================================================
    // CRIAR MOVIMENTAÇÃO
    // =====================================================

    async criarMovimentacao(req, res) {

        const {
            descricao,
            tipo,
            valor,
            categoria_id,
            data,
            status,
            forma_pagamento,
            observacao
        } = req.body;


        // =========================
        // Validações
        // =========================

        if (!descricao) {
            return res.status(400).json({
                success: false,
                message: "Informe a descrição."
            });
        }


        if (!tipo) {
            return res.status(400).json({
                success: false,
                message: "Informe o tipo da movimentação."
            });
        }


        if (
            tipo !== "income" &&
            tipo !== "expense" &&
            tipo !== "saved"
        ) {
            return res.status(400).json({
                success: false,
                message: "Tipo de movimentação inválido."
            });
        }


        if (
            !valor ||
            Number(valor) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Informe um valor válido."
            });
        }


        if (!data) {
            return res.status(400).json({
                success: false,
                message: "Informe a data."
            });
        }


        if (
            status &&
            status !== "paid" &&
            status !== "pending"
        ) {
            return res.status(400).json({
                success: false,
                message: "Status inválido."
            });
        }


        try {

            // =========================
            // Verifica categoria
            // =========================

            if (categoria_id) {

                const categoria =
                    await database("categorias")
                        .where({
                            id: categoria_id,
                            usuario_id: req.usuarioId
                        })
                        .first();


                if (!categoria) {
                    return res.status(404).json({
                        success: false,
                        message: "Categoria não encontrada."
                    });
                }
            }


            // =========================
            // Inserir movimentação
            // =========================

            const [movimentacaoId] =
                await database("movimentacoes")
                    .insert({

                        usuario_id:
                            req.usuarioId,

                        categoria_id:
                            categoria_id || null,

                        fixo_id:
                            null,

                        descricao:
                            descricao.trim(),

                        tipo,

                        valor:
                            Number(valor),

                        data_movimentacao:
                            data,

                        status:
                            status || "paid",

                        forma_pagamento:
                            forma_pagamento || null,

                        observacao:
                            observacao || null,

                        criado_em:
                            database.fn.now(),

                        atualizado_em:
                            database.fn.now()
                    });


            // =========================
            // Buscar movimentação criada
            // =========================

            const movimentacao =
                await database(
                    "movimentacoes as m"
                )
                    .leftJoin(
                        "categorias as c",
                        "m.categoria_id",
                        "c.id"
                    )
                    .select(

                        "m.id",

                        "m.descricao",

                        "m.tipo",

                        "m.valor",

                        "m.data_movimentacao as data",

                        "m.status",

                        "m.forma_pagamento",

                        "m.observacao",

                        "m.fixo_id",

                        "c.id as categoria_id",

                        "c.nome as categoria",

                        "c.cor as categoria_cor"
                    )
                    .where(
                        "m.id",
                        movimentacaoId
                    )
                    .where(
                        "m.usuario_id",
                        req.usuarioId
                    )
                    .first();


            return res.status(201).json({

                success: true,

                message:
                    "Movimentação adicionada com sucesso.",

                movimentacao
            });


        } catch (error) {

            console.error(
                "Erro ao criar movimentação:",
                error
            );


            return res.status(500).json({
                success: false,
                message:
                    "Erro ao adicionar movimentação."
            });
        }
    }



    // =====================================================
    // LISTAR MOVIMENTAÇÕES
    // =====================================================

    async listarMovimentacoes(req, res) {

        const {
            tipo,
            status,
            categoria_id,
            mes,
            ano,
            busca
        } = req.query;


        try {

            const query =
                database(
                    "movimentacoes as m"
                )
                    .leftJoin(
                        "categorias as c",
                        "m.categoria_id",
                        "c.id"
                    )
                    .select(

                        "m.id",

                        "m.descricao",

                        "m.tipo",

                        "m.valor",

                        "m.data_movimentacao as data",

                        "m.status",

                        "m.forma_pagamento",

                        "m.observacao",

                        "m.fixo_id",

                        "c.id as categoria_id",

                        "c.nome as categoria",

                        "c.cor as categoria_cor"
                    )
                    .where(
                        "m.usuario_id",
                        req.usuarioId
                    );


            // =========================
            // Filtro tipo
            // =========================

            if (tipo) {
                query.where(
                    "m.tipo",
                    tipo
                );
            }


            // =========================
            // Filtro status
            // =========================

            if (status) {
                query.where(
                    "m.status",
                    status
                );
            }


            // =========================
            // Filtro categoria
            // =========================

            if (categoria_id) {
                query.where(
                    "m.categoria_id",
                    categoria_id
                );
            }


            // =========================
            // Filtro mês
            // =========================

            if (mes) {
                query.whereRaw(
                    "MONTH(m.data_movimentacao) = ?",
                    [Number(mes)]
                );
            }


            // =========================
            // Filtro ano
            // =========================

            if (ano) {
                query.whereRaw(
                    "YEAR(m.data_movimentacao) = ?",
                    [Number(ano)]
                );
            }


            // =========================
            // Pesquisa
            // =========================

            if (busca) {

                query.where(function () {

                    this
                        .where(
                            "m.descricao",
                            "like",
                            `%${busca}%`
                        )
                        .orWhere(
                            "c.nome",
                            "like",
                            `%${busca}%`
                        )
                        .orWhere(
                            "m.forma_pagamento",
                            "like",
                            `%${busca}%`
                        );

                });
            }


            const movimentacoes =
                await query
                    .orderBy(
                        "m.data_movimentacao",
                        "desc"
                    )
                    .orderBy(
                        "m.id",
                        "desc"
                    );


            return res.status(200).json(
                movimentacoes
            );


        } catch (error) {

            console.error(
                "Erro ao listar movimentações:",
                error
            );


            return res.status(500).json({
                success: false,
                message:
                    "Erro ao listar movimentações."
            });
        }
    }



    // =====================================================
    // BUSCAR MOVIMENTAÇÃO
    // =====================================================

    async buscarMovimentacao(req, res) {

        const {
            movimentacaoId
        } = req.params;


        try {

            const movimentacao =
                await database(
                    "movimentacoes as m"
                )
                    .leftJoin(
                        "categorias as c",
                        "m.categoria_id",
                        "c.id"
                    )
                    .select(

                        "m.id",

                        "m.descricao",

                        "m.tipo",

                        "m.valor",

                        "m.data_movimentacao as data",

                        "m.status",

                        "m.forma_pagamento",

                        "m.observacao",

                        "m.fixo_id",

                        "c.id as categoria_id",

                        "c.nome as categoria",

                        "c.cor as categoria_cor"
                    )
                    .where(
                        "m.id",
                        movimentacaoId
                    )
                    .where(
                        "m.usuario_id",
                        req.usuarioId
                    )
                    .first();


            if (!movimentacao) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Movimentação não encontrada."
                });
            }


            return res.status(200).json(
                movimentacao
            );


        } catch (error) {

            console.error(
                "Erro ao buscar movimentação:",
                error
            );


            return res.status(500).json({
                success: false,
                message:
                    "Erro ao buscar movimentação."
            });
        }
    }



    // =====================================================
    // ATUALIZAR MOVIMENTAÇÃO
    // =====================================================

    async atualizarMovimentacao(req, res) {

        const {
            movimentacaoId
        } = req.params;


        const {
            descricao,
            tipo,
            valor,
            categoria_id,
            data,
            status,
            forma_pagamento,
            observacao
        } = req.body;


        try {

            const movimentacao =
                await database(
                    "movimentacoes"
                )
                    .where({
                        id: movimentacaoId,
                        usuario_id:
                            req.usuarioId
                    })
                    .first();


            if (!movimentacao) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Movimentação não encontrada."
                });
            }


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
                        success: false,
                        message:
                            "Categoria não encontrada."
                    });
                }
            }


            await database("movimentacoes")
                .where({
                    id: movimentacaoId,
                    usuario_id:
                        req.usuarioId
                })
                .update({

                    descricao:
                        descricao ??
                        movimentacao.descricao,

                    tipo:
                        tipo ??
                        movimentacao.tipo,

                    valor:
                        valor ??
                        movimentacao.valor,

                    categoria_id:
                        categoria_id === undefined
                            ? movimentacao.categoria_id
                            : categoria_id,

                    data_movimentacao:
                        data ??
                        movimentacao.data_movimentacao,

                    status:
                        status ??
                        movimentacao.status,

                    forma_pagamento:
                        forma_pagamento ??
                        movimentacao.forma_pagamento,

                    observacao:
                        observacao ??
                        movimentacao.observacao,

                    atualizado_em:
                        database.fn.now()
                });


            return res.status(200).json({
                success: true,
                message:
                    "Movimentação atualizada com sucesso."
            });


        } catch (error) {

            console.error(
                "Erro ao atualizar movimentação:",
                error
            );


            return res.status(500).json({
                success: false,
                message:
                    "Erro ao atualizar movimentação."
            });
        }
    }



    // =====================================================
    // EXCLUIR MOVIMENTAÇÃO
    // =====================================================

    async excluirMovimentacao(req, res) {

        const {
            movimentacaoId
        } = req.params;


        try {

            const movimentacao =
                await database(
                    "movimentacoes"
                )
                    .where({
                        id: movimentacaoId,
                        usuario_id:
                            req.usuarioId
                    })
                    .first();


            if (!movimentacao) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Movimentação não encontrada."
                });
            }


            await database(
                "movimentacoes"
            )
                .where({
                    id: movimentacaoId,
                    usuario_id:
                        req.usuarioId
                })
                .delete();


            return res.status(200).json({
                success: true,
                message:
                    "Movimentação excluída com sucesso."
            });


        } catch (error) {

            console.error(
                "Erro ao excluir movimentação:",
                error
            );


            return res.status(500).json({
                success: false,
                message:
                    "Erro ao excluir movimentação."
            });
        }
    }
}


module.exports =
    new MovimentacaoController();