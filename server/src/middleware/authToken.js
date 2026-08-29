import jwt from 'jsonwebtoken'

function verificarToken(req, res, next) {
    const authToken = req.headers.authorization
    if(!authToken || !authToken.startsWith('Bearer ')){
        return res.status(401).json({error: 'token no proporcionado'})
    }
    const token = authToken.split(' ')[1]
    try{
        const datos = jwt.verify(token, process.env.JWT_SECRET)
        req.usuario = datos
        next()
    }catch(error){
        console.error(error)
        res.status(401).json({error: 'token expirado'})
    }
}

export default verificarToken