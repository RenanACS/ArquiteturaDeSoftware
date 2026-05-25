// src/routes/salas.routes.js
const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth.middleware')
const exigirRole = require('../middlewares/role.middleware')

let reservas = []
let proximoId = 1

// Listar todas as reservas
router.get('/', verificarToken, exigirRole('admin', 'bibliotecario'), (req, res) => {
  res.json(reservas)
})

// Criar reserva
router.post('/', verificarToken, exigirRole('admin', 'bibliotecario'), (req, res) => {
  const { sala, data, horario, duracao, memberId } = req.body

  if (!sala || !data || !horario || !memberId) {
    return res.status(400).json({ error: '❌ Preencha todos os campos.' })
  }

  const novaReserva = {
    id: proximoId++,
    sala,
    data,
    horario,
    duracao,
    memberId,
    status: 'booked',
    criadoPor: req.usuario.email
  }

  reservas.push(novaReserva)
  res.status(201).json({ message: '✅ Sala reservada!', reserva: novaReserva })
})

// Cancelar reserva
router.delete('/:id', verificarToken, exigirRole('admin', 'bibliotecario'), (req, res) => {
  const index = reservas.findIndex(r => r.id === parseInt(req.params.id))
  if (index === -1) return res.status(404).json({ error: '❌ Reserva não encontrada.' })

  reservas.splice(index, 1)
  res.json({ message: '✅ Reserva cancelada!' })
})

module.exports = router