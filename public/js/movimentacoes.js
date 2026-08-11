// =====================================================
// CONFIGURAÇÕES
// =====================================================

const LOGIN_KEY = "clara-financas-login";
const TOKEN_KEY = "clara-financas-token";
const THEME_KEY = "clara-financas-tema";

const API_URL = "projeto-conecta-financas.vercel.app/api";


// =====================================================
// FORMATADOR
// =====================================================

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});


// =====================================================
// ESTADO
// =====================================================

let appData = {
    transactions: [],
    categories: []
};

let transactionToDelete = null;


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


function normalizeDate(value) {

    if (!value) {
        return "";
    }


    const text =
        String(value);


    const match =
        text.match(
            /^\d{4}-\d{2}-\d{2}/
        );


    if (match) {
        return match[0];
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}


function formatDate(dateValue) {

    const normalized =
        normalizeDate(dateValue);


    if (!normalized) {
        return "-";
    }


    return new Intl.DateTimeFormat(
        "pt-BR"
    ).format(
        new Date(
            `${normalized}T12:00:00`
        )
    );
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


    /*
        Aceita:

        30
        30,00
        30.00
        1.500,90
        1500.90
    */

    if (
        text.includes(",") &&
        text.includes(".")
    ) {

        text = text
            .replace(/\./g, "")
            .replace(",", ".");

    } else {

        text =
            text.replace(",", ".");
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


    if (
        appData.categories.length === 0
    ) {

        if (categorySelect) {

            categorySelect.innerHTML = `
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
            `;
        }


        return;
    }


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
            options;
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
// CARREGAR MOVIMENTAÇÕES
// =====================================================

async function loadTransactions() {

    try {

        const transactions =
            await apiRequest(
                "/movimentacoes"
            );


        if (
            !Array.isArray(
                transactions
            )
        ) {

            appData.transactions = [];

            return;
        }


        appData.transactions =
            transactions.map(item => {

                return {

                    id:
                        Number(item.id),

                    description:
                        item.descricao ||
                        "",

                    type:
                        item.tipo,

                    amount:
                        Number(
                            item.valor
                        ),

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

                    date:
                        normalizeDate(
                            item.data ||
                            item.data_movimentacao
                        ),

                    status:
                        item.status,

                    payment:
                        item.forma_pagamento ||
                        "Não informado",

                    observation:
                        item.observacao ||
                        "",

                    fixedId:
                        item.fixo_id ||
                        null
                };

            });


    } catch (error) {

        console.error(
            "Erro ao carregar movimentações:",
            error
        );


        showToast(
            error.message
        );
    }
}


// =====================================================
// ANOS
// =====================================================

function renderYearOptions() {

    const yearFilter =
        getElement(
            "yearFilter"
        );


    if (!yearFilter) {
        return;
    }


    const years =
        new Set();


    appData.transactions.forEach(
        transaction => {

            if (!transaction.date) {
                return;
            }


            const date =
                new Date(
                    `${transaction.date}T12:00:00`
                );


            if (
                !Number.isNaN(
                    date.getTime()
                )
            ) {

                years.add(
                    date.getFullYear()
                );
            }
        }
    );


    years.add(
        new Date().getFullYear()
    );


    const sortedYears =
        [...years]
            .sort(
                (a, b) =>
                    b - a
            );


    const currentValue =
        yearFilter.value;


    yearFilter.innerHTML = `
        <option value="all">
            Todos
        </option>

        ${sortedYears
            .map(year => {

                return `
                    <option value="${year}">
                        ${year}
                    </option>
                `;

            })
            .join("")}
    `;


    if (
        [...yearFilter.options]
            .some(
                option =>
                    option.value ===
                    currentValue
            )
    ) {

        yearFilter.value =
            currentValue;
    }
}


// =====================================================
// FILTROS
// =====================================================

function getFilteredTransactions() {

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


    const month =
        getElement(
            "monthFilter"
        ).value;


    const year =
        getElement(
            "yearFilter"
        ).value;


    const order =
        getElement(
            "orderFilter"
        ).value;


    const filtered =
        appData.transactions.filter(
            transaction => {

                const date =
                    transaction.date
                        ? new Date(
                            `${transaction.date}T12:00:00`
                        )
                        : null;


                const searchableText =
                    normalizeText(
                        `${transaction.description}
                         ${transaction.category}
                         ${transaction.payment}`
                    );


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                const matchesType =
                    type === "all" ||
                    transaction.type ===
                        type;


                const matchesStatus =
                    status === "all" ||
                    transaction.status ===
                        status;


                const matchesCategory =
                    category === "all" ||
                    String(
                        transaction.categoryId
                    ) ===
                        String(category);


                const matchesMonth =
                    month === "all" ||
                    (
                        date &&
                        date.getMonth() ===
                            Number(month)
                    );


                const matchesYear =
                    year === "all" ||
                    (
                        date &&
                        date.getFullYear() ===
                            Number(year)
                    );


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesStatus &&
                    matchesCategory &&
                    matchesMonth &&
                    matchesYear
                );
            }
        );


    filtered.sort(
        (
            first,
            second
        ) => {

            if (
                order === "oldest"
            ) {

                return first.date
                    .localeCompare(
                        second.date
                    );
            }


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


            return second.date
                .localeCompare(
                    first.date
                );
        }
    );


    return filtered;
}


// =====================================================
// SOMA
// =====================================================

function sumTransactions(
    transactions,
    filter
) {

    return transactions
        .filter(filter)
        .reduce(
            (
                total,
                transaction
            ) => {

                return (
                    total +
                    Number(
                        transaction.amount
                    )
                );

            },
            0
        );
}


// =====================================================
// RESUMO
// =====================================================

function renderSummary(
    transactions
) {

    const income =
        sumTransactions(
            transactions,
            transaction =>
                transaction.type ===
                    "income" &&
                transaction.status ===
                    "paid"
        );


    const expense =
        sumTransactions(
            transactions,
            transaction =>
                transaction.type ===
                    "expense" &&
                transaction.status ===
                    "paid"
        );


    const pending =
        sumTransactions(
            transactions,
            transaction =>
                transaction.type ===
                    "expense" &&
                transaction.status ===
                    "pending"
        );


    const incomeCount =
        transactions.filter(
            transaction =>
                transaction.type ===
                    "income" &&
                transaction.status ===
                    "paid"
        ).length;


    const expenseCount =
        transactions.filter(
            transaction =>
                transaction.type ===
                    "expense" &&
                transaction.status ===
                    "paid"
        ).length;


    const pendingCount =
        transactions.filter(
            transaction =>
                transaction.type ===
                    "expense" &&
                transaction.status ===
                    "pending"
        ).length;


    getElement(
        "summaryIncome"
    ).textContent =
        currency.format(
            income
        );


    getElement(
        "summaryExpense"
    ).textContent =
        currency.format(
            expense
        );


    getElement(
        "summaryPending"
    ).textContent =
        currency.format(
            pending
        );


    getElement(
        "summaryBalance"
    ).textContent =
        currency.format(
            income - expense
        );


    getElement(
        "summaryIncomeCount"
    ).textContent =
        `${incomeCount} recebimento${
            incomeCount === 1
                ? ""
                : "s"
        }`;


    getElement(
        "summaryExpenseCount"
    ).textContent =
        `${expenseCount} pagamento${
            expenseCount === 1
                ? ""
                : "s"
        }`;


    getElement(
        "summaryPendingCount"
    ).textContent =
        `${pendingCount} pendência${
            pendingCount === 1
                ? ""
                : "s"
        }`;
}


// =====================================================
// TABELA
// =====================================================

function createTableRow(
    transaction
) {

    const isIncome =
        transaction.type ===
        "income";


    return `
        <tr>

            <td>

                <div class="transaction-name">

                    <div
                        class="transaction-icon ${
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


                    <div>

                        <strong>
                            ${escapeHtml(
                                transaction.description
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                transaction.payment
                            )}
                        </small>

                    </div>

                </div>

            </td>


            <td>

                <span class="category-badge">
                    ${escapeHtml(
                        transaction.category
                    )}
                </span>

            </td>


            <td>
                ${formatDate(
                    transaction.date
                )}
            </td>


            <td>

                <span
                    class="status-badge ${transaction.status}"
                >
                    ${
                        transaction.status ===
                        "paid"

                            ? isIncome
                                ? "Recebido"
                                : "Pago"

                            : "Pendente"
                    }
                </span>

            </td>


            <td>

                <span
                    class="amount ${
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
                        transaction.amount
                    )}

                </span>

            </td>


            <td>

                <div class="actions">

                    <button
                        type="button"
                        class="action-button edit-button"
                        data-id="${transaction.id}"
                        title="Editar"
                    >
                        ✎
                    </button>


                    <button
                        type="button"
                        class="action-button delete delete-button"
                        data-id="${transaction.id}"
                        title="Excluir"
                    >
                        ×
                    </button>

                </div>

            </td>

        </tr>
    `;
}


// =====================================================
// CARD MOBILE
// =====================================================

function createMobileCard(
    transaction
) {

    const isIncome =
        transaction.type ===
        "income";


    return `
        <article class="mobile-transaction-card">

            <div class="mobile-transaction-top">

                <div class="mobile-transaction-main">

                    <div
                        class="transaction-icon ${
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


                    <div>

                        <strong>
                            ${escapeHtml(
                                transaction.description
                            )}
                        </strong>

                        <small>

                            ${escapeHtml(
                                transaction.category
                            )}

                            ·

                            ${formatDate(
                                transaction.date
                            )}

                        </small>

                    </div>

                </div>


                <span
                    class="amount ${
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
                        transaction.amount
                    )}

                </span>

            </div>


            <div class="mobile-transaction-bottom">

                <span
                    class="status-badge ${transaction.status}"
                >

                    ${
                        transaction.status ===
                        "paid"

                            ? isIncome
                                ? "Recebido"
                                : "Pago"

                            : "Pendente"
                    }

                </span>


                <div class="mobile-actions">

                    <button
                        type="button"
                        class="action-button edit-button"
                        data-id="${transaction.id}"
                    >
                        ✎
                    </button>


                    <button
                        type="button"
                        class="action-button delete delete-button"
                        data-id="${transaction.id}"
                    >
                        ×
                    </button>

                </div>

            </div>

        </article>
    `;
}


// =====================================================
// RENDERIZAR
// =====================================================

function renderTransactions() {

    const transactions =
        getFilteredTransactions();


    renderSummary(
        transactions
    );


    const total =
        transactions.length;


    getElement(
        "resultsText"
    ).textContent =
        `${total} movimentação${
            total === 1
                ? ""
                : "ões"
        } encontrada${
            total === 1
                ? ""
                : "s"
        }`;


    getElement(
        "emptyState"
    ).hidden =
        total > 0;


    getElement(
        "transactionsBody"
    ).innerHTML =
        transactions
            .map(
                createTableRow
            )
            .join("");


    getElement(
        "mobileTransactions"
    ).innerHTML =
        transactions
            .map(
                createMobileCard
            )
            .join("");


    setupRowActions();
}


// =====================================================
// CARREGAR PÁGINA
// =====================================================

async function refreshTransactions() {

    await loadTransactions();

    renderYearOptions();

    renderTransactions();
}


// =====================================================
// AÇÕES DE LINHA
// =====================================================

function setupRowActions() {

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
}


// =====================================================
// NOVA MOVIMENTAÇÃO
// =====================================================

function openNewModal() {

    const form =
        getElement(
            "transactionForm"
        );


    form.reset();


    getElement(
        "transactionId"
    ).value = "";


    getElement(
        "modalLabel"
    ).textContent =
        "Novo lançamento";


    getElement(
        "modalTitle"
    ).textContent =
        "Adicionar movimentação";


    getElement(
        "transactionType"
    ).value =
        "expense";


    getElement(
        "status"
    ).value =
        "paid";


    getElement(
        "payment"
    ).value =
        "Pix";


    const category =
        getElement(
            "category"
        );


    if (
        category &&
        category.options.length > 0
    ) {

        category.selectedIndex =
            0;
    }


    getElement(
        "date"
    ).value =
        new Date()
            .toISOString()
            .slice(
                0,
                10
            );


    getElement(
        "transactionModal"
    ).showModal();


    setTimeout(
        () => {

            getElement(
                "description"
            ).focus();

        },
        100
    );
}


// =====================================================
// EDITAR MOVIMENTAÇÃO
// =====================================================

function openEditModal(id) {

    const numericId =
        Number(id);


    const transaction =
        appData.transactions.find(
            item =>
                Number(item.id) ===
                numericId
        );


    if (!transaction) {

        showToast(
            "Movimentação não encontrada."
        );

        return;
    }


    getElement(
        "transactionId"
    ).value =
        transaction.id;


    getElement(
        "description"
    ).value =
        transaction.description;


    getElement(
        "transactionType"
    ).value =
        transaction.type;


    getElement(
        "amount"
    ).value =
        String(
            transaction.amount
        ).replace(
            ".",
            ","
        );


    getElement(
        "category"
    ).value =
        transaction.categoryId ||
        "";


    getElement(
        "date"
    ).value =
        transaction.date;


    getElement(
        "status"
    ).value =
        transaction.status;


    getElement(
        "payment"
    ).value =
        transaction.payment;


    getElement(
        "modalLabel"
    ).textContent =
        "Editar lançamento";


    getElement(
        "modalTitle"
    ).textContent =
        "Editar movimentação";


    getElement(
        "transactionModal"
    ).showModal();
}


// =====================================================
// SALVAR MOVIMENTAÇÃO
// =====================================================

async function saveTransaction(
    event
) {

    event.preventDefault();


    const id =
        getElement(
            "transactionId"
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


    const categoryId =
        getElement(
            "category"
        ).value;


    const data =
        getElement(
            "date"
        ).value;


    const type =
        getElement(
            "transactionType"
        ).value;


    const status =
        getElement(
            "status"
        ).value;


    const payment =
        getElement(
            "payment"
        ).value;


    // =========================
    // Validações
    // =========================

    if (!description) {

        showToast(
            "Informe a descrição."
        );

        return;
    }


    if (
        Number.isNaN(
            amount
        ) ||
        amount <= 0
    ) {

        showToast(
            "Informe um valor válido."
        );

        return;
    }


    if (!categoryId) {

        showToast(
            "Selecione uma categoria."
        );

        return;
    }


    if (!data) {

        showToast(
            "Informe a data."
        );

        return;
    }


    const form =
        getElement(
            "transactionForm"
        );


    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    try {

        submitButton.disabled =
            true;


        submitButton.textContent =
            id
                ? "Atualizando..."
                : "Salvando...";


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

            data,

            status,

            forma_pagamento:
                payment
        };


        console.log(
            "Enviando movimentação:",
            body
        );


        let resultado;


        if (id) {

            resultado =
                await apiRequest(
                    `/movimentacoes/${id}`,
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
                    "/movimentacoes",
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
            "transactionModal"
        ).close();


        form.reset();


        showToast(
            resultado.message ||
            (
                id
                    ? "Movimentação atualizada."
                    : "Movimentação adicionada."
            )
        );


        await refreshTransactions();


    } catch (error) {

        console.error(
            "Erro ao salvar movimentação:",
            error
        );


        showToast(
            error.message ||
            "Erro ao salvar movimentação."
        );


    } finally {

        submitButton.disabled =
            false;


        submitButton.textContent =
            "Salvar movimentação";
    }
}


// =====================================================
// MODAL EXCLUIR
// =====================================================

function openDeleteModal(id) {

    transactionToDelete =
        Number(id);


    getElement(
        "deleteModal"
    ).showModal();
}


// =====================================================
// EXCLUIR MOVIMENTAÇÃO
// =====================================================

async function deleteTransaction() {

    if (
        !transactionToDelete
    ) {
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
                `/movimentacoes/${transactionToDelete}`,
                {
                    method:
                        "DELETE"
                }
            );


        transactionToDelete =
            null;


        getElement(
            "deleteModal"
        ).close();


        showToast(
            resultado.message ||
            "Movimentação excluída."
        );


        await refreshTransactions();


    } catch (error) {

        console.error(
            "Erro ao excluir movimentação:",
            error
        );


        showToast(
            error.message ||
            "Erro ao excluir movimentação."
        );


    } finally {

        button.disabled =
            false;


        button.textContent =
            "Excluir";
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
        "monthFilter"
    ).value =
        "all";


    getElement(
        "yearFilter"
    ).value =
        "all";


    getElement(
        "orderFilter"
    ).value =
        "newest";


    renderTransactions();
}


// =====================================================
// EXPORTAR CSV
// =====================================================

function exportCsv() {

    const transactions =
        getFilteredTransactions();


    if (
        transactions.length === 0
    ) {

        showToast(
            "Não há movimentações para exportar."
        );

        return;
    }


    const header = [
        "Descrição",
        "Tipo",
        "Categoria",
        "Data",
        "Status",
        "Pagamento",
        "Valor"
    ];


    const rows =
        transactions.map(
            transaction => {

                return [

                    transaction.description,

                    transaction.type ===
                    "income"
                        ? "Entrada"
                        : "Despesa",

                    transaction.category,

                    transaction.date,

                    transaction.status ===
                    "paid"
                        ? "Pago ou recebido"
                        : "Pendente",

                    transaction.payment,

                    Number(
                        transaction.amount
                    )
                        .toFixed(2)
                        .replace(
                            ".",
                            ","
                        )
                ];
            }
        );


    const csv =
        [
            header,
            ...rows
        ]
            .map(
                row => {

                    return row
                        .map(
                            value => {

                                const escaped =
                                    String(
                                        value
                                    )
                                        .replace(
                                            /"/g,
                                            '""'
                                        );


                                return `"${escaped}"`;
                            }
                        )
                        .join(";");
                }
            )
            .join("\n");


    const blob =
        new Blob(
            [
                "\uFEFF" +
                csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
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


    link.href = url;


    link.download =
        "movimentacoes-clara-financas.csv";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "Arquivo CSV exportado."
    );
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
        "monthFilter",
        "yearFilter",
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

                renderTransactions
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

    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );


    const button =
        getElement(
            "themeToggle"
        );


    if (!button) {
        return;
    }


    if (
        savedTheme === "dark"
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
                                button.dataset.closeModal
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

                            transactionToDelete =
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

    const openTransaction =
        getElement(
            "openTransaction"
        );


    const headerAddButton =
        getElement(
            "headerAddButton"
        );


    const emptyAddButton =
        getElement(
            "emptyAddButton"
        );


    const transactionForm =
        getElement(
            "transactionForm"
        );


    const confirmDelete =
        getElement(
            "confirmDelete"
        );


    const clearFiltersButton =
        getElement(
            "clearFilters"
        );


    const exportButton =
        getElement(
            "exportButton"
        );


    const logoutButton =
        getElement(
            "logoutButton"
        );


    if (openTransaction) {

        openTransaction.addEventListener(
            "click",
            openNewModal
        );
    }


    if (headerAddButton) {

        headerAddButton.addEventListener(
            "click",
            openNewModal
        );
    }


    if (emptyAddButton) {

        emptyAddButton.addEventListener(
            "click",
            openNewModal
        );
    }


    if (transactionForm) {

        transactionForm.addEventListener(
            "submit",
            saveTransaction
        );
    }


    if (confirmDelete) {

        confirmDelete.addEventListener(
            "click",
            deleteTransaction
        );
    }


    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(
            "click",
            clearFilters
        );
    }


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportCsv
        );
    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );
    }
}


// =====================================================
// INICIALIZAÇÃO
// =====================================================

async function initializePage() {

    if (!getSession()) {
        return;
    }


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


        await refreshTransactions();


    } catch (error) {

        console.error(
            "Erro ao inicializar página:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar movimentações."
        );
    }
}


initializePage();