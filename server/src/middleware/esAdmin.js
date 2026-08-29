function esAdmin(req, res, next) {
    if(req.usuario.rol !== 'admin'){
        return res.status(403).json({error: 'No tienes acceso a este sitio'})
    }
    next()
}

export default esAdmin