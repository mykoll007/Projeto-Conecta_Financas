// =====================================================
// CONFIGURAÇÕES
// =====================================================

const LOGIN_KEY = "clara-financas-login";
const TOKEN_KEY = "clara-financas-token";
const THEME_KEY = "clara-financas-tema";

const API_URL = "https://projeto-conecta-financas.vercel.app/api";


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


const categoryColors = {
    Alimentação: "#e84c3d",
    Moradia: "#3385d6",
    Transporte: "#e9a319",
    Saúde: "#8854d0",
    Lazer: "#21a366",
    Salário: "#087747",
    Educação: "#3b82f6",
    Assinaturas: "#ec4899",
    Outros: "#95a19a"
};


// =====================================================
// ESTADO DA PÁGINA
// =====================================================

const currentDate = new Date();

let selectedMonth = currentDate.getMonth();
let selectedYear = currentDate.getFullYear();


let appData = {
    budget: 0,
    transactions: [],
    categories: []
};


// =====================================================
// ELEMENTOS
// =====================================================

function getElement(id) {
    return document.getElementById(id);
}


// =====================================================
// SESSÃO
// =====================================================

function getToken() {

    return (
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY)
    );
}


function getSession() {

    const localSession =
        localStorage.getItem(LOGIN_KEY);

    const temporarySession =
        sessionStorage.getItem(LOGIN_KEY);

    const session =
        localSession ||
        temporarySession;

    const token = getToken();


    if (!session || !token) {

        clearSession();

        window.location.href =
            "login.html";

        return null;
    }


    try {

        return JSON.parse(session);

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
// REQUISIÇÕES PARA API
// =====================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    const token = getToken();


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


    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }


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

        window.location.href =
            "login.html";

        throw new Error(
            "Sua sessão expirou. Entre novamente."
        );
    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            "Erro ao comunicar com o servidor."
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

    element.textContent =
        value;

    return element.innerHTML;
}


function normalizeDate(dateValue) {

    if (!dateValue) {
        return "";
    }


    const text =
        String(dateValue);


    const match =
        text.match(
            /^\d{4}-\d{2}-\d{2}/
        );


    if (match) {
        return match[0];
    }


    const date =
        new Date(dateValue);


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
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


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
// CARREGAR USUÁRIO
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


        const initial =
            firstName
                .charAt(0)
                .toUpperCase();


        const profileName =
            getElement(
                "profileName"
            );


        const welcomeName =
            getElement(
                "welcomeName"
            );


        const profileAvatar =
            getElement(
                "profileAvatar"
            );


        if (profileName) {
            profileName.textContent =
                firstName;
        }


        if (welcomeName) {
            welcomeName.textContent =
                firstName;
        }


        if (profileAvatar) {
            profileAvatar.textContent =
                initial;
        }


        updateLocalSession(
            usuario
        );


    } catch (error) {

        console.error(
            "Erro ao carregar usuário:",
            error
        );
    }
}


function updateLocalSession(
    usuario
) {

    const currentSession =
        getSession();


    if (!currentSession) {
        return;
    }


    const newSession = {
        ...currentSession,

        id:
            usuario.id,

        name:
            usuario.nome,

        email:
            usuario.email,

        telefone:
            usuario.telefone ||
            null,

        profissao:
            usuario.profissao ||
            null
    };


    if (
        localStorage.getItem(
            LOGIN_KEY
        )
    ) {

        localStorage.setItem(
            LOGIN_KEY,
            JSON.stringify(
                newSession
            )
        );

    } else {

        sessionStorage.setItem(
            LOGIN_KEY,
            JSON.stringify(
                newSession
            )
        );
    }
}


// =====================================================
// CARREGAR CATEGORIAS
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


        renderCategorySelect();


    } catch (error) {

        console.error(
            "Erro ao carregar categorias:",
            error
        );

        showToast(
            "Não foi possível carregar as categorias."
        );
    }
}


function renderCategorySelect() {

    const select =
        getElement("category");


    if (!select) {
        return;
    }


    if (
        appData.categories.length === 0
    ) {

        select.innerHTML = `
            <option value="">
                Nenhuma categoria
            </option>
        `;

        return;
    }


    select.innerHTML =
        appData.categories
            .map(category => {

                return `
                    <option value="${category.id}">
                        ${escapeHtml(category.nome)}
                    </option>
                `;

            })
            .join("");
}


// =====================================================
// CARREGAR MOVIMENTAÇÕES
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

        appData.transactions = [];

        return;
    }


    appData.transactions =
        transactions.map(item => {

            return {

                id:
                    item.id,

                description:
                    item.descricao,

                type:
                    item.tipo,

                amount:
                    Number(
                        item.valor
                    ),

                categoryId:
                    item.categoria_id,

                category:
                    item.categoria ||
                    "Outros",

                categoryColor:
                    item.categoria_cor,

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
                    null,

                fixedId:
                    item.fixo_id ||
                    null
            };

        });
}


// =====================================================
// CARREGAR RESUMO
// =====================================================

async function loadSummary() {

    const mes =
        selectedMonth + 1;


    const resumo =
        await apiRequest(
            `/dashboard/resumo?mes=${mes}&ano=${selectedYear}`
        );


    const income =
        Number(
            resumo.entradas || 0
        );


    const expense =
        Number(
            resumo.despesas || 0
        );


    const saved =
        Number(
            resumo.guardado || 0
        );


    const pending =
        Number(
            resumo.pendentes || 0
        );


    /*
        IMPORTANTE:

        Guardado NÃO participa do saldo.

        Saldo = entradas - despesas
    */

    const balance =
        income - expense;


    appData.budget =
        Number(
            resumo.orcamento || 0
        );


    // =============================================
    // VALORES
    // =============================================

    const balanceValue =
        getElement(
            "balanceValue"
        );

    const incomeValue =
        getElement(
            "incomeValue"
        );

    const expenseValue =
        getElement(
            "expenseValue"
        );

    const savedValue =
        getElement(
            "savedValue"
        );

    const pendingValue =
        getElement(
            "pendingValue"
        );


    if (balanceValue) {

        balanceValue.textContent =
            currency.format(
                balance
            );
    }


    if (incomeValue) {

        incomeValue.textContent =
            currency.format(
                income
            );
    }


    if (expenseValue) {

        expenseValue.textContent =
            currency.format(
                expense
            );
    }


    if (savedValue) {

        savedValue.textContent =
            currency.format(
                saved
            );
    }


    if (pendingValue) {

        pendingValue.textContent =
            currency.format(
                pending
            );
    }


    // =============================================
    // CONTADORES
    // =============================================

    const incomeCount =
        Number(
            resumo.quantidadeEntradas || 0
        );


    const expenseCount =
        Number(
            resumo.quantidadeDespesas || 0
        );


    const savedCount =
        Number(
            resumo.quantidadeGuardado || 0
        );


    const incomeCountElement =
        getElement(
            "incomeCount"
        );


    const expenseCountElement =
        getElement(
            "expenseCount"
        );


    const savedCountElement =
        getElement(
            "savedCount"
        );


    if (incomeCountElement) {

        incomeCountElement.textContent =
            incomeCount === 0
                ? "Nenhum recebimento"
                : `${incomeCount} recebimento${
                    incomeCount > 1
                        ? "s"
                        : ""
                }`;
    }


    if (expenseCountElement) {

        expenseCountElement.textContent =
            expenseCount === 0
                ? "Nenhum pagamento"
                : `${expenseCount} pagamento${
                    expenseCount > 1
                        ? "s"
                        : ""
                }`;
    }


    if (savedCountElement) {

        savedCountElement.textContent =
            savedCount === 0
                ? "Nenhum valor reservado"
                : `${savedCount} valor${
                    savedCount === 1
                        ? ""
                        : "es"
                } guardado${
                    savedCount === 1
                        ? ""
                        : "s"
                }`;
    }


    /*
        O orçamento continua considerando
        somente despesas pagas.

        Guardado NÃO consome orçamento.
    */

    renderBudget(
        expense
    );
}


// =====================================================
// ORÇAMENTO
// =====================================================

function renderBudget(expenses) {

    const budget =
        Number(
            appData.budget
        ) || 0;


    const percent =
        budget > 0
            ? Math.min(
                (
                    expenses /
                    budget
                ) * 100,
                100
            )
            : 0;


    const remaining =
        Math.max(
            budget - expenses,
            0
        );


    getElement(
        "budgetUsed"
    ).textContent =
        currency.format(
            expenses
        );


    getElement(
        "budgetTotal"
    ).textContent =
        currency.format(
            budget
        );


    getElement(
        "budgetRemaining"
    ).textContent =
        currency.format(
            remaining
        );


    getElement(
        "budgetPercent"
    ).textContent =
        `${Math.round(percent)}%`;


    const progress =
        getElement(
            "budgetProgress"
        );


    progress.style.width =
        `${percent}%`;


    if (
        expenses > budget &&
        budget > 0
    ) {

        progress.style.background =
            "var(--expense)";

    } else if (
        percent >= 80
    ) {

        progress.style.background =
            "var(--warning)";

    } else {

        progress.style.background =
            "var(--primary)";
    }
}


// =====================================================
// FILTRO DE PERÍODO
// =====================================================

function isInSelectedPeriod(
    transaction
) {

    if (!transaction.date) {
        return false;
    }


    const date =
        new Date(
            `${transaction.date}T12:00:00`
        );


    return (
        date.getMonth() ===
            selectedMonth &&
        date.getFullYear() ===
            selectedYear
    );
}


function getPeriodTransactions() {

    return appData.transactions.filter(
        isInSelectedPeriod
    );
}


// =====================================================
// ÚLTIMOS 6 MESES
// =====================================================

function getLastSixMonths() {

    const months = [];


    for (
        let index = 5;
        index >= 0;
        index--
    ) {

        const date =
            new Date(
                selectedYear,
                selectedMonth - index,
                1
            );


        months.push({

            month:
                date.getMonth(),

            year:
                date.getFullYear(),

            label:
                monthNames[
                    date.getMonth()
                ].slice(0, 3)

        });
    }


    return months;
}


// =====================================================
// GRÁFICO ENTRADAS / DESPESAS / RESERVAS
// =====================================================

function renderBarChart() {

    const periods =
        getLastSixMonths();


    const values =
        periods.map(
            period => {

                const periodTransactions =
                    appData.transactions.filter(
                        transaction => {

                            if (
                                !transaction.date
                            ) {
                                return false;
                            }


                            const date =
                                new Date(
                                    `${transaction.date}T12:00:00`
                                );


                            return (
                                date.getMonth() ===
                                    period.month &&

                                date.getFullYear() ===
                                    period.year &&

                                transaction.status ===
                                    "paid"
                            );
                        }
                    );


                const income =
                    sumTransactions(
                        periodTransactions,
                        transaction =>
                            transaction.type ===
                            "income"
                    );


                const expense =
                    sumTransactions(
                        periodTransactions,
                        transaction =>
                            transaction.type ===
                            "expense"
                    );


                const saved =
                    sumTransactions(
                        periodTransactions,
                        transaction =>
                            transaction.type ===
                            "saved"
                    );


                return {
                    ...period,
                    income,
                    expense,
                    saved
                };
            }
        );


    const maximum =
        Math.max(
            ...values.flatMap(
                item => [
                    item.income,
                    item.expense,
                    item.saved
                ]
            ),
            1
        );


    const chart =
        getElement(
            "barChart"
        );


    if (!chart) {
        return;
    }


    chart.innerHTML =
        values
            .map(
                item => {

                    const incomeHeight =
                        Math.max(
                            (
                                item.income /
                                maximum
                            ) * 90,

                            item.income > 0
                                ? 3
                                : 0
                        );


                    const expenseHeight =
                        Math.max(
                            (
                                item.expense /
                                maximum
                            ) * 90,

                            item.expense > 0
                                ? 3
                                : 0
                        );


                    const savedHeight =
                        Math.max(
                            (
                                item.saved /
                                maximum
                            ) * 90,

                            item.saved > 0
                                ? 3
                                : 0
                        );


                    return `
                        <div class="bar-group">

                            <div
                                class="bar income"
                                style="height: ${incomeHeight}%"
                                title="Entradas: ${currency.format(item.income)}"
                            ></div>


                            <div
                                class="bar expense"
                                style="height: ${expenseHeight}%"
                                title="Despesas: ${currency.format(item.expense)}"
                            ></div>


                            <div
                                class="bar saved"
                                style="height: ${savedHeight}%"
                                title="Guardado: ${currency.format(item.saved)}"
                            ></div>


                            <label>
                                ${item.label}
                            </label>

                        </div>
                    `;
                }
            )
            .join("");
}


// =====================================================
// GRÁFICO POR CATEGORIA
// =====================================================

function renderCategoryChart() {

    const expenses =
        getPeriodTransactions()
            .filter(
                transaction =>

                    transaction.type ===
                        "expense" &&

                    transaction.status ===
                        "paid"
            );


    const totals = {};


    expenses.forEach(
        transaction => {

            const category =
                transaction.category ||
                "Outros";


            if (!totals[category]) {

                totals[category] = {
                    value: 0,

                    color:
                        transaction.categoryColor ||
                        categoryColors[category] ||
                        categoryColors.Outros
                };
            }


            totals[category].value +=
                Number(
                    transaction.amount
                );
        }
    );


    const entries =
        Object.entries(totals)
            .sort(
                (
                    first,
                    second
                ) =>

                    second[1].value -
                    first[1].value
            );


    const total =
        entries.reduce(
            (
                sum,
                [, item]
            ) =>

                sum +
                item.value,

            0
        );


    getElement(
        "donutTotal"
    ).textContent =
        currency
            .format(total)
            .replace(",00", "");


    if (
        entries.length === 0 ||
        total <= 0
    ) {

        getElement(
            "donutChart"
        ).style.background =
            "conic-gradient(var(--border) 0 100%)";


        getElement(
            "categoryLegend"
        ).innerHTML =
            "<p>Sem despesas no período.</p>";


        return;
    }


    let accumulated = 0;

    const segments = [];


    entries.forEach(
        (
            [
                category,
                item
            ]
        ) => {

            const start =
                accumulated;


            const percentage =
                (
                    item.value /
                    total
                ) * 100;


            accumulated +=
                percentage;


            segments.push(
                `${item.color} ${start}% ${accumulated}%`
            );
        }
    );


    getElement(
        "donutChart"
    ).style.background =
        `conic-gradient(${segments.join(",")})`;


    getElement(
        "categoryLegend"
    ).innerHTML =
        entries
            .slice(0, 6)
            .map(
                (
                    [
                        category,
                        item
                    ]
                ) => {

                    const percentage =
                        Math.round(
                            (
                                item.value /
                                total
                            ) * 100
                        );


                    return `
                        <span>

                            <i
                                style="background: ${item.color}"
                            ></i>

                            ${escapeHtml(category)}
                            ·
                            ${percentage}%

                        </span>
                    `;
                }
            )
            .join("");
}


function getTransactionTypeInfo(type) {

    if (type === "income") {

        return {
            className:
                "income",

            icon:
                "↗",

            signal:
                "+",

            statusText:
                "Recebido"
        };
    }


    if (type === "saved") {

        return {
            className:
                "saved",

            icon:
                "◆",

            signal:
                "",

            statusText:
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

        statusText:
            "Pago"
    };
}

// =====================================================
// MOVIMENTAÇÕES RECENTES
// =====================================================

function renderRecentTransactions() {

    const transactions =
        [...getPeriodTransactions()]
            .sort(
                (
                    first,
                    second
                ) =>

                    second.date.localeCompare(
                        first.date
                    )
            )
            .slice(
                0,
                5
            );


    const container =
        getElement(
            "recentTransactions"
        );


    if (
        transactions.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ↔
                </div>

                <strong>
                    Nenhuma movimentação encontrada
                </strong>

                <p>
                    Adicione uma movimentação para começar.
                </p>

            </div>
        `;


        return;
    }


    container.innerHTML =
        transactions
            .map(
                transaction => {

                    const typeInfo =
                        getTransactionTypeInfo(
                            transaction.type
                        );


                    const statusText =
                        transaction.status ===
                        "pending"

                            ? "Pendente"

                            : typeInfo.statusText;


                    return `
                        <article class="transaction-item">

                            <div
                                class="transaction-icon ${typeInfo.className}"
                            >
                                ${typeInfo.icon}
                            </div>


                            <div class="transaction-info">

                                <strong>
                                    ${escapeHtml(
                                        transaction.description
                                    )}
                                </strong>

                                <span>

                                    ${escapeHtml(
                                        transaction.category
                                    )}

                                    ·

                                    ${escapeHtml(
                                        transaction.payment
                                    )}

                                </span>

                            </div>


                            <span
                                class="transaction-status ${transaction.status}"
                            >
                                ${statusText}
                            </span>


                            <div
                                class="transaction-amount ${typeInfo.className}"
                            >

                                ${typeInfo.signal}

                                ${currency.format(
                                    transaction.amount
                                )}


                                <span class="transaction-date">

                                    ${formatDate(
                                        transaction.date
                                    )}

                                </span>

                            </div>

                        </article>
                    `;
                }
            )
            .join("");
}


// =====================================================
// CARREGAR DASHBOARD
// =====================================================

async function renderDashboard() {

    try {

        await Promise.all([
            loadTransactions(),
            loadSummary()
        ]);


        renderBarChart();

        renderCategoryChart();

        renderRecentTransactions();


    } catch (error) {

        console.error(
            "Erro ao carregar dashboard:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar dashboard."
        );
    }
}


// =====================================================
// MODAL DE MOVIMENTAÇÃO
// =====================================================

function openTransactionModal() {

    const modal =
        getElement(
            "transactionModal"
        );


    const form =
        getElement(
            "transactionForm"
        );


    form.reset();


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

        category.selectedIndex = 0;
    }


    getElement(
        "date"
    ).value =
        new Date()
            .toISOString()
            .slice(0, 10);


    modal.showModal();


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
// FECHAR MODAL
// =====================================================

function closeModal(modalId) {

    const modal =
        getElement(modalId);


    if (
        modal &&
        modal.open
    ) {

        modal.close();
    }
}


// =====================================================
// SALVAR MOVIMENTAÇÃO
// =====================================================

async function saveTransaction(event) {

    event.preventDefault();


    const transactionIdElement =
        getElement("transactionId");


    const transactionId =
        transactionIdElement
            ? transactionIdElement.value
            : "";


    const description =
        getElement(
            "description"
        ).value.trim();


    // =========================
    // VALOR
    // =========================

    let amountValue =
        getElement(
            "amount"
        ).value.trim();


    // Converte formato brasileiro para número:
    // 111,10      -> 111.10
    // 1.111,10    -> 1111.10
    // 10.000,50   -> 10000.50
    amountValue =
        amountValue
            .replace(/\./g, "")
            .replace(",", ".");


    const amount =
        Number(amountValue);


    const date =
        getElement(
            "date"
        ).value;


    const categoryId =
        getElement(
            "category"
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
    // VALIDAÇÕES
    // =========================

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


    if (!categoryId) {

        showToast(
            "Selecione uma categoria."
        );

        return;
    }


    if (!date) {

        showToast(
            "Informe a data."
        );

        return;
    }


    const form =
        getElement(
            "transactionForm"
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
                transactionId
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

            data:
                date,

            status:
                status,

            forma_pagamento:
                payment
        };


        console.log(
            "Enviando movimentação:",
            body
        );


        let resultado;


        // =========================
        // EDITAR
        // =========================

        if (transactionId) {

            resultado =
                await apiRequest(
                    `/movimentacoes/${transactionId}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify(
                                body
                            )
                    }
                );

        }

        // =========================
        // CRIAR
        // =========================

        else {

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


        console.log(
            "Resposta da API:",
            resultado
        );


        closeModal(
            "transactionModal"
        );


        form.reset();


        showToast(
            resultado.message ||
            (
                transactionId
                    ? "Movimentação atualizada com sucesso."
                    : "Movimentação adicionada com sucesso."
            )
        );


        await renderDashboard();


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

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Salvar movimentação";
        }
    }
}

function setupMoneyInput() {

    const amountInput =
        getElement("amount");


    if (!amountInput) {
        return;
    }


    amountInput.addEventListener(
        "input",
        event => {

            let value =
                event.target.value
                    .replace(/\D/g, "");


            if (!value) {

                event.target.value = "";

                return;
            }


            const amount =
                Number(value) / 100;


            event.target.value =
                amount.toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );
        }
    );
}

// =====================================================
// MODAL ORÇAMENTO
// =====================================================

function openBudgetModal() {

    getElement(
        "budgetInput"
    ).value =
        appData.budget;


    getElement(
        "budgetModal"
    ).showModal();
}


// =====================================================
// SALVAR ORÇAMENTO
// =====================================================

async function saveBudget(
    event
) {

    event.preventDefault();


    const budget =
        Number(
            getElement(
                "budgetInput"
            ).value
        );


    if (
        budget < 0 ||
        Number.isNaN(
            budget
        )
    ) {

        showToast(
            "Digite um orçamento válido."
        );

        return;
    }


    try {

        await apiRequest(
            "/configuracoes",
            {
                method: "PUT",

                body:
                    JSON.stringify({
                        orcamento_mensal:
                            budget
                    })
            }
        );


        closeModal(
            "budgetModal"
        );


        showToast(
            "Orçamento atualizado."
        );


        await renderDashboard();


    } catch (error) {

        console.error(
            "Erro ao atualizar orçamento:",
            error
        );


        showToast(
            error.message
        );
    }
}


// =====================================================
// CONFIGURAR PERÍODO
// =====================================================

function setupPeriod() {

    const monthSelect =
        getElement(
            "monthSelect"
        );


    const yearSelect =
        getElement(
            "yearSelect"
        );


    if (
        !monthSelect ||
        !yearSelect
    ) {
        return;
    }


    selectedMonth =
        currentDate.getMonth();


    selectedYear =
        currentDate.getFullYear();


    monthSelect.value =
        String(
            selectedMonth
        );


    let yearExists =
        Array.from(
            yearSelect.options
        ).some(
            option =>
                Number(
                    option.value
                ) ===
                selectedYear
        );


    if (!yearExists) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            selectedYear;

        option.textContent =
            selectedYear;


        yearSelect.appendChild(
            option
        );
    }


    yearSelect.value =
        String(
            selectedYear
        );


    monthSelect.addEventListener(
        "change",
        async event => {

            selectedMonth =
                Number(
                    event.target.value
                );


            await renderDashboard();
        }
    );


    yearSelect.addEventListener(
        "change",
        async event => {

            selectedYear =
                Number(
                    event.target.value
                );


            await renderDashboard();
        }
    );
}


// =====================================================
// MENU DO PERFIL
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
                    .toggle("show");


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

                dropdown.classList.remove(
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
                .toggle("show");
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


    const themeButton =
        getElement(
            "themeToggle"
        );


    if (!themeButton) {
        return;
    }


    if (
        savedTheme === "dark"
    ) {

        document.body
            .classList
            .add("dark");


        themeButton.textContent =
            "☀";
    }


    themeButton.addEventListener(
        "click",
        () => {

            document.body
                .classList
                .toggle("dark");


            const darkMode =
                document.body
                    .classList
                    .contains("dark");


            localStorage.setItem(
                THEME_KEY,

                darkMode
                    ? "dark"
                    : "light"
            );


            themeButton.textContent =
                darkMode
                    ? "☀"
                    : "☾";
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

                        closeModal(
                            button.dataset
                                .closeModal
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        const rectangle =
                            modal
                                .getBoundingClientRect();


                        const clickedOutside =
                            event.clientX <
                                rectangle.left ||

                            event.clientX >
                                rectangle.right ||

                            event.clientY <
                                rectangle.top ||

                            event.clientY >
                                rectangle.bottom;


                        if (
                            clickedOutside
                        ) {

                            modal.close();
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

    setupMoneyInput();

    const openTransaction =
        getElement(
            "openTransaction"
        );


    const quickAddTransaction =
        getElement(
            "quickAddTransaction"
        );


    const transactionForm =
        getElement(
            "transactionForm"
        );


    const editBudget =
        getElement(
            "editBudget"
        );


    const budgetForm =
        getElement(
            "budgetForm"
        );


    const logoutButton =
        getElement(
            "logoutButton"
        );


    if (openTransaction) {

        openTransaction.addEventListener(
            "click",
            openTransactionModal
        );
    }


    if (quickAddTransaction) {

        quickAddTransaction.addEventListener(
            "click",
            openTransactionModal
        );
    }


    if (transactionForm) {

        transactionForm.addEventListener(
            "submit",
            saveTransaction
        );
    }


    if (editBudget) {

        editBudget.addEventListener(
            "click",
            openBudgetModal
        );
    }


    if (budgetForm) {

        budgetForm.addEventListener(
            "submit",
            saveBudget
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
// INICIALIZAR DASHBOARD
// =====================================================

async function initializeDashboard() {

    if (!getSession()) {
        return;
    }


    try {

        setupPeriod();

        setupProfileMenu();

        setupMobileMenu();

        setupTheme();

        setupModalClosing();

        setupEvents();


        await Promise.all([
            renderUser(),
            loadCategories()
        ]);


        await renderDashboard();


    } catch (error) {

        console.error(
            "Erro ao inicializar dashboard:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar o sistema."
        );
    }
}


initializeDashboard();