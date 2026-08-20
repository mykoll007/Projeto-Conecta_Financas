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

                        entradas +=
                            valor;

                        quantidadeEntradas++;
                    }


                    // =========================
                    // DESPESA
                    // =========================

                    if (
                        item.tipo === "expense" &&
                        item.status === "paid"
                    ) {

                        despesas +=
                            valor;

                        quantidadeDespesas++;
                    }


                    // =========================
                    // GUARDADO
                    // =========================

                    if (
                        item.tipo === "saved" &&
                        item.status === "paid"
                    ) {

                        guardado +=
                            valor;

                        quantidadeGuardado++;
                    }


                    // =========================
                    // PENDENTES
                    // =========================

                    if (
                        item.status ===
                        "pending"
                    ) {

                        /*
                            Aqui não incluímos
                            entradas pendentes.

                            Consideramos apenas
                            valores que ainda vão
                            sair do disponível.
                        */

                        if (
                            item.tipo ===
                                "expense" ||
                            item.tipo ===
                                "saved"
                        ) {

                            pendentes +=
                                valor;
                        }
                    }
                }
            );


            // =========================
            // CONFIGURAÇÕES
            // =========================

            const configuracao =
                await database(
                    "configuracoes"
                )
                    .where(
                        "usuario_id",
                        req.usuarioId
                    )
                    .first();


            // =========================
            // SALDO
            // =========================

            const saldo =
                entradas -
                despesas -
                guardado;


            return res.status(200).json({

                saldo,

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