(() => {
    "use strict";

    // =========================================
    // ELEMENTOS
    // =========================================

    const button = document.getElementById("importNubank");
    const dialog = document.getElementById("nubankDialog");
    const file = document.getElementById("nubankFile");
    const rows = document.getElementById("nubankRows");
    const info = document.getElementById("nubankInfo");
    const save = document.getElementById("nubankSave");
    const close = document.getElementById("nubankClose");

    const selectAll = document.getElementById("nubankSelectAll");

    const selectedCount = document.getElementById(
        "nubankSelectedCount"
    );

    if (!button || !dialog || !file || !rows || !info || !save || !close) {
        console.error("Elementos do importador não encontrados.");
        return;
    }

    let entries = [];

    const months = [
        "JAN", "FEV", "MAR", "ABR",
        "MAI", "JUN", "JUL", "AGO",
        "SET", "OUT", "NOV", "DEZ"
    ];

    // =========================================
    // AVISO DE VALIDAÇÃO DO IMPORTADOR
    // =========================================

    let importWarningTimer;

    function showImportWarning(message) {

        let warning = document.getElementById(
            "nubankWarning"
        );

        if (!warning) {

            warning = document.createElement("div");

            warning.id = "nubankWarning";

            warning.className = "nubank-warning";

            warning.setAttribute("role", "alert");

            dialog.appendChild(warning);
        }

        warning.replaceChildren();

        const icon = document.createElement("span");

        icon.className = "nubank-warning-icon";
        icon.textContent = "!";

        const content = document.createElement("div");

        const title = document.createElement("strong");

        title.textContent = "Atenção";

        const description = document.createElement("p");

        description.textContent = message;

        content.append(title, description);

        warning.append(icon, content);

        warning.classList.add("show");

        clearTimeout(importWarningTimer);

        importWarningTimer = setTimeout(() => {

            warning.classList.remove("show");

        }, 6000);
    }

    // =========================================
    // FUNÇÕES AUXILIARES
    // =========================================

    function normalize(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function parseValue(value) {
        return Number(
            String(value)
                .replace(/\./g, "")
                .replace(",", ".")
        );
    }

    function formatCurrency(value) {
        return Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function formatDateBR(date) {
        const [year, month, day] = date.split("-");
        return `${day}/${month}/${year}`;
    }

    function cents(value) {
        return Math.round(Number(value) * 100);
    }

    // =========================================
    // LIMPAR DESCRIÇÃO
    // =========================================

    function cleanDescription(description) {
        return String(description || "")
            .split(/\s+-\s+(?=\d|•)/)[0]
            .replace(/\s*\(Transferência.*$/i, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    // =========================================
    // IDENTIFICAR CATEGORIA
    // =========================================

    function suggestCategory(description) {
        const text = normalize(description);

        const rules = [
            {
                keywords: [
                    "spotify", "netflix", "amazon prime",
                    "disney", "youtube premium", "deezer"
                ],
                categories: ["assinatura", "streaming", "lazer"]
            },
            {
                keywords: [
                    "uber", "99app", "99 tecnologia",
                    "posto", "combustivel"
                ],
                categories: ["transporte", "combustivel"]
            },
            {
                keywords: [
                    "ifood", "restaurante", "lanchonete",
                    "kibe", "pizzaria", "padaria"
                ],
                categories: ["alimentacao", "restaurante"]
            },
            {
                keywords: [
                    "supermercado", "atacadao",
                    "assai", "carrefour", "mercado"
                ],
                categories: ["mercado", "alimentacao"]
            },
            {
                keywords: [
                    "star games", "steam", "riot games",
                    "playstation", "xbox", "epic games"
                ],
                categories: ["jogos", "lazer", "entretenimento"]
            },
            {
                keywords: [
                    "universidade", "unicid", "faculdade",
                    "escola", "curso", "udemy"
                ],
                categories: ["educacao", "estudos"]
            },
            {
                keywords: [
                    "drogasil", "drogaria", "farmacia",
                    "droga raia"
                ],
                categories: ["farmacia", "saude"]
            },
            {
                keywords: [
                    "doctoralia", "hospital",
                    "clinica", "laboratorio"
                ],
                categories: ["saude"]
            },
            {
                keywords: [
                    "enel", "cpfl", "energia eletrica"
                ],
                categories: ["energia", "contas fixas", "moradia"]
            },
            {
                keywords: ["sabesp", "agua e esgoto"],
                categories: ["agua", "contas fixas", "moradia"]
            },
            {
                keywords: ["vivo", "claro", "tim", "internet"],
                categories: ["internet", "telefone", "contas fixas"]
            },
            {
                keywords: ["facebook", "meta ads", "google ads"],
                categories: ["publicidade", "marketing", "trabalho"]
            },
            {
                keywords: ["simples nacional", "receita federal"],
                categories: ["impostos", "tributos"]
            },
            {
                keywords: ["igreja", "dizimo", "oferta religiosa"],
                categories: ["doacao", "igreja", "outros"]
            },
            {
                keywords: ["academia", "smart fit", "cia do corpo"],
                categories: ["academia", "saude"]
            },
            {
                keywords: ["salario", "pagamento salarial"],
                categories: ["salario", "receitas"]
            }
        ];

        const categories = appData.categories || [];

        for (const rule of rules) {
            const matched = rule.keywords.some(
                keyword => text.includes(keyword)
            );

            if (!matched) continue;

            for (const hint of rule.categories) {
                const category = categories.find(category =>
                    normalize(
                        category.nome || category.name
                    ).includes(hint)
                );

                if (category) {
                    return String(category.id);
                }
            }
        }

        return "";
    }

    // =========================================
    // IDENTIFICAR FORMA DE PAGAMENTO
    // =========================================

    function identifyPayment(kind) {
        const text = normalize(kind);

        if (text.includes("pix")) {
            return "Pix";
        }

        if (text.includes("boleto")) {
            return "Boleto";
        }

        if (
            text.includes("debito via") ||
            text.includes("compra no debito")
        ) {
            return "Cartão de débito";
        }

        if (text.includes("fatura")) {
            return "Cartão de crédito";
        }

        return "Transferência";
    }

    // =========================================
    // CLASSIFICAR MOVIMENTAÇÃO
    // =========================================

    function classifyEntry(entry, owner) {
        const kind = normalize(entry.kind);
        const description = normalize(entry.description);
        const normalizedOwner = normalize(owner);

        const ownTransfer =
            normalizedOwner.length > 5 &&
            description.includes(normalizedOwner);

        const isInvestment =
            kind.includes("aplicacao rdb") ||
            kind.includes("resgate rdb");

        const isInvoice = kind.includes("fatura");
        const isLoan = kind.includes("emprestimo");

        const isUnknown =
            kind.includes("credito em conta") ||
            kind.includes("debito em conta");

        let type = entry.type;
        let selected = entry.type === "expense";
        let warning = "";

        if (ownTransfer) {
            selected = false;
            warning = "Possível transferência entre contas próprias";
        }

        if (isInvestment) {
            selected = false;
            warning = "Movimentação de investimento";

            if (kind.includes("aplicacao")) {
                type = "saved";
            }
        }

        if (isInvoice) {
            selected = false;
            warning = "Pagamento de fatura";
        }

        if (isLoan) {
            selected = false;
            warning = "Movimentação de empréstimo";
        }

        if (isUnknown) {
            selected = false;
            warning = "Classificação precisa ser confirmada";
        }

        if (entry.type === "income" && !warning) {
            selected = false;
            warning = "Confirme se é uma receita";
        }

        return {
            ...entry,
            type,
            selected,
            warning,
            description: cleanDescription(entry.description),
            payment: identifyPayment(entry.kind),
            category: ""
        };
    }

    // =========================================
    // INTERPRETAR EXTRATO NUBANK
    // =========================================

    function parseNubankStatement(lines) {
        let date = "";
        let type = "";
        let active = false;
        let owner = "";
        let current = null;
        let group = null;

        const result = [];
        const groups = [];

        const transactionPattern =
            /^(Transferência (?:Recebida|recebida pelo Pix(?: via)?|enviada pelo Pix)|Crédito em conta|Débito em conta|Resgate RDB|Aplicação RDB|Pagamento de fatura|Resgate de empréstimo|Pagamento de boleto efetuado|Compra no débito via NuPay)\s*(.*?)\s+([\d.]+,\d{2})$/i;

        for (const raw of lines) {
            const line = raw.trim();

            if (!line) continue;

            if (!active && !owner && !line.includes("CPF")) {
                owner = line;
            }

            if (normalize(line) === "movimentacoes") {
                active = true;
                continue;
            }

            if (!active) continue;

            if (
                /Tem alguma dúvida|Extrato gerado|^CPF|^\d{2} DE |^Saldo |^O saldo líquido|^Nu Financeira/i.test(line)
            ) {
                current = null;
                continue;
            }

            if (normalize(line) === normalize(owner)) {
                continue;
            }

            // Identifica datas como:
            // 06 NOV 2026 Total de saídas - 5.036,97

            const dateMatch = line.match(
                /^(\d{2})\s+([A-Z]{3})\s+(\d{4})\s+(.*)$/
            );

            let rest = line;

            if (dateMatch) {
                const day = dateMatch[1];
                const monthIndex = months.indexOf(dateMatch[2]);
                const year = dateMatch[3];

                if (monthIndex < 0) continue;

                const month = String(
                    monthIndex + 1
                ).padStart(2, "0");

                date = `${year}-${month}-${day}`;
                rest = dateMatch[4];
            }

            // Identifica subtotais de entradas e saídas.

            const totalMatch = rest.match(
                /^Total de (entradas|saídas)\s+[+-]\s*([\d.]+,\d{2})$/i
            );

            if (totalMatch) {
                type =
                    normalize(totalMatch[1]) === "entradas"
                        ? "income"
                        : "expense";

                group = {
                    date,
                    type,
                    expected: parseValue(totalMatch[2]),
                    actual: 0
                };

                groups.push(group);
                current = null;

                continue;
            }

            // Identifica uma movimentação individual.

            const transaction = rest.match(transactionPattern);

            if (transaction && date && group) {
                const kind = transaction[1];

                const description =
                    transaction[2] || transaction[1];

                const amount = parseValue(transaction[3]);

                current = {
                    date,
                    type,
                    kind,
                    description,
                    amount
                };

                result.push(current);
                group.actual += amount;

                continue;
            }

            // Complementa descrições quebradas entre páginas.

            if (
                current &&
                /^SOFTWARE LTDA\b/i.test(rest)
            ) {
                current.description += " " + rest;
            }
        }

        if (!result.length) {
            throw new Error(
                "Nenhuma movimentação foi identificada no PDF."
            );
        }

        // Confere os subtotais para evitar importação incompleta.

        const invalidGroups = groups.filter(group =>
            cents(group.expected) !== cents(group.actual)
        );

        if (invalidGroups.length) {
            console.warn(
                "Subtotais divergentes:",
                invalidGroups
            );

            throw new Error(
                "Não foi possível conferir todos os valores do extrato. " +
                "Nenhum lançamento foi salvo."
            );
        }

        return result.map(entry =>
            classifyEntry(entry, owner)
        );
    }

    // =========================================
    // EXTRAIR TEXTO DO PDF
    // =========================================

    async function extractPDF(selectedFile) {
        const pdfjs = await import(
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs"
        );

        pdfjs.GlobalWorkerOptions.workerSrc =
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

        const buffer = await selectedFile.arrayBuffer();

        const pdf = await pdfjs.getDocument({
            data: buffer
        }).promise;

        const lines = [];

        for (let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {
            info.textContent =
                `Lendo página ${pageNumber} de ${pdf.numPages}...`;

            const page = await pdf.getPage(pageNumber);

            const content = await page.getTextContent();

            const groups = [];

            for (const item of content.items) {
                if (!item.str?.trim()) continue;

                const y = item.transform[5];

                let group = groups.find(
                    group => Math.abs(group.y - y) < 2
                );

                if (!group) {
                    group = {
                        y,
                        items: []
                    };

                    groups.push(group);
                }

                group.items.push(item);
            }

            groups.sort((a, b) => b.y - a.y);

            for (const group of groups) {
                const line = group.items
                    .sort(
                        (a, b) =>
                            a.transform[4] - b.transform[4]
                    )
                    .map(item => item.str.trim())
                    .join(" ");

                lines.push(line);
            }
        }

        return lines;
    }

    // =========================================
    // ATUALIZAR RESUMO
    // =========================================

    function updateSummary() {
        const selected = entries.filter(
            entry => entry.selected
        );

        const income = selected
            .filter(entry => entry.type === "income")
            .reduce((total, entry) => total + entry.amount, 0);

        const expense = selected
            .filter(entry => entry.type === "expense")
            .reduce((total, entry) => total + entry.amount, 0);

        const saved = selected
            .filter(entry => entry.type === "saved")
            .reduce((total, entry) => total + entry.amount, 0);

        info.textContent =
            `${entries.length} movimentações identificadas | ` +
            `${selected.length} selecionadas | ` +
            `Entradas: ${formatCurrency(income)} | ` +
            `Despesas: ${formatCurrency(expense)} | ` +
            `Reservas: ${formatCurrency(saved)}`;

        save.disabled = selected.length === 0;

        // Atualizar quantidade selecionada

        if (selectedCount) {
            selectedCount.textContent =
                `${selected.length} de ${entries.length} selecionadas`;
        }

        // Atualizar botão selecionar tudo

        if (selectAll) {

            const allSelected =
                entries.length > 0 &&
                entries.every(entry => entry.selected);

            selectAll.disabled =
                entries.length === 0 || file.disabled;

            selectAll.innerHTML = allSelected
                ? `
            <i class="fa-regular fa-square"></i>
            <span>Desmarcar tudo</span>
          `
                : `
            <i class="fa-solid fa-square-check"></i>
            <span>Selecionar tudo</span>
          `;
        }
    }

    // =========================================
    // RENDERIZAR MOVIMENTAÇÕES
    // =========================================

    function renderEntries() {
        rows.replaceChildren();

        for (const entry of entries) {
            const row = document.createElement("div");

            row.className = "nubank-row";

            // Checkbox

            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.checked = entry.selected;
checkbox.addEventListener("change", () => {

    entry.selected = checkbox.checked;

    if (!entry.selected) {

        row.classList.remove("nubank-row-invalid");

        row.querySelectorAll(".nubank-field-invalid")
            .forEach(field => {
                field.classList.remove("nubank-field-invalid");
            });
    }

    updateSummary();
});

            // Data e informações

            const label = document.createElement("small");

            label.textContent =
                `${formatDateBR(entry.date)} | ${entry.kind}`;

            if (entry.warning) {
                label.textContent += ` | ${entry.warning}`;
                label.style.color = "#f59e0b";
            }

            // Descrição editável

            const description = document.createElement("input");

            description.type = "text";
            description.value = entry.description;
            description.placeholder = "Descrição";

            description.addEventListener("input", () => {
                entry.description = description.value;
            });

            // Tipo de movimentação

            const type = document.createElement("select");

            type.add(new Option("Despesa", "expense"));
            type.add(new Option("Receita", "income"));
            type.add(new Option("Reserva", "saved"));

            type.value = entry.type;

            type.addEventListener("change", () => {
                entry.type = type.value;
                updateSummary();
            });

            // Categoria

            const category = document.createElement("select");

            category.add(new Option("Categoria...", ""));

            for (const item of appData.categories || []) {
                category.add(
                    new Option(
                        item.nome || item.name,
                        String(item.id)
                    )
                );
            }

            category.value = entry.category || "";
            category.addEventListener("change", () => {

                entry.category = category.value;

                category.classList.toggle(
                    "nubank-field-invalid",
                    entry.selected && !category.value
                );

                if (!row.querySelector(".nubank-field-invalid")) {

                    row.classList.remove("nubank-row-invalid");
                }

                updateSummary();
            });

            // Valor editável

            const amount = document.createElement("input");

            amount.type = "number";
            amount.min = "0.01";
            amount.step = "0.01";
            amount.value = entry.amount.toFixed(2);

            amount.addEventListener("input", () => {
                entry.amount = Number(amount.value);
                updateSummary();
            });

            row.append(
                checkbox,
                label,
                description,
                type,
                category,
                amount
            );

            rows.appendChild(row);
        }

        updateSummary();
    }

    // =========================================
    // VERIFICAR DUPLICIDADE
    // =========================================

    function isDuplicate(entry) {
        return (appData.transactions || []).some(transaction => {
            return (
                transaction.date === entry.date &&
                transaction.type === entry.type &&
                cents(transaction.amount) === cents(entry.amount) &&
                normalize(transaction.description) ===
                normalize(entry.description)
            );
        });
    }
    // =========================================
    // SELECIONAR E DESMARCAR TODAS
    // =========================================

    selectAll?.addEventListener("click", () => {

        if (!entries.length || file.disabled) return;

        const allSelected = entries.every(
            entry => entry.selected
        );

        entries.forEach(entry => {
            entry.selected = !allSelected;
        });

        renderEntries();
    });


    // =========================================
    // ABRIR E FECHAR MODAL
    // =========================================

    button.addEventListener("click", () => {
        dialog.showModal();
    });

    close.addEventListener("click", () => {
        dialog.close();
    });

    // =========================================
    // IMPORTAR ARQUIVO
    // =========================================

    file.addEventListener("change", async () => {
        const selectedFile = file.files[0];

        if (!selectedFile) return;

        if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
            info.textContent = "Selecione um arquivo PDF válido.";
            return;
        }

        entries = [];

        rows.replaceChildren();

        save.disabled = true;
        file.disabled = true;

        if (selectAll) selectAll.disabled = true;

        info.textContent = "Analisando extrato do Nubank...";

        try {
            const lines = await extractPDF(selectedFile);

            entries = parseNubankStatement(lines);

            // Carrega as categorias existentes.

            await loadCategories();

            // Carrega movimentações para verificar duplicidade.

            await loadTransactions();

            for (const entry of entries) {
                entry.category = suggestCategory(
                    entry.description
                );

                if (isDuplicate(entry)) {
                    entry.selected = false;
                    entry.warning = "Possível lançamento duplicado";
                }
            }

            renderEntries();

        } catch (error) {
            console.error(
                "Erro ao importar extrato:",
                error
            );

            entries = [];
            rows.replaceChildren();

            info.textContent =
                error.message ||
                "Não foi possível interpretar o extrato.";

            save.disabled = true;

} finally {
    file.disabled = false;

    if (selectAll) {
        selectAll.disabled = entries.length === 0;
    }

    if (selectedCount) {
        selectedCount.textContent =
            `${entries.filter(entry => entry.selected).length} de ${entries.length} selecionadas`;
    }
}
    });

    // =========================================
    // SALVAR MOVIMENTAÇÕES NA API
    // =========================================

    save.addEventListener("click", async () => {
        const selected = entries.filter(
            entry => entry.selected
        );

        if (!selected.length) {
            info.textContent =
                "Selecione pelo menos uma movimentação.";

            return;
        }

// =========================================
// VALIDAR MOVIMENTAÇÕES SELECIONADAS
// =========================================

const renderedRows = rows.querySelectorAll(".nubank-row");

let firstInvalid = null;
let missingCategories = 0;
let invalidFields = 0;

entries.forEach((entry, index) => {

    const row = renderedRows[index];

    if (!row) return;

    const descriptionInput = row.querySelector(
        'input[type="text"]'
    );

    const amountInput = row.querySelector(
        'input[type="number"]'
    );

    const categorySelect = row.querySelectorAll("select")[1];

    // Limpar erros anteriores

    row.classList.remove("nubank-row-invalid");

    descriptionInput?.classList.remove("nubank-field-invalid");
    amountInput?.classList.remove("nubank-field-invalid");
    categorySelect?.classList.remove("nubank-field-invalid");

    if (!entry.selected) return;

    let hasError = false;

    // Validar categoria

    if (!entry.category) {

        missingCategories++;

        categorySelect?.classList.add(
            "nubank-field-invalid"
        );

        firstInvalid ||= categorySelect;

        hasError = true;
    }

    // Validar descrição

    if (!entry.description.trim()) {

        invalidFields++;

        descriptionInput?.classList.add(
            "nubank-field-invalid"
        );

        firstInvalid ||= descriptionInput;

        hasError = true;
    }

    // Validar valor

    if (
        !Number.isFinite(entry.amount) ||
        entry.amount <= 0
    ) {

        invalidFields++;

        amountInput?.classList.add(
            "nubank-field-invalid"
        );

        firstInvalid ||= amountInput;

        hasError = true;
    }

    if (hasError) {
        row.classList.add("nubank-row-invalid");
    }
});

if (missingCategories || invalidFields) {

    const messages = [];

    if (missingCategories) {
        messages.push(
            `${missingCategories} movimentação(ões) sem categoria.`
        );
    }

    if (invalidFields) {
        messages.push(
            `${invalidFields} campo(s) inválido(s).`
        );
    }

    showImportWarning(
        messages.join(" ") +
        " Corrija os campos destacados antes de continuar."
    );

    firstInvalid?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    firstInvalid?.focus({
        preventScroll: true
    });

    return;
}

        save.disabled = true;
        file.disabled = true;
        if (selectAll) selectAll.disabled = true;

        close.disabled = true;

        
        let imported = 0;
        let duplicates = 0;

        try {
            await loadTransactions();

            for (let index = 0;
                index < selected.length;
                index++
            ) {
                const entry = selected[index];

                info.textContent =
                    `Importando ${index + 1} de ${selected.length}...`;

                if (isDuplicate(entry)) {
                    duplicates++;
                    entry.selected = false;

                    continue;
                }

                const payload = {
                    descricao: entry.description.trim(),
                    tipo: entry.type,
                    valor: Number(entry.amount.toFixed(2)),
                    categoria_id: Number(entry.category),
                    data: entry.date,
                    status: "paid",
                    forma_pagamento: entry.payment
                };

                await apiRequest("/movimentacoes", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                entry.selected = false;
                imported++;
            }

            // Atualiza a lista e o resumo do sistema.

            await refreshTransactions();

            renderEntries();

            info.textContent =
                `${imported} movimentações importadas com sucesso! ` +
                `${duplicates} possíveis duplicidades ignoradas.`;

            if (typeof showToast === "function") {
                showToast(
                    `${imported} movimentações importadas!`
                );
            }

        } catch (error) {
            console.error(
                "Erro ao salvar movimentações:",
                error
            );

            renderEntries();

            info.textContent =
                `${imported} movimentações salvas antes do erro. ` +
                `${error.message}`;

        } finally {
            file.disabled = false;
            if (selectAll) {
    selectAll.disabled = entries.length === 0;
}
            close.disabled = false;

            save.disabled = !entries.some(
                entry => entry.selected
            );
        }
    });

})();