const LOGIN_KEY = "clara-financas-login";
const TOKEN_KEY = "clara-financas-token";
const REMEMBER_KEY = "clara-financas-remember";

const API_URL = "http://localhost:5000/api";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberInput = document.getElementById("rememberMe");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const generalError = document.getElementById("generalError");

const loginButton = document.getElementById("loginButton");
const passwordToggle = document.getElementById("passwordToggle");

const forgotPasswordButton =
    document.getElementById("forgotPassword");

const registerButton =
    document.getElementById("registerButton");

const toastElement =
    document.getElementById("toast");


// =========================
// Toast
// =========================

function showToast(message) {
    toastElement.textContent = message;

    toastElement.classList.add("show");

    setTimeout(() => {
        toastElement.classList.remove("show");
    }, 2500);
}


// =========================
// Erros
// =========================

function showGeneralError(message) {
    generalError.textContent = message;

    generalError.classList.add("show");
}

function clearGeneralError() {
    generalError.textContent = "";

    generalError.classList.remove("show");
}

function showFieldError(
    input,
    errorElement,
    message
) {
    input.classList.add("invalid");

    errorElement.textContent = message;
}

function clearFieldError(
    input,
    errorElement
) {
    input.classList.remove("invalid");

    errorElement.textContent = "";
}


// =========================
// Validação
// =========================

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm() {
    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    let isValid = true;

    clearGeneralError();

    clearFieldError(
        emailInput,
        emailError
    );

    clearFieldError(
        passwordInput,
        passwordError
    );

    if (!email) {
        showFieldError(
            emailInput,
            emailError,
            "Informe seu e-mail."
        );

        isValid = false;

    } else if (!validateEmail(email)) {
        showFieldError(
            emailInput,
            emailError,
            "Digite um e-mail válido."
        );

        isValid = false;
    }

    if (!password) {
        showFieldError(
            passwordInput,
            passwordError,
            "Informe sua senha."
        );

        isValid = false;

    } else if (password.length < 6) {
        showFieldError(
            passwordInput,
            passwordError,
            "A senha precisa ter pelo menos 6 caracteres."
        );

        isValid = false;
    }

    return isValid;
}


// =========================
// Loading
// =========================

function setLoading(isLoading) {
    loginButton.disabled = isLoading;

    loginButton.classList.toggle(
        "loading",
        isLoading
    );
}


// =========================
// Login no backend
// =========================

async function autenticarUsuario(
    email,
    senha
) {
    const response = await fetch(
        `${API_URL}/usuarios/login`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                email,
                senha
            })
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            "Resposta inválida do servidor."
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Não foi possível realizar o login."
        );
    }

    return data;
}


// =========================
// Salvar sessão
// =========================

function saveSession(
    usuario,
    token
) {
    const session = {
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email,
        telefone:
            usuario.telefone || null,
        profissao:
            usuario.profissao || null,
        loggedAt:
            new Date().toISOString()
    };

    if (rememberInput.checked) {

        localStorage.setItem(
            LOGIN_KEY,
            JSON.stringify(session)
        );

        localStorage.setItem(
            TOKEN_KEY,
            token
        );

        localStorage.setItem(
            REMEMBER_KEY,
            usuario.email
        );

        sessionStorage.removeItem(
            LOGIN_KEY
        );

        sessionStorage.removeItem(
            TOKEN_KEY
        );

    } else {

        sessionStorage.setItem(
            LOGIN_KEY,
            JSON.stringify(session)
        );

        sessionStorage.setItem(
            TOKEN_KEY,
            token
        );

        localStorage.removeItem(
            LOGIN_KEY
        );

        localStorage.removeItem(
            TOKEN_KEY
        );
    }
}


// =========================
// Redirecionamento
// =========================

function redirectToDashboard() {
    window.location.href = "index.html";
}


// =========================
// Login
// =========================

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        clearGeneralError();

        setLoading(true);

        try {
            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const senha =
                passwordInput.value;

            const resultado =
                await autenticarUsuario(
                    email,
                    senha
                );

            saveSession(
                resultado.usuario,
                resultado.token
            );

            showToast(
                "Login realizado com sucesso."
            );

            setTimeout(() => {
                redirectToDashboard();
            }, 500);

        } catch (error) {

            console.error(
                "Erro no login:",
                error
            );

            showGeneralError(
                error.message
            );

        } finally {

            setLoading(false);
        }
    }
);


// =========================
// Mostrar / ocultar senha
// =========================

passwordToggle.addEventListener(
    "click",
    () => {

        const visible =
            passwordInput.type === "text";

        passwordInput.type =
            visible
                ? "password"
                : "text";

        passwordToggle.textContent =
            visible
                ? "◉"
                : "◌";

        passwordToggle.setAttribute(
            "aria-label",
            visible
                ? "Mostrar senha"
                : "Ocultar senha"
        );
    }
);


// =========================
// Esqueci minha senha
// =========================

forgotPasswordButton.addEventListener(
    "click",
    () => {

        showToast(
            "A recuperação de senha será adicionada em breve."
        );
    }
);


// =========================
// Cadastro
// =========================

registerButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "cadastro.html";
    }
);


// =========================
// Limpar erros
// =========================

emailInput.addEventListener(
    "input",
    () => {

        clearFieldError(
            emailInput,
            emailError
        );

        clearGeneralError();
    }
);

passwordInput.addEventListener(
    "input",
    () => {

        clearFieldError(
            passwordInput,
            passwordError
        );

        clearGeneralError();
    }
);


// =========================
// Carregar e-mail lembrado
// =========================

function loadRememberedEmail() {
    const rememberedEmail =
        localStorage.getItem(
            REMEMBER_KEY
        );

    if (rememberedEmail) {
        emailInput.value =
            rememberedEmail;

        rememberInput.checked =
            true;
    }
}


// =========================
// Verificar login existente
// =========================

function checkExistingSession() {

    const localToken =
        localStorage.getItem(
            TOKEN_KEY
        );

    const temporaryToken =
        sessionStorage.getItem(
            TOKEN_KEY
        );

    if (
        localToken ||
        temporaryToken
    ) {
        redirectToDashboard();
    }
}


// =========================
// Inicialização
// =========================

loadRememberedEmail();

checkExistingSession();