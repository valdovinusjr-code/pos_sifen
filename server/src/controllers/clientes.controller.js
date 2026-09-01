import pool from "../config/db.js";

export const listar = async(req, res)=>{
    try{
        const id = Number(req.params.id)
        if(!Number.isInteger(id) || id <= 0){
            return res.status(400).json({error: 'identificador invalido'})
        }
        const sql = 
        `
        SELECT 
        id_tipo_doc_identidad, numero_documento,
        nombre_razon_social, id_tipo_contribuyente,
        direccion, telefono
        FROM venta.cliente 
        WHERE id_cliente = $1
        `

        const {rows} = await pool.query(sql, [id])

        if(rows.length === 0){
            return res.status(404).json({error: 'el cliente no existe'})
        }

        res.status(200).json({
            message: 'Cliente encontrado',
            cliente: rows[0]
        })
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const asignar = async(req, res)=>{
    try{
        const {id_tipo_doc_identidad, numero_documento, nombre_razon_social, id_tipo_contribuyente, direccion, telefono} = req.body
        if(!nombre_razon_social){
            return res.status(400).json({error: 'Todos los campos son obligatorios'})
        }
        const sql = 
        `
        INSERT INTO venta.cliente 
        (id_tipo_doc_identidad, numero_documento,
        nombre_razon_social, id_tipo_contribuyente,
        direccion, telefono)
        VALUES
        ($1, $2, $3, $4, $5, $6)
        RETURNING id_cliente
        `

        const {rows} = await pool.query(sql, [id_tipo_doc_identidad, numero_documento, nombre_razon_social, id_tipo_contribuyente, direccion, telefono])

        res.status(201).json({
            message: 'Ingreso exitoso',
            cliente: rows[0].id_cliente
        })
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}