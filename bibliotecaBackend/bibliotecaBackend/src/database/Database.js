// src/database/Database.js
const { Sequelize } = require('sequelize')
const Config = require('../config/Config')

class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance
    }

    const config = Config.getInstance()

    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: config.dbPath,
      logging: false
    })

    Database.instance = this
  }

  static getInstance() {
    if (!Database.instance) {
      new Database()
    }
    return Database.instance
  }

  async connect() {
    try {
      await this.sequelize.authenticate()
      console.log('✅ Banco de dados conectado!')
    } catch (error) {
      console.error('❌ Erro ao conectar no banco:', error)
    }
  }
}

module.exports = Database