// Model de Empréstimo — registra cada saída de livro
  // Liga um Membro a um Livro com datas e status

  const { DataTypes } = require('sequelize');

  module.exports = (sequelize) => {
    return sequelize.define('Emprestimo', {
      dataEmprestimo: {
        type: DataTypes.DATEONLY, // só a data, sem hora
        allowNull: false,
      },
      dataDevolucaoPrevista: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      dataDevolucaoReal: {
        type: DataTypes.DATEONLY,
        allowNull: true, // só é preenchida quando o livro é devolvido
      },
      status: {
        type: DataTypes.ENUM('ativo', 'devolvido', 'atrasado'),
        defaultValue: 'ativo',
      },
      multa: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0, // calculada automaticamente quando houver atraso
      },
    });
  };
