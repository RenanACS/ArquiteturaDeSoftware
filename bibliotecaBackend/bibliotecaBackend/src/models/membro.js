 // Model de Membro — representa os usuários da biblioteca
  // (alunos, professores, etc.) que pegam livros emprestados

  const { DataTypes } = require('sequelize');

  module.exports = (sequelize) => {
    return sequelize.define('Membro', {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      telefone: {
        type: DataTypes.STRING,
      },
      matricula: {
        type: DataTypes.STRING,
        unique: true, // número de matrícula único (ex: MBR-1045)
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // membro pode ser desativado sem ser deletado
      },
    });
  };
