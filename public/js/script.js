const STORAGE_KEY = 'clara-financas-v1';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const categoryColors = {
  Alimentação: '#e84c3d',
  Moradia: '#238bd2',
  Transporte: '#f59e0b',
  Saúde: '#8b5cf6',
  Lazer: '#10a05a',
  Salário: '#0a7a3f',
  Outros: '#94a3b8'
};

const defaultState = {
  budget: 6000,

  categories: [
    'Alimentação',
    'Moradia',
    'Transporte',
    'Saúde',
    'Lazer',
    'Salário',
    'Outros'
  ],

  fixed: [
    {
      id: crypto.randomUUID(),
      description: 'Salário mensal',
      type: 'income',
      amount: 8500,
      category: 'Salário',
      day: 5,
      payment: 'Transferência'
    },
    {
      id: crypto.randomUUID(),
      description: 'Aluguel',
      type: 'expense',
      amount: 2200,
      category: 'Moradia',
      day: 8,
      payment: 'Pix'
    },
    {
      id: crypto.randomUUID(),
      description: 'Assinaturas digitais',
      type: 'expense',
      amount: 149.9,
      category: 'Lazer',
      day: 18,
      payment: 'Cartão de crédito'
    }
  ],

  transactions: [
    {
      id: crypto.randomUUID(),
      description: 'Salário',
      type: 'income',
      amount: 8500,
      category: 'Salário',
      date: '2026-08-05',
      status: 'paid',
      payment: 'Transferência'
    },
    {
      id: crypto.randomUUID(),
      description: 'Freelance',
      type: 'income',
      amount: 6020,
      category: 'Outros',
      date: '2026-08-10',
      status: 'paid',
      payment: 'Pix'
    },
    {
      id: crypto.randomUUID(),
      description: 'Reembolso',
      type: 'income',
      amount: 2500,
      category: 'Outros',
      date: '2026-08-21',
      status: 'paid',
      payment: 'Pix'
    },
    {
      id: crypto.randomUUID(),
      description: 'Consulta médica',
      type: 'expense',
      amount: 380,
      category: 'Saúde',
      date: '2026-08-23',
      status: 'paid',
      payment: 'Pix'
    },
    {
      id: crypto.randomUUID(),
      description: 'Assinaturas digitais',
      type: 'expense',
      amount: 149.9,
      category: 'Lazer',
      date: '2026-08-18',
      status: 'paid',
      payment: 'Cartão de crédito'
    },
    {
      id: crypto.randomUUID(),
      description: 'Assinaturas digitais',
      type: 'expense',
      amount: 149.9,
      category: 'Lazer',
      date: '2026-08-18',
      status: 'pending',
      payment: 'Cartão de crédito'
    },
    {
      id: crypto.randomUUID(),
      description: 'Combustível',
      type: 'expense',
      amount: 320,
      category: 'Transporte',
      date: '2026-08-14',
      status: 'paid',
      payment: 'Cartão de débito'
    },
    {
      id: crypto.randomUUID(),
      description: 'Supermercado',
      type: 'expense',
      amount: 684.32,
      category: 'Alimentação',
      date: '2026-08-12',
      status: 'paid',
      payment: 'Cartão de crédito'
    },
    {
      id: crypto.randomUUID(),
      description: 'Aluguel',
      type: 'expense',
      amount: 2200,
      category: 'Moradia',
      date: '2026-08-08',
      status: 'pending',
      payment: 'Pix'
    },
    {
      id: crypto.randomUUID(),
      description: 'Restaurante',
      type: 'expense',
      amount: 176,
      category: 'Alimentação',
      date: '2026-08-09',
      status: 'paid',
      payment: 'Cartão de crédito'
    },
    {
      id: crypto.randomUUID(),
      description: 'Curso online',
      type: 'expense',
      amount: 590,
      category: 'Lazer',
      date: '2026-08-06',
      status: 'paid',
      payment: 'Cartão de crédito'
    },
    {
      id: crypto.randomUUID(),
      description: 'Farmácia',
      type: 'expense',
      amount: 130,
      category: 'Saúde',
      date: '2026-08-03',
      status: 'paid',
      payment: 'Pix'
    },
    {
      id: crypto.randomUUID(),
      description: 'Conta de energia',
      type: 'expense',
      amount: 264,
      category: 'Moradia',
      date: '2026-08-02',
      status: 'paid',
      payment: 'Boleto'
    },
    {
      id: crypto.randomUUID(),
      description: 'Viagem',
      type: 'expense',
      amount: 6390,
      category: 'Lazer',
      date: '2026-08-26',
      status: 'paid',
      payment: 'Cartão de crédito'
    }
  ]
};

let state = loadState();
let editingId = null;

let selectedMonth = 7;
let selectedYear = 2026;

function loadState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);

    return savedState
      ? JSON.parse(savedState)
      : structuredClone(defaultState);
  } catch (error) {
    console.error('Erro ao carregar os dados:', error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function qs(id) {
  return document.getElementById(id);
}

function toast(message) {
  const element = qs('toast');

  if (!element) {
    console.log(message);
    return;
  }

  element.textContent = message;
  element.classList.add('show');

  setTimeout(() => {
    element.classList.remove('show');
  }, 2200);
}

function inSelectedMonth(transaction) {
  const date = new Date(`${transaction.date}T12:00:00`);

  return (
    date.getMonth() === selectedMonth &&
    date.getFullYear() === selectedYear
  );
}

function monthTransactions() {
  return state.transactions.filter(inSelectedMonth);
}

function sum(list, predicate = () => true) {
  return list
    .filter(predicate)
    .reduce((total, item) => total + Number(item.amount), 0);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(
    new Date(`${date}T12:00:00`)
  );
}

function slug(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function setupPeriodSelectors() {
  qs('monthSelect').innerHTML = monthNames
    .map(
      (month, index) => `
        <option value="${index}" ${index === selectedMonth ? 'selected' : ''}>
          ${month}
        </option>
      `
    )
    .join('');

  qs('yearSelect').innerHTML = [2024, 2025, 2026, 2027, 2028]
    .map(
      year => `
        <option value="${year}" ${year === selectedYear ? 'selected' : ''}>
          ${year}
        </option>
      `
    )
    .join('');
}

function render() {
  const transactions = monthTransactions();

  const incomes = sum(
    transactions,
    item => item.type === 'income' && item.status === 'paid'
  );

  const expenses = sum(
    transactions,
    item => item.type === 'expense' && item.status === 'paid'
  );

  const pending = sum(
    transactions,
    item => item.type === 'expense' && item.status === 'pending'
  );

  const incomeCount = transactions.filter(
    item => item.type === 'income' && item.status === 'paid'
  ).length;

  const expenseCount = transactions.filter(
    item => item.type === 'expense' && item.status === 'paid'
  ).length;

  const remaining = Math.max(state.budget - expenses, 0);

  const percent = state.budget
    ? Math.min((expenses / state.budget) * 100, 100)
    : 0;

  qs('balanceValue').textContent = currency.format(incomes - expenses);
  qs('incomeValue').textContent = currency.format(incomes);
  qs('expenseValue').textContent = currency.format(expenses);
  qs('pendingValue').textContent = currency.format(pending);

  qs('incomeCount').textContent =
    `${incomeCount} recebimento${incomeCount === 1 ? '' : 's'}`;

  qs('expenseCount').textContent =
    `${expenseCount} pagamento${expenseCount === 1 ? '' : 's'}`;

  qs('budgetUsed').textContent = currency.format(expenses);
  qs('budgetTotal').textContent = currency.format(state.budget);
  qs('budgetRemaining').textContent = currency.format(remaining);
  qs('budgetPercent').textContent = `${Math.round(percent)}%`;
  qs('budgetProgress').style.width = `${percent}%`;

  qs('budgetProgress').style.background =
    expenses > state.budget
      ? 'var(--danger)'
      : 'var(--primary)';

  renderFilters();
  renderTransactions();
  renderBarChart();
  renderDonut();
  renderFixed();
}

function renderFilters() {
  const options = state.categories
    .map(category => `
      <option value="${category}">${category}</option>
    `)
    .join('');

  const currentFilter = qs('categoryFilter').value || 'all';

  qs('categoryFilter').innerHTML = `
    <option value="all">Todas as categorias</option>
    ${options}
  `;

  qs('categoryFilter').value =
    state.categories.includes(currentFilter)
      ? currentFilter
      : 'all';

  const currentCategory = qs('category').value;

  qs('category').innerHTML = options;

  if (state.categories.includes(currentCategory)) {
    qs('category').value = currentCategory;
  }
}

function filteredTransactions() {
  const query = slug(qs('searchInput').value.trim());
  const type = qs('typeFilter').value;
  const status = qs('statusFilter').value;
  const category = qs('categoryFilter').value;

  return monthTransactions()
    .filter(transaction => {
      const matchesSearch =
        !query ||
        slug(
          `${transaction.description} ${transaction.payment}`
        ).includes(query);

      const matchesType =
        type === 'all' || transaction.type === type;

      const matchesStatus =
        status === 'all' || transaction.status === status;

      const matchesCategory =
        category === 'all' || transaction.category === category;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesCategory
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderTransactions() {
  const transactions = filteredTransactions();

  qs('emptyState').hidden = transactions.length > 0;

  qs('transactionBody').innerHTML = transactions
    .map(
      transaction => `
        <tr>
          <td class="description-cell">
            <strong>${escapeHtml(transaction.description)}</strong>
            <small>${escapeHtml(transaction.payment)}</small>
          </td>

          <td>${escapeHtml(transaction.category)}</td>

          <td>${formatDate(transaction.date)}</td>

          <td>
            <span class="status-pill ${transaction.status}">
              ${transaction.status === 'paid' ? 'Pago' : 'Pendente'}
            </span>
          </td>

          <td class="amount ${
            transaction.type === 'income'
              ? 'positive'
              : 'negative'
          }">
            ${transaction.type === 'income' ? '+' : '−'}
            ${currency.format(transaction.amount)}
          </td>

          <td>
            <button
              class="row-menu"
              data-id="${transaction.id}"
              aria-label="Editar movimentação"
            >
              •••
            </button>
          </td>
        </tr>
      `
    )
    .join('');

  document.querySelectorAll('.row-menu').forEach(button => {
    button.addEventListener('click', () => {
      openTransactionModal(button.dataset.id);
    });
  });
}

function renderBarChart() {
  const months = [];

  for (let index = 5; index >= 0; index--) {
    const date = new Date(
      selectedYear,
      selectedMonth - index,
      1
    );

    months.push({
      month: date.getMonth(),
      year: date.getFullYear(),
      label: monthNames[date.getMonth()].slice(0, 3)
    });
  }

  const values = months.map(monthData => {
    const income = sum(state.transactions, transaction => {
      const date = new Date(`${transaction.date}T12:00:00`);

      return (
        date.getMonth() === monthData.month &&
        date.getFullYear() === monthData.year &&
        transaction.type === 'income' &&
        transaction.status === 'paid'
      );
    });

    const expense = sum(state.transactions, transaction => {
      const date = new Date(`${transaction.date}T12:00:00`);

      return (
        date.getMonth() === monthData.month &&
        date.getFullYear() === monthData.year &&
        transaction.type === 'expense' &&
        transaction.status === 'paid'
      );
    });

    return {
      ...monthData,
      income,
      expense
    };
  });

  const max = Math.max(
    ...values.flatMap(value => [
      value.income,
      value.expense
    ]),
    1
  );

  qs('barChart').innerHTML = values
    .map(
      value => `
        <div class="bar-group">
          <div
            class="bar income"
            style="height: ${(value.income / max) * 90}%"
            title="Entradas: ${currency.format(value.income)}"
          ></div>

          <div
            class="bar expense"
            style="height: ${(value.expense / max) * 90}%"
            title="Despesas: ${currency.format(value.expense)}"
          ></div>

          <label>${value.label}</label>
        </div>
      `
    )
    .join('');
}

function renderDonut() {
  const expenses = monthTransactions().filter(
    transaction =>
      transaction.type === 'expense' &&
      transaction.status === 'paid'
  );

  const totals = {};

  expenses.forEach(transaction => {
    totals[transaction.category] =
      (totals[transaction.category] || 0) +
      Number(transaction.amount);
  });

  const total = Object.values(totals).reduce(
    (accumulator, value) => accumulator + value,
    0
  );

  qs('donutTotal').textContent =
    currency.format(total).replace(',00', '');

  let accumulated = 0;
  const stops = [];

  Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, value]) => {
      const start = accumulated;

      accumulated += total
        ? (value / total) * 100
        : 0;

      const color =
        categoryColors[category] || '#94a3b8';

      stops.push(
        `${color} ${start}% ${accumulated}%`
      );
    });

  qs('donutChart').style.background = stops.length
    ? `conic-gradient(${stops.join(',')})`
    : 'conic-gradient(var(--line) 0 100%)';

  qs('categoryLegend').innerHTML =
    Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, value]) => {
        const percentage = total
          ? Math.round((value / total) * 100)
          : 0;

        return `
          <span>
            <i style="background: ${
              categoryColors[category] || '#94a3b8'
            }"></i>

            ${escapeHtml(category)} · ${percentage}%
          </span>
        `;
      })
      .join('') ||
    '<span>Sem despesas no período.</span>';
}

function renderFixed() {
  const income = sum(
    state.fixed,
    item => item.type === 'income'
  );

  const expenses = sum(
    state.fixed,
    item => item.type === 'expense'
  );

  qs('fixedIncome').textContent = currency.format(income);
  qs('fixedExpenses').textContent = currency.format(expenses);
  qs('fixedBalance').textContent =
    currency.format(income - expenses);

  qs('fixedList').innerHTML = state.fixed
    .map(
      item => `
        <div class="fixed-item">
          <div>
            <strong>${escapeHtml(item.description)}</strong>

            <small>
              Dia ${item.day} ·
              ${escapeHtml(item.category)} ·
              Ativo
            </small>
          </div>

          <strong class="${
            item.type === 'income'
              ? 'positive'
              : 'negative'
          }">
            ${item.type === 'income' ? '+' : '−'}
            ${currency.format(item.amount)}
          </strong>

          <button
            data-fixed="${item.id}"
            title="Excluir"
          >
            ×
          </button>
        </div>
      `
    )
    .join('');

  document.querySelectorAll('[data-fixed]').forEach(button => {
    button.addEventListener('click', () => {
      const confirmed = confirm(
        'Deseja excluir este lançamento fixo?'
      );

      if (!confirmed) return;

      state.fixed = state.fixed.filter(
        item => item.id !== button.dataset.fixed
      );

      saveState();
      render();
      toast('Lançamento fixo removido.');
    });
  });
}

function openTransactionModal(id = null, seed = {}) {
  editingId = id;

  const modal = qs('transactionModal');

  const item = id
    ? state.transactions.find(
        transaction => transaction.id === id
      )
    : null;

  qs('transactionTitle').textContent = id
    ? 'Editar movimentação'
    : 'Nova movimentação';

  const source = item || {
    description: '',
    type: 'expense',
    amount: '',
    category: 'Alimentação',
    date: new Date().toISOString().slice(0, 10),
    status: 'paid',
    payment: 'Pix',
    ...seed
  };

  qs('description').value = source.description;
  qs('transactionType').value = source.type;
  qs('amount').value = source.amount;
  qs('category').value = source.category;
  qs('date').value = source.date;
  qs('status').value = source.status;
  qs('payment').value = source.payment;

  modal.showModal();
}

function saveTransactionFromForm() {
  const transaction = {
    id: editingId || crypto.randomUUID(),
    description: qs('description').value.trim(),
    type: qs('transactionType').value,
    amount: Number(qs('amount').value),
    category: qs('category').value,
    date: qs('date').value,
    status: qs('status').value,
    payment: qs('payment').value
  };

  if (
    !transaction.description ||
    !transaction.amount ||
    !transaction.date
  ) {
    toast('Preencha a descrição, o valor e a data.');
    return false;
  }

  if (editingId) {
    state.transactions = state.transactions.map(item =>
      item.id === editingId
        ? transaction
        : item
    );
  } else {
    state.transactions.push(transaction);
  }

  saveState();
  render();

  toast(
    editingId
      ? 'Movimentação atualizada.'
      : 'Movimentação adicionada.'
  );

  editingId = null;

  return true;
}

function parseSmartInput(text) {
  const clean = slug(text);

  const numberMatch = text.match(
    /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)/i
  );

  const amount = numberMatch
    ? Number(
        numberMatch[1]
          .replace(/\./g, '')
          .replace(',', '.')
      )
    : '';

  const isIncome =
    /(recebi|ganhei|salario|vendi|entrada|pix recebido)/.test(
      clean
    );

  let category = 'Outros';

  const rules = [
    [
      'Alimentação',
      /(mercado|supermercado|restaurante|comida|lanche|ifood)/
    ],
    [
      'Transporte',
      /(uber|99|combustivel|gasolina|onibus|metro)/
    ],
    [
      'Saúde',
      /(medico|consulta|farmacia|remedio|dentista)/
    ],
    [
      'Moradia',
      /(aluguel|energia|luz|agua|condominio|internet)/
    ],
    [
      'Lazer',
      /(cinema|viagem|assinatura|netflix|curso|show)/
    ],
    [
      'Salário',
      /(salario|pagamento recebido)/
    ]
  ];

  rules.forEach(([ruleCategory, expression]) => {
    if (expression.test(clean)) {
      category = ruleCategory;
    }
  });

  const date = new Date();

  if (/ontem/.test(clean)) {
    date.setDate(date.getDate() - 1);
  }

  if (/amanha/.test(clean)) {
    date.setDate(date.getDate() + 1);
  }

  let description = text
    .replace(
      /(?:r\$\s*)?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?/i,
      ''
    )
    .replace(
      /\b(gastei|paguei|recebi|ganhei|reais|real|ontem|hoje|amanhã|amanha|no|na|em|de)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  if (description) {
    description =
      description.charAt(0).toUpperCase() +
      description.slice(1);
  } else {
    description = isIncome
      ? 'Recebimento'
      : 'Despesa';
  }

  return {
    description,
    type: isIncome ? 'income' : 'expense',
    amount,
    category,
    date: date.toISOString().slice(0, 10),
    status: 'paid',
    payment: 'Pix'
  };
}

function applyFixedTransactions() {
  let added = 0;

  state.fixed.forEach(item => {
    const day = String(
      Math.min(item.day, 28)
    ).padStart(2, '0');

    const month = String(
      selectedMonth + 1
    ).padStart(2, '0');

    const date = `${selectedYear}-${month}-${day}`;

    const exists = state.transactions.some(
      transaction =>
        transaction.description === item.description &&
        transaction.date === date &&
        Number(transaction.amount) === Number(item.amount)
    );

    if (!exists) {
      state.transactions.push({
        id: crypto.randomUUID(),
        description: item.description,
        type: item.type,
        amount: item.amount,
        category: item.category,
        date,
        status:
          item.type === 'income'
            ? 'paid'
            : 'pending',
        payment: item.payment
      });

      added++;
    }
  });

  saveState();
  render();

  qs('fixedModal').close();

  toast(
    `${added} lançamento${added === 1 ? '' : 's'} fixo${
      added === 1 ? '' : 's'
    } adicionado${added === 1 ? '' : 's'}.`
  );
}

function openAssistant() {
  const transactions = monthTransactions();

  const income = sum(
    transactions,
    item =>
      item.type === 'income' &&
      item.status === 'paid'
  );

  const expense = sum(
    transactions,
    item =>
      item.type === 'expense' &&
      item.status === 'paid'
  );

  const pending = sum(
    transactions,
    item =>
      item.type === 'expense' &&
      item.status === 'pending'
  );

  const categories = {};

  transactions
    .filter(
      item =>
        item.type === 'expense' &&
        item.status === 'paid'
    )
    .forEach(item => {
      categories[item.category] =
        (categories[item.category] || 0) +
        Number(item.amount);
    });

  const topCategory = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])[0];

  const rate = income
    ? (expense / income) * 100
    : 0;

  qs('assistantContent').innerHTML = `
    <div class="insight">
      <strong>
        ${
          rate <= 70
            ? 'Seu mês está equilibrado'
            : 'Atenção ao ritmo de gastos'
        }
      </strong>

      <span>
        Você comprometeu ${Math.round(rate)}% das entradas
        com despesas pagas.
      </span>
    </div>

    <div class="insight">
      <strong>Maior categoria</strong>

      <span>
        ${
          topCategory
            ? `${topCategory[0]} representa ${currency.format(
                topCategory[1]
              )}.`
            : 'Ainda não há despesas pagas.'
        }
      </span>
    </div>

    <div class="insight">
      <strong>Próximo passo</strong>

      <span>
        ${
          pending
            ? `Existem ${currency.format(
                pending
              )} em contas pendentes.`
            : 'Você não possui contas pendentes neste período.'
        }
      </span>
    </div>
  `;

  qs('assistantModal').showModal();
}

function escapeHtml(text = '') {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

qs('transactionForm').addEventListener(
  'submit',
  event => {
    event.preventDefault();

    const saved = saveTransactionFromForm();

    if (saved) {
      qs('transactionModal').close();
    }
  }
);

qs('budgetForm').addEventListener(
  'submit',
  event => {
    event.preventDefault();

    state.budget = Number(
      qs('budgetInput').value
    );

    saveState();
    render();

    qs('budgetModal').close();

    toast('Orçamento atualizado.');
  }
);

qs('openTransaction').addEventListener(
  'click',
  () => openTransactionModal()
);

qs('quickAdd').addEventListener(
  'click',
  () => openTransactionModal()
);

qs('openFixed').addEventListener(
  'click',
  () => qs('fixedModal').showModal()
);

qs('launchFixed').addEventListener(
  'click',
  () => qs('fixedModal').showModal()
);

qs('applyFixed').addEventListener(
  'click',
  applyFixedTransactions
);

qs('editBudget').addEventListener(
  'click',
  () => {
    qs('budgetInput').value = state.budget;
    qs('budgetModal').showModal();
  }
);

qs('interpretBtn').addEventListener(
  'click',
  () => {
    const text = qs('smartInput').value.trim();

    if (!text) {
      toast(
        'Digite um lançamento para interpretar.'
      );

      return;
    }

    const parsedTransaction =
      parseSmartInput(text);

    openTransactionModal(
      null,
      parsedTransaction
    );
  }
);

qs('smartInput').addEventListener(
  'keydown',
  event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      qs('interpretBtn').click();
    }
  }
);

[
  'searchInput',
  'typeFilter',
  'statusFilter',
  'categoryFilter'
].forEach(id => {
  const eventName =
    id === 'searchInput'
      ? 'input'
      : 'change';

  qs(id).addEventListener(
    eventName,
    renderTransactions
  );
});

qs('monthSelect').addEventListener(
  'change',
  event => {
    selectedMonth = Number(
      event.target.value
    );

    render();
  }
);

qs('yearSelect').addEventListener(
  'change',
  event => {
    selectedYear = Number(
      event.target.value
    );

    render();
  }
);

qs('newCategory').addEventListener(
  'click',
  () => {
    const name = prompt(
      'Nome da nova categoria:'
    );

    if (!name) return;

    const cleanName = name.trim();

    if (
      state.categories.includes(cleanName)
    ) {
      toast('Essa categoria já existe.');
      return;
    }

    state.categories.push(cleanName);

    saveState();
    render();

    toast('Categoria criada.');
  }
);

qs('addFixed').addEventListener(
  'click',
  () => {
    const description = prompt(
      'Descrição do lançamento fixo:'
    );

    if (!description) return;

    const amountText = prompt(
      'Digite o valor:'
    );

    const amount = Number(
      amountText
        ?.replace(/\./g, '')
        .replace(',', '.')
    );

    if (!amount || amount <= 0) {
      toast('Digite um valor válido.');
      return;
    }

    const isIncome = confirm(
      'Clique em OK para entrada ou Cancelar para despesa.'
    );

    const type = isIncome
      ? 'income'
      : 'expense';

    const day = Math.min(
      28,
      Math.max(
        1,
        Number(
          prompt('Dia do mês:', '5')
        ) || 1
      )
    );

    state.fixed.push({
      id: crypto.randomUUID(),
      description: description.trim(),
      type,
      amount,
      category:
        type === 'income'
          ? 'Salário'
          : 'Outros',
      day,
      payment: 'Pix'
    });

    saveState();
    render();

    toast('Lançamento fixo criado.');
  }
);

qs('themeToggle').addEventListener(
  'click',
  () => {
    document.body.classList.toggle('dark');

    const isDark =
      document.body.classList.contains('dark');

    localStorage.setItem(
      'finance-theme',
      isDark ? 'dark' : 'light'
    );
  }
);

qs('financeAssistant').addEventListener(
  'click',
  openAssistant
);

const savedTheme =
  localStorage.getItem('finance-theme');

if (savedTheme === 'dark') {
  document.body.classList.add('dark');
}

setupPeriodSelectors();
render();