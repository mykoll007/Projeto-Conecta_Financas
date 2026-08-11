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


const monthFormatter =
    new Intl.DateTimeFormat("pt-BR", {
        month: "short"
    });


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
// ESTADO
// =====================================================

let appData = {
    transactions: [],
    categories: []
};

let reportTransactions = [];


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


    if (response.status === 401) {

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
// UTILITÁRIOS
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


function formatInputDate(date) {

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
// DATAS INICIAIS
// =====================================================

function setupInitialDates() {

    const today =
        new Date();


    const firstDay =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


    getElement(
        "startDate"
    ).value =
        formatInputDate(
            firstDay
        );


    getElement(
        "endDate"
    ).value =
        formatInputDate(
            today
        );
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

    const select =
        getElement(
            "categoryFilter"
        );


    if (!select) {
        return;
    }


    const options =
        appData.categories
            .map(category => {

                return `
                    <option value="${category.id}">
                        ${escapeHtml(
                            category.nome
                        )}
                    </option>
                `;

            })
            .join("");


    select.innerHTML = `
        <option value="all">
            Todas as categorias
        </option>

        ${options}
    `;
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
                            "Outros",

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
                            null,

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
            error.message
        );
    }
}


// =====================================================
// FILTRAR MOVIMENTAÇÕES
// =====================================================

function getFilteredTransactions() {

    const startDate =
        getElement(
            "startDate"
        ).value;


    const endDate =
        getElement(
            "endDate"
        ).value;


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


    return appData.transactions
        .filter(
            transaction => {

                const matchesStart =
                    !startDate ||
                    transaction.date >=
                        startDate;


                const matchesEnd =
                    !endDate ||
                    transaction.date <=
                        endDate;


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


                return (
                    matchesStart &&
                    matchesEnd &&
                    matchesType &&
                    matchesStatus &&
                    matchesCategory
                );
            }
        )
        .sort(
            (
                first,
                second
            ) => {

                return second.date
                    .localeCompare(
                        first.date
                    );
            }
        );
}


// =====================================================
// SOMAR
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

function renderSummary() {

    const incomeTransactions =
        reportTransactions.filter(
            transaction => {

                return (
                    transaction.type ===
                        "income" &&

                    transaction.status ===
                        "paid"
                );
            }
        );


    const expenseTransactions =
        reportTransactions.filter(
            transaction => {

                return (
                    transaction.type ===
                        "expense" &&

                    transaction.status ===
                        "paid"
                );
            }
        );


    const pendingTransactions =
        reportTransactions.filter(
            transaction => {

                return (
                    transaction.status ===
                    "pending"
                );
            }
        );


    const income =
        sumTransactions(
            incomeTransactions,
            () => true
        );


    const expense =
        sumTransactions(
            expenseTransactions,
            () => true
        );


    const pending =
        sumTransactions(
            pendingTransactions,
            () => true
        );


    const balance =
        income - expense;


    getElement(
        "totalIncome"
    ).textContent =
        currency.format(
            income
        );


    getElement(
        "totalExpense"
    ).textContent =
        currency.format(
            expense
        );


    getElement(
        "totalPending"
    ).textContent =
        currency.format(
            pending
        );


    const periodBalance =
        getElement(
            "periodBalance"
        );


    periodBalance.textContent =
        currency.format(
            balance
        );


    periodBalance.classList.toggle(
        "expense-text",
        balance < 0
    );


    periodBalance.classList.toggle(
        "income-text",
        balance >= 0
    );


    getElement(
        "incomeCount"
    ).textContent =
        `${incomeTransactions.length} recebimento${
            incomeTransactions.length === 1
                ? ""
                : "s"
        }`;


    getElement(
        "expenseCount"
    ).textContent =
        `${expenseTransactions.length} pagamento${
            expenseTransactions.length === 1
                ? ""
                : "s"
        }`;


    getElement(
        "pendingCount"
    ).textContent =
        `${pendingTransactions.length} pendência${
            pendingTransactions.length === 1
                ? ""
                : "s"
        }`;


    renderIndicators(
        income,
        expense,
        expenseTransactions
    );
}


// =====================================================
// INDICADORES
// =====================================================

function renderIndicators(
    income,
    expense,
    expenseTransactions
) {

    const savingRate =
        income > 0
            ? (
                (
                    income -
                    expense
                ) /
                income
            ) * 100
            : 0;


    const normalizedSavingRate =
        Math.max(
            0,
            Math.min(
                savingRate,
                100
            )
        );


    const averageExpense =
        expenseTransactions.length > 0
            ? expense /
                expenseTransactions.length
            : 0;


    const highest =
        [...expenseTransactions]
            .sort(
                (
                    first,
                    second
                ) => {

                    return (
                        Number(
                            second.amount
                        ) -
                        Number(
                            first.amount
                        )
                    );
                }
            )[0];


    const categoryTotals =
        calculateCategoryTotals(
            expenseTransactions
        );


    const topCategory =
        Object.entries(
            categoryTotals
        )
            .sort(
                (
                    first,
                    second
                ) => {

                    return (
                        second[1].total -
                        first[1].total
                    );
                }
            )[0];


    getElement(
        "savingRate"
    ).textContent =
        `${Math.round(
            savingRate
        )}%`;


    getElement(
        "savingProgress"
    ).style.width =
        `${normalizedSavingRate}%`;


    getElement(
        "savingProgress"
    ).style.background =
        savingRate < 0
            ? "var(--expense)"
            : savingRate < 15
                ? "var(--warning)"
                : "var(--primary)";


    getElement(
        "averageExpense"
    ).textContent =
        currency.format(
            averageExpense
        );


    getElement(
        "highestExpense"
    ).textContent =
        currency.format(
            highest?.amount ||
            0
        );


    getElement(
        "highestExpenseDescription"
    ).textContent =
        highest
            ? `${highest.description} em ${formatDate(highest.date)}.`
            : "Nenhuma despesa encontrada.";


    getElement(
        "topCategory"
    ).textContent =
        topCategory?.[0] ||
        "Nenhuma";


    getElement(
        "topCategoryValue"
    ).textContent =
        topCategory
            ? `${currency.format(
                topCategory[1].total
            )} em despesas.`
            : "R$ 0,00 em despesas.";
}


// =====================================================
// TOTAIS POR CATEGORIA
// =====================================================

function calculateCategoryTotals(
    transactions
) {

    const totals = {};


    transactions.forEach(
        transaction => {

            const category =
                transaction.category ||
                "Outros";


            if (!totals[category]) {

                totals[category] = {
                    total: 0,
                    count: 0,
                    color:
                        transaction.categoryColor ||
                        categoryColors[category] ||
                        categoryColors.Outros
                };
            }


            totals[category].total +=
                Number(
                    transaction.amount
                );


            totals[category].count +=
                1;
        }
    );


    return totals;
}


// =====================================================
// MESES ENTRE DATAS
// =====================================================

function getMonthsBetweenDates() {

    const startValue =
        getElement(
            "startDate"
        ).value;


    const endValue =
        getElement(
            "endDate"
        ).value;


    if (
        !startValue ||
        !endValue
    ) {

        return [];
    }


    const start =
        new Date(
            `${startValue}T12:00:00`
        );


    const end =
        new Date(
            `${endValue}T12:00:00`
        );


    const months = [];


    const current =
        new Date(
            start.getFullYear(),
            start.getMonth(),
            1
        );


    const last =
        new Date(
            end.getFullYear(),
            end.getMonth(),
            1
        );


    while (
        current <= last &&
        months.length < 12
    ) {

        months.push({

            year:
                current.getFullYear(),

            month:
                current.getMonth(),

            label:
                monthFormatter
                    .format(
                        current
                    )
                    .replace(
                        ".",
                        ""
                    )
        });


        current.setMonth(
            current.getMonth() + 1
        );
    }


    return months;
}


// =====================================================
// GRÁFICO MENSAL
// =====================================================

function renderMonthlyChart() {

    const months =
        getMonthsBetweenDates();


    if (
        months.length === 0
    ) {

        getElement(
            "monthlyChart"
        ).innerHTML = "";

        return;
    }


    const values =
        months.map(
            period => {

                const transactions =
                    reportTransactions.filter(
                        transaction => {

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
                        transactions,
                        transaction =>
                            transaction.type ===
                            "income"
                    );


                const expense =
                    sumTransactions(
                        transactions,
                        transaction =>
                            transaction.type ===
                            "expense"
                    );


                return {
                    ...period,
                    income,
                    expense
                };
            }
        );


    const maximum =
        Math.max(
            ...values.flatMap(
                value => {

                    return [
                        value.income,
                        value.expense
                    ];
                }
            ),
            1
        );


    getElement(
        "monthlyChart"
    ).innerHTML =
        values
            .map(
                value => {

                    const incomeHeight =
                        Math.max(
                            (
                                value.income /
                                maximum
                            ) * 95,

                            value.income > 0
                                ? 2
                                : 0
                        );


                    const expenseHeight =
                        Math.max(
                            (
                                value.expense /
                                maximum
                            ) * 95,

                            value.expense > 0
                                ? 2
                                : 0
                        );


                    return `
                        <div class="bar-group">

                            <div
                                class="bar income"
                                style="height: ${incomeHeight}%"
                                title="Entradas: ${currency.format(value.income)}"
                            ></div>

                            <div
                                class="bar expense"
                                style="height: ${expenseHeight}%"
                                title="Despesas: ${currency.format(value.expense)}"
                            ></div>

                            <label>
                                ${escapeHtml(value.label)}
                            </label>

                        </div>
                    `;
                }
            )
            .join("");
}


// =====================================================
// GRÁFICO DE CATEGORIA
// =====================================================

function renderCategoryChart() {

    const expenses =
        reportTransactions.filter(
            transaction => {

                return (
                    transaction.type ===
                        "expense" &&

                    transaction.status ===
                        "paid"
                );
            }
        );


    const categoryTotals =
        calculateCategoryTotals(
            expenses
        );


    const entries =
        Object.entries(
            categoryTotals
        )
            .sort(
                (
                    first,
                    second
                ) => {

                    return (
                        second[1].total -
                        first[1].total
                    );
                }
            );


    const total =
        entries.reduce(
            (
                sum,
                entry
            ) => {

                return (
                    sum +
                    entry[1].total
                );
            },
            0
        );


    getElement(
        "donutTotal"
    ).textContent =
        currency
            .format(
                total
            )
            .replace(
                ",00",
                ""
            );


    if (
        entries.length === 0 ||
        total <= 0
    ) {

        getElement(
            "categoryDonut"
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
                data
            ]
        ) => {

            const start =
                accumulated;


            const percentage =
                (
                    data.total /
                    total
                ) * 100;


            accumulated +=
                percentage;


            const color =
                data.color ||
                categoryColors[
                    category
                ] ||
                categoryColors.Outros;


            segments.push(
                `${color} ${start}% ${accumulated}%`
            );
        }
    );


    getElement(
        "categoryDonut"
    ).style.background =
        `conic-gradient(${segments.join(",")})`;


    getElement(
        "categoryLegend"
    ).innerHTML =
        entries
            .slice(
                0,
                8
            )
            .map(
                (
                    [
                        category,
                        data
                    ]
                ) => {

                    const percentage =
                        Math.round(
                            (
                                data.total /
                                total
                            ) * 100
                        );


                    const color =
                        data.color ||
                        categoryColors[
                            category
                        ] ||
                        categoryColors.Outros;


                    return `
                        <span>

                            <i
                                style="background: ${color}"
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


// =====================================================
// RANKING DE DESPESAS
// =====================================================

function renderExpenseRanking() {

    const transactions =
        reportTransactions
            .filter(transaction => {
                return (
                    transaction.status === "paid"
                );
            })
            .sort((first, second) => {

                return (
                    Number(second.amount) -
                    Number(first.amount)
                );

            })
            .slice(0, 5);


    const container =
        getElement(
            "expenseRanking"
        );


    if (
        transactions.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ↕
                </div>

                <strong>
                    Nenhuma movimentação encontrada
                </strong>

                <p>
                    Não existem entradas ou despesas pagas
                    neste período.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        transactions
            .map(
                (
                    transaction,
                    index
                ) => {

                    const isIncome =
                        transaction.type ===
                        "income";


                    const signal =
                        isIncome
                            ? "+"
                            : "−";


                    const typeText =
                        isIncome
                            ? "Entrada"
                            : "Despesa";


                    return `
                        <article class="ranking-item">

                            <div class="ranking-position">
                                ${index + 1}
                            </div>


                            <div class="ranking-info">

                                <strong>
                                    ${escapeHtml(
                                        transaction.description
                                    )}
                                </strong>

                                <span>

                                    ${typeText}

                                    ·

                                    ${escapeHtml(
                                        transaction.category
                                    )}

                                    ·

                                    ${formatDate(
                                        transaction.date
                                    )}

                                </span>

                            </div>


                            <strong
                                class="ranking-value ${
                                    isIncome
                                        ? "income-text"
                                        : "expense-text"
                                }"
                            >

                                ${signal}

                                ${currency.format(
                                    transaction.amount
                                )}

                            </strong>

                        </article>
                    `;
                }
            )
            .join("");
}


// =====================================================
// INSIGHTS
// =====================================================

function renderInsights() {

    const income =
        sumTransactions(
            reportTransactions,
            transaction => {

                return (
                    transaction.type ===
                        "income" &&

                    transaction.status ===
                        "paid"
                );
            }
        );


    const expense =
        sumTransactions(
            reportTransactions,
            transaction => {

                return (
                    transaction.type ===
                        "expense" &&

                    transaction.status ===
                        "paid"
                );
            }
        );


    const pending =
        sumTransactions(
            reportTransactions,
            transaction =>
                transaction.status ===
                "pending"
        );


    const expenseRate =
        income > 0
            ? (
                expense /
                income
            ) * 100
            : 0;


    const categoryTotals =
        calculateCategoryTotals(
            reportTransactions.filter(
                transaction => {

                    return (
                        transaction.type ===
                            "expense" &&

                        transaction.status ===
                            "paid"
                    );
                }
            )
        );


    const topCategory =
        Object.entries(
            categoryTotals
        )
            .sort(
                (
                    first,
                    second
                ) => {

                    return (
                        second[1].total -
                        first[1].total
                    );
                }
            )[0];


    const insights = [];


    if (
        income === 0 &&
        expense === 0
    ) {

        insights.push({
            type:
                "warning",

            icon:
                "!",

            title:
                "Poucos dados disponíveis",

            text:
                "Não existem entradas ou despesas pagas no período selecionado."
        });

    } else if (
        expenseRate <= 70
    ) {

        insights.push({
            type:
                "success",

            icon:
                "✓",

            title:
                "Período equilibrado",

            text:
                `As despesas representam ${Math.round(expenseRate)}% das entradas recebidas.`
        });

    } else if (
        expenseRate <= 100
    ) {

        insights.push({
            type:
                "warning",

            icon:
                "!",

            title:
                "Atenção aos gastos",

            text:
                `Você utilizou ${Math.round(expenseRate)}% das entradas com despesas.`
        });

    } else {

        insights.push({
            type:
                "danger",

            icon:
                "!",

            title:
                "Despesas acima das entradas",

            text:
                `Os gastos ultrapassaram as entradas em ${currency.format(expense - income)}.`
        });
    }


    if (topCategory) {

        insights.push({
            type:
                "success",

            icon:
                "▥",

            title:
                "Categoria com maior gasto",

            text:
                `${topCategory[0]} concentrou ${currency.format(topCategory[1].total)} das despesas.`
        });
    }


    if (pending > 0) {

        insights.push({
            type:
                "warning",

            icon:
                "!",

            title:
                "Contas pendentes",

            text:
                `Existem ${currency.format(pending)} aguardando pagamento ou recebimento.`
        });

    } else {

        insights.push({
            type:
                "success",

            icon:
                "✓",

            title:
                "Sem pendências",

            text:
                "Não existem contas pendentes no período selecionado."
        });
    }


    getElement(
        "insightsList"
    ).innerHTML =
        insights
            .map(
                insight => {

                    return `
                        <article
                            class="insight-item ${insight.type}"
                        >

                            <div class="insight-icon">
                                ${insight.icon}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHtml(insight.title)}
                                </strong>

                                <p>
                                    ${escapeHtml(insight.text)}
                                </p>

                            </div>

                        </article>
                    `;
                }
            )
            .join("");
}


// =====================================================
// TABELA POR CATEGORIA
// =====================================================

function renderCategoryTable() {

    const expenses =
        reportTransactions.filter(
            transaction => {

                return (
                    transaction.type ===
                        "expense" &&

                    transaction.status ===
                        "paid"
                );
            }
        );


    const categoryTotals =
        calculateCategoryTotals(
            expenses
        );


    const entries =
        Object.entries(
            categoryTotals
        )
            .sort(
                (
                    first,
                    second
                ) => {

                    return (
                        second[1].total -
                        first[1].total
                    );
                }
            );


    const total =
        entries.reduce(
            (
                sum,
                entry
            ) => {

                return (
                    sum +
                    entry[1].total
                );
            },
            0
        );


    const body =
        getElement(
            "categoryTableBody"
        );


    const emptyState =
        getElement(
            "categoryEmptyState"
        );


    emptyState.hidden =
        entries.length > 0;


    body.innerHTML =
        entries
            .map(
                (
                    [
                        category,
                        data
                    ]
                ) => {

                    const percentage =
                        total > 0
                            ? (
                                data.total /
                                total
                            ) * 100
                            : 0;


                    const color =
                        data.color ||
                        categoryColors[
                            category
                        ] ||
                        categoryColors.Outros;


                    return `
                        <tr>

                            <td>

                                <div class="category-name">

                                    <i
                                        class="category-color"
                                        style="background: ${color}"
                                    ></i>

                                    ${escapeHtml(category)}

                                </div>

                            </td>


                            <td>
                                ${data.count}
                            </td>


                            <td>

                                <strong>
                                    ${currency.format(data.total)}
                                </strong>

                            </td>


                            <td class="participation-cell">

                                <div class="participation-content">

                                    <div class="participation-bar">

                                        <div
                                            style="
                                                width: ${percentage}%;
                                                background: ${color};
                                            "
                                        ></div>

                                    </div>

                                    <span>
                                        ${Math.round(percentage)}%
                                    </span>

                                </div>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


// =====================================================
// RENDERIZAR RELATÓRIO
// =====================================================

function renderReport() {

    const startDate =
        getElement(
            "startDate"
        ).value;


    const endDate =
        getElement(
            "endDate"
        ).value;


    if (
        startDate &&
        endDate &&
        startDate > endDate
    ) {

        showToast(
            "A data inicial não pode ser maior que a data final."
        );

        return;
    }


    reportTransactions =
        getFilteredTransactions();


    renderSummary();

    renderMonthlyChart();

    renderCategoryChart();

    renderExpenseRanking();

    renderInsights();

    renderCategoryTable();
}


// =====================================================
// MÊS ATUAL
// =====================================================

function setCurrentMonth() {

    const today =
        new Date();


    const firstDay =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


    getElement(
        "startDate"
    ).value =
        formatInputDate(
            firstDay
        );


    getElement(
        "endDate"
    ).value =
        formatInputDate(
            today
        );


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


    renderReport();
}


// =====================================================
// EXPORTAR CSV
// =====================================================

function exportCsv() {

    if (
        reportTransactions.length === 0
    ) {

        showToast(
            "Não existem movimentações para exportar."
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
        reportTransactions.map(
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
                                    ).replace(
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


    link.href =
        url;


    link.download =
        `relatorio-financeiro-${
            getElement(
                "startDate"
            ).value ||
            "inicio"
        }-${
            getElement(
                "endDate"
            ).value ||
            "fim"
        }.csv`;


    document.body.appendChild(
        link
    );


    link.click();

    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "Relatório exportado em CSV."
    );
}


// =====================================================
// EXPORTAR JSON
// =====================================================

function exportJsonReport() {

    if (
        reportTransactions.length === 0
    ) {

        showToast(
            "Não existem dados para exportar."
        );

        return;
    }


    const report = {

        generatedAt:
            new Date()
                .toISOString(),

        period: {

            start:
                getElement(
                    "startDate"
                ).value,

            end:
                getElement(
                    "endDate"
                ).value
        },

        filters: {

            type:
                getElement(
                    "typeFilter"
                ).value,

            status:
                getElement(
                    "statusFilter"
                ).value,

            category:
                getElement(
                    "categoryFilter"
                ).value
        },

        transactions:
            reportTransactions
    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    report,
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
        "relatorio-clara-financas.json";


    document.body.appendChild(
        link
    );


    link.click();

    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "Relatório completo exportado."
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

        document.body
            .classList
            .add(
                "dark"
            );


        button.textContent =
            "☀";
    }


    button.addEventListener(
        "click",
        () => {

            document.body
                .classList
                .toggle(
                    "dark"
                );


            const isDark =
                document.body
                    .classList
                    .contains(
                        "dark"
                    );


            localStorage.setItem(

                THEME_KEY,

                isDark
                    ? "dark"
                    : "light"
            );


            button.textContent =
                isDark
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

            navigation
                .classList
                .toggle(
                    "show"
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

    const applyFiltersButton =
        getElement(
            "applyFiltersButton"
        );


    const currentMonthButton =
        getElement(
            "currentMonthButton"
        );


    const exportCsvButton =
        getElement(
            "exportCsvButton"
        );


    const exportReportButton =
        getElement(
            "exportReportButton"
        );


    const printButton =
        getElement(
            "printButton"
        );


    const logoutButton =
        getElement(
            "logoutButton"
        );


    if (applyFiltersButton) {

        applyFiltersButton
            .addEventListener(
                "click",
                renderReport
            );
    }


    if (currentMonthButton) {

        currentMonthButton
            .addEventListener(
                "click",
                setCurrentMonth
            );
    }


    if (exportCsvButton) {

        exportCsvButton
            .addEventListener(
                "click",
                exportCsv
            );
    }


    if (exportReportButton) {

        exportReportButton
            .addEventListener(
                "click",
                exportJsonReport
            );
    }


    if (printButton) {

        printButton
            .addEventListener(
                "click",
                () =>
                    window.print()
            );
    }


    if (logoutButton) {

        logoutButton
            .addEventListener(
                "click",
                logout
            );
    }


    [
        "startDate",
        "endDate",
        "typeFilter",
        "statusFilter",
        "categoryFilter"
    ].forEach(
        id => {

            const element =
                getElement(id);


            if (!element) {
                return;
            }


            element.addEventListener(
                "change",
                renderReport
            );
        }
    );
}


// =====================================================
// INICIALIZAR
// =====================================================

async function initializePage() {

    if (!getSession()) {
        return;
    }


    setupInitialDates();

    setupProfileMenu();

    setupTheme();

    setupMobileMenu();

    setupEvents();


    try {

        await Promise.all([
            renderUser(),
            loadCategories(),
            loadTransactions()
        ]);


        renderReport();


    } catch (error) {

        console.error(
            "Erro ao inicializar relatórios:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar relatórios."
        );
    }
}


initializePage();