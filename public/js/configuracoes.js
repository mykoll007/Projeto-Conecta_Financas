// =====================================================
// CONFIGURAÇÕES GERAIS
// =====================================================

const LOGIN_KEY = "clara-financas-login";
const TOKEN_KEY = "clara-financas-token";

const THEME_KEY = "clara-financas-tema";
const APPEARANCE_KEY = "clara-financas-aparencia";

const API_URL = "projeto-conecta-financas.vercel.app/api";


// =====================================================
// ESTADO
// =====================================================

let usuarioAtual = null;

let configuracoes = {
    moeda: "BRL",
    orcamento_mensal: 0,
    dia_inicio_mes: 1,
    forma_pagamento_padrao: "Pix",
    incluir_pendencias: true,
    confirmar_exclusao: true
};

let categorias = [];

let confirmationAction = null;


// =====================================================
// ELEMENTOS
// =====================================================

function getElement(id) {
    return document.getElementById(id);
}


// =====================================================
// TOKEN
// =====================================================

function getToken() {

    return (
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY)
    );
}


// =====================================================
// SESSÃO
// =====================================================

function getSession() {

    const savedSession =
        localStorage.getItem(LOGIN_KEY) ||
        sessionStorage.getItem(LOGIN_KEY);

    const token =
        getToken();


    if (!savedSession || !token) {

        clearSession();

        window.location.href =
            "login.html";

        return null;
    }


    try {

        return JSON.parse(
            savedSession
        );

    } catch (error) {

        clearSession();

        window.location.href =
            "login.html";

        return null;
    }
}


function clearSession() {

    localStorage.removeItem(
        LOGIN_KEY
    );

    localStorage.removeItem(
        TOKEN_KEY
    );

    sessionStorage.removeItem(
        LOGIN_KEY
    );

    sessionStorage.removeItem(
        TOKEN_KEY
    );
}


// =====================================================
// ATUALIZAR SESSÃO SALVA
// =====================================================

function updateSavedSession(
    usuario
) {

    const session =
        getSession();


    if (!session) {
        return;
    }


    const updatedSession = {

        ...session,

        id:
            usuario.id,

        name:
            usuario.nome,

        email:
            usuario.email,

        telefone:
            usuario.telefone || null,

        profissao:
            usuario.profissao || null
    };


    if (
        localStorage.getItem(
            LOGIN_KEY
        )
    ) {

        localStorage.setItem(

            LOGIN_KEY,

            JSON.stringify(
                updatedSession
            )
        );

    } else {

        sessionStorage.setItem(

            LOGIN_KEY,

            JSON.stringify(
                updatedSession
            )
        );
    }
}


// =====================================================
// API
// =====================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        getToken();


    if (!token) {

        clearSession();

        window.location.href =
            "login.html";

        throw new Error(
            "Usuário não autenticado."
        );
    }


    const headers = {
        ...options.headers
    };


    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {

        headers["Content-Type"] =
            "application/json";
    }


    headers.Authorization =
        `Bearer ${token}`;


    let response;


    try {

        response = await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    } catch (error) {

        throw new Error(
            "Não foi possível conectar ao servidor."
        );
    }


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        data = null;
    }


    if (
        response.status === 401
    ) {

        clearSession();

        window.location.href =
            "login.html";

        throw new Error(
            "Sua sessão expirou."
        );
    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            "Erro ao comunicar com a API."
        );
    }


    return data;
}


// =====================================================
// TOAST
// =====================================================

function showToast(message) {

    const toast =
        getElement("toast");


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    window.clearTimeout(
        showToast.timeout
    );


    showToast.timeout =
        window.setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );
}


// =====================================================
// HTML SEGURO
// =====================================================

function escapeHtml(value = "") {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value;


    return element.innerHTML;
}


// =====================================================
// CARREGAR USUÁRIO
// =====================================================

async function loadUser() {

    usuarioAtual =
        await apiRequest(
            "/usuarios/logado"
        );


    renderUser();
}


// =====================================================
// MOSTRAR USUÁRIO
// =====================================================

function renderUser() {

    if (!usuarioAtual) {
        return;
    }


    const name =
        usuarioAtual.nome ||
        "Usuário";


    const email =
        usuarioAtual.email ||
        "";


    const firstName =
        name.split(" ")[0];


    const initial =
        firstName
            .charAt(0)
            .toUpperCase();


    // Topbar
    getElement(
        "profileName"
    ).textContent =
        firstName;


    getElement(
        "profileAvatar"
    ).textContent =
        initial;


    // Avatar maior
    getElement(
        "largeAvatar"
    ).textContent =
        initial;


    // Card
    getElement(
        "profileDisplayName"
    ).textContent =
        name;


    getElement(
        "profileDisplayEmail"
    ).textContent =
        email;


    // Form
    getElement(
        "fullName"
    ).value =
        name;


    getElement(
        "email"
    ).value =
        email;


    getElement(
        "phone"
    ).value =
        usuarioAtual.telefone ||
        "";


    getElement(
        "profession"
    ).value =
        usuarioAtual.profissao ||
        "";
}


// =====================================================
// SALVAR PERFIL
// =====================================================

async function saveProfile(event) {

    event.preventDefault();


    const nome =
        getElement(
            "fullName"
        ).value.trim();


    const email =
        getElement(
            "email"
        ).value.trim();


    const telefone =
        getElement(
            "phone"
        ).value.trim();


    const profissao =
        getElement(
            "profession"
        ).value.trim();


    if (
        !nome ||
        !email
    ) {

        showToast(
            "Preencha o nome e o e-mail."
        );

        return;
    }


    const submitButton =
        event.currentTarget.querySelector(
            'button[type="submit"]'
        );


    try {

        submitButton.disabled =
            true;


        submitButton.textContent =
            "Salvando...";


        const resultado =
            await apiRequest(
                "/usuarios/perfil",
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            nome,
                            email,
                            telefone,
                            profissao
                        })
                }
            );


        // Atualiza com o retorno
        // ou busca novamente do backend
        await loadUser();


        updateSavedSession(
            usuarioAtual
        );


        showToast(
            resultado.message ||
            "Perfil atualizado com sucesso."
        );


    } catch (error) {

        console.error(
            "Erro ao atualizar perfil:",
            error
        );


        showToast(
            error.message
        );


    } finally {

        submitButton.disabled =
            false;


        submitButton.textContent =
            "Salvar alterações";
    }
}


// =====================================================
// CARREGAR CONFIGURAÇÕES
// =====================================================

async function loadFinanceSettings() {

    try {

        const data =
            await apiRequest(
                "/configuracoes"
            );


        /*
            Suporta alguns formatos diferentes
            para não quebrar caso seu Controller
            use nomes um pouco diferentes.
        */

        configuracoes = {

            moeda:
                data.moeda ??
                data.currency ??
                "BRL",

            orcamento_mensal:
                Number(
                    data.orcamento_mensal ??
                    data.orcamento ??
                    data.monthlyBudget ??
                    0
                ),

            dia_inicio_mes:
                Number(
                    data.dia_inicio_mes ??
                    data.monthStartDay ??
                    1
                ),

            forma_pagamento_padrao:
                data.forma_pagamento_padrao ??
                data.defaultPayment ??
                "Pix",

            incluir_pendencias:
                Boolean(
                    data.incluir_pendencias ??
                    data.includePending ??
                    true
                ),

            confirmar_exclusao:
                Boolean(
                    data.confirmar_exclusao ??
                    data.confirmDelete ??
                    true
                )
        };


        renderFinanceSettings();


    } catch (error) {

        console.error(
            "Erro ao carregar configurações:",
            error
        );


        showToast(
            "Erro ao carregar preferências financeiras."
        );
    }
}


// =====================================================
// MOSTRAR CONFIGURAÇÕES
// =====================================================

function renderFinanceSettings() {

    getElement(
        "currencySelect"
    ).value =
        configuracoes.moeda ||
        "BRL";


    getElement(
        "monthlyBudget"
    ).value =
        configuracoes.orcamento_mensal ||
        0;


    getElement(
        "monthStartDay"
    ).value =
        String(
            configuracoes.dia_inicio_mes ||
            1
        );


    getElement(
        "defaultPayment"
    ).value =
        configuracoes
            .forma_pagamento_padrao ||
        "Pix";


    getElement(
        "includePending"
    ).checked =
        Boolean(
            configuracoes
                .incluir_pendencias
        );


    getElement(
        "confirmDeleteSetting"
    ).checked =
        Boolean(
            configuracoes
                .confirmar_exclusao
        );
}


// =====================================================
// SALVAR CONFIGURAÇÕES
// =====================================================

async function saveFinanceSettings(
    event
) {

    event.preventDefault();


    const budget =
        Number(
            getElement(
                "monthlyBudget"
            ).value
        );


    if (
        Number.isNaN(budget) ||
        budget < 0
    ) {

        showToast(
            "Informe um orçamento válido."
        );

        return;
    }


    const body = {

        moeda:
            getElement(
                "currencySelect"
            ).value,

        orcamento_mensal:
            budget,

        dia_inicio_mes:
            Number(
                getElement(
                    "monthStartDay"
                ).value
            ),

        forma_pagamento_padrao:
            getElement(
                "defaultPayment"
            ).value,

        incluir_pendencias:
            getElement(
                "includePending"
            ).checked,

        confirmar_exclusao:
            getElement(
                "confirmDeleteSetting"
            ).checked
    };


    const submitButton =
        event.currentTarget.querySelector(
            'button[type="submit"]'
        );


    try {

        submitButton.disabled =
            true;


        submitButton.textContent =
            "Salvando...";


        const resultado =
            await apiRequest(
                "/configuracoes",
                {
                    method:
                        "PUT",

                    body:
                        JSON.stringify(
                            body
                        )
                }
            );


        configuracoes = {
            ...configuracoes,
            ...body
        };


        showToast(
            resultado.message ||
            "Preferências financeiras salvas."
        );


    } catch (error) {

        console.error(
            "Erro ao salvar configurações:",
            error
        );


        showToast(
            error.message
        );


    } finally {

        submitButton.disabled =
            false;


        submitButton.textContent =
            "Salvar preferências";
    }
}


// =====================================================
// APARÊNCIA
// =====================================================

function getAppearanceSettings() {

    try {

        const saved =
            localStorage.getItem(
                APPEARANCE_KEY
            );


        if (!saved) {

            return {
                theme:
                    localStorage.getItem(
                        THEME_KEY
                    ) ||
                    "light",

                animations:
                    true,

                compactMode:
                    false
            };
        }


        const parsed =
            JSON.parse(saved);


        return {

            theme:
                parsed.theme ||
                "light",

            animations:
                parsed.animations !==
                false,

            compactMode:
                Boolean(
                    parsed.compactMode
                )
        };


    } catch (error) {

        return {
            theme: "light",
            animations: true,
            compactMode: false
        };
    }
}


let appearance =
    getAppearanceSettings();


// =====================================================
// SALVAR APARÊNCIA
// =====================================================

function saveAppearance() {

    localStorage.setItem(

        APPEARANCE_KEY,

        JSON.stringify(
            appearance
        )
    );


    localStorage.setItem(
        THEME_KEY,
        appearance.theme
    );
}


// =====================================================
// APLICAR TEMA
// =====================================================

function applyTheme(theme) {

    document.body
        .classList
        .remove(
            "dark"
        );


    if (
        theme === "dark"
    ) {

        document.body
            .classList
            .add(
                "dark"
            );
    }


    if (
        theme === "system"
    ) {

        const prefersDark =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;


        document.body
            .classList
            .toggle(
                "dark",
                prefersDark
            );
    }


    const themeToggle =
        getElement(
            "themeToggle"
        );


    if (themeToggle) {

        themeToggle.textContent =
            document.body
                .classList
                .contains(
                    "dark"
                )
                ? "☀"
                : "☾";
    }


    document
        .querySelectorAll(
            ".theme-card"
        )
        .forEach(
            card => {

                card.classList.toggle(
                    "active",
                    card.dataset.theme ===
                        theme
                );
            }
        );
}


// =====================================================
// MOSTRAR APARÊNCIA
// =====================================================

function renderAppearanceSettings() {

    applyTheme(
        appearance.theme
    );


    getElement(
        "animationsSetting"
    ).checked =
        Boolean(
            appearance.animations
        );


    getElement(
        "compactMode"
    ).checked =
        Boolean(
            appearance.compactMode
        );


    document.body
        .classList
        .toggle(
            "no-animations",
            !appearance.animations
        );


    document.body
        .classList
        .toggle(
            "compact",
            appearance.compactMode
        );
}


// =====================================================
// SELECIONAR TEMA
// =====================================================

function selectTheme(theme) {

    appearance.theme =
        theme;


    saveAppearance();

    applyTheme(
        theme
    );


    showToast(
        "Tema atualizado."
    );
}


// =====================================================
// SALVAR OPÇÕES VISUAIS
// =====================================================

function saveAppearanceOption() {

    appearance.animations =
        getElement(
            "animationsSetting"
        ).checked;


    appearance.compactMode =
        getElement(
            "compactMode"
        ).checked;


    saveAppearance();

    renderAppearanceSettings();
}


// =====================================================
// CARREGAR CATEGORIAS
// =====================================================

async function loadCategories() {

    try {

        const data =
            await apiRequest(
                "/categorias"
            );


        categorias =
            Array.isArray(data)
                ? data
                : [];


        renderCategories();


    } catch (error) {

        console.error(
            "Erro ao carregar categorias:",
            error
        );


        showToast(
            "Erro ao carregar categorias."
        );
    }
}


// =====================================================
// MOSTRAR CATEGORIAS
// =====================================================

function renderCategories() {

    const list =
        getElement(
            "categoriesList"
        );


    if (
        categorias.length === 0
    ) {

        list.innerHTML = `
            <div class="empty-state">
                Nenhuma categoria cadastrada.
            </div>
        `;

        return;
    }


    list.innerHTML =
        categorias
            .map(
                categoria => {

                    return `
                        <article class="category-item">

                            <i
                                class="category-color-dot"
                                style="background: ${
                                    categoria.cor ||
                                    "#168a52"
                                }"
                            ></i>

                            <strong>
                                ${escapeHtml(
                                    categoria.nome
                                )}
                            </strong>

                            <div class="category-item-actions">

                                <button
                                    type="button"
                                    class="action-button edit-category"
                                    data-id="${categoria.id}"
                                    title="Editar"
                                >
                                    ✎
                                </button>

                                <button
                                    type="button"
                                    class="action-button delete delete-category"
                                    data-id="${categoria.id}"
                                    title="Excluir"
                                >
                                    ×
                                </button>

                            </div>

                        </article>
                    `;
                }
            )
            .join("");


    document
        .querySelectorAll(
            ".edit-category"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openCategoryModal(
                            button.dataset.id
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".delete-category"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        confirmCategoryDelete(
                            button.dataset.id
                        );
                    }
                );
            }
        );
}


// =====================================================
// ABRIR MODAL CATEGORIA
// =====================================================

function openCategoryModal(
    categoriaId = ""
) {

    const categoria =
        categorias.find(
            item =>
                String(item.id) ===
                String(categoriaId)
        );


    getElement(
        "categoryForm"
    ).reset();


    getElement(
        "editingCategory"
    ).value =
        categoria?.id ||
        "";


    getElement(
        "categoryModalTitle"
    ).textContent =
        categoria
            ? "Editar categoria"
            : "Nova categoria";


    getElement(
        "categoryName"
    ).value =
        categoria?.nome ||
        "";


    getElement(
        "categoryColor"
    ).value =
        categoria?.cor ||
        "#168a52";


    getElement(
        "categoryModal"
    ).showModal();
}


// =====================================================
// SALVAR CATEGORIA
// =====================================================

async function saveCategory(event) {

    event.preventDefault();


    const id =
        getElement(
            "editingCategory"
        ).value;


    const nome =
        getElement(
            "categoryName"
        ).value.trim();


    const cor =
        getElement(
            "categoryColor"
        ).value;


    if (!nome) {

        showToast(
            "Informe o nome da categoria."
        );

        return;
    }


    const duplicate =
        categorias.some(
            categoria => {

                return (
                    categoria.nome
                        .toLowerCase() ===
                    nome.toLowerCase() &&

                    String(
                        categoria.id
                    ) !==
                    String(id)
                );
            }
        );


    if (duplicate) {

        showToast(
            "Essa categoria já existe."
        );

        return;
    }


    const submitButton =
        event.currentTarget.querySelector(
            'button[type="submit"]'
        );


    try {

        submitButton.disabled =
            true;


        submitButton.textContent =
            id
                ? "Atualizando..."
                : "Salvando...";


        let resultado;


        if (id) {

            resultado =
                await apiRequest(
                    `/categorias/${id}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify({
                                nome,
                                cor
                            })
                    }
                );

        } else {

            resultado =
                await apiRequest(
                    "/categorias",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                nome,
                                cor
                            })
                    }
                );
        }


        getElement(
            "categoryModal"
        ).close();


        await loadCategories();


        showToast(
            resultado.message ||
            (
                id
                    ? "Categoria atualizada."
                    : "Categoria criada."
            )
        );


    } catch (error) {

        console.error(
            "Erro ao salvar categoria:",
            error
        );


        showToast(
            error.message
        );


    } finally {

        submitButton.disabled =
            false;


        submitButton.textContent =
            "Salvar categoria";
    }
}


// =====================================================
// CONFIRMAR EXCLUSÃO CATEGORIA
// =====================================================

function confirmCategoryDelete(id) {

    const categoria =
        categorias.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!categoria) {
        return;
    }


    openConfirmation(

        "Excluir categoria",

        `Deseja excluir a categoria "${categoria.nome}"?`,

        async () => {

            await deleteCategory(
                id
            );
        }
    );
}


// =====================================================
// EXCLUIR CATEGORIA
// =====================================================

async function deleteCategory(id) {

    try {

        const resultado =
            await apiRequest(
                `/categorias/${id}`,
                {
                    method:
                        "DELETE"
                }
            );


        await loadCategories();


        showToast(
            resultado.message ||
            "Categoria excluída."
        );


    } catch (error) {

        console.error(
            "Erro ao excluir categoria:",
            error
        );


        showToast(
            error.message
        );
    }
}


// =====================================================
// INFORMAÇÃO DA SESSÃO
// =====================================================

function renderSessionInformation() {

    const session =
        getSession();


    if (!session) {
        return;
    }


    const loggedAt =
        session.loggedAt
            ? new Date(
                session.loggedAt
            )
            : new Date();


    const date =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                dateStyle:
                    "medium",

                timeStyle:
                    "short"
            }
        ).format(
            loggedAt
        );


    getElement(
        "sessionInformation"
    ).textContent =
        `Sessão iniciada em ${date}.`;
}


// =====================================================
// TROCAR SEÇÃO
// =====================================================

function switchSection(sectionId) {

    document
        .querySelectorAll(
            ".settings-section"
        )
        .forEach(
            section => {

                section.classList.toggle(
                    "active",
                    section.id ===
                        sectionId
                );
            }
        );


    document
        .querySelectorAll(
            ".settings-menu-item"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                        sectionId
                );
            }
        );
}


// =====================================================
// ALTERAR SENHA
// =====================================================

async function changePassword(event) {

    event.preventDefault();


    const senhaAtual =
        getElement(
            "currentPassword"
        ).value;


    const novaSenha =
        getElement(
            "newPassword"
        ).value;


    const confirmacao =
        getElement(
            "confirmPassword"
        ).value;


    if (!senhaAtual) {

        showToast(
            "Informe sua senha atual."
        );

        return;
    }


    if (
        novaSenha.length < 6
    ) {

        showToast(
            "A nova senha deve ter pelo menos 6 caracteres."
        );

        return;
    }


    if (
        novaSenha !==
        confirmacao
    ) {

        showToast(
            "As novas senhas não são iguais."
        );

        return;
    }


    const submitButton =
        event.currentTarget.querySelector(
            'button[type="submit"]'
        );


    try {

        submitButton.disabled =
            true;


        submitButton.textContent =
            "Alterando...";


        const resultado =
            await apiRequest(
                "/usuarios/senha",
                {
                    method: "PUT",

                    body:
                        JSON.stringify({

                            senha_atual:
                                senhaAtual,

                            nova_senha:
                                novaSenha
                        })
                }
            );


        event.currentTarget.reset();


        showToast(
            resultado.message ||
            "Senha alterada com sucesso."
        );


    } catch (error) {

        console.error(
            "Erro ao alterar senha:",
            error
        );


        showToast(
            error.message
        );


    } finally {

        submitButton.disabled =
            false;


        submitButton.textContent =
            "Alterar senha";
    }
}


// =====================================================
// EXPORTAR TODOS OS DADOS
// =====================================================

async function exportAllData() {

    const button =
        getElement(
            "exportDataButton"
        );


    try {

        button.disabled =
            true;


        button.textContent =
            "Preparando...";


        const [
            usuario,
            configuracao,
            movimentacoes,
            fixos,
            categoriasData
        ] =
            await Promise.all([

                apiRequest(
                    "/usuarios/logado"
                ),

                apiRequest(
                    "/configuracoes"
                ),

                apiRequest(
                    "/movimentacoes"
                ),

                apiRequest(
                    "/fixos"
                ),

                apiRequest(
                    "/categorias"
                )
            ]);


        const backup = {

            exportedAt:
                new Date()
                    .toISOString(),

            usuario,

            configuracoes:
                configuracao,

            categorias:
                categoriasData,

            movimentacoes,

            fixos
        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        backup,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `backup-conecta-financas-${
                new Date()
                    .toISOString()
                    .slice(
                        0,
                        10
                    )
            }.json`;


        document.body.appendChild(
            link
        );


        link.click();

        link.remove();


        URL.revokeObjectURL(
            url
        );


        showToast(
            "Backup exportado."
        );


    } catch (error) {

        console.error(
            "Erro ao exportar dados:",
            error
        );


        showToast(
            error.message
        );


    } finally {

        button.disabled =
            false;


        button.textContent =
            "Exportar";
    }
}


// =====================================================
// APAGAR TODOS OS DADOS FINANCEIROS
// =====================================================

async function deleteAllFinancialData() {

    const button =
        getElement(
            "confirmationButton"
        );


    try {

        button.disabled =
            true;


        button.textContent =
            "Apagando...";


        // Primeiro busca os dados existentes
        const [
            movimentacoes,
            fixos,
            categoriasData
        ] =
            await Promise.all([

                apiRequest(
                    "/movimentacoes"
                ),

                apiRequest(
                    "/fixos"
                ),

                apiRequest(
                    "/categorias"
                )
            ]);


        // =========================
        // Excluir movimentações
        // =========================

        for (
            const movimentacao
            of movimentacoes
        ) {

            await apiRequest(
                `/movimentacoes/${movimentacao.id}`,
                {
                    method:
                        "DELETE"
                }
            );
        }


        // =========================
        // Excluir fixos
        // =========================

        for (
            const fixo
            of fixos
        ) {

            await apiRequest(
                `/fixos/${fixo.id}`,
                {
                    method:
                        "DELETE"
                }
            );
        }


        // =========================
        // Excluir categorias
        // =========================

        for (
            const categoria
            of categoriasData
        ) {

            try {

                await apiRequest(
                    `/categorias/${categoria.id}`,
                    {
                        method:
                            "DELETE"
                    }
                );

            } catch (error) {

                console.warn(
                    "Categoria não removida:",
                    categoria.nome,
                    error.message
                );
            }
        }


        // =========================
        // Zerar orçamento
        // =========================

        await apiRequest(
            "/configuracoes",
            {
                method:
                    "PUT",

                body:
                    JSON.stringify({

                        moeda:
                            "BRL",

                        orcamento_mensal:
                            0,

                        dia_inicio_mes:
                            1,

                        forma_pagamento_padrao:
                            "Pix",

                        incluir_pendencias:
                            true,

                        confirmar_exclusao:
                            true
                    })
            }
        );


        configuracoes = {

            moeda:
                "BRL",

            orcamento_mensal:
                0,

            dia_inicio_mes:
                1,

            forma_pagamento_padrao:
                "Pix",

            incluir_pendencias:
                true,

            confirmar_exclusao:
                true
        };


        await loadCategories();

        renderFinanceSettings();


        showToast(
            "Dados financeiros apagados."
        );


    } catch (error) {

        console.error(
            "Erro ao apagar dados:",
            error
        );


        showToast(
            error.message
        );


    } finally {

        button.disabled =
            false;


        button.textContent =
            "Confirmar";
    }
}


// =====================================================
// CONFIRMAÇÃO
// =====================================================

function openConfirmation(
    title,
    text,
    action
) {

    confirmationAction =
        action;


    getElement(
        "confirmationTitle"
    ).textContent =
        title;


    getElement(
        "confirmationText"
    ).textContent =
        text;


    getElement(
        "confirmationModal"
    ).showModal();
}


// =====================================================
// EXECUTAR CONFIRMAÇÃO
// =====================================================

async function executeConfirmation() {

    if (
        typeof confirmationAction !==
        "function"
    ) {

        return;
    }


    const action =
        confirmationAction;


    confirmationAction =
        null;


    try {

        await action();


        const modal =
            getElement(
                "confirmationModal"
            );


        if (modal.open) {
            modal.close();
        }


    } catch (error) {

        console.error(
            error
        );
    }
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    clearSession();


    window.location.href =
        "login.html";
}


// =====================================================
// MENU LATERAL
// =====================================================

function setupSections() {

    document
        .querySelectorAll(
            ".settings-menu-item"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        switchSection(
                            button.dataset.section
                        );
                    }
                );
            }
        );
}


// =====================================================
// MENU PERFIL
// =====================================================

function setupProfileMenu() {

    const button =
        getElement(
            "profileButton"
        );


    const dropdown =
        getElement(
            "profileDropdown"
        );


    if (
        !button ||
        !dropdown
    ) {
        return;
    }


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            const isOpen =
                dropdown
                    .classList
                    .toggle(
                        "show"
                    );


            button.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(
                    ".profile-menu"
                )
            ) {

                dropdown
                    .classList
                    .remove(
                        "show"
                    );


                button.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        }
    );
}


// =====================================================
// TEMA
// =====================================================

function setupThemeToggle() {

    const themeToggle =
        getElement(
            "themeToggle"
        );


    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            () => {

                const currentTheme =
                    document.body
                        .classList
                        .contains(
                            "dark"
                        )
                        ? "dark"
                        : "light";


                selectTheme(
                    currentTheme ===
                        "dark"
                        ? "light"
                        : "dark"
                );
            }
        );
    }


    document
        .querySelectorAll(
            ".theme-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        selectTheme(
                            card.dataset.theme
                        );
                    }
                );
            }
        );
}


// =====================================================
// TEMA DO SISTEMA
// =====================================================

function setupSystemThemeListener() {

    const mediaQuery =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );


    mediaQuery.addEventListener(
        "change",
        () => {

            if (
                appearance.theme ===
                "system"
            ) {

                applyTheme(
                    "system"
                );
            }
        }
    );
}


// =====================================================
// MENU MOBILE
// =====================================================

function setupMobileMenu() {

    const button =
        getElement(
            "mobileMenuButton"
        );


    const navigation =
        getElement(
            "mobileNav"
        );


    if (
        !button ||
        !navigation
    ) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            navigation
                .classList
                .toggle(
                    "show"
                );
        }
    );
}


// =====================================================
// FECHAR MODAIS
// =====================================================

function setupModalClosing() {

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const modal =
                            getElement(
                                button.dataset
                                    .closeModal
                            );


                        if (
                            modal &&
                            modal.open
                        ) {

                            modal.close();
                        }


                        if (
                            modal?.id ===
                            "confirmationModal"
                        ) {

                            confirmationAction =
                                null;
                        }
                    }
                );
            }
        );
}


// =====================================================
// EVENTOS
// =====================================================

function setupEvents() {

    // Perfil
    getElement(
        "profileForm"
    )?.addEventListener(
        "submit",
        saveProfile
    );


    // Preferências financeiras
    getElement(
        "financeForm"
    )?.addEventListener(
        "submit",
        saveFinanceSettings
    );


    // Senha
    getElement(
        "passwordForm"
    )?.addEventListener(
        "submit",
        changePassword
    );


    // Animações
    getElement(
        "animationsSetting"
    )?.addEventListener(
        "change",
        saveAppearanceOption
    );


    // Compacto
    getElement(
        "compactMode"
    )?.addEventListener(
        "change",
        saveAppearanceOption
    );


    // Categoria
    getElement(
        "addCategoryButton"
    )?.addEventListener(
        "click",
        () => {

            openCategoryModal();
        }
    );


    getElement(
        "categoryForm"
    )?.addEventListener(
        "submit",
        saveCategory
    );


    // Avatar
    getElement(
        "changeAvatarButton"
    )?.addEventListener(
        "click",
        () => {

            showToast(
                "O envio de foto será adicionado posteriormente."
            );
        }
    );


    // Encerrar sessão
    getElement(
        "endSessionButton"
    )?.addEventListener(
        "click",
        logout
    );


    getElement(
        "logoutButton"
    )?.addEventListener(
        "click",
        logout
    );


    // Exportar
    getElement(
        "exportDataButton"
    )?.addEventListener(
        "click",
        exportAllData
    );


    // =========================
    // Botão antigo de demo
    // =========================

    const restoreButton =
        getElement(
            "restoreDataButton"
        );


    if (restoreButton) {

        restoreButton.style.display =
            "none";
    }


    // =========================
    // Apagar dados
    // =========================

    getElement(
        "deleteAllDataButton"
    )?.addEventListener(
        "click",
        () => {

            openConfirmation(

                "Apagar dados financeiros",

                "Essa ação excluirá suas movimentações, fixos, categorias e preferências financeiras. Sua conta continuará existindo.",

                deleteAllFinancialData
            );
        }
    );


    // Confirmação
    getElement(
        "confirmationButton"
    )?.addEventListener(
        "click",
        executeConfirmation
    );
}


// =====================================================
// INICIALIZAÇÃO
// =====================================================

async function initializePage() {

    console.log(
        "CONFIGURAÇÕES API CARREGADO"
    );


    if (!getSession()) {
        return;
    }


    // Interface
    setupSections();

    setupProfileMenu();

    setupThemeToggle();

    setupSystemThemeListener();

    setupMobileMenu();

    setupModalClosing();

    setupEvents();


    // Preferência visual local
    renderAppearanceSettings();


    // Sessão
    renderSessionInformation();


    try {

        await Promise.all([

            loadUser(),

            loadFinanceSettings(),

            loadCategories()
        ]);


    } catch (error) {

        console.error(
            "Erro ao inicializar configurações:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar configurações."
        );
    }
}


initializePage();