import pool from "../config/db.js";

export const asignar = async(req, res) => {
    try{
        const id = Number(req.params.id)
        if(!Number.isInteger(id)||id <= 0){
            return res.status(400).json({error: 'el id invalido'})
        }
        const {id_sucursal} = req.body
        if(!Number.isInteger(Number(id_sucursal))||Number(id_sucursal) <= 0){
            return res.status(400).json({error: 'el id invalido'})
        }

        const {rows} = await pool.query('SELECT id_sucursal FROM catalogos.sucursales WHERE id_sucursal = $1', [id_sucursal])
        if(rows.length === 0){
            return res.status(404).json({error: 'el identificador de sucursal no existe'})
        }

        const {rows: usuarioSucursal} = await pool.query('INSERT INTO seguridad.usuario_sucursal (id_usuario, id_sucursal) VALUES($1, $2) RETURNING id_usuario, id_sucursal', [id, id_sucursal])

        res.status(201).json({
            message: 'Registro existoso',
            usuarioSucursal: usuarioSucursal[0]
        })
    }catch(error){
        console.error(error)
        if(error.code === '23505'){
            return res.status(409).json({error: 'El usuario ya esta asignado a esa sucursal'})
        }
        res.status(500).json({error: 'Sin conexion a la db'})
    }
}

export const listar = async(req, res) => {
    try{
        const id = Number(req.params.id)
        if(!Number.isInteger(id)||id<=0){
            return res.status(400).json({error: 'el id proporcionado no es valido'})
        }
        const sql = `
        SELECT us.id_usuario, us.id_sucursal, s.nombre_sucursal, us.activo 
        FROM seguridad.usuario_sucursal us 
        JOIN catalogos.sucursales s ON us.id_sucursal = s.id_sucursal WHERE us.id_usuario = $1 AND us.activo = TRUE`
        const {rows} = await pool.query(sql, [id])
        if(rows.length === 0){
            return res.status(404).json({error: 'el usuario no existe'})
        }
        res.json(rows[0])
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Sin conexion a la db'})
    }
}

export const quitar = async(req, res) => {
    try{
        const {id, id_sucursal }= req.params
        if(!Number.isInteger(Number(id))||Number(id)<=0){
            return res.status(400).json({error: 'el id proporcionado no es valido'})
        }

        if(!Number.isInteger(Number(id_sucursal))||Number(id_sucursal)<=0){
            return res.status(400).json({error: 'el id proporcionado no es valido'})
        }
        const sql = `
        UPDATE seguridad.usuario_sucursal SET activo = FALSE WHERE id_usuario = $1 AND id_sucursal = $2 RETURNING id_usuario, id_sucursal, activo`
        const {rows} = await pool.query(sql, [id, id_sucursal])
        if(rows.length === 0){
            return res.status(404).json({error: 'la asignacion no existe o ya fue desactivada'})
        }
        res.status(200).json({
            message: 'Desactivado con exito',
            usuarioAffected: rows[0]
        })
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Sin conexion a la db'})
    }
}