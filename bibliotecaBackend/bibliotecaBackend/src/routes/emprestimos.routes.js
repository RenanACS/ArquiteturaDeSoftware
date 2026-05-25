// src/routes/emprestimos.routes.js
// Rotas responsáveis pelo gerenciamento de empréstimos de livros.
// Ao emprestar, desconta uma cópia disponível do livro.
// Ao devolver, devolve a cópia e verifica se houve atraso.
// Acessível por admin e bibliotecario.

const express        = require('express')
const router         = express.Router()
const verificarToken = require('../middlewares/auth.middleware') // valida o token JWT
const exigirRole     = require('../middlewares/role.middleware') // verifica o perfil do usuário
const { Emprestimo, Livro, Membro } = require('../models/index') // importa os models necessários

// ─────────────────────────────────────────────
// GET /api/emprestimos
// Lista todos os empréstimos, incluindo dados do livro e do membro.
// O "include" funciona como um JOIN no SQL — traz dados das tabelas relacionadas.
// ─────────────────────────────────────────────
router.get('/', verificarToken, exigirRole('admin', 'bibliotecario'), async (req, res) => {
  try {
    const emprestimos = await Emprestimo.findAll({
      include: [
        { model: Livro,  attributes: ['titulo', 'autor'] },   // traz só o necessário do livro
        { model: Membro, attributes: ['nome', 'matricula'] }  // traz só o necessário do membro
      ]
    })
    res.json(emprestimos)
  } catch (error) {
    res.status(500).json({ error: '❌ Erro ao buscar empréstimos.' })
  }
})

// ─────────────────────────────────────────────
// GET /api/emprestimos/:id
// Busca um empréstimo específico pelo ID, com dados do livro e do membro.
// ─────────────────────────────────────────────
router.get('/:id', verificarToken, exigirRole('admin', 'bibliotecario'), async (req, res) => {
  try {
    const emprestimo = await Emprestimo.findByPk(req.params.id, {
      include: [
        { model: Livro,  attributes: ['titulo', 'autor'] },
        { model: Membro, attributes: ['nome', 'matricula'] }
      ]
    })
    if (!emprestimo) return res.status(404).json({ error: '❌ Empréstimo não encontrado.' })
    res.json(emprestimo)
  } catch (error) {
    res.status(500).json({ error: '❌ Erro ao buscar empréstimo.' })
  }
})

// ─────────────────────────────────────────────
// POST /api/emprestimos
// Registra um novo empréstimo.
// Verifica se o livro tem cópias disponíveis e se o membro está ativo.
// Desconta 1 do copiasDisponiveis do livro ao confirmar o empréstimo.
// ─────────────────────────────────────────────
router.post('/', verificarToken, exigirRole('admin', 'bibliotecario'), async (req, res) => {
  const { livroId, membroId, dataEmprestimo, dataDevolucaoPrevista } = req.body

  // todos os campos são obrigatórios para registrar um empréstimo
  if (!livroId || !membroId || !dataEmprestimo || !dataDevolucaoPrevista) {
    return res.status(400).json({ error: '❌ Preencha todos os campos obrigatórios.' })
  }

  try {
    // verifica se o livro existe e tem cópias disponíveis
    const livro = await Livro.findByPk(livroId)
    if (!livro) return res.status(404).json({ error: '❌ Livro não encontrado.' })
    if (livro.copiasDisponiveis <= 0) {
      return res.status(400).json({ error: '❌ Nenhuma cópia disponível para empréstimo.' })
    }

    // verifica se o membro existe e está ativo
    const membro = await Membro.findByPk(membroId)
    if (!membro) return res.status(404).json({ error: '❌ Membro não encontrado.' })
    if (!membro.ativo) {
      return res.status(400).json({ error: '❌ Membro inativo. Ative o cadastro antes de emprestar.' })
    }

    // cria o registro do empréstimo no banco
    const emprestimo = await Emprestimo.create({
      livroId,
      membroId,
      dataEmprestimo,
      dataDevolucaoPrevista
    })

    // desconta 1 cópia disponível do livro
    await livro.update({ copiasDisponiveis: livro.copiasDisponiveis - 1 })

    res.status(201).json({ message: '✅ Empréstimo registrado!', emprestimo })
  } catch (error) {
    res.status(500).json({ error: '❌ Erro ao registrar empréstimo.' })
  }
})

// ─────────────────────────────────────────────
// PATCH /api/emprestimos/:id/devolver
// Registra a devolução de um livro emprestado.
// Verifica se houve atraso comparando a data atual com a dataDevolucaoPrevista.
// Devolve 1 cópia ao estoque do livro.
// ─────────────────────────────────────────────
router.patch('/:id/devolver', verificarToken, exigirRole('admin', 'bibliotecario'), async (req, res) => {
  try {
    // busca o empréstimo junto com os dados do livro (precisamos atualizar as cópias)
    const emprestimo = await Emprestimo.findByPk(req.params.id, {
      include: [{ model: Livro }]
    })
    if (!emprestimo) return res.status(404).json({ error: '❌ Empréstimo não encontrado.' })
    if (emprestimo.status === 'devolvido') {
      return res.status(400).json({ error: '❌ Este livro já foi devolvido.' })
    }

    // pega a data de hoje no formato AAAA-MM-DD para comparar com a data prevista
    const hoje = new Date().toISOString().split('T')[0]
    const atrasado = hoje > emprestimo.dataDevolucaoPrevista // true se passou da data prevista

    // atualiza o empréstimo com a data real de devolução e o status correto
    await emprestimo.update({
      dataDevolucaoReal: hoje,
      status: atrasado ? 'atrasado' : 'devolvido'
    })

    // devolve 1 cópia ao estoque do livro
    await emprestimo.Livro.update({
      copiasDisponiveis: emprestimo.Livro.copiasDisponiveis + 1
    })

    res.json({ message: '✅ Devolução registrada!', emprestimo })
  } catch (error) {
    res.status(500).json({ error: '❌ Erro ao registrar devolução.' })
  }
})

module.exports = router
