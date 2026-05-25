// src/controllers/auth.controller.js
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Usuario = require('../models/Usuario')
const Config = require('../config/Config')

const config = Config.getInstance()

async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: '❌ Email e senha são obrigatórios.' })
  }

  try {
    const usuario = await Usuario.findOne({ where: { email } })

    if (!usuario) {
      return res.status(401).json({ error: '❌ Credenciais inválidas.' })
    }

    if (usuario.status === 'inactive') {
      return res.status(403).json({ error: '❌ Usuário inativo.' })
    }

    const senhaValida = await bcrypt.compare(password, usuario.password)

    if (!senhaValida) {
      return res.status(401).json({ error: '❌ Credenciais inválidas.' })
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role },
      config.jwtSecret,
      { expiresIn: '8h' }
    )

    return res.status(200).json({
      message: '✅ Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        firstName: usuario.firstName,
        lastName: usuario.lastName,
        email: usuario.email,
        role: usuario.role
      }
    })
  } catch (error) {
    return res.status(500).json({ error: '❌ Erro interno do servidor.' })
  }
}

module.exports = { login }