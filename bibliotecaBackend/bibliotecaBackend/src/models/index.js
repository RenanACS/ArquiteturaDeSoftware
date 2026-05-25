// Ponto central dos models — carrega a conexão, inicializa os models
// e define os relacionamentos entre as tabelas.

const Database   = require('../database/Database')
const sequelize  = Database.getInstance().sequelize

// Usuario já é um model pronto (não é factory), importa direto
const Usuario    = require('./Usuario')

// Livro, Membro e Emprestimo são factories — recebem o sequelize para se registrar
const Livro      = require('./livro')(sequelize)
const Membro     = require('./membro')(sequelize)
const Emprestimo = require('./emprestimo')(sequelize)

// Relacionamentos: um Emprestimo pertence a um Livro e a um Membro
Emprestimo.belongsTo(Livro,  { foreignKey: 'livroId' })
Emprestimo.belongsTo(Membro, { foreignKey: 'membroId' })
Livro.hasMany(Emprestimo,    { foreignKey: 'livroId' })
Membro.hasMany(Emprestimo,   { foreignKey: 'membroId' })

module.exports = { sequelize, Usuario, Livro, Membro, Emprestimo }
