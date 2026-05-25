// src/routes/membros.routes.js
// Rotas responsáveis pelo gerenciamento dos membros da biblioteca.
// Membros são os usuários que realizam empréstimos (alunos, professores, etc.).
// Utiliza os middlewares de autenticação (JWT) e controle de perfil (role).

const express        = require('express')
const router         = express.Router() // cria um roteador isolado para membros
const verificarToken = require('../middlewares/auth.middleware') // valida o token JWT
const exigirRole     = require('../middlewares/role.middleware') // verifica o perfil do usuário
const { Membro }     = require('../models/index') // importa o model Membro do banco de dados

// ─────────────────────────────────────────────
// GET /api/membros
// Lista todos os membros cadastrados.
// Acessível por admin e bibliotecario.
// ─────────────────────────────────────────────
router.get('/', verificarToken, exigirRole('admin', 'bibliotecario'), async (req, res) => {
  try {
    const membros = await Membro.findAll() // busca todos os membros na tabela
    res.json(membros)
  } catch (error) {
    res.status(500).json({ error: '❌ Erro ao buscar membros.' })
  }
})

// ─────────────────────────────────────────────
// GET /api/membros/:id
// Busca um membro específico pelo ID.
// Acessível por admin e bibliotecario.
// ─────────────────────────────────────────────
router.get('/:id', verificarToken, exigirRole('admin', 'bibliotecario'), async (req, res) => {
  try {
    const membro = await Membro.findByPk(req.params.id) // findByPk = busca pela Primary Key (ID)
    if (!membro) return res.status(404).json({ error: '❌ Membro não encontrado.' })
    res.json(membro)
  } catch (error) {
    res.status(500).json({ error: '❌ Erro ao buscar membro.' })
  }
})

// ─────────────────────────────────────────────
// POST /api/membros
// Cadastra um novo membro na biblioteca.
// Acessível por admin e bibliotecario.
// ─────────────────────────────────────────────
router.post('/', verificarToken, exigirRole('admin', 'bibliotecario'), async (req, res) => {
  const { nome, email, telefone, matricula } = req.body

  // nome é o único campo obrigatório para cadastrar um membro
  if (!nome) {
    return res.status(400).json({ error: '❌ Nome é obrigatório.' })
  }

  try {
    const membro = await Membro.create({ nome, email, telefone, matricula })
    res.status(201).json({ message: '✅ Membro cadastrado!', membro })
  } catch (error) {
    // erro 400 geralmente indica email ou matrícula duplicados
    res.status(400).json({ error: '❌ Email ou matrícula já cadastrados.' })
  }
})

// ─────────────────────────────────────────────
// PUT /api/membros/:id
// Atualiza os dados de um membro existente.
// Acessível por admin e bibliotecario.
// ─────────────────────────────────────────────
router.put('/:id', verificarToken, exigirRole('admin', 'bibliotecario'), async (req, res) => {
  try {
    const membro = await Membro.findByPk(req.params.id)
    if (!membro) return res.status(404).json({ error: '❌ Membro não encontrado.' })

    const { nome, email, telefone, matricula } = req.body
    await membro.update({ nome, email, telefone, matricula }) // atualiza apenas os campos enviados
    res.json({ message: '✅ Membro atualizado!', membro })
  } catch (error) {
    res.status(400).json({ error: '❌ Erro ao atualizar membro.' })
  }
})

// ─────────────────────────────────────────────
// PATCH /api/membros/:id/status
// Ativa ou desativa um membro sem removê-lo do banco.
// Membro inativo não pode fazer empréstimos.
// Acessível apenas por admin.
// ─────────────────────────────────────────────
router.patch('/:id/status', verificarToken, exigirRole('admin'), async (req, res) => {
  try {
    const membro = await Membro.findByPk(req.params.id)
    if (!membro) return res.status(404).json({ error: '❌ Membro não encontrado.' })

    membro.ativo = !membro.ativo // inverte o status: true vira false, false vira true
    await membro.save()
    res.json({ message: `✅ Membro ${membro.ativo ? 'ativado' : 'desativado'}.`, membro })
  } catch (error) {
    res.status(500).json({ error: '❌ Erro ao alterar status do membro.' })
  }
})

module.exports = router
