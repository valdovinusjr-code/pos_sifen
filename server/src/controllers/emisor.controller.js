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
        razon_social, id_tipo_doc_identidad, numero_documento
        FROM facturacion.emisor 
        WHERE id_emisor = $1
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
        const {razon_social, id_tipo_doc_identidad, numero_documento} = req.body
        if(id_tipo_doc_identidad === null || id_tipo_doc_identidad === undefined, !razon_social || !numero_documento){
            return res.status(400).json({error: 'Todos los campos son obligatorios'})
        }
        const sql = 
        `
        INSERT INTO facturacion.emisor
        (razon_social, id_tipo_doc_identidad, numero_documento)
        VALUES
        ($1, $2, $3)
        RETURNING id_emisor
        `

        const {rows} = await pool.query(sql, [razon_social, id_tipo_doc_identidad, numero_documento])

        res.status(201).json({
            message: 'Ingreso exitoso',
            emisor: rows[0].id_emisor
        })
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}