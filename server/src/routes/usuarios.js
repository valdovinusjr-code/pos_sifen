import pool from "../config/db.js";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import esAdmin from "../middleware/esAdmin.js"
import verificarToken from "../middleware/authToken.js"

const router = Router()

router.post('/login', async(req, res)=>{
    try{    
        const {login, pass_hash} = req.body
        if(!login || !pass_hash){
            return res.status(400).json({error: 'No puedes dejar los campos vacios'})
        } 

        const {rows: usuarios} = await pool.query(`
            SELECT u.id_usuario, u.login, u.activo, u.password_hash, r.id_rol, r.nombre_rol
            FROM seguridad.usuarios u JOIN seguridad.roles r ON
            u.id_rol = r.id_rol WHERE u.login = $1
            `, [login])
        
        
        if(usuarios.length === 0){
            return res.status(404).json({error: 'el usuario no existe'})
        }

        const usuariovalido = usuarios[0]

        const compare = await bcrypt.compare(pass_hash, usuariovalido.password_hash)
        if(!compare){
            return res.status(400).json({error: 'Credenciales invalidas'})
        }

        const token = jwt.sign(
            {id_usuario: usuariovalido.id_usuario, login: usuariovalido.login, rol: usuariovalido.nombre_rol},
            process.env.JWT_SECRET,
            {expiresIn: '8h'}
        )

        res.status(200).json({
            message: 'Logeado con exito',
            token,
            rol: usuariovalido.nombre_rol
        })
    }catch(error){
        console.log(error)
        res.status(500).json({error: 'sin acceso a la base de datos'})
    }
})

router.post('/', async(req, res)=>{
    try{
        const {login, password, id_rol} = req.body
        if(!login || !password || id_rol === undefined || id_rol === null){
            return res.status(400).json({error: 'Todos los campos son obligatorios'})
        }

        if(!Number.isInteger(Number(id_rol)) || Number(id_rol) <= 0){
            return res.status(400).json({error: 'identificador invalido'})
        }
        
        if(typeof login !== 'string' || !login.trim()){
            return res.status(400).json({error: 'usuario invalido'})
        }

        if(typeof password !== 'string' || password.length < 8){
            return res.status(400).json({error: 'contraseña invalida (al menos 8 caracteres)'})
        }

        const {rows: roles} = await pool.query('SELECT id_rol FROM seguridad.roles WHERE id_rol = $1', [id_rol])
        if(roles.length === 0){
            return res.status(404).json({error: 'rol no encontrado'})
        }

        const password_hash = await bcrypt.hash(password, 10)
        const {rows: usuarios} = await pool.query('INSERT INTO seguridad.usuarios(login, password_hash, id_rol) VALUES($1, $2, $3) RETURNING id_usuario', [login, password_hash, id_rol])
        return res.status(201).json({
            message: 'Registro exitoso',
            id_usuario: usuarios[0].id_usuario
        })
    }catch(error){
        console.error(error)
        if(error.code === '23505'){
            return res.status(409).json({error: 'usuario esta en uso'})
        } 
        res.status(500).json({error: 'Problema al conectarse al servidor'})
    }
})

router.use(verificarToken)
router.use(esAdmin) 

router.get('/:id', async(req, res) => {
    try{
        const id = Number(req.params.id)
        if(!Number.isInteger(id) || id <= 0){
            return res.status(400).json({error: 'id invalido'})
        }
        const {rows} = await pool.query(`
            SELECT 
            u.id_usuario, u.login, u.activo, r.id_rol, r.nombre_rol
            FROM seguridad.usuarios u JOIN seguridad.roles r ON
            u.id_rol = r.id_rol WHERE u.id_usuario = $1`, [id])

        if(rows.length === 0){
            return res.status(404).json({error: 'Usuario no existe'})
        }
        res.json(rows[0])
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problema al conectar con la base de datos'})
    }
})

router.patch('/:id', async(req, res)=>{
    try{
        const id = Number(req.params.id)
        if(!Number.isInteger(id) || id <= 0){
            return res.status(400).json({error: 'id invalido'})
        }
        const clave = []
        const valores = []

        const {login, password, password_nueva, id_rol} = req.body
        
        if(login !== undefined){
            if(typeof login !== 'string' || !login.trim()){
                return res.status(400).json({error: 'usuario invalido'})
            }

            valores.push(login.trim())
            clave.push(`login = $${valores.length}`)
        }

        if(password_nueva !== undefined){
            if(typeof password !== 'string' || !password.trim()){
                return res.status(400).json({error: 'contraseña invalida'})
            }

            const {rows: password_user} = await pool.query(`SELECT password_hash FROM seguridad.usuarios WHERE id_usuario = $1`, [id])

            if(password_user.length === 0){
                return res.status(404).json({error: 'credenciales invalidas'})
            }

            const compare = await bcrypt.compare(password, password_user[0].password_hash)

            if(!compare){
                return res.status(400).json({error: 'la contraseña no coincide, intentelo de nuevo'})
            }

            if(typeof password_nueva !== 'string' || password_nueva.length < 8 || !password_nueva.trim()){
                return res.status(400).json({error: 'contraseña invalida'})
            }

            const newHash = await bcrypt.hash(password_nueva, 10)

            valores.push(newHash)
            clave.push(`password_hash = $${valores.length}`)
        }
        
        if(id_rol !== undefined){
            if(!Number.isInteger(Number(id_rol)) || Number(id_rol) <= 0){
                return res.status(400).json({error: 'el rol es invalido'})
            }

            const {rows: roles} = await pool.query(`SELECT id_rol FROM seguridad.roles WHERE id_rol = $1`, [id_rol]) 
            if(roles.length === 0){
                return res.status(404).json({error: 'el rol no existe'})
            }
            
            valores.push(id_rol)
            clave.push(`id_rol = $${valores.length}`)
        }   

        if(clave.length === 0){
            return res.status(400).json({error: 'No se realizo ninguna actualizacion'})
        }

        valores.push(id)

        const {rows: usuariosPatch} = await pool.query(`UPDATE seguridad.usuarios SET ${clave.join(', ')} WHERE id_usuario = $${valores.length} RETURNING id_usuario, login, id_rol, activo` , valores )

        if(usuariosPatch.length === 0){
            return res.status(404).json({error: 'usuario no encontrado'})
        }

        return res.status(200).json({
            message: 'Usuario actualizado',
            usuario: usuariosPatch[0]
        })
        
    }catch(error){
        if(error.code === '23505'){
            return res.status(409).json({error: 'el nombre de usuario ya esta en uso'})
        }

        console.error(error)
        return res.status(500).json({error: 'sin acceso a la base de datos'})
    }
})

router.delete('/:id', async(req, res)=>{
    try{
        const id = Number(req.params.id)
        if(!Number.isInteger(id)||id <= 0){
            return res.status(400).json({error: 'id invalido'})
        }
        
        if(req.usuario.id_usuario === id){
            return res.status(400).json({error: 'No puedes desactivar tu usuario'})
        }

        const {rows} = await pool.query('SELECT id_usuario, activo FROM seguridad.usuarios WHERE id_usuario = $1', [id])

        if(rows.length === 0){
            return res.status(404).json({error: 'Usuario no encontrado'})
        }
        
        if(!rows[0].activo){
            return res.status(400).json({error: 'El usuario ya esta desactivado'})
        }
        const {rows: usuarioDesactivar} = await pool.query('UPDATE seguridad.usuarios SET activo = FALSE WHERE id_usuario = $1', [id])

        res.status(200).json({
            message: 'Usuario desactivado',
            usuario: usuarioDesactivar[0]
        })
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Sin acceso a la base de datos'})
    }
})
export default router