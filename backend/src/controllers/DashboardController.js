const database = require("../database/connection");


// =====================================================
// NOMES DOS MESES
// =====================================================

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


// =====================================================
// GARANTIR SALDO DO MÊS ANTERIOR
// =====================================================

async function garantirSaldoAnterior(
    usuarioId,
    mes,
    ano
) {

    const hoje = new Date();

const mesAtual =
    hoje.getMonth() + 1;

const anoAtual =
    hoje.getFullYear();


const periodoSolicitado =
    ano * 100 + mes;

const periodoAtual =
    anoAtual * 100 + mesAtual;


// =====================================================
// NÃO CRIAR SALDO EM MÊS FUTURO
// =====================================================

if (
    periodoSolicitado >
    periodoAtual
) {

    return 0;
}

    // =====================================================
    // DESCOBRIR MÊS ANTERIOR
    // =====================================================

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
    // IDENTIFICADOR ÚNICO
    // =====================================================

    const identificador =
        `SALDO_TRANSPORTADO:${anoAnterior}-${String(
            mesAnterior
        ).padStart(
            2,
            "0"
        )}`;


    // =====================================================
    // DATA DA MOVIMENTAÇÃO NO NOVO MÊS
    // =====================================================

    const dataMovimentacao =
        `${ano}-${String(
            mes
        ).padStart(
            2,
            "0"
        )}-01`;


    // =====================================================
    // BUSCAR MOVIMENTAÇÕES DO MÊS ANTERIOR
    // =====================================================

    const movimentacoesAnteriores =
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


    movimentacoesAnteriores.forEach(
        item => {

            const valor =
                Number(
                    item.valor
                );


            // =========================
            // ENTRADAS
            // =========================

            if (
                item.tipo === "income"
            ) {

                entradas +=
                    valor;
            }


            // =========================
            // DESPESAS
            // =========================

            if (
                item.tipo === "expense"
            ) {

                despesas +=
                    valor;
            }


            /*
                saved / reserva
                NÃO altera o saldo.
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
    // VERIFICAR SE A MOVIMENTAÇÃO JÁ EXISTE
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

    if (saldoAnterior === 0) {

        /*
            Se ela já existia e o saldo
            passou para zero, remove.
        */

        if (movimentacaoExistente) {

            await database(
                "movimentacoes"
            )
                .where({
                    id:
                        movimentacaoExistente.id,

                    usuario_id:
                        usuarioId
                })
                .delete();
        }


        return 0;
    }


    // =====================================================
    // POSITIVO = ENTRADA
    // NEGATIVO = DESPESA
    // =====================================================

    const tipo =
        saldoAnterior >= 0
            ? "income"
            : "expense";


    const valor =
        Math.abs(
            saldoAnterior
        );


    const nomeMesAnterior =
        meses[
            mesAnterior - 1
        ];


    const descricao =
        `Saldo de ${nomeMesAnterior}/${anoAnterior}`;


    // =====================================================
    // ATUALIZAR MOVIMENTAÇÃO EXISTENTE
    // =====================================================

    if (movimentacaoExistente) {

        await database(
            "movimentacoes"
        )
            .where({
                id:
                    movimentacaoExistente.id,

                usuario_id:
                    usuarioId
            })
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

                fixo_id:
                    null,

                forma_pagamento:
                    null,

                observacao:
                    identificador,

                atualizado_em:
                    database.fn.now()
            });


        return saldoAnterior;
    }


    // =====================================================
    // CRIAR NOVA MOVIMENTAÇÃO
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
// CONTROLLER
// =====================================================

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
            // VALIDAR PERÍODO
            // =====================================================

            if (
                mesSelecionado < 1 ||
                mesSelecionado > 12
            ) {

                return res.status(400).json({
                    message:
                        "Mês inválido."
                });
            }


            // =====================================================
            // CRIAR / ATUALIZAR SALDO TRANSPORTADO
            // =====================================================

            await garantirSaldoAnterior(
                req.usuarioId,
                mesSelecionado,
                anoSelecionado
            );


            // =====================================================
            // BUSCAR MOVIMENTAÇÕES DO MÊS ATUAL
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


            // =====================================================
            // TOTAIS
            // =====================================================

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

                        entradas +=
                            valor;

                        quantidadeEntradas++;
                    }


                    // =========================
                    // DESPESAS
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
                    // RESERVAS
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
                        item.status === "pending" &&
                        (
                            item.tipo === "expense" ||
                            item.tipo === "saved"
                        )
                    ) {

                        pendentes +=
                            valor;
                    }
                }
            );


            // =====================================================
            // SALDO
            // =====================================================

            /*
                O saldo transportado já está
                dentro das entradas do mês.

                Portanto:

                saldo = entradas - despesas

                Reserva não altera.
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
                "======================================"
            );

            console.error(
                "ERRO DASHBOARD:"
            );

            console.error(
                error
            );

            console.error(
                "======================================"
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