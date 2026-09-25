const database = require("../database/connection");


class AgendaController {

    // =====================================================
    // LISTAR AGENDAMENTOS
    // =====================================================

    async listarAgendamentos(req, res) {

        try {

            const agendamentos =
                await database("agendamentos")
                    .where(
                        "usuario_id",
                        req.usuarioId
                    )
                    .orderBy(
                        "data_agendamento",
                        "asc"
                    )
                    .orderBy(
                        "horario",
                        "asc"
                    );


            return res
                .status(200)
                .json(
                    agendamentos
                );


        } catch (error) {

            console.error(
                "Erro ao listar agendamentos:",
                error
            );


            return res.status(500).json({
                message:
                    "Erro ao listar agendamentos."
            });
        }
    }


    // =====================================================
    // CRIAR AGENDAMENTO
    // =====================================================

    async criarAgendamento(req, res) {

        const {
            titulo,
            cliente_nome,
            descricao,
            data_agendamento,
            horario,
            valor,
            tipo_financeiro,
            observacao
        } = req.body;


        if (
            !titulo ||
            !data_agendamento ||
            !horario
        ) {

            return res.status(400).json({
                message:
                    "Título, data e horário são obrigatórios."
            });
        }


        try {

            // =================================================
            // VERIFICAR HORÁRIO DUPLICADO
            // =================================================

            const horarioOcupado =
                await database(
                    "agendamentos"
                )
                    .where({
                        usuario_id:
                            req.usuarioId,

                        data_agendamento,

                        horario
                    })
                    .whereNot(
                        "status",
                        "cancelled"
                    )
                    .first();


            if (
                horarioOcupado
            ) {

                return res.status(409).json({
                    message:
                        "Já existe um compromisso agendado para esse horário."
                });
            }


            // =================================================
            // VALIDAR TIPO FINANCEIRO
            // =================================================

            const tiposPermitidos = [
                "none",
                "income",
                "expense"
            ];


            const tipoFinanceiro =
                tiposPermitidos.includes(
                    tipo_financeiro
                )
                    ? tipo_financeiro
                    : "none";


            // =================================================
            // CRIAR
            // =================================================

            const [agendamentoId] =
                await database(
                    "agendamentos"
                )
                    .insert({

                        usuario_id:
                            req.usuarioId,

                        titulo:
                            titulo.trim(),

                        cliente_nome:
                            cliente_nome?.trim() ||
                            null,

                        descricao:
                            descricao?.trim() ||
                            null,

                        data_agendamento,

                        horario,

                        valor:
                            valor !== null &&
                            valor !== undefined &&
                            valor !== ""
                                ? Number(
                                    valor
                                )
                                : null,

                        tipo_financeiro:
                            tipoFinanceiro,

                        status:
                            "scheduled",

                        movimentacao_id:
                            null,

                        observacao:
                            observacao?.trim() ||
                            null,

                        criado_em:
                            database.fn.now(),

                        atualizado_em:
                            null
                    });


            return res.status(201).json({

                message:
                    "Agendamento criado com sucesso.",

                agendamentoId
            });


        } catch (error) {

            console.error(
                "Erro ao criar agendamento:",
                error
            );


            return res.status(500).json({
                message:
                    "Erro ao criar agendamento."
            });
        }
    }


    // =====================================================
    // ATUALIZAR AGENDAMENTO
    // =====================================================

    async atualizarAgendamento(req, res) {

        const {
            agendamentoId
        } = req.params;


        const {
            titulo,
            cliente_nome,
            descricao,
            data_agendamento,
            horario,
            valor,
            tipo_financeiro,
            observacao
        } = req.body;


        try {

            const agendamento =
                await database(
                    "agendamentos"
                )
                    .where({
                        id:
                            agendamentoId,

                        usuario_id:
                            req.usuarioId
                    })
                    .first();


            if (
                !agendamento
            ) {

                return res.status(404).json({
                    message:
                        "Agendamento não encontrado."
                });
            }


            // =================================================
            // NÃO EDITAR CONCLUÍDO
            // =================================================

            if (
                agendamento.status ===
                "completed"
            ) {

                return res.status(400).json({
                    message:
                        "Um agendamento concluído não pode ser alterado."
                });
            }


            const novaData =
                data_agendamento ||
                agendamento.data_agendamento;


            const novoHorario =
                horario ||
                agendamento.horario;


            // =================================================
            // VERIFICAR CONFLITO
            // =================================================

            const horarioOcupado =
                await database(
                    "agendamentos"
                )
                    .where({
                        usuario_id:
                            req.usuarioId,

                        data_agendamento:
                            novaData,

                        horario:
                            novoHorario
                    })
                    .whereNot(
                        "id",
                        agendamentoId
                    )
                    .whereNot(
                        "status",
                        "cancelled"
                    )
                    .first();


            if (
                horarioOcupado
            ) {

                return res.status(409).json({
                    message:
                        "Já existe um compromisso agendado para esse horário."
                });
            }


            const tiposPermitidos = [
                "none",
                "income",
                "expense"
            ];


            const tipoFinanceiro =
                tipo_financeiro &&
                tiposPermitidos.includes(
                    tipo_financeiro
                )
                    ? tipo_financeiro
                    : agendamento.tipo_financeiro;


            await database(
                "agendamentos"
            )
                .where({
                    id:
                        agendamentoId,

                    usuario_id:
                        req.usuarioId
                })
                .update({

                    titulo:
                        titulo?.trim() ||
                        agendamento.titulo,

                    cliente_nome:
                        cliente_nome !== undefined
                            ? (
                                cliente_nome?.trim() ||
                                null
                            )
                            : agendamento.cliente_nome,

                    descricao:
                        descricao !== undefined
                            ? (
                                descricao?.trim() ||
                                null
                            )
                            : agendamento.descricao,

                    data_agendamento:
                        novaData,

                    horario:
                        novoHorario,

                    valor:
                        valor !== undefined
                            ? (
                                valor === "" ||
                                valor === null
                                    ? null
                                    : Number(
                                        valor
                                    )
                            )
                            : agendamento.valor,

                    tipo_financeiro:
                        tipoFinanceiro,

                    observacao:
                        observacao !== undefined
                            ? (
                                observacao?.trim() ||
                                null
                            )
                            : agendamento.observacao,

                    atualizado_em:
                        database.fn.now()
                });


            return res.status(200).json({
                message:
                    "Agendamento atualizado com sucesso."
            });


        } catch (error) {

            console.error(
                "Erro ao atualizar agendamento:",
                error
            );


            return res.status(500).json({
                message:
                    "Erro ao atualizar agendamento."
            });
        }
    }


    // =====================================================
    // CONCLUIR AGENDAMENTO
    // =====================================================

    async concluirAgendamento(req, res) {

        const {
            agendamentoId
        } = req.params;


        try {

            const resultado =
                await database.transaction(
                    async trx => {

                        const agendamento =
                            await trx(
                                "agendamentos"
                            )
                                .where({
                                    id:
                                        agendamentoId,

                                    usuario_id:
                                        req.usuarioId
                                })
                                .first();


                        if (
                            !agendamento
                        ) {

                            return {
                                status:
                                    404,

                                body: {
                                    message:
                                        "Agendamento não encontrado."
                                }
                            };
                        }


                        if (
                            agendamento.status ===
                            "completed"
                        ) {

                            return {
                                status:
                                    400,

                                body: {
                                    message:
                                        "Esse agendamento já foi concluído."
                                }
                            };
                        }


                        if (
                            agendamento.status ===
                            "cancelled"
                        ) {

                            return {
                                status:
                                    400,

                                body: {
                                    message:
                                        "Um agendamento cancelado não pode ser concluído."
                                }
                            };
                        }


                        let movimentacaoId =
                            null;


                        // =================================================
                        // CRIAR MOVIMENTAÇÃO AUTOMÁTICA
                        // =================================================

                        if (
                            agendamento.valor !==
                                null &&
                            Number(
                                agendamento.valor
                            ) > 0 &&
                            (
                                agendamento.tipo_financeiro ===
                                    "income" ||
                                agendamento.tipo_financeiro ===
                                    "expense"
                            )
                        ) {

                            // =============================================
                            // TENTAR ACHAR UMA CATEGORIA
                            // =============================================

                            let categoriaId =
                                null;


                            const categoriaPadrao =
                                await trx(
                                    "categorias"
                                )
                                    .where(
                                        "usuario_id",
                                        req.usuarioId
                                    )
                                    .whereIn(
                                        "nome",
                                        [
                                            "Outros",
                                            "Salário"
                                        ]
                                    )
                                    .orderByRaw(`
                                        CASE
                                            WHEN nome = 'Outros' THEN 1
                                            ELSE 2
                                        END
                                    `)
                                    .first();


                            if (
                                categoriaPadrao
                            ) {

                                categoriaId =
                                    categoriaPadrao.id;
                            }


                            const descricaoMovimentacao =
                                agendamento.cliente_nome
                                    ? `${agendamento.titulo} - ${agendamento.cliente_nome}`
                                    : agendamento.titulo;


                            const [novaMovimentacaoId] =
                                await trx(
                                    "movimentacoes"
                                )
                                    .insert({

                                        usuario_id:
                                            req.usuarioId,

                                        categoria_id:
                                            categoriaId,

                                        fixo_id:
                                            null,

                                        descricao:
                                            descricaoMovimentacao,

                                        tipo:
                                            agendamento.tipo_financeiro,

                                        valor:
                                            Number(
                                                agendamento.valor
                                            ),

                                        data_movimentacao:
                                            agendamento.data_agendamento,

                                        status:
                                            "paid",

                                        forma_pagamento:
                                            null,

                                        observacao:
                                            "Gerado automaticamente pela agenda.",

                                        criado_em:
                                            trx.fn.now(),

                                        atualizado_em:
                                            null
                                    });


                            movimentacaoId =
                                novaMovimentacaoId;
                        }


                        // =================================================
                        // MARCAR COMO CONCLUÍDO
                        // =================================================

                        await trx(
                            "agendamentos"
                        )
                            .where({
                                id:
                                    agendamentoId,

                                usuario_id:
                                    req.usuarioId
                            })
                            .update({

                                status:
                                    "completed",

                                movimentacao_id:
                                    movimentacaoId,

                                atualizado_em:
                                    trx.fn.now()
                            });


                        return {
                            status:
                                200,

                            body: {

                                message:
                                    movimentacaoId
                                        ? "Agendamento concluído e movimentação criada."
                                        : "Agendamento concluído com sucesso.",

                                movimentacaoId
                            }
                        };
                    }
                );


            return res
                .status(
                    resultado.status
                )
                .json(
                    resultado.body
                );


        } catch (error) {

            console.error(
                "Erro ao concluir agendamento:",
                error
            );


            return res.status(500).json({
                message:
                    "Erro ao concluir agendamento."
            });
        }
    }


    // =====================================================
    // CANCELAR AGENDAMENTO
    // =====================================================

    async cancelarAgendamento(req, res) {

        const {
            agendamentoId
        } = req.params;


        try {

            const agendamento =
                await database(
                    "agendamentos"
                )
                    .where({
                        id:
                            agendamentoId,

                        usuario_id:
                            req.usuarioId
                    })
                    .first();


            if (
                !agendamento
            ) {

                return res.status(404).json({
                    message:
                        "Agendamento não encontrado."
                });
            }


            if (
                agendamento.status ===
                "completed"
            ) {

                return res.status(400).json({
                    message:
                        "Um agendamento concluído não pode ser cancelado."
                });
            }


            if (
                agendamento.status ===
                "cancelled"
            ) {

                return res.status(400).json({
                    message:
                        "Esse agendamento já está cancelado."
                });
            }


            await database(
                "agendamentos"
            )
                .where({
                    id:
                        agendamentoId,

                    usuario_id:
                        req.usuarioId
                })
                .update({

                    status:
                        "cancelled",

                    atualizado_em:
                        database.fn.now()
                });


            return res.status(200).json({
                message:
                    "Agendamento cancelado."
            });


        } catch (error) {

            console.error(
                "Erro ao cancelar agendamento:",
                error
            );


            return res.status(500).json({
                message:
                    "Erro ao cancelar agendamento."
            });
        }
    }


    // =====================================================
    // EXCLUIR AGENDAMENTO
    // =====================================================

    async excluirAgendamento(req, res) {

        const {
            agendamentoId
        } = req.params;


        try {

            const agendamento =
                await database(
                    "agendamentos"
                )
                    .where({
                        id:
                            agendamentoId,

                        usuario_id:
                            req.usuarioId
                    })
                    .first();


            if (
                !agendamento
            ) {

                return res.status(404).json({
                    message:
                        "Agendamento não encontrado."
                });
            }


            /*
                Se já criou uma movimentação,
                não apagamos a movimentação.

                Apenas o agendamento será removido.
                A movimentação financeira continua
                no histórico normalmente.
            */


            await database(
                "agendamentos"
            )
                .where({
                    id:
                        agendamentoId,

                    usuario_id:
                        req.usuarioId
                })
                .delete();


            return res.status(200).json({
                message:
                    "Agendamento excluído com sucesso."
            });


        } catch (error) {

            console.error(
                "Erro ao excluir agendamento:",
                error
            );


            return res.status(500).json({
                message:
                    "Erro ao excluir agendamento."
            });
        }
    }
}


module.exports =
    new AgendaController();