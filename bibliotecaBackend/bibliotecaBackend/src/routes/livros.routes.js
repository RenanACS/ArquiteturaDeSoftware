// src/routes/livros.routes.js
// Rotas responsáveis pelo gerenciamento do acervo de livros da biblioteca.
// Utiliza os middlewares de autenticação (JWT) e controle de perfil (role)
// para garantir que apenas usuários autorizados acessem cada operação.

const express        = require('express')
const router         = express.Router() // cria um roteador isolado para livros
const verificarToken = require('../middlewares/auth.middleware') // valida o token JWT
const exigirRole     = require('../middlewares/role.middleware') // verifica o perfil do usuário
const { Livro }      = require('../models/index') // importa o model Livro do banco de dados

// ─────────────────────────────────────────────
// GET /api/livros
// Lista todos os livros cadastrados no acervo.
// Acessível por admin e bibliotecario.
// ─────────────────────────────────────────────
router.get('/', verificarToken, exigirRole('admin', 'bibliotecario'), async (req, res) => {
  try {
    const livros = await Livro.findAll() // busca todos os registros da tabela Livros
    res.json(livros)
  } catch (error) {
    res.status(500).json({ error: '❌ Erro ao buscar livros.' })
  }
})

// ─────────────────────────────────────────────
// GET /api/livros/:id
// Busca um livro específico pelo seu ID.
// Acessível por admin e bibliotecario.
// ─────────────────────────────────────────────
router.get('/:id', verificarToken, exigirRole('admin', 'bibliotecario'), async (req, res) => {
  try {
    const livro = await Livro.findByPk(req.params.id) // findByPk = busca pela Primary Key (ID)
    if (!livro) return res.status(404).json({ error: '❌ Livro não encontrado.' })
    res.json(livro)
  } catch (error) {
    res.status(500).json({ error: '❌ Erro ao buscar livro.' })
  }
})

// ─────────────────────────────────────────────
// POST /api/livros
// Cadastra um novo livro no acervo.
// Acessível apenas por admin.
// ─────────────────────────────────────────────
router.post('/', verificarToken, exigirRole('admin'), async (req, res) => {
  // desestrutura os campos enviados no corpo da requisição
  const { titulo, autor, isbn, categoria, tipo, copias } = req.body

  // titulo e autor são obrigatórios para cadastrar um livro
  if (!titulo || !autor) {
    return res.status(400).json({ error: '❌ Título e autor são obrigatórios.' })
  }

  try {
    const livro = await Livro.create({
      titulo,
      autor,
      isbn,
      categoria,
      tipo,
      copias: copias || 1,             // se não informado, assume 1 cópia
      copiasDisponiveis: copias || 1   // ao cadastrar, todas as cópias estão disponíveis
    })
    res.status(201).json({ message: '✅ Livro cadastrado!', livro })
  } catch (error) {
    // erro 400 geralmente indica ISBN duplicado ou campo inválido
    res.status(400).json({ error: '❌ ISBN já cadastrado ou dados inválidos.' })
  }
})

// ─────────────────────────────────────────────
// PUT /api/livros/:id
// Atualiza os dados de um livro existente.
// Acessível apenas por admin.
// ─────────────────────────────────────────────
router.put('/:id', verificarToken, exigirRole('admin'), async (req, res) => {
  try {
    const livro = await Livro.findByPk(req.params.id)
    if (!livro) return res.status(404).json({ error: '❌ Livro não encontrado.' })

    const { titulo, autor, isbn, categoria, tipo, copias } = req.body
    await livro.update({ titulo, autor, isbn, categoria, tipo, copias }) // atualiza apenas os campos enviados
    res.json({ message: '✅ Livro atualizado!', livro })
  } catch (error) {
    res.status(400).json({ error: '❌ Erro ao atualizar livro.' })
  }
})

// ─────────────────────────────────────────────
// DELETE /api/livros/:id
// Remove um livro do acervo permanentemente.
// Acessível apenas por admin.
// ─────────────────────────────────────────────
router.delete('/:id', verificarToken, exigirRole('admin'), async (req, res) => {
  try {
    const livro = await Livro.findByPk(req.params.id)
    if (!livro) return res.status(404).json({ error: '❌ Livro não encontrado.' })

    await livro.destroy() // remove o registro do banco de dados
    res.json({ message: '✅ Livro removido do acervo!' })
  } catch (error) {
    res.status(500).json({ error: '❌ Erro ao remover livro.' })
  }
})

module.exports = router
