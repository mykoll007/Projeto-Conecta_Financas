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
// ESTADO
// =====================================================

let schedules =
    [];


let currentPeriod =
    "today";


let scheduleToComplete =
    null;


let scheduleToDelete =
    null;


let currentCurrency =
    "BRL";


let currency =
    createCurrencyFormatter(
        currentCurrency
    );


// =====================================================
// FORMATADOR DE MOEDA
// =====================================================

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


// =====================================================
// LIMPAR SESSÃO
// =====================================================

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


    let data =
        null;


    try {

        data =
            await response.json();


    } catch (error) {

        data =
            null;
    }


    if (
        response.status ===
        401
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
// ESCAPE HTML
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


// =====================================================
// NORMALIZAR DATA
// =====================================================

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


// =====================================================
// FORMATAR DATA PARA INPUT
// =====================================================

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


    return (
        `${year}-${month}-${day}`
    );
}


// =====================================================
// DATA DE HOJE
// =====================================================

function getTodayString() {

    return formatInputDate(
        new Date()
    );
}


// =====================================================
// FORMATAR DATA
// =====================================================

function formatDate(
    value
) {

    const normalized =
        normalizeDate(
            value
        );


    if (!normalized) {

        return "-";
    }


    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            weekday:
                "long",

            day:
                "2-digit",

            month:
                "long"
        }
    ).format(
        new Date(
            `${normalized}T12:00:00`
        )
    );
}


// =====================================================
// FORMATAR DATA CURTA
// =====================================================

function formatShortDate(
    value
) {

    const normalized =
        normalizeDate(
            value
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


// =====================================================
// FORMATAR HORÁRIO
// =====================================================

function formatTime(
    value
) {

    if (!value) {

        return "--:--";
    }


    return String(
        value
    ).slice(
        0,
        5
    );
}


// =====================================================
// CARREGAR USUÁRIO
// =====================================================

async function loadUser() {

    try {

        const usuario =
            await apiRequest(
                "/usuarios/logado"
            );


        const name =
            usuario?.nome ||
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
// CARREGAR CONFIGURAÇÕES
// =====================================================

async function loadFinancialSettings() {

    try {

        const configuracao =
            await apiRequest(
                "/configuracoes"
            );


        currentCurrency =
            configuracao?.moeda ||
            "BRL";


        currency =
            createCurrencyFormatter(
                currentCurrency
            );


    } catch (error) {

        console.error(
            "Erro ao carregar configurações:",
            error
        );


        currentCurrency =
            "BRL";


        currency =
            createCurrencyFormatter(
                "BRL"
            );
    }
}


// =====================================================
// CARREGAR AGENDAMENTOS
// =====================================================

async function loadSchedules() {

    showAgendaLoading(
        true
    );


    try {

        const data =
            await apiRequest(
                "/agendamentos"
            );


        schedules =
            Array.isArray(
                data
            )
                ? data.map(
                    item => {

                        return {

                            id:
                                Number(
                                    item.id
                                ),

                            title:
                                item.titulo ||
                                "",

                            clientName:
                                item.cliente_nome ||
                                "",

                            description:
                                item.descricao ||
                                "",

                            date:
                                normalizeDate(
                                    item.data_agendamento
                                ),

                            time:
                                formatTime(
                                    item.horario
                                ),

                            value:
                                item.valor !== null &&
                                item.valor !== undefined
                                    ? Number(
                                        item.valor
                                    )
                                    : null,

                            financialType:
                                item.tipo_financeiro ||
                                "none",

                            status:
                                item.status ||
                                "scheduled",

                            observation:
                                item.observacao ||
                                "",

                            movementId:
                                item.movimentacao_id ||
                                null
                        };
                    }
                )
                : [];


        renderAgenda();


    } catch (error) {

        console.error(
            "Erro ao carregar agenda:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar agenda."
        );


    } finally {

        showAgendaLoading(
            false
        );
    }
}


// =====================================================
// REFRESH
// =====================================================

async function refreshAgenda() {

    await loadSchedules();
}


// =====================================================
// LOADING
// =====================================================

function showAgendaLoading(
    active
) {

    const loading =
        getElement(
            "agendaLoading"
        );


    const list =
        getElement(
            "agendaList"
        );


    const empty =
        getElement(
            "agendaEmptyState"
        );


    if (loading) {

        loading.hidden =
            !active;
    }


    if (active) {

        if (list) {

            list.hidden =
                true;
        }


        if (empty) {

            empty.hidden =
                true;
        }
    }
}


// =====================================================
// PERÍODO
// =====================================================

function getPeriodRange() {

    const today =
        new Date();


    today.setHours(
        12,
        0,
        0,
        0
    );


    if (
        currentPeriod ===
        "today"
    ) {

        const value =
            formatInputDate(
                today
            );


        return {
            start:
                value,

            end:
                value
        };
    }


    if (
        currentPeriod ===
        "week"
    ) {

        const start =
            new Date(
                today
            );


        const day =
            start.getDay();


        const difference =
            day === 0
                ? -6
                : 1 - day;


        start.setDate(
            start.getDate() +
            difference
        );


        const end =
            new Date(
                start
            );


        end.setDate(
            start.getDate() +
            6
        );


        return {

            start:
                formatInputDate(
                    start
                ),

            end:
                formatInputDate(
                    end
                )
        };
    }


    const start =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


    const end =
        new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        );


    return {

        start:
            formatInputDate(
                start
            ),

        end:
            formatInputDate(
                end
            )
    };
}


// =====================================================
// FILTRAR AGENDAMENTOS
// =====================================================

function getFilteredSchedules() {

    const search =
        getElement(
            "searchInput"
        )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const status =
        getElement(
            "statusFilter"
        )?.value ||
        "all";


    const financial =
        getElement(
            "financialFilter"
        )?.value ||
        "all";


    const range =
        getPeriodRange();


    return schedules
        .filter(
            schedule => {

                const matchesPeriod =
                    schedule.date >=
                        range.start &&
                    schedule.date <=
                        range.end;


                const searchText =
                    [
                        schedule.title,
                        schedule.clientName,
                        schedule.description,
                        schedule.observation
                    ]
                        .join(
                            " "
                        )
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchText.includes(
                        search
                    );


                const matchesStatus =
                    status === "all" ||
                    schedule.status ===
                        status;


                const matchesFinancial =
                    financial === "all" ||
                    schedule.financialType ===
                        financial;


                return (
                    matchesPeriod &&
                    matchesSearch &&
                    matchesStatus &&
                    matchesFinancial
                );
            }
        )
        .sort(
            (
                first,
                second
            ) => {

                const firstValue =
                    `${first.date} ${first.time}`;


                const secondValue =
                    `${second.date} ${second.time}`;


                return firstValue.localeCompare(
                    secondValue
                );
            }
        );
}


// =====================================================
// AGRUPAR POR DATA
// =====================================================

function groupSchedulesByDate(
    list
) {

    const groups =
        {};


    list.forEach(
        schedule => {

            if (
                !groups[
                    schedule.date
                ]
            ) {

                groups[
                    schedule.date
                ] = [];
            }


            groups[
                schedule.date
            ].push(
                schedule
            );
        }
    );


    return groups;
}


// =====================================================
// RENDER PRINCIPAL
// =====================================================

function renderAgenda() {

    renderSummary();


    renderPeriodTexts();


    renderFiltersState();


    const filtered =
        getFilteredSchedules();


    const list =
        getElement(
            "agendaList"
        );


    const empty =
        getElement(
            "agendaEmptyState"
        );


    if (!list) {
        return;
    }


    if (
        filtered.length ===
        0
    ) {

        list.hidden =
            true;


        if (empty) {

            empty.hidden =
                false;
        }


        list.innerHTML =
            "";


        return;
    }


    if (empty) {

        empty.hidden =
            true;
    }


    list.hidden =
        false;


    const grouped =
        groupSchedulesByDate(
            filtered
        );


    list.innerHTML =
        Object.entries(
            grouped
        )
            .map(
                (
                    [
                        date,
                        items
                    ]
                ) => {

                    return `
                        <section class="agenda-day">

                            <div class="agenda-day-title">

                                <strong>
                                    ${escapeHtml(
                                        formatDate(
                                            date
                                        )
                                    )}
                                </strong>

                                <span>
                                    ${items.length}
                                    compromisso${
                                        items.length === 1
                                            ? ""
                                            : "s"
                                    }
                                </span>

                            </div>


                            ${items
                                .map(
                                    renderScheduleItem
                                )
                                .join(
                                    ""
                                )}

                        </section>
                    `;
                }
            )
            .join(
                ""
            );


    setupScheduleActions();
}


// =====================================================
// RENDER ITEM
// =====================================================

function renderScheduleItem(
    schedule
) {

    const statusText =
        getStatusText(
            schedule.status
        );


    const financialText =
        getFinancialValueText(
            schedule
        );


    const secondaryText =
        [
            schedule.clientName,
            schedule.description
        ]
            .filter(
                Boolean
            )
            .join(
                " · "
            ) ||
        "Sem detalhes";


    const canManage =
        schedule.status ===
        "scheduled";


    return `
        <article
            class="agenda-item ${schedule.status}"
        >

            <div class="agenda-time">
                ${escapeHtml(
                    schedule.time
                )}
            </div>


            <div class="agenda-main">

                <strong>
                    ${escapeHtml(
                        schedule.title
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        secondaryText
                    )}
                </span>

            </div>


            <div
                class="agenda-value ${schedule.financialType}"
            >
                ${escapeHtml(
                    financialText
                )}
            </div>


            <span
                class="status-badge ${schedule.status}"
            >
                ${escapeHtml(
                    statusText
                )}
            </span>


            <div class="agenda-actions">

                ${
                    canManage
                        ? `
                            <button
                                type="button"
                                class="action-button complete-schedule"
                                data-id="${schedule.id}"
                                title="Concluir"
                                aria-label="Concluir compromisso"
                            >
                                ✓
                            </button>


                            <button
                                type="button"
                                class="action-button edit-schedule"
                                data-id="${schedule.id}"
                                title="Editar"
                                aria-label="Editar compromisso"
                            >
                                ✎
                            </button>


                            <button
                                type="button"
                                class="action-button cancel cancel-schedule"
                                data-id="${schedule.id}"
                                title="Cancelar"
                                aria-label="Cancelar compromisso"
                            >
                                ⊘
                            </button>
                        `
                        : ""
                }


                <button
                    type="button"
                    class="action-button delete delete-schedule"
                    data-id="${schedule.id}"
                    title="Excluir"
                    aria-label="Excluir compromisso"
                >
                    ×
                </button>

            </div>

        </article>
    `;
}


// =====================================================
// STATUS
// =====================================================

function getStatusText(
    status
) {

    if (
        status ===
        "completed"
    ) {

        return "Concluído";
    }


    if (
        status ===
        "cancelled"
    ) {

        return "Cancelado";
    }


    return "Agendado";
}


// =====================================================
// TEXTO VALOR
// =====================================================

function getFinancialValueText(
    schedule
) {

    if (
        schedule.value ===
            null ||
        schedule.value ===
            undefined
    ) {

        return "Sem valor";
    }


    if (
        schedule.financialType ===
        "income"
    ) {

        return (
            `+ ${currency.format(
                schedule.value
            )}`
        );
    }


    if (
        schedule.financialType ===
        "expense"
    ) {

        return (
            `− ${currency.format(
                schedule.value
            )}`
        );
    }


    return currency.format(
        schedule.value
    );
}


// =====================================================
// RESUMO
// =====================================================

function renderSummary() {

    const today =
        getTodayString();


    const todaySchedules =
        schedules.filter(
            schedule =>
                schedule.date ===
                    today &&
                schedule.status !==
                    "cancelled"
        );


    const scheduled =
        schedules.filter(
            schedule =>
                schedule.status ===
                "scheduled"
        );


    const range =
        getPeriodRange();


    const completed =
        schedules.filter(
            schedule => {

                return (
                    schedule.status ===
                        "completed" &&
                    schedule.date >=
                        range.start &&
                    schedule.date <=
                        range.end
                );
            }
        );


    const scheduledValue =
        scheduled
            .filter(
                schedule => {

                    return (
                        schedule.date >=
                            range.start &&
                        schedule.date <=
                            range.end &&
                        schedule.value !==
                            null
                    );
                }
            )
            .reduce(
                (
                    total,
                    schedule
                ) => {

                    return (
                        total +
                        Number(
                            schedule.value
                        )
                    );
                },
                0
            );


    const todayCount =
        getElement(
            "todayCount"
        );


    const scheduledCount =
        getElement(
            "scheduledCount"
        );


    const completedCount =
        getElement(
            "completedCount"
        );


    const scheduledValueElement =
        getElement(
            "scheduledValue"
        );


    if (todayCount) {

        todayCount.textContent =
            todaySchedules.length;
    }


    if (scheduledCount) {

        scheduledCount.textContent =
            scheduled.length;
    }


    if (completedCount) {

        completedCount.textContent =
            completed.length;
    }


    if (
        scheduledValueElement
    ) {

        scheduledValueElement.textContent =
            currency.format(
                scheduledValue
            );
    }
}


// =====================================================
// TEXTOS DO PERÍODO
// =====================================================

function renderPeriodTexts() {

    const title =
        getElement(
            "agendaTitle"
        );


    const description =
        getElement(
            "agendaDescription"
        );


    if (
        currentPeriod ===
        "today"
    ) {

        if (title) {

            title.textContent =
                "Compromissos de hoje";
        }


        if (description) {

            description.textContent =
                "Veja os horários agendados para hoje.";
        }


        return;
    }


    if (
        currentPeriod ===
        "week"
    ) {

        if (title) {

            title.textContent =
                "Compromissos da semana";
        }


        if (description) {

            description.textContent =
                "Veja seus compromissos desta semana.";
        }


        return;
    }


    if (title) {

        title.textContent =
            "Compromissos do mês";
    }


    if (description) {

        description.textContent =
            "Veja seus compromissos deste mês.";
    }
}


// =====================================================
// ABRIR NOVO
// =====================================================

function openNewScheduleModal() {

    const form =
        getElement(
            "scheduleForm"
        );


    if (!form) {
        return;
    }


    form.reset();


    getElement(
        "scheduleId"
    ).value =
        "";


    getElement(
        "scheduleModalTitle"
    ).textContent =
        "Novo compromisso";


    getElement(
        "scheduleModalLabel"
    ).textContent =
        "Agenda";


    getElement(
        "scheduleDate"
    ).value =
        getTodayString();


    getElement(
        "financialType"
    ).value =
        "none";


    getElement(
        "scheduleModal"
    )?.showModal();


    setTimeout(
        () => {

            getElement(
                "scheduleTitle"
            )?.focus();

        },
        80
    );
}


// =====================================================
// ABRIR EDIÇÃO
// =====================================================

function openEditScheduleModal(
    id
) {

    const schedule =
        schedules.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    id
                )
        );


    if (!schedule) {

        showToast(
            "Compromisso não encontrado."
        );

        return;
    }


    if (
        schedule.status !==
        "scheduled"
    ) {

        showToast(
            "Somente compromissos agendados podem ser editados."
        );

        return;
    }


    const form =
        getElement(
            "scheduleForm"
        );


    form?.reset();


    getElement(
        "scheduleId"
    ).value =
        schedule.id;


    getElement(
        "scheduleModalTitle"
    ).textContent =
        "Editar compromisso";


    getElement(
        "scheduleTitle"
    ).value =
        schedule.title;


    getElement(
        "clientName"
    ).value =
        schedule.clientName;


    getElement(
        "scheduleDescription"
    ).value =
        schedule.description;


    getElement(
        "scheduleDate"
    ).value =
        schedule.date;


    getElement(
        "scheduleTime"
    ).value =
        schedule.time;


    getElement(
        "scheduleValue"
    ).value =
        schedule.value ??
        "";


    getElement(
        "financialType"
    ).value =
        schedule.financialType;


    getElement(
        "scheduleObservation"
    ).value =
        schedule.observation;


    getElement(
        "scheduleModal"
    )?.showModal();
}


// =====================================================
// SALVAR
// =====================================================

async function saveSchedule(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const id =
        getElement(
            "scheduleId"
        )?.value ||
        "";


    const title =
        getElement(
            "scheduleTitle"
        )
            ?.value
            .trim() ||
        "";


    const clientName =
        getElement(
            "clientName"
        )
            ?.value
            .trim() ||
        "";


    const description =
        getElement(
            "scheduleDescription"
        )
            ?.value
            .trim() ||
        "";


    const date =
        getElement(
            "scheduleDate"
        )?.value ||
        "";


    const time =
        getElement(
            "scheduleTime"
        )?.value ||
        "";


    const valueText =
        getElement(
            "scheduleValue"
        )?.value ||
        "";


    const financialType =
        getElement(
            "financialType"
        )?.value ||
        "none";


    const observation =
        getElement(
            "scheduleObservation"
        )
            ?.value
            .trim() ||
        "";


    if (
        !title ||
        !date ||
        !time
    ) {

        showToast(
            "Informe título, data e horário."
        );

        return;
    }


    let value =
        null;


    if (
        valueText !==
        ""
    ) {

        value =
            Number(
                valueText
            );


        if (
            Number.isNaN(
                value
            ) ||
            value < 0
        ) {

            showToast(
                "Informe um valor válido."
            );

            return;
        }
    }


    if (
        value ===
            null &&
        financialType !==
            "none"
    ) {

        showToast(
            "Informe um valor para lançar no financeiro."
        );

        return;
    }


    const button =
        getElement(
            "saveScheduleButton"
        );


    try {

        if (button) {

            button.disabled =
                true;


            button.textContent =
                id
                    ? "Salvando..."
                    : "Agendando...";
        }


        const body = {

            titulo:
                title,

            cliente_nome:
                clientName ||
                null,

            descricao:
                description ||
                null,

            data_agendamento:
                date,

            horario:
                time,

            valor:
                value,

            tipo_financeiro:
                financialType,

            observacao:
                observation ||
                null
        };


        let result;


        if (id) {

            result =
                await apiRequest(
                    `/agendamentos/${id}`,
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

            result =
                await apiRequest(
                    "/agendamentos",
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
            "scheduleModal"
        )?.close();


        form.reset();


        showToast(
            result?.message ||
            (
                id
                    ? "Compromisso atualizado."
                    : "Compromisso criado."
            )
        );


        await refreshAgenda();


    } catch (error) {

        console.error(
            "Erro ao salvar agendamento:",
            error
        );


        showToast(
            error.message ||
            "Erro ao salvar compromisso."
        );


    } finally {

        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Salvar compromisso";
        }
    }
}


// =====================================================
// ABRIR CONCLUSÃO
// =====================================================

function openCompleteModal(
    id
) {

    const schedule =
        schedules.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    id
                )
        );


    if (!schedule) {

        return;
    }


    scheduleToComplete =
        schedule.id;


    const text =
        getElement(
            "completeModalText"
        );


    if (text) {

        text.textContent =
            schedule.clientName
                ? `Concluir "${schedule.title}" de ${schedule.clientName}?`
                : `Concluir "${schedule.title}"?`;
    }


    const preview =
        getElement(
            "financePreview"
        );


    const previewValue =
        getElement(
            "financePreviewValue"
        );


    const previewType =
        getElement(
            "financePreviewType"
        );


    const hasFinancialMovement =
        schedule.value !==
            null &&
        schedule.value >
            0 &&
        (
            schedule.financialType ===
                "income" ||
            schedule.financialType ===
                "expense"
        );


    if (preview) {

        preview.hidden =
            !hasFinancialMovement;
    }


    if (
        hasFinancialMovement &&
        previewValue
    ) {

        previewValue.textContent =
            currency.format(
                schedule.value
            );
    }


    if (
        hasFinancialMovement &&
        previewType
    ) {

        previewType.textContent =
            schedule.financialType ===
                "income"
                ? "Será lançado como entrada"
                : "Será lançado como despesa";
    }


    getElement(
        "completeModal"
    )?.showModal();
}


// =====================================================
// CONCLUIR
// =====================================================

async function completeSchedule() {

    if (!scheduleToComplete) {
        return;
    }


    const button =
        getElement(
            "confirmCompleteButton"
        );


    try {

        if (button) {

            button.disabled =
                true;


            button.textContent =
                "Concluindo...";
        }


        const result =
            await apiRequest(
                `/agendamentos/${scheduleToComplete}/concluir`,
                {
                    method:
                        "PUT"
                }
            );


        scheduleToComplete =
            null;


        getElement(
            "completeModal"
        )?.close();


        showToast(
            result?.message ||
            "Compromisso concluído."
        );


        await refreshAgenda();


    } catch (error) {

        console.error(
            "Erro ao concluir compromisso:",
            error
        );


        showToast(
            error.message ||
            "Erro ao concluir compromisso."
        );


    } finally {

        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Concluir";
        }
    }
}


// =====================================================
// CANCELAR
// =====================================================

async function cancelSchedule(
    id
) {

    try {

        const result =
            await apiRequest(
                `/agendamentos/${id}/cancelar`,
                {
                    method:
                        "PUT"
                }
            );


        showToast(
            result?.message ||
            "Compromisso cancelado."
        );


        await refreshAgenda();


    } catch (error) {

        console.error(
            "Erro ao cancelar compromisso:",
            error
        );


        showToast(
            error.message ||
            "Erro ao cancelar compromisso."
        );
    }
}


// =====================================================
// ABRIR EXCLUSÃO
// =====================================================

function openDeleteModal(
    id
) {

    scheduleToDelete =
        Number(
            id
        );


    getElement(
        "deleteModal"
    )?.showModal();
}


// =====================================================
// EXCLUIR
// =====================================================

async function deleteSchedule() {

    if (!scheduleToDelete) {
        return;
    }


    const button =
        getElement(
            "confirmDeleteButton"
        );


    try {

        if (button) {

            button.disabled =
                true;


            button.textContent =
                "Excluindo...";
        }


        const result =
            await apiRequest(
                `/agendamentos/${scheduleToDelete}`,
                {
                    method:
                        "DELETE"
                }
            );


        scheduleToDelete =
            null;


        getElement(
            "deleteModal"
        )?.close();


        showToast(
            result?.message ||
            "Compromisso excluído."
        );


        await refreshAgenda();


    } catch (error) {

        console.error(
            "Erro ao excluir compromisso:",
            error
        );


        showToast(
            error.message ||
            "Erro ao excluir compromisso."
        );


    } finally {

        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Excluir";
        }
    }
}


// =====================================================
// AÇÕES DOS ITENS
// =====================================================

function setupScheduleActions() {

    document
        .querySelectorAll(
            ".edit-schedule"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openEditScheduleModal(
                            button.dataset.id
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".complete-schedule"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openCompleteModal(
                            button.dataset.id
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".cancel-schedule"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        cancelSchedule(
                            button.dataset.id
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".delete-schedule"
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
// FILTROS ATIVOS
// =====================================================

function renderFiltersState() {

    const status =
        getElement(
            "statusFilter"
        )?.value ||
        "all";


    const financial =
        getElement(
            "financialFilter"
        )?.value ||
        "all";


    const dot =
        getElement(
            "filterActiveDot"
        );


    const active =
        status !==
            "all" ||
        financial !==
            "all";


    if (dot) {

        dot.hidden =
            !active;
    }
}


// =====================================================
// LIMPAR FILTROS
// =====================================================

function clearFilters() {

    const status =
        getElement(
            "statusFilter"
        );


    const financial =
        getElement(
            "financialFilter"
        );


    if (status) {

        status.value =
            "all";
    }


    if (financial) {

        financial.value =
            "all";
    }


    renderAgenda();


    getElement(
        "filtersModal"
    )?.close();
}


// =====================================================
// PERÍODO
// =====================================================

function setPeriod(
    period
) {

    currentPeriod =
        period;


    document
        .querySelectorAll(
            ".period-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.period ===
                        period
                );
            }
        );


    renderAgenda();
}


// =====================================================
// BUSCA COM LOADING
// =====================================================

let searchTimeout =
    null;


function setupSearch() {

    const input =
        getElement(
            "searchInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        () => {

            const loading =
                getElement(
                    "searchLoading"
                );


            if (loading) {

                loading.hidden =
                    false;
            }


            clearTimeout(
                searchTimeout
            );


            searchTimeout =
                setTimeout(
                    () => {

                        renderAgenda();


                        if (loading) {

                            loading.hidden =
                                true;
                        }

                    },
                    250
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
                            modal?.open
                        ) {

                            modal.close();
                        }


                        if (
                            modal?.id ===
                            "completeModal"
                        ) {

                            scheduleToComplete =
                                null;
                        }


                        if (
                            modal?.id ===
                            "deleteModal"
                        ) {

                            scheduleToDelete =
                                null;
                        }
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


            const open =
                dropdown.classList.toggle(
                    "show"
                );


            button.setAttribute(
                "aria-expanded",
                String(
                    open
                )
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


    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );


    if (
        savedTheme ===
        "dark"
    ) {

        document.body.classList.add(
            "dark"
        );
    }


    if (
        savedTheme ===
        "system"
    ) {

        const dark =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;


        document.body.classList.toggle(
            "dark",
            dark
        );
    }


    if (button) {

        button.textContent =
            document.body.classList.contains(
                "dark"
            )
                ? "☀"
                : "☾";


        button.addEventListener(
            "click",
            () => {

                const dark =
                    document.body.classList.toggle(
                        "dark"
                    );


                localStorage.setItem(
                    THEME_KEY,
                    dark
                        ? "dark"
                        : "light"
                );


                button.textContent =
                    dark
                        ? "☀"
                        : "☾";
            }
        );
    }
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

    // Novo

    getElement(
        "newScheduleButton"
    )?.addEventListener(
        "click",
        openNewScheduleModal
    );


    getElement(
        "emptyNewScheduleButton"
    )?.addEventListener(
        "click",
        openNewScheduleModal
    );


    // Salvar

    getElement(
        "scheduleForm"
    )?.addEventListener(
        "submit",
        saveSchedule
    );


    // Concluir

    getElement(
        "confirmCompleteButton"
    )?.addEventListener(
        "click",
        completeSchedule
    );


    // Excluir

    getElement(
        "confirmDeleteButton"
    )?.addEventListener(
        "click",
        deleteSchedule
    );


    // Períodos

    document
        .querySelectorAll(
            ".period-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        setPeriod(
                            button.dataset.period
                        );
                    }
                );
            }
        );


    // Filtros

    getElement(
        "openFiltersButton"
    )?.addEventListener(
        "click",
        () => {

            getElement(
                "filtersModal"
            )?.showModal();
        }
    );


    getElement(
        "applyFiltersButton"
    )?.addEventListener(
        "click",
        () => {

            renderAgenda();


            getElement(
                "filtersModal"
            )?.close();
        }
    );


    getElement(
        "clearFiltersButton"
    )?.addEventListener(
        "click",
        clearFilters
    );


    // Logout

    getElement(
        "logoutButton"
    )?.addEventListener(
        "click",
        logout
    );
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


    setupProfileMenu();

    setupTheme();

    setupMobileMenu();

    setupModalClosing();

    setupEvents();

    setupSearch();


    try {

        await Promise.all([
            loadUser(),
            loadFinancialSettings()
        ]);


        await loadSchedules();


    } catch (error) {

        console.error(
            "Erro ao inicializar agenda:",
            error
        );


        showToast(
            error.message ||
            "Erro ao carregar agenda."
        );
    }
}


// =====================================================
// INICIAR
// =====================================================

initializePage();