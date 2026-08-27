# 💰 Conecta Finanças

O **Conecta Finanças** é uma aplicação web de controle financeiro desenvolvida para facilitar o gerenciamento das finanças pessoais.

A plataforma permite registrar e acompanhar **receitas, despesas e movimentações financeiras**, além de organizar categorias, despesas fixas e visualizar informações consolidadas através de um dashboard.

O projeto utiliza uma arquitetura **cliente-servidor**, com separação entre o front-end e o back-end. A comunicação é realizada através de uma **API**, utilizando requisições HTTP e dados no formato **JSON**.

---

## 🎯 Objetivo do projeto

O objetivo do **Conecta Finanças** é oferecer uma solução simples e organizada para que o usuário consiga acompanhar sua vida financeira em um único lugar.

Entre as principais funcionalidades estão:

* Cadastro e autenticação de usuários;
* Registro de receitas e despesas;
* Gerenciamento de movimentações financeiras;
* Controle de despesas fixas;
* Organização das movimentações por categorias;
* Gerenciamento de contas;
* Dashboard com resumo financeiro;
* Visualização de receitas, despesas e saldo;
* Relatórios financeiros;
* Configurações do usuário.

---

## 🚀 Tecnologias utilizadas

### Front-end

* HTML5
* CSS3
* JavaScript
* Fetch API
* JSON

### Back-end

* Node.js
* Express.js
* JavaScript
* API REST
* Middlewares

### Banco de dados

* MySQL
* SQL

### Ferramentas

* Git
* GitHub
* Visual Studio Code
* Postman
* Vercel

---

## 🏗️ Arquitetura

O projeto utiliza uma arquitetura cliente-servidor.

O **front-end** é responsável pela interface apresentada ao usuário e pela captura das interações realizadas na aplicação.

O **back-end** recebe as requisições HTTP, executa as regras de negócio, realiza validações e acessa o banco de dados MySQL.

O fluxo básico da aplicação ocorre da seguinte forma:

```text id="xq5b1t"
Usuário
   ↓
Front-end
   ↓
Requisição HTTP
   ↓
API Node.js + Express
   ↓
Rotas
   ↓
Controllers
   ↓
MySQL
   ↓
Resposta JSON
   ↓
Front-end
   ↓
Usuário
```

---

## 📁 Estrutura do projeto

A aplicação está organizada aproximadamente da seguinte maneira:

```text id="n8v27x"
Projeto-Conecta_Financas/
│
├── backend/
│   │
│   ├── src/
│   │   │
│   │   ├── controllers/
│   │   │   ├── AuthController.js
│   │   │   ├── CategoriaController.js
│   │   │   ├── ConfiguracaoController.js
│   │   │   ├── DashboardController.js
│   │   │   ├── FixoController.js
│   │   │   └── MovimentacaoController.js
│   │   │
│   │   ├── database/
│   │   │   ├── conecta_financas.sql
│   │   │   ├── conecta_financasmysql.sql
│   │   │   └── connection.js
│   │   │
│   │   ├── middleware/
│   │   │
│   │   └── routes/
│   │       └── routes.js
│   │
│   ├── .env
│   ├── .gitignore
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
└── public/
```

> A pasta `node_modules` é criada localmente após a instalação das dependências e não deve ser enviada ao GitHub.

---

## 📂 Organização do Back-end

### `index.js`

Arquivo principal do servidor.

É responsável por inicializar a aplicação, configurar os middlewares, registrar as rotas, testar a conexão com o banco de dados e iniciar o servidor HTTP.

A porta utilizada pode ser definida através da variável de ambiente `PORT`. Caso ela não seja informada, a aplicação utiliza a porta `5000`.

```javascript id="5urj0s"
const PORT = Number(process.env.PORT) || 5000;
```

---

### `src/controllers/`

Contém os controladores responsáveis pelas regras de negócio da aplicação.

Cada controller possui uma responsabilidade específica.

#### `AuthController.js`

Responsável pelas funcionalidades relacionadas aos usuários e autenticação.

#### `CategoriaController.js`

Responsável pelo gerenciamento das categorias financeiras.

#### `ConfiguracaoController.js`

Responsável pelas configurações da aplicação e do usuário.

#### `DashboardController.js`

Responsável por obter e processar os dados utilizados no dashboard, como saldo, receitas, despesas e resumos financeiros.

#### `FixoController.js`

Responsável pelo gerenciamento das despesas e movimentações fixas.

#### `MovimentacaoController.js`

Responsável pelo cadastro, consulta, alteração e remoção das movimentações financeiras.

---

### `src/routes/routes.js`

Responsável por definir os endpoints disponibilizados pela API.

As rotas recebem as requisições HTTP e encaminham o processamento para o controller responsável.

---

### `src/database/connection.js`

Responsável pela configuração e gerenciamento da conexão entre a aplicação Node.js e o banco de dados MySQL.

Antes de iniciar completamente o servidor, a aplicação verifica se a comunicação com o MySQL está funcionando.

---

### `src/database/`

Contém os arquivos relacionados à estrutura e configuração do banco de dados.

Os arquivos SQL armazenados nesse diretório podem ser utilizados para criação das tabelas necessárias ao funcionamento da aplicação.

---

### `src/middleware/`

Contém os middlewares utilizados pela API.

Middlewares são funções executadas durante o ciclo de uma requisição e podem ser utilizadas para autenticação, validação, tratamento de erros e outras operações intermediárias.

---

## 🗄️ Banco de dados

O **Conecta Finanças** utiliza o **MySQL** para persistência das informações.

Entre as informações armazenadas estão dados de usuários, categorias e movimentações financeiras.

Um usuário, por exemplo, possui informações como:

```text id="1ol1la"
id
nome
email
senha
telefone
profissao
criado_em
atualizado_em
```

O campo `id` funciona como chave primária e utiliza incremento automático.

Exemplo:

```sql id="yfq8nd"
CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(30) NULL,
    profissao VARCHAR(120) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NULL
);
```

---

## ⚙️ Como executar o projeto localmente

### 1. Clone o repositório

```bash id="mt3qge"
git clone https://github.com/mykoll007/Projeto-Conecta_Financas.git
```

### 2. Entre na pasta do projeto

```bash id="zy27j4"
cd Projeto-Conecta_Financas
```

### 3. Acesse o back-end

```bash id="40k3h2"
cd backend
```

### 4. Instale as dependências

```bash id="ggx9md"
npm install
```

---

## 🗄️ Configuração do MySQL

Antes de iniciar o servidor, é necessário possuir o **MySQL** instalado e criar o banco de dados utilizado pelo projeto.

Os scripts SQL necessários estão disponíveis em:

```text id="fiz7ue"
backend/src/database/
```

Execute o arquivo SQL correspondente no MySQL para criar as tabelas utilizadas pela aplicação.

---

## 🔐 Variáveis de ambiente

Crie um arquivo `.env` dentro da pasta `backend` e configure as informações necessárias para conexão com o banco de dados.

Exemplo:

```env id="9d3v3c"
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=conecta_financas
PORT=5000
```

> Nunca publique senhas ou informações privadas do arquivo `.env` no GitHub.

---

## ▶️ Iniciando o servidor

Após instalar as dependências e configurar o banco de dados, execute:

```bash id="gks9n2"
node index.js
```

Caso exista um script de desenvolvimento configurado no `package.json`, também poderá ser utilizado:

```bash id="0eqf82"
npm run dev
```

Por padrão, o servidor será iniciado em:

```text id="l8nuw3"
http://localhost:5000
```

Quando a conexão com o banco de dados for realizada corretamente, o servidor exibirá no terminal uma mensagem indicando que a conexão com o MySQL foi realizada com sucesso.

---

## 🔗 API

A comunicação entre o front-end e o back-end ocorre através de requisições HTTP.

A API utiliza os principais métodos do padrão REST:

| Método      | Finalidade                       |
| ----------- | -------------------------------- |
| `GET`       | Consultar informações            |
| `POST`      | Cadastrar novas informações      |
| `PUT/PATCH` | Atualizar informações existentes |
| `DELETE`    | Remover informações              |

---

## 📡 Exemplos de endpoints

Alguns exemplos de operações realizadas pela API são:

| Método | Endpoint                     | Finalidade                               |
| ------ | ---------------------------- | ---------------------------------------- |
| `GET`  | `/api/resumo`                | Obter o resumo financeiro                |
| `GET`  | `/api/movimentacoes`         | Consultar movimentações                  |
| `GET`  | `/api/movimentacoes?limit=5` | Consultar as movimentações mais recentes |
| `GET`  | `/api/categorias`            | Consultar categorias                     |
| `GET`  | `/api/grafico?periodo=mes`   | Obter dados para gráficos                |
| `POST` | `/api/movimentacao`          | Cadastrar uma nova movimentação          |

> Os endpoints disponíveis dependem das rotas configuradas no arquivo `src/routes/routes.js`.

---

## 📥 Exemplo de requisição JSON

Uma movimentação financeira pode ser enviada ao servidor utilizando uma estrutura JSON semelhante a:

```json id="vnmvpa"
{
  "descricao": "Supermercado",
  "valor": 320.00,
  "tipo": "despesa",
  "categoria": "Alimentação",
  "data": "2025-05-02"
}
```

Nesse exemplo:

* `descricao` identifica a movimentação;
* `valor` representa o valor financeiro;
* `tipo` identifica se é uma receita ou despesa;
* `categoria` classifica a movimentação;
* `data` informa quando a movimentação ocorreu.

---

## 📤 Respostas da API

As respostas da API são enviadas principalmente no formato **JSON**.

Exemplo de resposta:

```json id="d7cwwn"
{
  "id": 15,
  "descricao": "Supermercado",
  "valor": 320.00,
  "tipo": "despesa",
  "categoria": "Alimentação",
  "data": "2025-05-02"
}
```

---

## 📊 Códigos HTTP

A API utiliza códigos de status HTTP para indicar o resultado das operações.

| Status                      | Significado                                           |
| --------------------------- | ----------------------------------------------------- |
| `200 OK`                    | Requisição realizada com sucesso                      |
| `201 Created`               | Recurso criado com sucesso                            |
| `204 No Content`            | Recurso removido com sucesso sem conteúdo de resposta |
| `400 Bad Request`           | Dados enviados são inválidos                          |
| `404 Not Found`             | Recurso não encontrado                                |
| `500 Internal Server Error` | Erro interno no servidor                              |

---

## 🔄 Exemplo do fluxo de uma movimentação

Ao cadastrar uma nova movimentação, o fluxo ocorre da seguinte forma:

1. O usuário informa os dados no front-end.
2. O JavaScript captura os dados preenchidos.
3. O front-end cria uma requisição HTTP.
4. Os dados são enviados para a API em formato JSON.
5. A rota correspondente recebe a requisição.
6. O controller executa as validações e regras de negócio.
7. O back-end realiza a operação necessária no MySQL.
8. O banco de dados retorna o resultado.
9. A API envia uma resposta HTTP em JSON.
10. O front-end interpreta a resposta e atualiza a interface.

---

## 🔒 Segurança

Informações sensíveis de configuração são armazenadas através de variáveis de ambiente.

O arquivo `.env` não deve ser versionado.

O `.gitignore` deve conter, no mínimo:

```gitignore id="3q8phh"
node_modules/
.env
```

Isso evita que dependências locais e credenciais sejam enviadas para o repositório público.

---

## 🌐 Deploy

O projeto possui uma versão web publicada utilizando a **Vercel**.

O deploy permite acessar a interface do Conecta Finanças através da internet sem a necessidade de executar o projeto localmente.

---

## 📌 Versionamento

O código-fonte do projeto é versionado utilizando **Git** e armazenado no **GitHub**, permitindo acompanhar alterações, manter um histórico de desenvolvimento e facilitar futuras evoluções do sistema.

Repositório:

`https://github.com/mykoll007/Projeto-Conecta_Financas`

---

## 👨‍💻 Autor

**Mykoll Daniel**

Projeto desenvolvido para fins de estudo e prática de desenvolvimento web, APIs REST, arquitetura cliente-servidor, Node.js e banco de dados MySQL.
