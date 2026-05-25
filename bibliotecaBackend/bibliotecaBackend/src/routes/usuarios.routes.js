// src/routes/usuarios.routes.js
const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth.middleware')
const exigirRole = require('../middlewares/role.middleware')
const Usuario = require('../models/Usuario')

// Somente admin pode listar usuários
router.get('/', verificarToken, exigirRole('admin'), async (req, res) => {
  const usuarios = await Usuario.findAll({
    attributes: { exclude: ['password'] }
  })
  res.json(usuarios)
})

// Somente admin pode cadastrar usuários
router.post('/', verificarToken, exigirRole('admin'), async (req, res) => {
  const bcrypt = require('bcrypt')
  const { firstName, lastName, email, password, role } = req.body

  if (!firstName || !email || !password) {
    return res.status(400).json({ error: '❌ Preencha todos os campos.' })
  }

  try {
    const hash = await bcrypt.hash(password, 10)
    const usuario = await Usuario.create({
      firstName, lastName, email,
      password: hash, role: role || 'membro'
    })
    const { password: _, ...dados } = usuario.toJSON()
    res.status(201).json({ message: '✅ Usuário criado!', usuario: dados })
  } catch (error) {
    res.status(400).json({ error: '❌ Email já cadastrado.' })
  }
})

// Ativar/desativar usuário — somente admin
router.patch('/:id/status', verificarToken, exigirRole('admin'), async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id)
  if (!usuario) return res.status(404).json({ error: '❌ Usuário não encontrado.' })

  usuario.status = usuario.status === 'active' ? 'inactive' : 'active'
  await usuario.save()
  res.json({ message: `✅ Status alterado para ${usuario.status}.` })
})

module.exports = router