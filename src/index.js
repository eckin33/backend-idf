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
    /* const usuarioExistente = await prisma.user.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(409).json({ error: "Email já cadastrado." });
    } */

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

  res.send('Padrão do projeto')

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

    const user = await prisma.user.findFirst({where: {email}})

    if(!user) return res.status(404).send("Email não encontrado.")
    
    const senhaCorreta = await bcrypt.compare(password, user.password)

    if(senhaCorreta){
      
      const token = jwt.sign(
        { id: user.id, email: user.email},
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES}
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
      

    }else{
      return res.status(404).send("Senha incorreta.")
    }

  } catch (erro) {
    console.log(erro)
    res.status(500).send({ erro: "Erro no servidor" })

  }

})

//Midleware, será util quando for necessário rotas privadas.
function checkToken(req, res, next){

  const authHeader = req.headers.authorization
  const token = authHeader.split(" ")[1]

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) =>{

    if(err){
      return res.status(403).json({error: "Token invalido"})
    }

    req.user = decoded
    next()

  })

}

const PORT = 5500;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));