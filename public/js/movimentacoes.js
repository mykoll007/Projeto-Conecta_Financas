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
// FORMATADOR
// =====================================================

const currency =
    new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );


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
// CONTROLE DO HISTÓRICO
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
        getElement("historyLoading");

    const resultsText =
        getElement("resultsText");

    const search =
        document.querySelector(
            ".transactions-search"
        );

    const tableWrapper =
        document.querySelector(
            ".table-wrapper"
        );

    const mobileTransactions =
        getElement("mobileTransactions");

    const emptyState =
        getElement("emptyState");

    const historyViewAllWrapper =
        document.querySelector(
            ".history-view-all-wrapper"
        );


    // TEXTO DO CABEÇALHO
    if (resultsText) {

        resultsText.textContent =
            "Carregando movimentações...";
    }


    // MOSTRA SOMENTE O LOADING
    if (loading) {

        loading.hidden =
            false;
    }


    // ESCONDE PESQUISA
    if (search) {

        search.hidden =
            true;
    }


    // ESCONDE TABELA DESKTOP
    if (tableWrapper) {

        tableWrapper.hidden =
            true;
    }


    // ESCONDE CARDS MOBILE
    if (mobileTransactions) {

        mobileTransactions.hidden =
            true;
    }


    // ESCONDE ESTADO VAZIO
    if (emptyState) {

        emptyState.hidden =
            true;
    }


    // ESCONDE VER TODAS
    if (historyViewAllWrapper) {

        historyViewAllWrapper.hidden =
            true;
    }
}


// =====================================================
// FINALIZAR LOADING DO HISTÓRICO
// =====================================================

function hideHistoryLoading() {

    const loading =
        getElement("historyLoading");

    const search =
        document.querySelector(
            ".transactions-search"
        );

    const tableWrapper =
        document.querySelector(
            ".table-wrapper"
        );

    const mobileTransactions =
        getElement("mobileTransactions");

    const historyViewAllWrapper =
        document.querySelector(
            ".history-view-all-wrapper"
        );


    // ESCONDE LOADING
    if (loading) {

        loading.hidden =
            true;
    }


    // MOSTRA PESQUISA
    if (search) {

        search.hidden =
            false;
    }


    // MOSTRA TABELA
    if (tableWrapper) {

        tableWrapper.hidden =
            false;
    }


    // MOSTRA CARDS MOBILE
    if (mobileTransactions) {

        mobileTransactions.hidden =
            false;
    }


    // MOSTRA ÁREA DO VER TODAS
    if (historyViewAllWrapper) {

        historyViewAllWrapper.hidden =
            false;
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


        if (
            profileName
        ) {

            profileName.textContent =
                firstName;
        }


        if (
            profileAvatar
        ) {

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

        if (
            categorySelect
        ) {

            categorySelect.innerHTML = `
                <option value="">
                    Nenhuma categoria
                </option>
            `;
        }


        if (
            categoryFilter
        ) {

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


    if (
        categorySelect
    ) {

        categorySelect.innerHTML =
            options;
    }


    if (
        categoryFilter
    ) {

        categoryFilter.innerHTML = `
            <option value="all">
                Todas
            </option>

            ${options}
        `;
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


    if (
        colorInput
    ) {

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
// SALVAR NOVA CATEGORIA
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
            category => {

                return (
                    String(
                        category.nome
                    )
                        .trim()
                        .toLowerCase() ===
                    name.toLowerCase()
                );
            }
        );


    if (
        duplicate
    ) {

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

        if (
            submitButton
        ) {

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
                category => {

                    return (
                        String(
                            category.nome
                        )
                            .trim()
                            .toLowerCase() ===
                        name.toLowerCase()
                    );
                }
            );


        if (
            createdCategory
        ) {

            const categorySelect =
                getElement(
                    "category"
                );


            if (
                categorySelect
            ) {

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

        if (
            submitButton
        ) {

            submitButton.disabled =
                false;


            submitButton.textContent =
                "Adicionar categoria";
        }
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
                }
            );


    } catch (error) {

        console.error(
            "Erro ao carregar movimentações:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar movimentações."
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


    if (
        !yearFilter
    ) {
        return;
    }


    const years =
        new Set();


    appData.transactions.forEach(
        transaction => {

            if (
                !transaction.date
            ) {
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
                year => {

                    return `
                        <option value="${year}">
                            ${year}
                        </option>
                    `;
                }
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


    if (
        optionExists
    ) {

        yearFilter.value =
            currentValue;
    }
}


// =====================================================
// FILTRAR MOVIMENTAÇÕES
// =====================================================

function getFilteredTransactions() {

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


    const search =
        normalizeText(
            searchInput?.value.trim() ||
            ""
        );


    const type =
        typeFilter?.value ||
        "all";


    const status =
        statusFilter?.value ||
        "all";


    const category =
        categoryFilter?.value ||
        "all";


    const month =
        monthFilter?.value ||
        "all";


    const year =
        yearFilter?.value ||
        "all";


    const order =
        orderFilter?.value ||
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


    // =====================================================
    // SALDO
    // =====================================================

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


    const summaryIncomeCount =
        getElement(
            "summaryIncomeCount"
        );


    const summaryExpenseCount =
        getElement(
            "summaryExpenseCount"
        );


    const summarySavedCount =
        getElement(
            "summarySavedCount"
        );


    const summaryPendingCount =
        getElement(
            "summaryPendingCount"
        );


    if (
        summaryIncome
    ) {

        summaryIncome.textContent =
            currency.format(
                income
            );
    }


    if (
        summaryExpense
    ) {

        summaryExpense.textContent =
            currency.format(
                expense
            );
    }


    if (
        summarySaved
    ) {

        summarySaved.textContent =
            currency.format(
                saved
            );
    }


    if (
        summaryPending
    ) {

        summaryPending.textContent =
            currency.format(
                pending
            );
    }


    if (
        summaryBalance
    ) {

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


    if (
        summaryIncomeCount
    ) {

        summaryIncomeCount.textContent =
            `${incomeCount} recebimento${
                incomeCount === 1
                    ? ""
                    : "s"
            }`;
    }


    if (
        summaryExpenseCount
    ) {

        summaryExpenseCount.textContent =
            `${expenseCount} pagamento${
                expenseCount === 1
                    ? ""
                    : "s"
            }`;
    }


    if (
        summarySavedCount
    ) {

        summarySavedCount.textContent =
            `${savedCount} valor${
                savedCount === 1
                    ? ""
                    : "es"
            } guardado${
                savedCount === 1
                    ? ""
                    : "s"
            }`;
    }


    if (
        summaryPendingCount
    ) {

        summaryPendingCount.textContent =
            `${pendingCount} pendência${
                pendingCount === 1
                    ? ""
                    : "s"
            }`;
    }
}


// =====================================================
// GERAR SALDO DO MÊS ANTERIOR
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
        !yearFilter
    ) {

        return;
    }


    const monthValue =
        monthFilter.value;


    if (
        monthValue === "all"
    ) {

        return;
    }


    let yearValue =
        yearFilter.value;


    if (
        yearValue === "all"
    ) {

        const currentYear =
            new Date()
                .getFullYear();


        const optionExists =
            [...yearFilter.options]
                .some(
                    option =>
                        Number(
                            option.value
                        ) ===
                        currentYear
                );


        if (
            optionExists
        ) {

            yearFilter.value =
                String(
                    currentYear
                );


            yearValue =
                yearFilter.value;
        }
    }


    if (
        yearValue === "all"
    ) {

        return;
    }


    const mes =
        Number(
            monthValue
        ) + 1;


    const ano =
        Number(
            yearValue
        );


    try {

        await apiRequest(
            `/dashboard/resumo?mes=${mes}&ano=${ano}`
        );


        await loadTransactions();


        renderYearOptions();


        monthFilter.value =
            monthValue;


        yearFilter.value =
            String(
                ano
            );


        renderTransactions();


    } catch (error) {

        console.error(
            "Erro ao gerar saldo do mês anterior:",
            error
        );


        showToast(
            error.message ||
            "Erro ao atualizar saldo anterior."
        );
    }
}


// =====================================================
// TIPO DA MOVIMENTAÇÃO
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
// LINHA DA TABELA
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
// CARD MOBILE
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
// RENDERIZAR MOVIMENTAÇÕES
// =====================================================

function renderTransactions() {

    const transactions =
        getFilteredTransactions();


    // =====================================================
    // RESUMO USA TODOS OS RESULTADOS FILTRADOS
    // =====================================================

    renderSummary(
        transactions
    );


    // =====================================================
    // TOTAL REAL
    // =====================================================

    const total =
        transactions.length;


    const resultsText =
        getElement(
            "resultsText"
        );


    if (
        resultsText
    ) {

if (resultsText) {

    resultsText.textContent =
        total === 1
            ? "1 movimentação encontrada"
            : `${total} movimentações encontradas`;
}
    }


    // =====================================================
    // MOSTRAR 4 OU TODAS
    // =====================================================

    const visibleTransactions =
        showAllTransactions
            ? transactions
            : transactions.slice(
                0,
                INITIAL_TRANSACTION_LIMIT
            );


    // =====================================================
    // CLASSE DO HISTÓRICO EXPANDIDO
    // =====================================================

    const historyContent =
        getElement(
            "historyContent"
        );


    if (
        historyContent
    ) {

        historyContent.classList.toggle(
            "show-all",
            showAllTransactions
        );
    }


    // =====================================================
    // EMPTY STATE
    // =====================================================

    const emptyState =
        getElement(
            "emptyState"
        );


    if (
        emptyState
    ) {

        emptyState.hidden =
            total > 0;
    }


    // =====================================================
    // TABELA DESKTOP
    // =====================================================

    const transactionsBody =
        getElement(
            "transactionsBody"
        );


    if (
        transactionsBody
    ) {

        transactionsBody.innerHTML =
            visibleTransactions
                .map(
                    createTableRow
                )
                .join(
                    ""
                );
    }


    // =====================================================
    // MOBILE
    // =====================================================

    const mobileTransactions =
        getElement(
            "mobileTransactions"
        );


    if (
        mobileTransactions
    ) {

        mobileTransactions.innerHTML =
            visibleTransactions
                .map(
                    createMobileCard
                )
                .join(
                    ""
                );
    }


    // =====================================================
    // BOTÃO VER TODAS
    // =====================================================

    const historyViewAll =
        getElement(
            "historyViewAll"
        );


    if (
        historyViewAll
    ) {

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
// CARREGAR PÁGINA
// =====================================================

async function refreshTransactions() {

    showHistoryLoading();


    try {

        await loadTransactions();


        renderYearOptions();


        renderTransactions();


    } catch (error) {

        console.error(
            "Erro ao atualizar movimentações:",
            error
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


    if (
        dateInput
    ) {

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
// EDITAR MOVIMENTAÇÃO
// =====================================================

function openEditModal(id) {

    const numericId =
        Number(
            id
        );


    const transaction =
        appData.transactions.find(
            item =>
                Number(
                    item.id
                ) ===
                numericId
        );


    if (
        !transaction
    ) {

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


    if (
        !description
    ) {

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


    if (
        !categoryId
    ) {

        showToast(
            "Selecione uma categoria."
        );

        return;
    }


    if (
        !data
    ) {

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


        if (
            id
        ) {

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


        showToast(
            resultado?.message ||
            (
                id
                    ? "Movimentação atualizada."
                    : "Movimentação adicionada."
            )
        );


        showAllTransactions =
            false;


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
        Number(
            id
        );


    getElement(
        "deleteModal"
    )?.showModal();
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
        )?.close();


        showToast(
            resultado?.message ||
            "Movimentação excluída."
        );


        showAllTransactions =
            false;


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

    showAllTransactions =
        false;


    clearTimeout(
        searchLoadingTimeout
    );


    const loading =
        getElement(
            "searchLoading"
        );


    if (
        loading
    ) {

        loading.hidden =
            true;
    }


    const searchInput =
        getElement(
            "searchInput"
        );


    if (
        searchInput
    ) {

        searchInput.value =
            "";
    }


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
            transaction => {

                return [

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
                        .join(
                            ";"
                        );
                }
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
                getElement(
                    id
                );


            if (
                !element
            ) {
                return;
            }


            element.addEventListener(

                id === "searchInput"
                    ? "input"
                    : "change",

                async () => {

                    // =================================================
                    // PESQUISA COM LOADING
                    // =================================================

                    if (
                        id === "searchInput"
                    ) {

                        const loading =
                            getElement(
                                "searchLoading"
                            );


                        showAllTransactions =
                            false;


                        // CANCELA TIMER ANTERIOR
                        clearTimeout(
                            searchLoadingTimeout
                        );


                        // MOSTRA LOADING
                        if (
                            loading
                        ) {

                            loading.hidden =
                                false;
                        }


                        // ESPERA USUÁRIO PARAR DE DIGITAR
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

                                        // SEMPRE ESCONDE O LOADING
                                        if (
                                            loading
                                        ) {

                                            loading.hidden =
                                                true;
                                        }
                                    }

                                },
                                300
                            );


                        return;
                    }


                    // =================================================
                    // OUTROS FILTROS
                    // =================================================

                    showAllTransactions =
                        false;


                    // =================================================
                    // MÊS
                    // =================================================

                    if (
                        id === "monthFilter"
                    ) {

                        try {

                            if (
                                element.value !==
                                "all"
                            ) {

                                await ensurePreviousMonthBalance();

                            } else {

                                renderTransactions();
                            }

                        } catch (error) {

                            console.error(
                                "Erro ao filtrar por mês:",
                                error
                            );


                            renderTransactions();
                        }


                        return;
                    }


                    // =================================================
                    // ANO
                    // =================================================

                    if (
                        id === "yearFilter"
                    ) {

                        const monthFilter =
                            getElement(
                                "monthFilter"
                            );


                        try {

                            if (
                                element.value !==
                                    "all" &&
                                monthFilter?.value !==
                                    "all"
                            ) {

                                await ensurePreviousMonthBalance();

                            } else {

                                renderTransactions();
                            }

                        } catch (error) {

                            console.error(
                                "Erro ao filtrar por ano:",
                                error
                            );


                            renderTransactions();
                        }


                        return;
                    }


                    // =================================================
                    // TIPO, STATUS, CATEGORIA E ORDENAÇÃO
                    // =================================================

                    renderTransactions();
                }
            );
        }
    );
}

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


    if (
        !button
    ) {

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
// ABRIR / FECHAR FILTROS
// =====================================================

function toggleFiltersSection() {

    const button =
        getElement(
            "toggleFilters"
        );


    const content =
        getElement(
            "filtersContent"
        );


    if (
        !button ||
        !content
    ) {

        return;
    }


    const isOpen =
        !content.hidden;


    content.hidden =
        isOpen;


    button.classList.toggle(
        "active",
        !isOpen
    );


    button.setAttribute(
        "aria-expanded",
        String(
            !isOpen
        )
    );
}


// =====================================================
// ABRIR / FECHAR HISTÓRICO
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


    const clearFiltersButton =
        getElement(
            "clearFilters"
        );


    const toggleFilters =
        getElement(
            "toggleFilters"
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


    // =====================================================
    // MOVIMENTAÇÃO
    // =====================================================

    if (
        openTransaction
    ) {

        openTransaction.addEventListener(
            "click",
            openNewModal
        );
    }


    if (
        headerAddButton
    ) {

        headerAddButton.addEventListener(
            "click",
            openNewModal
        );
    }


    if (
        emptyAddButton
    ) {

        emptyAddButton.addEventListener(
            "click",
            openNewModal
        );
    }


    if (
        transactionForm
    ) {

        transactionForm.addEventListener(
            "submit",
            saveTransaction
        );
    }


    // =====================================================
    // CATEGORIA
    // =====================================================

    if (
        openCategoryButton
    ) {

        openCategoryButton.addEventListener(
            "click",
            openCategoryModal
        );
    }


    if (
        categoryForm
    ) {

        categoryForm.addEventListener(
            "submit",
            saveCategory
        );
    }


    // =====================================================
    // EXCLUIR
    // =====================================================

    if (
        confirmDelete
    ) {

        confirmDelete.addEventListener(
            "click",
            deleteTransaction
        );
    }


    // =====================================================
    // LIMPAR FILTROS
    // =====================================================

    if (
        clearFiltersButton
    ) {

        clearFiltersButton.addEventListener(
            "click",
            clearFilters
        );
    }


    // =====================================================
    // ACCORDION FILTROS
    // =====================================================

    if (
        toggleFilters
    ) {

        toggleFilters.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "#clearFilters"
                    )
                ) {

                    return;
                }


                toggleFiltersSection();
            }
        );


        toggleFilters.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                        "Enter" ||
                    event.key ===
                        " "
                ) {

                    event.preventDefault();


                    toggleFiltersSection();
                }
            }
        );
    }


    // =====================================================
    // ACCORDION HISTÓRICO
    // =====================================================

    if (
        toggleHistory
    ) {

        toggleHistory.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "#exportButton"
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


    // =====================================================
    // VER TODAS
    // =====================================================

    if (
        historyViewAll
    ) {

        historyViewAll.addEventListener(
            "click",
            () => {

                showAllTransactions =
                    !showAllTransactions;


                renderTransactions();


                /*
                    Quando volta para apenas 4,
                    leva o usuário para o topo
                    do histórico.
                */

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


    // =====================================================
    // EXPORTAR
    // =====================================================

    if (
        exportButton
    ) {

        exportButton.addEventListener(
            "click",
            exportCsv
        );
    }


    // =====================================================
    // LOGOUT
    // =====================================================

    if (
        logoutButton
    ) {

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


    } finally {

        hideHistoryLoading();
    }
}


initializePage();