const database = require("../database/connection");

class ConfiguracaoController {

    async buscarConfiguracoes(req, res) {
        try {
            const configuracao =
                await database("configuracoes")
                    .where(
                        "usuario_id",
                        req.usuarioId
                    )
                    .first();

            if (!configuracao) {
                return res.status(404).json({
                    message:
                        "Configurações não encontradas."
                });
            }

            return res
                .status(200)
                .json(configuracao);

        } catch (error) {
            console.error(
                "Erro ao buscar configurações:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao buscar configurações."
            });
        }
    }


    async atualizarConfiguracoes(req, res) {
        const {
            orcamento_mensal,
            moeda,
            tema,
            forma_pagamento_padrao,
            inicio_mes,
            incluir_pendencias,
            confirmar_exclusao,
            animacoes,
            modo_compacto
        } = req.body;

        try {
            const configuracao =
                await database("configuracoes")
                    .where(
                        "usuario_id",
                        req.usuarioId
                    )
                    .first();

            if (!configuracao) {
                return res.status(404).json({
                    message:
                        "Configurações não encontradas."
                });
            }

            await database("configuracoes")
                .where(
                    "usuario_id",
                    req.usuarioId
                )
                .update({
                    orcamento_mensal:
                        orcamento_mensal ??
                        configuracao.orcamento_mensal,

                    moeda:
                        moeda ??
                        configuracao.moeda,

                    tema:
                        tema ??
                        configuracao.tema,

                    forma_pagamento_padrao:
                        forma_pagamento_padrao ??
                        configuracao.forma_pagamento_padrao,

                    inicio_mes:
                        inicio_mes ??
                        configuracao.inicio_mes,

                    incluir_pendencias:
                        incluir_pendencias ??
                        configuracao.incluir_pendencias,

                    confirmar_exclusao:
                        confirmar_exclusao ??
                        configuracao.confirmar_exclusao,

                    animacoes:
                        animacoes ??
                        configuracao.animacoes,

                    modo_compacto:
                        modo_compacto ??
                        configuracao.modo_compacto,

                    atualizado_em:
                        database.fn.now()
                });

            return res.status(200).json({
                message:
                    "Configurações atualizadas com sucesso."
            });

        } catch (error) {
            console.error(
                "Erro ao atualizar configurações:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao atualizar configurações."
            });
        }
    }
}

module.exports =
    new ConfiguracaoController();