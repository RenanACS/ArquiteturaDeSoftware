class Config {
  constructor() {
    this.port      = process.env.PORT       || 3001
    this.jwtSecret = process.env.JWT_SECRET || 'bibliotheca_secret_2026'
    this.dbPath    = process.env.DB_PATH    || './bibliotheca.db'
    Config.instance = this // salva a instância para o Singleton funcionar
  }

  static getInstance() {
    if (!Config.instance) {
      new Config()
    }
    return Config.instance
  }
}

module.exports = Config

