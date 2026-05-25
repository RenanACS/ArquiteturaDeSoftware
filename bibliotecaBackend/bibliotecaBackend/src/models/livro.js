 // Model de Livro — representa cada item do acervo da biblioteca

  const { DataTypes } = require('sequelize');

  module.exports = (sequelize) => {
    return sequelize.define('Livro', {
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      autor: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isbn: {
        type: DataTypes.STRING,
        unique: true, // cada livro tem um código único no mundo
      },
      categoria: {
        type: DataTypes.STRING,
      },
      tipo: {
        type: DataTypes.ENUM('Livro', 'Revista', 'Mídia Digital', 'Jornal'),
        defaultValue: 'Livro',
      },
      copias: {
        type: DataTypes.INTEGER,
        defaultValue: 1, // quantidade total de exemplares
      },
      copiasDisponiveis: {
        type: DataTypes.INTEGER,
        defaultValue: 1, // quantidade disponível para empréstimo
      },
    });
  };
