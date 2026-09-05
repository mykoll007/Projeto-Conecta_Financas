const database = require("../database/connection");


class DashboardController {

    // =====================================================
    // NOMES DOS MESES
    // =====================================================

    obterNomeMes(mes) {

        const meses = [
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro"
        ];


        return meses[
            mes - 1
        ];
    }


    // =====================================================
    // GARANTIR SALDO DO MÊS ANTERIOR
    // =====================================================

    async garantirSaldoAnterior(
        usuarioId,
        mes,
        ano
    ) {

        // Janeiro precisa buscar dezembro
        // do ano anterior.

        let mesAnterior =
            mes - 1;

        let anoAnterior =
            ano;


        if (mesAnterior === 0) {

            mesAnterior =
                12;

            anoAnterior =
                ano - 1;
        }


        // =====================================================
        // PRIMEIRO DIA DO MÊS ATUAL
        // =====================================================

        const dataMovimentacao =
            `${ano}-${String(
                mes
            ).padStart(
                2,
                "0"
            )}-01`;


        // =====================================================
        // IDENTIFICADOR DA MOVIMENTAÇÃO
        // =====================================================

        /*
            Usamos observacao para saber que
            essa movimentação foi criada
            automaticamente pelo sistema.

            Isso evita duplicar o saldo.
        */

        const identificador =
            `SALDO_TRANSPORTADO:${anoAnterior}-${String(
                mesAnterior
            ).padStart(
                2,
                "0"
            )}`;


        // =====================================================
        // BUSCAR MOVIMENTAÇÕES DO MÊS ANTERIOR
        // =====================================================

        const movimentacoesAnterior =
            await database(
                "movimentacoes"
            )
                .where(
                    "usuario_id",
                    usuarioId
                )
                .whereRaw(
                    "MONTH(data_movimentacao) = ?",
                    [mesAnterior]
                )
                .whereRaw(
                    "YEAR(data_movimentacao) = ?",
                    [anoAnterior]
                )
                .where(
                    "status",
                    "paid"
                );


        let entradas = 0;
        let despesas = 0;


        movimentacoesAnterior.forEach(
            item => {

                const valor =
                    Number(
                        item.valor
                    );


                if (
                    item.tipo === "income"
                ) {

                    entradas += valor;
                }


                if (
                    item.tipo === "expense"
                ) {

                    despesas += valor;
                }


                /*
                    saved continua sem
                    alterar o saldo.
                */
            }
        );


        // =====================================================
        // SALDO FINAL DO MÊS ANTERIOR
        // =====================================================

        const saldoAnterior =
            entradas -
            despesas;


        // =====================================================
        // VERIFICAR SE JÁ EXISTE
        // =====================================================

        const movimentacaoExistente =
            await database(
                "movimentacoes"
            )
                .where({
                    usuario_id:
                        usuarioId,

                    observacao:
                        identificador
                })
                .first();


        // =====================================================
        // SE O SALDO FOR ZERO
        // =====================================================

        /*
            Se antes existia uma movimentação
            automática e agora o saldo virou 0,
            removemos ela.
        */

        if (saldoAnterior === 0) {

            if (movimentacaoExistente) {

                await database(
                    "movimentacoes"
                )
                    .where(
                        "id",
                        movimentacaoExistente.id
                    )
                    .delete();
            }


            return 0;
        }


        // =====================================================
        // TIPO DA MOVIMENTAÇÃO
        // =====================================================

        /*
            Saldo positivo:
            vira Entrada.

            Saldo negativo:
            vira Despesa.
        */

        const tipo =
            saldoAnterior >= 0
                ? "income"
                : "expense";


        const valor =
            Math.abs(
                saldoAnterior
            );


        const nomeMesAnterior =
            this.obterNomeMes(
                mesAnterior
            );


        const descricao =
            `Saldo de ${nomeMesAnterior}/${anoAnterior}`;


        // =====================================================
        // ATUALIZAR SE JÁ EXISTIR
        // =====================================================

        if (movimentacaoExistente) {

            await database(
                "movimentacoes"
            )
                .where(
                    "id",
                    movimentacaoExistente.id
                )
                .update({

                    descricao,

                    tipo,

                    valor,

                    data_movimentacao:
                        dataMovimentacao,

                    status:
                        "paid",

                    categoria_id:
                        null,

                    forma_pagamento:
                        null,

                    atualizado_em:
                        database.fn.now()
                });


            return saldoAnterior;
        }


        // =====================================================
        // CRIAR MOVIMENTAÇÃO
        // =====================================================

        await database(
            "movimentacoes"
        )
            .insert({

                usuario_id:
                    usuarioId,

                categoria_id:
                    null,

                fixo_id:
                    null,

                descricao,

                tipo,

                valor,

                data_movimentacao:
                    dataMovimentacao,

                status:
                    "paid",

                forma_pagamento:
                    null,

                observacao:
                    identificador,

                criado_em:
                    database.fn.now(),

                atualizado_em:
                    database.fn.now()
            });


        return saldoAnterior;
    }


    // =====================================================
    // BUSCAR RESUMO
    // =====================================================

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
            // CRIAR / ATUALIZAR SALDO DO MÊS ANTERIOR
            // =====================================================

            await this.garantirSaldoAnterior(
                req.usuarioId,
                mesSelecionado,
                anoSelecionado
            );


            // =====================================================
            // MOVIMENTAÇÕES DO MÊS ATUAL
            // =====================================================

            /*
                Aqui o saldo transportado já está
                dentro das movimentações do mês.

                Portanto NÃO usamos saldo acumulado.
            */

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
                    // ENTRADAS
                    // =========================

                    if (
                        item.tipo === "income" &&
                        item.status === "paid"
                    ) {

                        entradas += valor;

                        quantidadeEntradas++;
                    }


                    // =========================
                    // DESPESAS
                    // =========================

                    if (
                        item.tipo === "expense" &&
                        item.status === "paid"
                    ) {

                        despesas += valor;

                        quantidadeDespesas++;
                    }


                    // =========================
                    // RESERVAS
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
            // SALDO DO MÊS
            // =====================================================

            /*
                Como "Saldo de Agosto" virou
                uma entrada real em Setembro:

                saldo =
                entradas do mês
                -
                despesas do mês

                Reserva NÃO altera.
            */

            const saldo =
                entradas -
                despesas;


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