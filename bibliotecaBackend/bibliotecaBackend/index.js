const https = require('https')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const { ensureCertificates } = require('./gerar-certificado')
const Config = require('./src/config/Config')
const Database = require('./src/database/Database')
const { sequelize, Usuario } = require('./src/models/index')
const authRoutes = require('./src/routes/auth.routes')
const usuariosRoutes = require('./src/routes/usuarios.routes')
const livrosRoutes = require('./src/routes/livros.routes')
const membrosRoutes = require('./src/routes/membros.routes')
const emprestimosRoutes = require('./src/routes/emprestimos.routes')
const salasRoutes = require('./src/routes/salas.routes')

const config = Config.getInstance()
const database = Database.getInstance()
const app = express()

app.use(cors({
  origin: ['http://localhost:4200', 'https://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/livros', livrosRoutes)
app.use('/api/membros', membrosRoutes)
app.use('/api/emprestimos', emprestimosRoutes)
app.use('/api/salas', salasRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Servidor da Biblioteca rodando com HTTPS!', status: 'ok' })
})

async function start() {
  const { keyPath, certPath } = await ensureCertificates()
  const sslOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  }

  await database.connect()
  await sequelize.sync({ alter: true })
  console.log('Tabelas sincronizadas!')

  const bcrypt = require('bcrypt')
  const adminExiste = await Usuario.findOne({ where: { email: 'admin@biblioteca.com' } })
  if (!adminExiste) {
    await Usuario.create({
      firstName: 'Admin',
      lastName: 'Sistema',
      email: 'admin@biblioteca.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      status: 'active'
    })
    console.log('Usuario admin criado!')
  }

  https.createServer(sslOptions, app).listen(config.port, () => {
    console.log(`Servidor HTTPS na porta ${config.port}`)
    console.log(`Acesse: https://localhost:${config.port}`)
  })
}

start().catch((error) => {
  console.error('Erro ao iniciar o servidor:', error)
  process.exit(1)
})
