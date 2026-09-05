const database = require("../database/connection");


class DashboardController {

    async buscarResumo(req, res) {

        const {
            mes,
            ano
        } = req.query;


        const hoje =
            new Date();


        const mesSelecionado =
            Number(mes) ||
            hoje.getMonth() + 1;


        const anoSelecionado =
            Number(ano) ||
            hoje.getFullYear();


        try {

            // =====================================================
            // MOVIMENTAÇÕES DO MÊS SELECIONADO
            // =====================================================

            const movimentacoes =
                await database(
                    "movimentacoes"
                )
                    .where(
                        "usuario_id",
                        req.usuarioId
                    )
                    .whereRaw(
                        "MONTH(data_movimentacao) = ?",
                        [mesSelecionado]
                    )
                    .whereRaw(
                        "YEAR(data_movimentacao) = ?",
                        [anoSelecionado]
                    );


            let entradas = 0;
            let despesas = 0;
            let guardado = 0;
            let pendentes = 0;


            let quantidadeEntradas = 0;
            let quantidadeDespesas = 0;
            let quantidadeGuardado = 0;


            movimentacoes.forEach(
                item => {

                    const valor =
                        Number(
                            item.valor
                        );


                    // =========================
                    // ENTRADA
                    // =========================

                    if (
                        item.tipo === "income" &&
                        item.status === "paid"
                    ) {

                        entradas += valor;

                        quantidadeEntradas++;
                    }


                    // =========================
                    // DESPESA
                    // =========================

                    if (
                        item.tipo === "expense" &&
                        item.status === "paid"
                    ) {

                        despesas += valor;

                        quantidadeDespesas++;
                    }


                    // =========================
                    // GUARDADO
                    // =========================

                    if (
                        item.tipo === "saved" &&
                        item.status === "paid"
                    ) {

                        guardado += valor;

                        quantidadeGuardado++;
                    }


                    // =========================
                    // PENDENTES
                    // =========================

                    if (
                        item.status === "pending" &&
                        (
                            item.tipo === "expense" ||
                            item.tipo === "saved"
                        )
                    ) {

                        pendentes += valor;
                    }
                }
            );


            // =====================================================
            // ÚLTIMO DIA DO MÊS SELECIONADO
            // =====================================================

            const ultimoDiaDoMes =
                new Date(
                    anoSelecionado,
                    mesSelecionado,
                    0
                );


            const dataLimite =
                `${ultimoDiaDoMes.getFullYear()}-${String(
                    ultimoDiaDoMes.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                )}-${String(
                    ultimoDiaDoMes.getDate()
                ).padStart(
                    2,
                    "0"
                )}`;


            // =====================================================
            // ÚLTIMO DIA DO MÊS ANTERIOR
            // =====================================================

            const ultimoDiaMesAnterior =
                new Date(
                    anoSelecionado,
                    mesSelecionado - 1,
                    0
                );


            const dataLimiteAnterior =
                `${ultimoDiaMesAnterior.getFullYear()}-${String(
                    ultimoDiaMesAnterior.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                )}-${String(
                    ultimoDiaMesAnterior.getDate()
                ).padStart(
                    2,
                    "0"
                )}`;


            // =====================================================
            // MOVIMENTAÇÕES ACUMULADAS ATÉ O MÊS SELECIONADO
            // =====================================================

            const movimentacoesAcumuladas =
                await database(
                    "movimentacoes"
                )
                    .where(
                        "usuario_id",
                        req.usuarioId
                    )
                    .where(
                        "data_movimentacao",
                        "<=",
                        dataLimite
                    )
                    .where(
                        "status",
                        "paid"
                    );


            let entradasAcumuladas = 0;
            let despesasAcumuladas = 0;


            movimentacoesAcumuladas.forEach(
                item => {

                    const valor =
                        Number(
                            item.valor
                        );


                    if (
                        item.tipo === "income"
                    ) {

                        entradasAcumuladas += valor;
                    }


                    if (
                        item.tipo === "expense"
                    ) {

                        despesasAcumuladas += valor;
                    }


                    /*
                        saved NÃO altera
                        o saldo disponível.
                    */
                }
            );


            // =====================================================
            // SALDO ACUMULADO ATÉ O MÊS SELECIONADO
            // =====================================================

            const saldo =
                entradasAcumuladas -
                despesasAcumuladas;


            // =====================================================
            // MOVIMENTAÇÕES ACUMULADAS ATÉ O MÊS ANTERIOR
            // =====================================================

            const movimentacoesAnteriores =
                await database(
                    "movimentacoes"
                )
                    .where(
                        "usuario_id",
                        req.usuarioId
                    )
                    .where(
                        "data_movimentacao",
                        "<=",
                        dataLimiteAnterior
                    )
                    .where(
                        "status",
                        "paid"
                    );


            let entradasAnteriores = 0;
            let despesasAnteriores = 0;


            movimentacoesAnteriores.forEach(
                item => {

                    const valor =
                        Number(
                            item.valor
                        );


                    if (
                        item.tipo === "income"
                    ) {

                        entradasAnteriores += valor;
                    }


                    if (
                        item.tipo === "expense"
                    ) {

                        despesasAnteriores += valor;
                    }


                    /*
                        saved também NÃO altera
                        o saldo anterior.
                    */
                }
            );


            // =====================================================
            // SALDO DO MÊS ANTERIOR
            // =====================================================

            const saldoAnterior =
                entradasAnteriores -
                despesasAnteriores;


            // =====================================================
            // CONFIGURAÇÕES
            // =====================================================

            const configuracao =
                await database(
                    "configuracoes"
                )
                    .where(
                        "usuario_id",
                        req.usuarioId
                    )
                    .first();


            // =====================================================
            // RESPOSTA
            // =====================================================

            return res.status(200).json({

                saldo,

                saldoAnterior,

                entradas,

                despesas,

                guardado,

                pendentes,

                quantidadeEntradas,

                quantidadeDespesas,

                quantidadeGuardado,

                orcamento:
                    Number(
                        configuracao
                            ?.orcamento_mensal ||
                        0
                    )
            });


        } catch (error) {

            console.error(
                "Erro ao carregar dashboard:",
                error
            );


            return res.status(500).json({
                message:
                    "Erro ao carregar dashboard."
            });
        }
    }
}


module.exports =
    new DashboardController();