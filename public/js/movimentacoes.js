// =====================================================
// CONFIGURAÇÕES
// =====================================================

const LOGIN_KEY =
    "clara-financas-login";

const TOKEN_KEY =
    "clara-financas-token";

const THEME_KEY =
    "clara-financas-tema";


const API_URL =
    "https://projeto-conecta-financas.vercel.app/api";


    // =====================================================
// CONFIRMAR EXCLUSÃO
// =====================================================

let confirmBeforeDelete =
    true;

    


// =====================================================
// FORMATADOR
// =====================================================

// =====================================================
// MOEDA
// =====================================================

let currentCurrency =
    "BRL";


let currency =
    createCurrencyFormatter(
        currentCurrency
    );


function createCurrencyFormatter(
    currencyCode
) {

    return new Intl.NumberFormat(
        "pt-BR",
        {
            style:
                "currency",

            currency:
                currencyCode,

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    );
}

// =====================================================
// CARREGAR CONFIGURAÇÕES
// =====================================================

async function loadFinancialSettings() {

    try {

        const configuracao =
            await apiRequest(
                "/configuracoes"
            );


        // =========================
        // MOEDA
        // =========================

        currentCurrency =
            configuracao?.moeda ||
            "BRL";


        currency =
            createCurrencyFormatter(
                currentCurrency
            );


        // =========================
        // FORMA DE PAGAMENTO PADRÃO
        // =========================

        defaultPaymentMethod =
            configuracao?.forma_pagamento_padrao ||
            "Pix";


        // =========================
        // CONFIRMAR ANTES DE EXCLUIR
        // =========================

        confirmBeforeDelete =
            Boolean(
                Number(
                    configuracao?.confirmar_exclusao ??
                    1
                )
            );


    } catch (error) {

        console.error(
            "Erro ao carregar configurações:",
            error
        );


        // =========================
        // FALLBACK MOEDA
        // =========================

        currentCurrency =
            "BRL";


        currency =
            createCurrencyFormatter(
                "BRL"
            );


        // =========================
        // FALLBACK PAGAMENTO
        // =========================

        defaultPaymentMethod =
            "Pix";


        // =========================
        // FALLBACK CONFIRMAÇÃO
        // =========================

        confirmBeforeDelete =
            true;
    }
}


// =====================================================
// ESTADO
// =====================================================

let appData = {
    transactions: [],
    categories: []
};


let transactionToDelete =
    null;


// =====================================================
// HISTÓRICO
// =====================================================

let showAllTransactions =
    false;


const INITIAL_TRANSACTION_LIMIT =
    4;


let searchLoadingTimeout =
    null;


// =====================================================
// ELEMENTOS
// =====================================================

function getElement(id) {

    return document.getElementById(
        id
    );
}


// =====================================================
// TOKEN
// =====================================================

function getToken() {

    return (
        localStorage.getItem(
            TOKEN_KEY
        ) ||
        sessionStorage.getItem(
            TOKEN_KEY
        )
    );
}


// =====================================================
// SESSÃO
// =====================================================

function getSession() {

    const savedSession =
        localStorage.getItem(
            LOGIN_KEY
        ) ||
        sessionStorage.getItem(
            LOGIN_KEY
        );


    const token =
        getToken();


    if (
        !savedSession ||
        !token
    ) {

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
        !(
            options.body
            instanceof FormData
        )
    ) {

        headers["Content-Type"] =
            "application/json";
    }


    headers.Authorization =
        `Bearer ${token}`;


    let response;


    try {

        response =
            await fetch(
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


    if (
        !response.ok
    ) {

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
        getElement(
            "toast"
        );


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
// LOADING DO HISTÓRICO
// =====================================================

function showHistoryLoading() {

    const loading =
        getElement(
            "historyLoading"
        );


    const resultsText =
        getElement(
            "resultsText"
        );


    const search =
        document.querySelector(
            ".transactions-search"
        );


    const tableWrapper =
        document.querySelector(
            ".table-wrapper"
        );


    const mobileTransactions =
        getElement(
            "mobileTransactions"
        );


    const emptyState =
        getElement(
            "emptyState"
        );


    const historyViewAllWrapper =
        document.querySelector(
            ".history-view-all-wrapper"
        );


    if (resultsText) {

        resultsText.textContent =
            "Carregando movimentações...";
    }


    if (loading) {

        loading.hidden =
            false;
    }


    if (search) {

        search.hidden =
            true;
    }


    if (tableWrapper) {

        tableWrapper.hidden =
            true;
    }


    if (mobileTransactions) {

        mobileTransactions.hidden =
            true;
    }


    if (emptyState) {

        emptyState.hidden =
            true;
    }


    if (historyViewAllWrapper) {

        historyViewAllWrapper.hidden =
            true;
    }
}


function hideHistoryLoading() {

    const loading =
        getElement(
            "historyLoading"
        );


    const search =
        document.querySelector(
            ".transactions-search"
        );


    const tableWrapper =
        document.querySelector(
            ".table-wrapper"
        );


    const mobileTransactions =
        getElement(
            "mobileTransactions"
        );


    const historyViewAllWrapper =
        document.querySelector(
            ".history-view-all-wrapper"
        );


    if (loading) {

        loading.hidden =
            true;
    }


    if (search) {

        search.hidden =
            false;
    }


    if (tableWrapper) {

        tableWrapper.hidden =
            false;
    }


    if (mobileTransactions) {

        mobileTransactions.hidden =
            false;
    }


    if (historyViewAllWrapper) {

        historyViewAllWrapper.hidden =
            false;
    }
}


// =====================================================
// LOADING DA PESQUISA
// =====================================================

function hideSearchLoading() {

    clearTimeout(
        searchLoadingTimeout
    );


    const loading =
        getElement(
            "searchLoading"
        );


    if (loading) {

        loading.hidden =
            true;
    }
}


// =====================================================
// UTILITÁRIOS
// =====================================================

function escapeHtml(
    value = ""
) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value;


    return element.innerHTML;
}


function normalizeText(value) {

    return String(
        value
    )
        .normalize(
            "NFD"
        )
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
        String(
            value
        );


    const match =
        text.match(
            /^\d{4}-\d{2}-\d{2}/
        );


    if (match) {

        return match[0];
    }


    const date =
        new Date(
            value
        );


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


    return (
        `${year}-${month}-${day}`
    );
}


function formatDate(
    dateValue
) {

    const normalized =
        normalizeDate(
            dateValue
        );


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
        String(
            value
        )
            .trim()
            .replace(
                /\s/g,
                ""
            );


    if (
        text.includes(",") &&
        text.includes(".")
    ) {

        text =
            text
                .replace(
                    /\./g,
                    ""
                )
                .replace(
                    ",",
                    "."
                );

    } else {

        text =
            text.replace(
                ",",
                "."
            );
    }


    return Number(
        text
    );
}


// =====================================================
// INPUT DE DINHEIRO
// =====================================================

function setupMoneyInput() {

    const amountInput =
        getElement(
            "amount"
        );


    if (!amountInput) {
        return;
    }


    amountInput.addEventListener(
        "input",
        event => {

            let value =
                event.target.value
                    .replace(
                        /\D/g,
                        ""
                    );


            if (!value) {

                event.target.value =
                    "";

                return;
            }


            const amount =
                Number(
                    value
                ) / 100;


            event.target.value =
                amount.toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits:
                            2,

                        maximumFractionDigits:
                            2
                    }
                );
        }
    );
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
            name
                .split(
                    " "
                )[0];


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
                    .charAt(
                        0
                    )
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
            Array.isArray(
                categories
            )
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
        appData.categories.length ===
        0
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
            .map(
                category => {

                    return `
                        <option value="${category.id}">
                            ${escapeHtml(
                                category.nome
                            )}
                        </option>
                    `;
                }
            )
            .join(
                ""
            );


    if (categorySelect) {

        categorySelect.innerHTML =
            options;
    }


    if (categoryFilter) {

        const currentValue =
            categoryFilter.value;


        categoryFilter.innerHTML = `
            <option value="all">
                Todas
            </option>

            ${options}
        `;


        const exists =
            [...categoryFilter.options]
                .some(
                    option =>
                        option.value ===
                        currentValue
                );


        if (exists) {

            categoryFilter.value =
                currentValue;
        }
    }
}


// =====================================================
// MODAL NOVA CATEGORIA
// =====================================================

function openCategoryModal() {

    const modal =
        getElement(
            "categoryModal"
        );


    const form =
        getElement(
            "categoryForm"
        );


    if (
        !modal ||
        !form
    ) {

        return;
    }


    form.reset();


    const colorInput =
        getElement(
            "newCategoryColor"
        );


    if (colorInput) {

        colorInput.value =
            "#168a52";
    }


    modal.showModal();


    window.setTimeout(
        () => {

            getElement(
                "newCategoryName"
            )?.focus();

        },
        100
    );
}


// =====================================================
// SALVAR CATEGORIA
// =====================================================

async function saveCategory(
    event
) {

    event.preventDefault();


    const name =
        getElement(
            "newCategoryName"
        )?.value.trim();


    const color =
        getElement(
            "newCategoryColor"
        )?.value ||
        "#168a52";


    if (!name) {

        showToast(
            "Informe o nome da categoria."
        );

        return;
    }


    const duplicate =
        appData.categories.some(
            category =>

                String(
                    category.nome
                )
                    .trim()
                    .toLowerCase() ===
                name.toLowerCase()
        );


    if (duplicate) {

        showToast(
            "Essa categoria já existe."
        );

        return;
    }


    const form =
        getElement(
            "categoryForm"
        );


    const submitButton =
        form?.querySelector(
            'button[type="submit"]'
        );


    try {

        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Adicionando...";
        }


        const resultado =
            await apiRequest(
                "/categorias",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({
                            nome:
                                name,

                            cor:
                                color
                        })
                }
            );


        getElement(
            "categoryModal"
        )?.close();


        await loadCategories();


        const createdCategory =
            appData.categories.find(
                category =>

                    String(
                        category.nome
                    )
                        .trim()
                        .toLowerCase() ===
                    name.toLowerCase()
            );


        if (createdCategory) {

            const categorySelect =
                getElement(
                    "category"
                );


            if (categorySelect) {

                categorySelect.value =
                    String(
                        createdCategory.id
                    );
            }
        }


        showToast(
            resultado?.message ||
            "Categoria adicionada com sucesso."
        );


    } catch (error) {

        console.error(
            "Erro ao criar categoria:",
            error
        );


        showToast(
            error.message ||
            "Erro ao criar categoria."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Adicionar categoria";
        }
    }
}


// =====================================================
// MOVIMENTAÇÕES
// =====================================================

async function loadTransactions() {

    const transactions =
        await apiRequest(
            "/movimentacoes"
        );


    if (
        !Array.isArray(
            transactions
        )
    ) {

        appData.transactions =
            [];

        return;
    }


    appData.transactions =
        transactions.map(
            item => {

                return {

                    id:
                        Number(
                            item.id
                        ),

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
                        (
                            String(
                                item.observacao ||
                                ""
                            ).startsWith(
                                "SALDO_TRANSPORTADO:"
                            )
                                ? "Saldo anterior"
                                : "Sem categoria"
                        ),

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
            }
        );
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
        new Date()
            .getFullYear()
    );


    const sortedYears =
        [...years]
            .sort(
                (
                    first,
                    second
                ) =>
                    second -
                    first
            );


    const currentValue =
        yearFilter.value;


    yearFilter.innerHTML = `
        <option value="all">
            Todos
        </option>

        ${sortedYears
            .map(
                year => `
                    <option value="${year}">
                        ${year}
                    </option>
                `
            )
            .join("")}
    `;


    const optionExists =
        [...yearFilter.options]
            .some(
                option =>
                    option.value ===
                    currentValue
            );


    if (optionExists) {

        yearFilter.value =
            currentValue;
    }
}


// =====================================================
// FILTRAR
// =====================================================

function getFilteredTransactions() {

    const search =
        normalizeText(
            getElement(
                "searchInput"
            )?.value.trim() ||
            ""
        );


    const type =
        getElement(
            "typeFilter"
        )?.value ||
        "all";


    const status =
        getElement(
            "statusFilter"
        )?.value ||
        "all";


    const category =
        getElement(
            "categoryFilter"
        )?.value ||
        "all";


    const month =
        getElement(
            "monthFilter"
        )?.value ||
        "all";


    const year =
        getElement(
            "yearFilter"
        )?.value ||
        "all";


    const order =
        getElement(
            "orderFilter"
        )?.value ||
        "newest";


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
                    String(
                        category
                    );


                const matchesMonth =
                    month === "all" ||
                    (
                        date &&
                        date.getMonth() ===
                        Number(
                            month
                        )
                    );


                const matchesYear =
                    year === "all" ||
                    (
                        date &&
                        date.getFullYear() ===
                        Number(
                            year
                        )
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
        .filter(
            filter
        )
        .reduce(
            (
                total,
                transaction
            ) =>

                total +
                Number(
                    transaction.amount
                ),
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


    const saved =
        sumTransactions(
            transactions,
            transaction =>
                transaction.type ===
                    "saved" &&
                transaction.status ===
                    "paid"
        );


    const pending =
        sumTransactions(
            transactions,
            transaction =>
                (
                    transaction.type ===
                        "expense" ||
                    transaction.type ===
                        "saved"
                ) &&
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


    const savedCount =
        transactions.filter(
            transaction =>
                transaction.type ===
                    "saved" &&
                transaction.status ===
                    "paid"
        ).length;


    const pendingCount =
        transactions.filter(
            transaction =>
                (
                    transaction.type ===
                        "expense" ||
                    transaction.type ===
                        "saved"
                ) &&
                transaction.status ===
                    "pending"
        ).length;


    const balance =
        income -
        expense -
        saved;


    const summaryIncome =
        getElement(
            "summaryIncome"
        );


    const summaryExpense =
        getElement(
            "summaryExpense"
        );


    const summarySaved =
        getElement(
            "summarySaved"
        );


    const summaryPending =
        getElement(
            "summaryPending"
        );


    const summaryBalance =
        getElement(
            "summaryBalance"
        );


    if (summaryIncome) {

        summaryIncome.textContent =
            currency.format(
                income
            );
    }


    if (summaryExpense) {

        summaryExpense.textContent =
            currency.format(
                expense
            );
    }


    if (summarySaved) {

        summarySaved.textContent =
            currency.format(
                saved
            );
    }


    if (summaryPending) {

        summaryPending.textContent =
            currency.format(
                pending
            );
    }


    if (summaryBalance) {

        summaryBalance.textContent =
            currency.format(
                balance
            );


        summaryBalance.classList.toggle(
            "expense-text",
            balance < 0
        );


        summaryBalance.classList.toggle(
            "income-text",
            balance >= 0
        );
    }


    const incomeCountElement =
        getElement(
            "summaryIncomeCount"
        );


    const expenseCountElement =
        getElement(
            "summaryExpenseCount"
        );


    const savedCountElement =
        getElement(
            "summarySavedCount"
        );


    const pendingCountElement =
        getElement(
            "summaryPendingCount"
        );


    if (incomeCountElement) {

        incomeCountElement.textContent =
            `${incomeCount} recebimento${
                incomeCount === 1
                    ? ""
                    : "s"
            }`;
    }


    if (expenseCountElement) {

        expenseCountElement.textContent =
            `${expenseCount} pagamento${
                expenseCount === 1
                    ? ""
                    : "s"
            }`;
    }


    if (savedCountElement) {

        savedCountElement.textContent =
            savedCount === 1
                ? "1 valor guardado"
                : `${savedCount} valores guardados`;
    }


    if (pendingCountElement) {

        pendingCountElement.textContent =
            `${pendingCount} pendência${
                pendingCount === 1
                    ? ""
                    : "s"
            }`;
    }
}


// =====================================================
// SALDO ANTERIOR
// =====================================================

async function ensurePreviousMonthBalance() {

    const monthFilter =
        getElement(
            "monthFilter"
        );


    const yearFilter =
        getElement(
            "yearFilter"
        );


    if (
        !monthFilter ||
        !yearFilter ||
        monthFilter.value === "all" ||
        yearFilter.value === "all"
    ) {

        return;
    }


    const monthValue =
        monthFilter.value;


    const yearValue =
        yearFilter.value;


    const mes =
        Number(
            monthValue
        ) + 1;


    const ano =
        Number(
            yearValue
        );


    await apiRequest(
        `/dashboard/resumo?mes=${mes}&ano=${ano}`
    );


    await loadTransactions();


    renderYearOptions();


    monthFilter.value =
        monthValue;


    yearFilter.value =
        yearValue;
}


// =====================================================
// TIPO
// =====================================================

function getTransactionTypeInfo(
    type
) {

    if (
        type === "income"
    ) {

        return {
            className:
                "income",

            icon:
                "↗",

            signal:
                "+",

            label:
                "Entrada"
        };
    }


    if (
        type === "saved"
    ) {

        return {
            className:
                "saved",

            icon:
                "◆",

            signal:
                "",

            label:
                "Guardado"
        };
    }


    return {
        className:
            "expense",

        icon:
            "↘",

        signal:
            "−",

        label:
            "Despesa"
    };
}


// =====================================================
// STATUS
// =====================================================

function getTransactionStatusLabel(
    transaction
) {

    if (
        transaction.status ===
        "pending"
    ) {

        return "Pendente";
    }


    if (
        transaction.type ===
        "income"
    ) {

        return "Recebido";
    }


    if (
        transaction.type ===
        "saved"
    ) {

        return "Guardado";
    }


    return "Pago";
}


// =====================================================
// TABELA
// =====================================================

function createTableRow(
    transaction
) {

    const typeInfo =
        getTransactionTypeInfo(
            transaction.type
        );


    const statusLabel =
        getTransactionStatusLabel(
            transaction
        );


    return `
        <tr>

            <td>

                <div class="transaction-name">

                    <div
                        class="transaction-icon ${typeInfo.className}"
                    >
                        ${typeInfo.icon}
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
                    ${statusLabel}
                </span>

            </td>


            <td>

                <span
                    class="amount ${typeInfo.className}"
                >

                    ${typeInfo.signal}

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
// MOBILE
// =====================================================

function createMobileCard(
    transaction
) {

    const typeInfo =
        getTransactionTypeInfo(
            transaction.type
        );


    const statusLabel =
        getTransactionStatusLabel(
            transaction
        );


    return `
        <article class="mobile-transaction-card">

            <div class="mobile-transaction-top">

                <div class="mobile-transaction-main">

                    <div
                        class="transaction-icon ${typeInfo.className}"
                    >
                        ${typeInfo.icon}
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
                    class="amount ${typeInfo.className}"
                >

                    ${typeInfo.signal}

                    ${currency.format(
                        transaction.amount
                    )}

                </span>

            </div>


            <div class="mobile-transaction-bottom">

                <span
                    class="status-badge ${transaction.status}"
                >
                    ${statusLabel}
                </span>


                <div class="mobile-actions">

                    <button
                        type="button"
                        class="action-button edit-button"
                        data-id="${transaction.id}"
                        aria-label="Editar movimentação"
                    >
                        ✎
                    </button>


                    <button
                        type="button"
                        class="action-button delete delete-button"
                        data-id="${transaction.id}"
                        aria-label="Excluir movimentação"
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


    const resultsText =
        getElement(
            "resultsText"
        );


    if (resultsText) {

        resultsText.textContent =
            total === 1
                ? "1 movimentação encontrada"
                : `${total} movimentações encontradas`;
    }


    const visibleTransactions =
        showAllTransactions
            ? transactions
            : transactions.slice(
                0,
                INITIAL_TRANSACTION_LIMIT
            );


    const historyContent =
        getElement(
            "historyContent"
        );


    if (historyContent) {

        historyContent.classList.toggle(
            "show-all",
            showAllTransactions
        );
    }


    const emptyState =
        getElement(
            "emptyState"
        );


    if (emptyState) {

        emptyState.hidden =
            total > 0;
    }


    const transactionsBody =
        getElement(
            "transactionsBody"
        );


    if (transactionsBody) {

        transactionsBody.innerHTML =
            visibleTransactions
                .map(
                    createTableRow
                )
                .join(
                    ""
                );
    }


    const mobileTransactions =
        getElement(
            "mobileTransactions"
        );


    if (mobileTransactions) {

        mobileTransactions.innerHTML =
            visibleTransactions
                .map(
                    createMobileCard
                )
                .join(
                    ""
                );
    }


    const historyViewAll =
        getElement(
            "historyViewAll"
        );


    if (historyViewAll) {

        historyViewAll.hidden =
            total <=
            INITIAL_TRANSACTION_LIMIT;


        if (
            total >
            INITIAL_TRANSACTION_LIMIT
        ) {

            historyViewAll.textContent =
                showAllTransactions
                    ? "Mostrar apenas as 4 mais recentes"
                    : `Ver todas as ${total} movimentações`;
        }
    }


    setupRowActions();
}


// =====================================================
// ATUALIZAR
// =====================================================

async function refreshTransactions() {

    showHistoryLoading();


    try {

        await loadTransactions();


        renderYearOptions();


        renderTransactions();


        updateFilterIndicator();


    } catch (error) {

        console.error(
            "Erro ao atualizar movimentações:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar movimentações."
        );


    } finally {

        hideHistoryLoading();
    }
}


// =====================================================
// AÇÕES DAS LINHAS
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


    if (!form) {
        return;
    }


    form.reset();


    getElement(
        "transactionId"
    ).value =
        "";


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


const paymentSelect =
    getElement(
        "payment"
    );


if (paymentSelect) {

    const paymentExists =
        [...paymentSelect.options]
            .some(
                option =>
                    option.value ===
                    defaultPaymentMethod
            );


    if (paymentExists) {

        paymentSelect.value =
            defaultPaymentMethod;

    } else {

        paymentSelect.value =
            "Pix";
    }
}


    const category =
        getElement(
            "category"
        );


    if (
        category &&
        category.options.length >
        0
    ) {

        category.selectedIndex =
            0;
    }


    const dateInput =
        getElement(
            "date"
        );


    if (dateInput) {

        dateInput.value =
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );
    }


    getElement(
        "transactionModal"
    )?.showModal();


    setTimeout(
        () => {

            getElement(
                "description"
            )?.focus();

        },
        100
    );
}


// =====================================================
// EDITAR
// =====================================================

function openEditModal(id) {

    const transaction =
        appData.transactions.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    id
                )
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
        Number(
            transaction.amount
        ).toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
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
    )?.showModal();
}


// =====================================================
// SALVAR
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


        let resultado;


        if (id) {

            resultado =
                await apiRequest(
                    `/movimentacoes/${id}`,
                    {
                        method:
                            "PUT",

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
                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                body
                            )
                    }
                );
        }


        getElement(
            "transactionModal"
        )?.close();


        form.reset();


        showAllTransactions =
            false;


        showToast(
            resultado?.message ||
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
// EXCLUSÃO
// =====================================================

async function openDeleteModal(id) {

    const numericId =
        Number(
            id
        );


    if (!numericId) {
        return;
    }


    transactionToDelete =
        numericId;


    // =================================================
    // COM CONFIRMAÇÃO
    // =================================================

    if (
        confirmBeforeDelete
    ) {

        getElement(
            "deleteModal"
        )?.showModal();


        return;
    }


    // =================================================
    // SEM CONFIRMAÇÃO
    // =================================================

    await deleteTransaction();
}


async function deleteTransaction() {

    if (!transactionToDelete) {
        return;
    }


    const button =
        getElement(
            "confirmDelete"
        );


    try {

        // =================================================
        // LOADING DO BOTÃO
        // =================================================

        if (button) {

            button.disabled =
                true;


            button.textContent =
                "Excluindo...";
        }


        // =================================================
        // EXCLUIR NA API
        // =================================================

        const resultado =
            await apiRequest(
                `/movimentacoes/${transactionToDelete}`,
                {
                    method:
                        "DELETE"
                }
            );


        // =================================================
        // LIMPAR ID
        // =================================================

        transactionToDelete =
            null;


        // =================================================
        // FECHAR MODAL SOMENTE SE ESTIVER ABERTO
        // =================================================

        const modal =
            getElement(
                "deleteModal"
            );


        if (
            modal?.open
        ) {

            modal.close();
        }


        // =================================================
        // VOLTAR PARA AS 4 MAIS RECENTES
        // =================================================

        showAllTransactions =
            false;


        // =================================================
        // MENSAGEM
        // =================================================

        showToast(
            resultado?.message ||
            "Movimentação excluída."
        );


        // =================================================
        // RECARREGAR
        // =================================================

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

        // =================================================
        // RESTAURAR BOTÃO
        // =================================================

        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Excluir";
        }
    }
}


async function deleteTransaction() {

    if (!transactionToDelete) {
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
        )?.close();


        showAllTransactions =
            false;


        showToast(
            resultado?.message ||
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
// FILTROS ATIVOS
// =====================================================

function hasActiveFilters() {

    const type =
        getElement(
            "typeFilter"
        )?.value ||
        "all";


    const status =
        getElement(
            "statusFilter"
        )?.value ||
        "all";


    const category =
        getElement(
            "categoryFilter"
        )?.value ||
        "all";


    const month =
        getElement(
            "monthFilter"
        )?.value ||
        "all";


    const year =
        getElement(
            "yearFilter"
        )?.value ||
        "all";


    const order =
        getElement(
            "orderFilter"
        )?.value ||
        "newest";


    return (
        type !== "all" ||
        status !== "all" ||
        category !== "all" ||
        month !== "all" ||
        year !== "all" ||
        order !== "newest"
    );
}


// =====================================================
// BOLINHA DO FILTRO
// =====================================================

function updateFilterIndicator() {

    const dot =
        getElement(
            "filterActiveDot"
        );


    if (!dot) {
        return;
    }


    dot.hidden =
        !hasActiveFilters();
}


// =====================================================
// MODAL FILTROS
// =====================================================

function openFiltersModal() {

    const modal =
        getElement(
            "filtersModal"
        );


    if (!modal) {
        return;
    }


    modal.showModal();
}


// =====================================================
// APLICAR FILTROS
// =====================================================

async function applyFilters() {

    const modal =
        getElement(
            "filtersModal"
        );


    const button =
        getElement(
            "applyFilters"
        );


    const monthFilter =
        getElement(
            "monthFilter"
        );


    const yearFilter =
        getElement(
            "yearFilter"
        );


    showAllTransactions =
        false;


    try {

        if (button) {

            button.disabled =
                true;


            button.textContent =
                "Aplicando...";
        }


        // Apenas chama o saldo transportado
        // se mês E ano forem específicos.

        if (
            monthFilter?.value !== "all" &&
            yearFilter?.value !== "all"
        ) {

            await ensurePreviousMonthBalance();
        }


        renderTransactions();


        updateFilterIndicator();


        if (
            modal?.open
        ) {

            modal.close();
        }


    } catch (error) {

        console.error(
            "Erro ao aplicar filtros:",
            error
        );


        showToast(
            error.message ||
            "Erro ao aplicar filtros."
        );


    } finally {

        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Aplicar filtros";
        }
    }
}


// =====================================================
// LIMPAR FILTROS
// =====================================================

function clearFilters() {

    showAllTransactions =
        false;


    hideSearchLoading();


    const searchInput =
        getElement(
            "searchInput"
        );


    const typeFilter =
        getElement(
            "typeFilter"
        );


    const statusFilter =
        getElement(
            "statusFilter"
        );


    const categoryFilter =
        getElement(
            "categoryFilter"
        );


    const monthFilter =
        getElement(
            "monthFilter"
        );


    const yearFilter =
        getElement(
            "yearFilter"
        );


    const orderFilter =
        getElement(
            "orderFilter"
        );


    if (searchInput) {

        searchInput.value =
            "";
    }


    if (typeFilter) {

        typeFilter.value =
            "all";
    }


    if (statusFilter) {

        statusFilter.value =
            "all";
    }


    if (categoryFilter) {

        categoryFilter.value =
            "all";
    }


    if (monthFilter) {

        monthFilter.value =
            "all";
    }


    if (yearFilter) {

        yearFilter.value =
            "all";
    }


    if (orderFilter) {

        orderFilter.value =
            "newest";
    }


    renderTransactions();


    updateFilterIndicator();


    const modal =
        getElement(
            "filtersModal"
        );


    if (
        modal?.open
    ) {

        modal.close();
    }


    showToast(
        "Filtros removidos."
    );
}


// =====================================================
// PESQUISA
// =====================================================

function setupFilters() {

    const searchInput =
        getElement(
            "searchInput"
        );


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        () => {

            const loading =
                getElement(
                    "searchLoading"
                );


            showAllTransactions =
                false;


            clearTimeout(
                searchLoadingTimeout
            );


            if (loading) {

                loading.hidden =
                    false;
            }


            searchLoadingTimeout =
                setTimeout(
                    () => {

                        try {

                            renderTransactions();

                        } catch (error) {

                            console.error(
                                "Erro ao pesquisar movimentações:",
                                error
                            );

                        } finally {

                            if (loading) {

                                loading.hidden =
                                    true;
                            }
                        }

                    },
                    300
                );
        }
    );
}


// =====================================================
// EXPORTAR CSV
// =====================================================

function exportCsv() {

    const transactions =
        getFilteredTransactions();


    if (
        transactions.length ===
        0
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
            transaction => [

                transaction.description,

                transaction.type ===
                    "income"
                    ? "Entrada"
                    : transaction.type ===
                        "saved"
                        ? "Guardado"
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
                    .toFixed(
                        2
                    )
                    .replace(
                        ".",
                        ","
                    )
            ]
        );


    const csv =
        [
            header,
            ...rows
        ]
            .map(
                row =>

                    row
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
                        .join(
                            ";"
                        )
            )
            .join(
                "\n"
            );


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


    link.href =
        url;


    link.download =
        "movimentacoes-conecta-financas.csv";


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
        savedTheme ===
        "dark"
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
// HISTÓRICO ACCORDION
// =====================================================

function toggleHistorySection() {

    const header =
        getElement(
            "toggleHistory"
        );


    const content =
        getElement(
            "historyContent"
        );


    if (
        !header ||
        !content
    ) {

        return;
    }


    const isOpen =
        !content.hidden;


    content.hidden =
        isOpen;


    header.classList.toggle(
        "active",
        !isOpen
    );


    header.setAttribute(
        "aria-expanded",
        String(
            !isOpen
        )
    );
}


// =====================================================
// MOBILE
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

    setupMoneyInput();


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


    const openCategoryButton =
        getElement(
            "openCategoryModal"
        );


    const categoryForm =
        getElement(
            "categoryForm"
        );


    const confirmDelete =
        getElement(
            "confirmDelete"
        );


    const openFiltersButton =
        getElement(
            "openFiltersModal"
        );


    const applyFiltersButton =
        getElement(
            "applyFilters"
        );


    const clearFiltersButton =
        getElement(
            "clearFilters"
        );


    const toggleHistory =
        getElement(
            "toggleHistory"
        );


    const historyViewAll =
        getElement(
            "historyViewAll"
        );


    const exportButton =
        getElement(
            "exportButton"
        );


    const logoutButton =
        getElement(
            "logoutButton"
        );


    // NOVA MOVIMENTAÇÃO

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


    // CATEGORIA

    if (openCategoryButton) {

        openCategoryButton.addEventListener(
            "click",
            openCategoryModal
        );
    }


    if (categoryForm) {

        categoryForm.addEventListener(
            "submit",
            saveCategory
        );
    }


    // EXCLUIR

    if (confirmDelete) {

        confirmDelete.addEventListener(
            "click",
            deleteTransaction
        );
    }


    // ABRIR FILTROS

    if (openFiltersButton) {

        openFiltersButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                openFiltersModal();
            }
        );
    }


    // APLICAR FILTROS

    if (applyFiltersButton) {

        applyFiltersButton.addEventListener(
            "click",
            applyFilters
        );
    }


    // LIMPAR FILTROS

    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(
            "click",
            clearFilters
        );
    }


    // HISTÓRICO ACCORDION

    if (toggleHistory) {

        toggleHistory.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "#exportButton"
                    ) ||
                    event.target.closest(
                        "#openFiltersModal"
                    )
                ) {

                    return;
                }


                toggleHistorySection();
            }
        );


        toggleHistory.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                        "Enter" ||
                    event.key ===
                        " "
                ) {

                    event.preventDefault();


                    toggleHistorySection();
                }
            }
        );
    }


    // VER TODAS

    if (historyViewAll) {

        historyViewAll.addEventListener(
            "click",
            () => {

                showAllTransactions =
                    !showAllTransactions;


                renderTransactions();


                if (
                    !showAllTransactions
                ) {

                    getElement(
                        "toggleHistory"
                    )?.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "start"
                    });
                }
            }
        );
    }


    // EXPORTAR

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                exportCsv();
            }
        );
    }


    // LOGOUT

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

    if (
        !getSession()
    ) {

        return;
    }


    hideSearchLoading();

    showHistoryLoading();


    setupFilters();

    setupProfileMenu();

    setupTheme();

    setupMobileMenu();

    setupModalClosing();

    setupEvents();


    try {

        await Promise.all([
            renderUser(),
            loadCategories(),
            loadFinancialSettings()
        ]);


        await refreshTransactions();


        updateFilterIndicator();


    } catch (error) {

        console.error(
            "Erro ao inicializar página:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar movimentações."
        );


    } finally {

        hideHistoryLoading();
    }
}


initializePage();