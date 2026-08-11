// =====================================================
// CONFIGURAÇÕES
// =====================================================

const LOGIN_KEY = "clara-financas-login";
const TOKEN_KEY = "clara-financas-token";
const THEME_KEY = "clara-financas-tema";

const API_URL = "http://localhost:5000/api";


// =====================================================
// FORMATADORES
// =====================================================

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});


const monthNames = [
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
// ESTADO
// =====================================================

let appData = {
    fixed: [],
    categories: []
};

let fixedToDelete = null;


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

    const token = getToken();


    if (!savedSession || !token) {

        clearSession();

        window.location.href = "login.html";

        return null;
    }


    try {

        return JSON.parse(savedSession);

    } catch (error) {

        clearSession();

        window.location.href = "login.html";

        return null;
    }
}


function clearSession() {

    localStorage.removeItem(LOGIN_KEY);
    localStorage.removeItem(TOKEN_KEY);

    sessionStorage.removeItem(LOGIN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
}


// =====================================================
// API
// =====================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    const token = getToken();


    if (!token) {

        clearSession();

        window.location.href = "login.html";

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

        data = await response.json();

    } catch (error) {

        data = null;
    }


    if (response.status === 401) {

        clearSession();

        window.location.href = "login.html";

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

    const toast = getElement("toast");

    if (!toast) {
        return;
    }


    toast.textContent = message;

    toast.classList.add("show");


    window.clearTimeout(
        showToast.timeout
    );


    showToast.timeout =
        window.setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2500);
}


// =====================================================
// UTILITÁRIOS
// =====================================================

function escapeHtml(value = "") {

    const element =
        document.createElement("div");

    element.textContent = value;

    return element.innerHTML;
}


function normalizeText(value) {

    return String(value)
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase();
}


function parseMoney(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return NaN;
    }


    let text =
        String(value)
            .trim()
            .replace(/\s/g, "");


    if (
        text.includes(",") &&
        text.includes(".")
    ) {

        text =
            text
                .replace(/\./g, "")
                .replace(",", ".");

    } else {

        text =
            text.replace(
                ",",
                "."
            );
    }


    return Number(text);
}


// =====================================================
// USUÁRIO
// =====================================================

async function renderUser() {

    try {

        const usuario =
            await apiRequest(
                "/usuarios/logado"
            );


        const name =
            usuario.nome ||
            "Usuário";


        const firstName =
            name.split(" ")[0];


        const profileName =
            getElement(
                "profileName"
            );


        const profileAvatar =
            getElement(
                "profileAvatar"
            );


        if (profileName) {
            profileName.textContent =
                firstName;
        }


        if (profileAvatar) {
            profileAvatar.textContent =
                firstName
                    .charAt(0)
                    .toUpperCase();
        }


    } catch (error) {

        console.error(
            "Erro ao carregar usuário:",
            error
        );
    }
}


// =====================================================
// CATEGORIAS
// =====================================================

async function loadCategories() {

    try {

        const categories =
            await apiRequest(
                "/categorias"
            );


        appData.categories =
            Array.isArray(categories)
                ? categories
                : [];


        renderCategoryOptions();


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


function renderCategoryOptions() {

    const categorySelect =
        getElement(
            "category"
        );


    const categoryFilter =
        getElement(
            "categoryFilter"
        );


    const options =
        appData.categories
            .map(category => {

                return `
                    <option value="${category.id}">
                        ${escapeHtml(category.nome)}
                    </option>
                `;

            })
            .join("");


    if (categorySelect) {

        categorySelect.innerHTML =
            options ||
            `
                <option value="">
                    Nenhuma categoria
                </option>
            `;
    }


    if (categoryFilter) {

        categoryFilter.innerHTML = `
            <option value="all">
                Todas
            </option>

            ${options}
        `;
    }
}


// =====================================================
// CARREGAR FIXOS
// =====================================================

async function loadFixed() {

    try {

        const fixed =
            await apiRequest(
                "/fixos"
            );


        if (!Array.isArray(fixed)) {

            appData.fixed = [];

            return;
        }


        appData.fixed =
            fixed.map(item => {

                return {

                    id:
                        Number(item.id),

                    description:
                        item.descricao || "",

                    type:
                        item.tipo,

                    amount:
                        Number(item.valor),

                    categoryId:
                        item.categoria_id
                            ? Number(
                                item.categoria_id
                            )
                            : null,

                    category:
                        item.categoria ||
                        "Sem categoria",

                    categoryColor:
                        item.categoria_cor ||
                        null,

                    day:
                        Number(
                            item.dia_vencimento
                        ),

                    payment:
                        item.forma_pagamento ||
                        "Não informado",

                    defaultStatus:
                        item.status_padrao,

                    active:
                        Boolean(
                            Number(item.ativo)
                        )
                };
            });


    } catch (error) {

        console.error(
            "Erro ao carregar fixos:",
            error
        );


        showToast(
            error.message
        );
    }
}


// =====================================================
// PERÍODO
// =====================================================

function setupPeriodOptions() {

    const currentDate =
        new Date();


    const currentYear =
        currentDate.getFullYear();


    const launchMonth =
        getElement(
            "launchMonth"
        );


    const launchYear =
        getElement(
            "launchYear"
        );


    if (launchMonth) {
        launchMonth.value =
            currentDate.getMonth();
    }


    if (launchYear) {

        launchYear.innerHTML =
            [
                currentYear - 1,
                currentYear,
                currentYear + 1,
                currentYear + 2
            ]
                .map(year => {

                    return `
                        <option
                            value="${year}"
                            ${
                                year === currentYear
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${year}
                        </option>
                    `;

                })
                .join("");
    }
}


// =====================================================
// FILTROS
// =====================================================

function getFilteredFixed() {

    const search =
        normalizeText(
            getElement(
                "searchInput"
            ).value.trim()
        );


    const type =
        getElement(
            "typeFilter"
        ).value;


    const status =
        getElement(
            "statusFilter"
        ).value;


    const category =
        getElement(
            "categoryFilter"
        ).value;


    const order =
        getElement(
            "orderFilter"
        ).value;


    const filtered =
        appData.fixed.filter(
            item => {

                const searchableText =
                    normalizeText(
                        `${item.description} ${item.category} ${item.payment}`
                    );


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                const matchesType =
                    type === "all" ||
                    item.type === type;


                const matchesStatus =
                    status === "all" ||
                    (
                        status === "active" &&
                        item.active
                    ) ||
                    (
                        status === "inactive" &&
                        !item.active
                    );


                const matchesCategory =
                    category === "all" ||
                    String(
                        item.categoryId
                    ) ===
                    String(category);


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesStatus &&
                    matchesCategory
                );
            }
        );


    filtered.sort(
        (
            first,
            second
        ) => {

            if (
                order === "highest"
            ) {

                return (
                    Number(
                        second.amount
                    ) -
                    Number(
                        first.amount
                    )
                );
            }


            if (
                order === "lowest"
            ) {

                return (
                    Number(
                        first.amount
                    ) -
                    Number(
                        second.amount
                    )
                );
            }


            if (
                order === "description"
            ) {

                return first.description
                    .localeCompare(
                        second.description,
                        "pt-BR"
                    );
            }


            return (
                Number(first.day) -
                Number(second.day)
            );
        }
    );


    return filtered;
}


// =====================================================
// SOMAS
// =====================================================

function sumItems(
    items,
    filter
) {

    return items
        .filter(filter)
        .reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    Number(
                        item.amount
                    )
                );

            },
            0
        );
}


// =====================================================
// RESUMO
// =====================================================

function renderSummary() {

    const activeItems =
        appData.fixed.filter(
            item =>
                item.active
        );


    const income =
        sumItems(
            activeItems,
            item =>
                item.type ===
                "income"
        );


    const expenses =
        sumItems(
            activeItems,
            item =>
                item.type ===
                "expense"
        );


    const incomeCount =
        activeItems.filter(
            item =>
                item.type ===
                "income"
        ).length;


    const expenseCount =
        activeItems.filter(
            item =>
                item.type ===
                "expense"
        ).length;


    const inactiveCount =
        appData.fixed.filter(
            item =>
                !item.active
        ).length;


    getElement(
        "fixedIncomeValue"
    ).textContent =
        currency.format(
            income
        );


    getElement(
        "fixedExpenseValue"
    ).textContent =
        currency.format(
            expenses
        );


    getElement(
        "fixedBalanceValue"
    ).textContent =
        currency.format(
            income - expenses
        );


    getElement(
        "activeFixedCount"
    ).textContent =
        activeItems.length;


    getElement(
        "fixedIncomeCount"
    ).textContent =
        `${incomeCount} lançamento${
            incomeCount === 1
                ? ""
                : "s"
        } ativo${
            incomeCount === 1
                ? ""
                : "s"
        }`;


    getElement(
        "fixedExpenseCount"
    ).textContent =
        `${expenseCount} lançamento${
            expenseCount === 1
                ? ""
                : "s"
        } ativo${
            expenseCount === 1
                ? ""
                : "s"
        }`;


    getElement(
        "inactiveFixedCount"
    ).textContent =
        `${inactiveCount} lançamento${
            inactiveCount === 1
                ? ""
                : "s"
        } inativo${
            inactiveCount === 1
                ? ""
                : "s"
        }`;
}


// =====================================================
// ITEM FIXO
// =====================================================

function createFixedItem(item) {

    const isIncome =
        item.type ===
        "income";


    return `
        <article
            class="fixed-item ${
                item.active
                    ? ""
                    : "inactive"
            }"
        >

            <div
                class="fixed-type-icon ${
                    isIncome
                        ? "income"
                        : "expense"
                }"
            >
                ${
                    isIncome
                        ? "↗"
                        : "↘"
                }
            </div>


            <div class="fixed-main">

                <strong>
                    ${escapeHtml(
                        item.description
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        item.category
                    )}

                    ·

                    ${escapeHtml(
                        item.payment
                    )}
                </span>

            </div>


            <div class="fixed-detail fixed-day">

                Dia do mês

                <strong>
                    Dia ${item.day}
                </strong>

            </div>


            <div class="fixed-detail fixed-payment">

                Ao lançar

                <strong>
                    ${
                        item.defaultStatus ===
                        "paid"

                            ? isIncome
                                ? "Recebido"
                                : "Pago"

                            : "Pendente"
                    }
                </strong>

            </div>


            <div
                class="fixed-amount ${
                    isIncome
                        ? "income"
                        : "expense"
                }"
            >

                ${
                    isIncome
                        ? "+"
                        : "−"
                }

                ${currency.format(
                    item.amount
                )}

            </div>


            <div class="fixed-actions">

                <label
                    class="status-toggle fixed-status"
                >

                    <input
                        type="checkbox"
                        class="active-toggle"
                        data-id="${item.id}"
                        ${
                            item.active
                                ? "checked"
                                : ""
                        }
                    >

                    <span
                        class="toggle-track"
                    ></span>

                    <span>
                        ${
                            item.active
                                ? "Ativo"
                                : "Inativo"
                        }
                    </span>

                </label>


                <button
                    type="button"
                    class="action-button edit-button"
                    data-id="${item.id}"
                    title="Editar"
                >
                    ✎
                </button>


                <button
                    type="button"
                    class="action-button delete delete-button"
                    data-id="${item.id}"
                    title="Excluir"
                >
                    ×
                </button>

            </div>

        </article>
    `;
}


// =====================================================
// LISTA
// =====================================================

function renderFixedList() {

    const items =
        getFilteredFixed();


    getElement(
        "resultsText"
    ).textContent =
        `${items.length} lançamento${
            items.length === 1
                ? ""
                : "s"
        } encontrado${
            items.length === 1
                ? ""
                : "s"
        }`;


    getElement(
        "emptyState"
    ).hidden =
        items.length > 0;


    getElement(
        "fixedList"
    ).innerHTML =
        items
            .map(
                createFixedItem
            )
            .join("");


    setupItemActions();
}


// =====================================================
// RENDERIZAR
// =====================================================

function renderPage() {

    renderSummary();

    renderFixedList();
}


// =====================================================
// RECARREGAR
// =====================================================

async function refreshFixed() {

    await loadFixed();

    renderPage();
}


// =====================================================
// AÇÕES
// =====================================================

function setupItemActions() {

    document
        .querySelectorAll(
            ".edit-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openEditModal(
                            button.dataset.id
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".delete-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openDeleteModal(
                            button.dataset.id
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".active-toggle"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    async () => {

                        await toggleFixedStatus(
                            input.dataset.id,
                            input.checked
                        );
                    }
                );
            }
        );
}


// =====================================================
// NOVO FIXO
// =====================================================

function openNewModal() {

    const form =
        getElement(
            "fixedForm"
        );


    form.reset();


    getElement(
        "fixedId"
    ).value = "";


    getElement(
        "modalLabel"
    ).textContent =
        "Novo lançamento";


    getElement(
        "modalTitle"
    ).textContent =
        "Adicionar fixo mensal";


    getElement(
        "fixedType"
    ).value =
        "expense";


    getElement(
        "day"
    ).value =
        5;


    getElement(
        "payment"
    ).value =
        "Pix";


    getElement(
        "defaultStatus"
    ).value =
        "pending";


    getElement(
        "active"
    ).checked =
        true;


    const category =
        getElement(
            "category"
        );


    if (
        category &&
        category.options.length > 0
    ) {
        category.selectedIndex = 0;
    }


    getElement(
        "fixedModal"
    ).showModal();


    window.setTimeout(
        () => {

            getElement(
                "description"
            ).focus();

        },
        100
    );
}


// =====================================================
// EDITAR FIXO
// =====================================================

function openEditModal(id) {

    const numericId =
        Number(id);


    const item =
        appData.fixed.find(
            fixed =>
                Number(fixed.id) ===
                numericId
        );


    if (!item) {

        showToast(
            "Lançamento não encontrado."
        );

        return;
    }


    getElement(
        "fixedId"
    ).value =
        item.id;


    getElement(
        "description"
    ).value =
        item.description;


    getElement(
        "fixedType"
    ).value =
        item.type;


    getElement(
        "amount"
    ).value =
        String(
            item.amount
        ).replace(
            ".",
            ","
        );


    getElement(
        "category"
    ).value =
        item.categoryId ||
        "";


    getElement(
        "day"
    ).value =
        item.day;


    getElement(
        "payment"
    ).value =
        item.payment;


    getElement(
        "defaultStatus"
    ).value =
        item.defaultStatus;


    getElement(
        "active"
    ).checked =
        item.active;


    getElement(
        "modalLabel"
    ).textContent =
        "Editar lançamento";


    getElement(
        "modalTitle"
    ).textContent =
        "Editar fixo mensal";


    getElement(
        "fixedModal"
    ).showModal();
}


// =====================================================
// SALVAR FIXO
// =====================================================

async function saveFixed(event) {

    event.preventDefault();


    const id =
        getElement(
            "fixedId"
        ).value;


    const description =
        getElement(
            "description"
        ).value.trim();


    const amount =
        parseMoney(
            getElement(
                "amount"
            ).value
        );


    const day =
        Number(
            getElement(
                "day"
            ).value
        );


    const categoryId =
        getElement(
            "category"
        ).value;


    const type =
        getElement(
            "fixedType"
        ).value;


    const payment =
        getElement(
            "payment"
        ).value;


    const defaultStatus =
        getElement(
            "defaultStatus"
        ).value;


    const active =
        getElement(
            "active"
        ).checked;


    if (!description) {

        showToast(
            "Informe a descrição."
        );

        return;
    }


    if (
        Number.isNaN(amount) ||
        amount <= 0
    ) {

        showToast(
            "Informe um valor válido."
        );

        return;
    }


    if (
        !day ||
        day < 1 ||
        day > 31
    ) {

        showToast(
            "O dia precisa estar entre 1 e 31."
        );

        return;
    }


    if (!categoryId) {

        showToast(
            "Selecione uma categoria."
        );

        return;
    }


    const form =
        getElement(
            "fixedForm"
        );


    const saveButton =
        form.querySelector(
            'button[type="submit"]'
        );


    try {

        if (saveButton) {

            saveButton.disabled =
                true;


            saveButton.textContent =
                id
                    ? "Atualizando..."
                    : "Salvando...";
        }


        const body = {

            descricao:
                description,

            tipo:
                type,

            valor:
                amount,

            categoria_id:
                Number(
                    categoryId
                ),

            dia_vencimento:
                day,

            forma_pagamento:
                payment,

            status_padrao:
                defaultStatus,

            ativo:
                active
        };


        console.log(
            "Enviando fixo:",
            body
        );


        let resultado;


        if (id) {

            resultado =
                await apiRequest(
                    `/fixos/${id}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify(
                                body
                            )
                    }
                );

        } else {

            resultado =
                await apiRequest(
                    "/fixos",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                body
                            )
                    }
                );
        }


        getElement(
            "fixedModal"
        ).close();


        form.reset();


        showToast(
            resultado.message ||
            (
                id
                    ? "Lançamento atualizado."
                    : "Lançamento adicionado."
            )
        );


        await refreshFixed();


    } catch (error) {

        console.error(
            "Erro ao salvar fixo:",
            error
        );


        showToast(
            error.message ||
            "Erro ao salvar lançamento."
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "Salvar lançamento";
        }
    }
}


// =====================================================
// ATIVAR / DESATIVAR
// =====================================================

async function toggleFixedStatus(
    id,
    active
) {

    try {

        const resultado =
            await apiRequest(
                `/fixos/${id}/status`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            ativo: active
                        })
                }
            );


        showToast(
            resultado.message ||
            (
                active
                    ? "Lançamento ativado."
                    : "Lançamento desativado."
            )
        );


        await refreshFixed();


    } catch (error) {

        console.error(
            "Erro ao alterar status:",
            error
        );


        showToast(
            error.message ||
            "Erro ao atualizar lançamento."
        );


        await refreshFixed();
    }
}


// =====================================================
// EXCLUIR
// =====================================================

function openDeleteModal(id) {

    fixedToDelete =
        Number(id);


    getElement(
        "deleteModal"
    ).showModal();
}


async function deleteFixed() {

    if (!fixedToDelete) {
        return;
    }


    const button =
        getElement(
            "confirmDelete"
        );


    try {

        button.disabled =
            true;


        button.textContent =
            "Excluindo...";


        const resultado =
            await apiRequest(
                `/fixos/${fixedToDelete}`,
                {
                    method:
                        "DELETE"
                }
            );


        fixedToDelete =
            null;


        getElement(
            "deleteModal"
        ).close();


        showToast(
            resultado.message ||
            "Lançamento excluído."
        );


        await refreshFixed();


    } catch (error) {

        console.error(
            "Erro ao excluir fixo:",
            error
        );


        showToast(
            error.message ||
            "Erro ao excluir lançamento."
        );


    } finally {

        button.disabled =
            false;


        button.textContent =
            "Excluir";
    }
}


// =====================================================
// DATA
// =====================================================

function getValidDay(
    year,
    month,
    requestedDay
) {

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    return Math.min(
        Number(
            requestedDay
        ),
        lastDay
    );
}


function buildDate(
    year,
    month,
    day
) {

    return [
        year,

        String(
            month + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            day
        ).padStart(
            2,
            "0"
        )
    ].join("-");
}


// =====================================================
// ABRIR LANÇAMENTO
// =====================================================

function openLaunchModal() {

    const month =
        Number(
            getElement(
                "launchMonth"
            ).value
        );


    const year =
        Number(
            getElement(
                "launchYear"
            ).value
        );


    const activeCount =
        appData.fixed.filter(
            item =>
                item.active
        ).length;


    if (
        activeCount === 0
    ) {

        showToast(
            "Não existem lançamentos fixos ativos."
        );

        return;
    }


    getElement(
        "launchConfirmationText"
    ).textContent =
        `${activeCount} lançamento${
            activeCount === 1
                ? ""
                : "s"
        } ativo${
            activeCount === 1
                ? ""
                : "s"
        } será${
            activeCount === 1
                ? ""
                : "ão"
        } adicionado${
            activeCount === 1
                ? ""
                : "s"
        } em ${
            monthNames[month]
        } de ${year}.`;


    getElement(
        "launchModal"
    ).showModal();
}


// =====================================================
// LANÇAR FIXOS
// =====================================================

async function launchFixedTransactions() {

    const month =
        Number(
            getElement(
                "launchMonth"
            ).value
        );


    const year =
        Number(
            getElement(
                "launchYear"
            ).value
        );


    const activeItems =
        appData.fixed.filter(
            item =>
                item.active
        );


    if (
        activeItems.length === 0
    ) {

        showToast(
            "Não existem fixos ativos."
        );

        return;
    }


    const button =
        getElement(
            "executeLaunchButton"
        );


    try {

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Lançando...";
        }


        const existingTransactions =
            await apiRequest(
                `/movimentacoes?mes=${
                    month + 1
                }&ano=${year}`
            );


        let added = 0;
        let ignored = 0;


        for (
            const item
            of activeItems
        ) {

            const alreadyExists =
                Array.isArray(
                    existingTransactions
                ) &&
                existingTransactions.some(
                    transaction => {

                        return (
                            Number(
                                transaction.fixo_id
                            ) ===
                            Number(
                                item.id
                            )
                        );
                    }
                );


            if (alreadyExists) {

                ignored++;

                continue;
            }


            const validDay =
                getValidDay(
                    year,
                    month,
                    item.day
                );


            const data =
                buildDate(
                    year,
                    month,
                    validDay
                );


            await apiRequest(
                "/movimentacoes",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({

                            descricao:
                                item.description,

                            tipo:
                                item.type,

                            valor:
                                Number(
                                    item.amount
                                ),

                            categoria_id:
                                item.categoryId,

                            data,

                            status:
                                item.defaultStatus,

                            forma_pagamento:
                                item.payment,

                            fixo_id:
                                item.id
                        })
                }
            );


            added++;
        }


        getElement(
            "launchModal"
        ).close();


        if (added === 0) {

            showToast(
                "Os fixos desse período já foram lançados."
            );

            return;
        }


        let message =
            `${added} lançamento${
                added === 1
                    ? ""
                    : "s"
            } adicionado${
                added === 1
                    ? ""
                    : "s"
            } às movimentações.`;


        if (ignored > 0) {

            message +=
                ` ${ignored} já existia${
                    ignored === 1
                        ? ""
                        : "m"
                }.`;
        }


        showToast(
            message
        );


    } catch (error) {

        console.error(
            "Erro ao lançar fixos:",
            error
        );


        showToast(
            error.message ||
            "Erro ao lançar os fixos."
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Confirmar lançamento";
        }
    }
}


// =====================================================
// LIMPAR FILTROS
// =====================================================

function clearFilters() {

    getElement(
        "searchInput"
    ).value = "";


    getElement(
        "typeFilter"
    ).value =
        "all";


    getElement(
        "statusFilter"
    ).value =
        "all";


    getElement(
        "categoryFilter"
    ).value =
        "all";


    getElement(
        "orderFilter"
    ).value =
        "day";


    renderFixedList();
}


// =====================================================
// FILTROS
// =====================================================

function setupFilters() {

    [
        "searchInput",
        "typeFilter",
        "statusFilter",
        "categoryFilter",
        "orderFilter"
    ].forEach(
        id => {

            const element =
                getElement(id);


            if (!element) {
                return;
            }


            element.addEventListener(

                id === "searchInput"
                    ? "input"
                    : "change",

                renderFixedList
            );
        }
    );
}


// =====================================================
// PERFIL
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


            dropdown.classList.toggle(
                "show"
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

                dropdown.classList.remove(
                    "show"
                );
            }
        }
    );
}


// =====================================================
// TEMA
// =====================================================

function setupTheme() {

    const button =
        getElement(
            "themeToggle"
        );


    if (!button) {
        return;
    }


    if (
        localStorage.getItem(
            THEME_KEY
        ) === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );


        button.textContent =
            "☀";
    }


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            const darkMode =
                document.body.classList.contains(
                    "dark"
                );


            localStorage.setItem(

                THEME_KEY,

                darkMode
                    ? "dark"
                    : "light"
            );


            button.textContent =
                darkMode
                    ? "☀"
                    : "☾";
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

            navigation.classList.toggle(
                "show"
            );
        }
    );
}


// =====================================================
// MODAIS
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
                            "deleteModal"
                        ) {

                            fixedToDelete =
                                null;
                        }
                    }
                );
            }
        );
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
// EVENTOS
// =====================================================

function setupEvents() {

    [
        "topAddButton",
        "headerAddButton",
        "listAddButton",
        "emptyAddButton"
    ].forEach(
        id => {

            const button =
                getElement(id);


            if (button) {

                button.addEventListener(
                    "click",
                    openNewModal
                );
            }
        }
    );


    const fixedForm =
        getElement(
            "fixedForm"
        );


    if (fixedForm) {

        fixedForm.addEventListener(
            "submit",
            saveFixed
        );
    }


    const confirmDelete =
        getElement(
            "confirmDelete"
        );


    if (confirmDelete) {

        confirmDelete.addEventListener(
            "click",
            deleteFixed
        );
    }


    const clearFiltersButton =
        getElement(
            "clearFilters"
        );


    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(
            "click",
            clearFilters
        );
    }


    const launchFixedButton =
        getElement(
            "launchFixedButton"
        );


    if (launchFixedButton) {

        launchFixedButton.addEventListener(
            "click",
            openLaunchModal
        );
    }


    const confirmLaunchButton =
        getElement(
            "confirmLaunchButton"
        );


    if (confirmLaunchButton) {

        confirmLaunchButton.addEventListener(
            "click",
            openLaunchModal
        );
    }


    const executeLaunchButton =
        getElement(
            "executeLaunchButton"
        );


    if (executeLaunchButton) {

        executeLaunchButton.addEventListener(
            "click",
            launchFixedTransactions
        );
    }


    const logoutButton =
        getElement(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );
    }
}


// =====================================================
// INICIALIZAR
// =====================================================

async function initializePage() {


    if (!getSession()) {
        return;
    }


    setupPeriodOptions();

    setupFilters();

    setupProfileMenu();

    setupTheme();

    setupMobileMenu();

    setupModalClosing();

    setupEvents();


    try {

        await Promise.all([
            renderUser(),
            loadCategories()
        ]);


        await refreshFixed();


    } catch (error) {

        console.error(
            "Erro ao inicializar página:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar fixos."
        );
    }
}


initializePage();