// src/middlewares/role.middleware.js
function exigirRole(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: '❌ Não autenticado.' })
    }

    if (!roles.includes(req.usuario.role)) {
      return res.status(403).json({ 
        error: `❌ Acesso negado. Requer perfil: ${roles.join(' ou ')}` 
      })
    }

    next()
  }
}

module.exports = exigirRole