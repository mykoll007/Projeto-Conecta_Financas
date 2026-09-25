const express = require("express");
const router = express.Router();


const AuthController = require("../controllers/AuthController");
const MovimentacaoController = require("../controllers/MovimentacaoController");
const FixoController = require("../controllers/FixoController");
const CategoriaController = require("../controllers/CategoriaController");
const DashboardController = require("../controllers/DashboardController");
const ConfiguracaoController = require("../controllers/ConfiguracaoController");
const AgendaController = require("../controllers/AgendaController");


const verificarUsuario = require("../middleware/authMiddleware");



// =====================================================
// ROTAS DE AUTENTICAÇÃO
// =====================================================


// Criar uma nova conta
router.post(
    "/usuarios/criar",
    AuthController.criarUsuario
);


// Login do usuário
router.post(
    "/usuarios/login",
    AuthController.autenticarUsuario
);


// Retorna os dados do usuário logado
router.get(
    "/usuarios/logado",
    verificarUsuario,
    AuthController.listarUsuarioLogado
);


// Atualizar os dados do usuário
router.put(
    "/usuarios/perfil",
    verificarUsuario,
    AuthController.atualizarPerfil
);

// Atualizar a senha do usuário
router.put(
    "/usuarios/senha",
    verificarUsuario,
    AuthController.alterarSenha
);

// Excluir a conta do usuário
router.delete(
    "/usuarios/conta",
    verificarUsuario,
    AuthController.excluirConta
);

// =====================================================
// ROTAS DO DASHBOARD
// =====================================================


// Retorna o resumo financeiro do mês
router.get(
    "/dashboard/resumo",
    verificarUsuario,
    DashboardController.buscarResumo
);



// =====================================================
// ROTAS DE MOVIMENTAÇÕES
// =====================================================


// Criar uma nova movimentação
router.post(
    "/movimentacoes",
    verificarUsuario,
    MovimentacaoController.criarMovimentacao
);


// Listar todas as movimentações do usuário
router.get(
    "/movimentacoes",
    verificarUsuario,
    MovimentacaoController.listarMovimentacoes
);


// Buscar uma movimentação específica
router.get(
    "/movimentacoes/:movimentacaoId",
    verificarUsuario,
    MovimentacaoController.buscarMovimentacao
);


// Atualizar uma movimentação
router.put(
    "/movimentacoes/:movimentacaoId",
    verificarUsuario,
    MovimentacaoController.atualizarMovimentacao
);


// Excluir uma movimentação
router.delete(
    "/movimentacoes/:movimentacaoId",
    verificarUsuario,
    MovimentacaoController.excluirMovimentacao
);



// =====================================================
// ROTAS DE FIXOS MENSAIS
// =====================================================


// Criar um novo lançamento fixo
router.post(
    "/fixos",
    verificarUsuario,
    FixoController.criarFixo
);


// Listar os lançamentos fixos
router.get(
    "/fixos",
    verificarUsuario,
    FixoController.listarFixos
);


// Atualizar um lançamento fixo
router.put(
    "/fixos/:fixoId",
    verificarUsuario,
    FixoController.atualizarFixo
);


// Ativar ou desativar um lançamento fixo
router.put(
    "/fixos/:fixoId/status",
    verificarUsuario,
    FixoController.atualizarStatus
);


// Excluir um lançamento fixo
router.delete(
    "/fixos/:fixoId",
    verificarUsuario,
    FixoController.excluirFixo
);



// =====================================================
// ROTAS DE CATEGORIAS
// =====================================================


// Criar uma nova categoria
router.post(
    "/categorias",
    verificarUsuario,
    CategoriaController.criarCategoria
);


// Listar todas as categorias
router.get(
    "/categorias",
    verificarUsuario,
    CategoriaController.listarCategorias
);


// Atualizar uma categoria
router.put(
    "/categorias/:categoriaId",
    verificarUsuario,
    CategoriaController.atualizarCategoria
);


// Excluir uma categoria
router.delete(
    "/categorias/:categoriaId",
    verificarUsuario,
    CategoriaController.excluirCategoria
);



// =====================================================
// ROTAS DE CONFIGURAÇÕES
// =====================================================


// Buscar as configurações do usuário
router.get(
    "/configuracoes",
    verificarUsuario,
    ConfiguracaoController.buscarConfiguracoes
);


// Atualizar as configurações do usuário
router.put(
    "/configuracoes",
    verificarUsuario,
    ConfiguracaoController.atualizarConfiguracoes
);

// =====================================================
// ROTAS DE AGENDAMENTOS
// =====================================================


// Criar um novo agendamento
router.post(
    "/agendamentos",
    verificarUsuario,
    AgendaController.criarAgendamento
);


// Listar todos os agendamentos do usuário
router.get(
    "/agendamentos",
    verificarUsuario,
    AgendaController.listarAgendamentos
);


// Atualizar um agendamento
router.put(
    "/agendamentos/:agendamentoId",
    verificarUsuario,
    AgendaController.atualizarAgendamento
);


// Concluir um agendamento
router.put(
    "/agendamentos/:agendamentoId/concluir",
    verificarUsuario,
    AgendaController.concluirAgendamento
);


// Cancelar um agendamento
router.put(
    "/agendamentos/:agendamentoId/cancelar",
    verificarUsuario,
    AgendaController.cancelarAgendamento
);


// Excluir um agendamento
router.delete(
    "/agendamentos/:agendamentoId",
    verificarUsuario,
    AgendaController.excluirAgendamento
);



module.exports = router;