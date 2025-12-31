# 🧠 IdFocus API — Backend

API REST utilizada pelo aplicativo IdFocus para autenticação segura, registro de usuários e comunicação com o front-end.  
Desenvolvida com Node.js, Express, JWT e bcrypt — e hospedada em ambiente serverless na Vercel.

---

## 🚀 Tecnologias Utilizadas
- **Node.js**
- **Express.js**
- **Prisma ORM**
- **MongoDB Atlas**
- **bcrypt** (hash seguro de senhas)
- **JSON Web Token (JWT)**

---

## 📌 Funcionalidades
- Registro de novos usuários  
- Login com validação completa  
- Hash de senha com bcrypt + salt  
- Geração e verificação de JWT  
- Middleware para proteger rotas  
- Estrutura modular pronta para expandir
- APIs para métricas e estatísticas
- Rotas protegidas por middleware

---
## 🧠 Conceito Principal (Nova atualização)

Cada ação relevante do usuário gera um **evento**, armazenado no banco de dados com informações como:

- tipo da ação
- data/hora
- usuário associado
- metadados adicionais (ex: id da tarefa, tempo de foco)

Esse modelo permite análises futuras, que será consumida por outra aplicação.

---
## 🔗 Projetos Relacionados

Frontend base (IdFocus):
https://github.com/eckin33/Projeto-IdFocus

Dashboard de Métricas (React):
https://github.com/eckin33/Metrics-UI

---

## 📌 Status do Projeto

- ✔️ Em produção
- ✔️ Funcional
- ✔️ Em evolução contínua

