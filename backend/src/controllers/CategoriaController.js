const database = require("../database/connection");

class CategoriaController {

    async listarCategorias(req, res) {
        try {
            const categorias =
                await database("categorias")
                    .where(
                        "usuario_id",
                        req.usuarioId
                    )
                    .orderBy(
                        "nome",
                        "asc"
                    );

            return res
                .status(200)
                .json(categorias);

        } catch (error) {
            console.error(
                "Erro ao listar categorias:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao listar categorias."
            });
        }
    }


    async criarCategoria(req, res) {
        const {
            nome,
            cor
        } = req.body;

        if (!nome) {
            return res.status(400).json({
                message:
                    "Informe o nome da categoria."
            });
        }

        try {
            const existe =
                await database("categorias")
                    .where({
                        usuario_id:
                            req.usuarioId,

                        nome: nome.trim()
                    })
                    .first();

            if (existe) {
                return res.status(409).json({
                    message:
                        "Categoria já cadastrada."
                });
            }

            const [categoriaId] =
                await database("categorias")
                    .insert({
                        usuario_id:
                            req.usuarioId,

                        nome:
                            nome.trim(),

                        cor:
                            cor || "#168a52",

                        criado_em:
                            database.fn.now()
                    });

            return res.status(201).json({
                message:
                    "Categoria criada com sucesso.",

                categoriaId
            });

        } catch (error) {
            console.error(
                "Erro ao criar categoria:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao criar categoria."
            });
        }
    }


    async atualizarCategoria(req, res) {
        const {
            categoriaId
        } = req.params;

        const {
            nome,
            cor
        } = req.body;

        try {
            const categoria =
                await database("categorias")
                    .where({
                        id: categoriaId,
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

            await database("categorias")
                .where({
                    id: categoriaId,
                    usuario_id:
                        req.usuarioId
                })
                .update({
                    nome:
                        nome ?? categoria.nome,

                    cor:
                        cor ?? categoria.cor
                });

            return res.status(200).json({
                message:
                    "Categoria atualizada com sucesso."
            });

        } catch (error) {
            console.error(
                "Erro ao atualizar categoria:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao atualizar categoria."
            });
        }
    }


    async excluirCategoria(req, res) {
        const {
            categoriaId
        } = req.params;

        try {
            const categoria =
                await database("categorias")
                    .where({
                        id: categoriaId,
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

            await database("categorias")
                .where({
                    id: categoriaId,
                    usuario_id:
                        req.usuarioId
                })
                .delete();

            return res.status(200).json({
                message:
                    "Categoria excluída com sucesso."
            });

        } catch (error) {
            console.error(
                "Erro ao excluir categoria:",
                error
            );

            return res.status(500).json({
                message:
                    "Erro ao excluir categoria."
            });
        }
    }
}

module.exports =
    new CategoriaController();