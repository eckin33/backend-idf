import express from "express";
import { prisma } from './utils/prisma.js'
import cors from "cors";
import bcrypt from "bcrypt"
import jwt, { decode } from "jsonwebtoken"

const userlogado = false
const app = express();
//const prisma = new PrismaClient();

app.use(cors());
app.use(express.json()); // permite ler req.body (dados do formulário)

// Rota para registrar usuário
app.post("/register", async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "Preencha todos os campos." });
    }

    // Verificar se o usuário já existe
    const usuarioExistente = await prisma.user.findFirst({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(409).json({ error: "Email já cadastrado." });
    }

    const senhaProtegida = await bcrypt.hash(password, 10)

    // Criar o novo usuário
    const novoUsuario = await prisma.user.create({
      data: {
        email,
        name,
        password: senhaProtegida
      },
    });

    res.status(201).json({
      message: "Usuário criado com sucesso!",
      user: novoUsuario,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

app.get('/', (req, res) => {

  res.send('Bem vindo ao IdFocus, para acessar: https://eckin33.github.io/Projeto-IdFocus ')

})

// Rota para login
app.post('/login', async (req, res) => {

  const { email, password } = req.body

  try {

    if (!email, !password) {
      return res.status(404).json({
        error: "é preciso Email e senha "
      })
    }

    const user = await prisma.user.findFirst({ where: { email } })

    if (!user) return res.status(404).send({ message: "Email não encontrado." })

    const senhaCorreta = await bcrypt.compare(password, user.password)

    if (senhaCorreta) {

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
      )

      res.json({
        message: "Login realizado.",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      })


    } else {
      return res.status(404).send({
        message: "Senha incorreta"
      })
    }

  } catch (erro) {
    console.log(erro)
    res.status(500).send({ message: "Erro no servidor" })

  }

})


app.post('/events', async (req, res) => {

  const { tipo, email, metadada } = req.body

  try {

    if (!tipo || !email || !metadada) {
      return res.status(401).send({ message: "Algo errado" })
    }

    const event = await prisma.event.create({
      data: {
        tipo,
        email,
        metadada
      }
    })

    res.status(200).send({
      message: "OK",
      event
    })

  } catch (error) {
    return res.status(404).send({ error: error })

  }

})


//Rota para métricas do dia atual
app.get('/metrics/actions/today', checkToken, async (req, res) => {

  //email vem do checkToken, ele traz do JWT e valida se ta certo
  const email = req.user.email

  //Toda lógica para filtrar apenas ações do dia atual
  const data = new Date()
  let ano = data.getFullYear()
  let mes = data.getMonth() + 1
  let dia = data.getDate()

  let start = new Date(`${String(ano)}-${String(mes)}-${String(dia)}T00:00:00-03:00`);
  let end = new Date(`${String(ano)}-${String(mes)}-${String(dia)}T23:59:59-03:00`);

  try {

    const coleta = await prisma.event.findMany({
      where: {
        email: email,
        createdAt: {
          gte: start,
          lte: end
        },
      }
    })

    let qtdTotal = coleta.length
    let qtdLogin = coleta.filter(item => item.tipo === "USER_LOGIN").length
    let qtdTarefas = coleta.filter(item => item.tipo === "TASK_CREATED").length

    res.status(200).send({
      message: "sucesso",
      quantidadeTotalAcoes: qtdTotal,
      quantidadeLogin: qtdLogin,
      quantidadeTarefas: qtdTarefas
    })

  } catch (error) {

    res.status(404).send({
      message: "erro",
      error: error
    })
  }
})

//Rota para métricas da semana atual
app.get('/metrics/actions/week', checkToken, async (req, res) => {
  const email = req.user.email

  const dataAtual = new Date();
  const primeiroDiaSemana = new Date(dataAtual.setDate(dataAtual.getDate() - dataAtual.getDay()));
  const ultimoDiaSemana = new Date(dataAtual.setDate(primeiroDiaSemana.getDate() + 6));

  try {

    const coleta = await prisma.event.findMany({
      where: {
        email: email,
        createdAt: {
          gte: primeiroDiaSemana,
          lte: ultimoDiaSemana
        },
      }
    })

    let qtdTotal = coleta.length
    let qtdLogin = coleta.filter(item => item.tipo === "USER_LOGIN").length
    let qtdTarefas = coleta.filter(item => item.tipo === "TASK_CREATED").length

    res.status(200).send({
      message: "sucesso",
      quantidadeTotalAcoes: qtdTotal,
      quantidadeLogin: qtdLogin,
      quantidadeTarefas: qtdTarefas

    })
  } catch (error) {

    res.status(404).send({
      message: "erro",
      error: error
    })
  }
})

//Rota para métricas do mes atual
app.get('/metrics/actions/month', checkToken, async (req, res) => {

  const email = req.user.email

  const dataAtual = new Date();
  const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
  const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);

  try {
    const coleta = await prisma.event.findMany({
      where: {
        email: email,
        createdAt: {
          gte: primeiroDiaMes,
          lte: ultimoDiaMes
        },
      }
    })

    let qtdTotal = coleta.length
    let qtdLogin = coleta.filter(item => item.tipo === "USER_LOGIN").length
    let qtdTarefas = coleta.filter(item => item.tipo === "TASK_CREATED").length

    res.status(200).send({
      message: "sucesso",
      quantidadeTotalAcoes: qtdTotal,
      quantidadeLogin: qtdLogin,
      quantidadeTarefas: qtdTarefas

    })


  } catch {
    res.status(404).send({
      message: "erro",
      error: error
    })
  }
})

app.get('/metrics/focus/today', checkToken, async (req, res) => {

  const email = req.user.email

  const data = new Date()
  let ano = data.getFullYear()
  let mes = data.getMonth() + 1
  let dia = data.getDate()

  let start = new Date(`${String(ano)}-${String(mes)}-${String(dia)}T00:00:00-03:00`);
  let end = new Date(`${String(ano)}-${String(mes)}-${String(dia)}T23:59:59-03:00`);

  //let hoje = (String(ano) + '-' + String(mes) + '-' + String(dia))

  try {

    //Vai buscar nos Eventos apenas qual tiver o email certo e criado hoje.
    const coleta = await prisma.event.findMany({
      where: {
        email: email,
        createdAt: {
          gte: start,
          lte: end
        },
        tipo: {
          contains: "POMODORO"
        }

      }
    })

    let quantidadeTotalAcoes = coleta.length
    let sessoesFoco = coleta.filter(item => item.tipo == "POMODORO_START").length
    let quantidadePausas = coleta.filter(item => item.metadada.reason == "paused").length
    let tempoFocado = coleta.filter(item => item.metadada.tempoPlanejado > 0).reduce((total, item) => total + item.metadada.tempoPlanejado, 0);

    res.status(200).send({
      message: "sucesso",
      quantidadeTotalAcoes,
      sessoesFoco,
      tempoFocado,
      quantidadePausas
    })

  } catch (error) {

    res.status(404).send({
      message: "erro",
      error: error
    })
  }
})

app.get('/metrics/tasks/history', checkToken, async (req, res) => {
  const email = req.user.email
  let days = req.query.days || 7

  const dataAtual = new Date();
  const dataLimite = new Date(dataAtual.getTime() - (days * 24 * 60 * 60 * 1000));

  try {
    const coleta = await prisma.event.findMany({
      where: {
        email: email,
        tipo: "TASK_CREATED",
        createdAt: {
          gte: dataLimite,
          lte: dataAtual
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    let quantidadeTotal = coleta.length

    res.status(200).send({
      message: "sucesso",
      quantidadeTotal
    })

  } catch (error) {

    res.status(404).send({
      message: "erro",
      error: error
    })
  }
})

app.get('/metrics/focus/history', checkToken, async (req, res) => {
  const email = req.user.email
  let days = req.query.days || 7

  const dataAtual = new Date();
  const dataLimite = new Date(dataAtual.getTime() - (days * 24 * 60 * 60 * 1000));

  try {
    const coleta = await prisma.event.findMany({
      where: {
        email: email,
        tipo: "POMODORO_START",
        createdAt: {
          gte: dataLimite,
          lte: dataAtual
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    let data = coleta.map(item => {
      {
        return {
          id: item.id,
          date: item.createdAt,
          minutos: item.metadada.tempoPlanejado
        }
      }
    })

    res.status(200).send({
      message: "sucesso",
      data

    })

  } catch (error) {

    res.status(404).send({
      message: "erro",
      error: error
    })
  }

})

app.get('/metrics/productivity', checkToken, async (req, res) => {

  const email = req.user.email

  const data = new Date()
  let ano = data.getFullYear()
  let mes = data.getMonth() + 1
  let dia = data.getDate()

  let start = new Date(`${String(ano)}-${String(mes)}-${String(dia)}T00:00:00-03:00`);
  let end = new Date(`${String(ano)}-${String(mes)}-${String(dia)}T23:59:59-03:00`);

  try {

    const coleta = await prisma.event.findMany({
      where: {
        email: email,
        createdAt: {
          gte: start,
          lte: end
        },
        tipo: {
          contains: "POMODORO"
        }

      }
    })

    const coleta2 = await prisma.event.findMany({
      where: {
        email: email,
        tipo: "TASK_CREATED",
        createdAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    let tarefasCriadas = coleta2.length
    let tempoFocado = coleta.filter(item => item.metadada.tempoPlanejado > 0).reduce((total, item) => total + item.metadada.tempoPlanejado, 0);
    let indiceProdutividade = tarefasCriadas > 0 ? (tempoFocado / tarefasCriadas) : 0

    res.status(200).send({
      message: "sucesso",
      tempoFocado,
      tarefasCriadas,
      indiceProdutividade: indiceProdutividade.toFixed(2)
    })

  } catch (error) {

    res.status(404).send({
      message: "erro",
      error: error
    })
  }
})

app.get('/dashboard', checkToken, async (req, res) => {

  const email = req.user.email

  try {

    const coleta = await prisma.event.findMany({
      where: {
        email: email
      }
    })

    let qtdTotal = coleta.length
    let qtdLogin = coleta.filter(item => item.tipo === "USER_LOGIN").length
    let qtdTarefas = coleta.filter(item => item.tipo === "TASK_CREATED").length
    let tempoFocado = coleta.filter(item => item.metadada.tempoPlanejado > 0).reduce((total, item) => total + item.metadada.tempoPlanejado, 0);
    let indiceProdutividade = qtdTarefas > 0 ? (tempoFocado / qtdTarefas) : 0
    
    res.status(200).send({
        quantidadeTotalAcoes: qtdTotal,
        quantidadeLogin: qtdLogin,
        quantidadeTarefas: qtdTarefas,
        tempoFocado: tempoFocado,
        indiceProdutividade: indiceProdutividade.toFixed(2)
    })

  } catch (error) {

    res.status(404).send({
      message: "erro",
      error: error
    })
  }
})

//Midleware, será util quando for necessário rotas privadas.
function checkToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).send({ error: "Token nao enviado" })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

const PORT = 5500;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));