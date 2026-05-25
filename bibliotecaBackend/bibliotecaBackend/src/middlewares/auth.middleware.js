// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken')
const Config = require('../config/Config')

const config = Config.getInstance()

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '❌ Acesso negado. Token não fornecido.' })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.usuario = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: '❌ Token inválido ou expirado.' })
  }
}

module.exports = verificarToken