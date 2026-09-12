import pool from "../config/db.js";

export const listarContribuyente = async(req, res)=>{
    try{
        const sql = 
        `
        SELECT 
        id_tipo_contribuyente,
        codigo, descripcion
        FROM catalogos.tipo_contribuyente
        `

        const {rows} = await pool.query(sql)

        if(rows.length === 0){
            return res.status(404).json({error: 'el contribuyente no existe'})
        }

        res.status(200).json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const listarDocumentos = async(req, res)=>{
    try{
        const sql = 
        `
        SELECT 
        id_tipo_doc_identidad,
        codigo_sifen, descripcion
        FROM catalogos.tipo_documento_identidad
        `

        const {rows} = await pool.query(sql)

        if(rows.length === 0){
            return res.status(404).json({error: 'el documento no existe'})
        }

        res.status(200).json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const listar = async(req, res)=>{
    try{
        const sql = 
        `
        SELECT 
        id_cliente,
        id_tipo_doc_identidad, numero_documento,
        nombre_razon_social, id_tipo_contribuyente,
        direccion, telefono
        FROM venta.cliente 
        ORDER BY id_cliente
        `

        const {rows} = await pool.query(sql)

        if(rows.length === 0){
            return res.status(404).json({error: 'el cliente no existe'})
        }

        res.status(200).json(rows)
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
        if(id_tipo_doc_identidad !== undefined){
            const textoVacio = typeof id_tipo_doc_identidad === 'string' && !id_tipo_doc_identidad.trim()
            const numid = Number(id_tipo_doc_identidad)
            if(textoVacio || !Number.isInteger(numid) || numid <= 0){
                return res.status(400).json({error: "documento de identidad invalido"})
            }
        }

        if(typeof numero_documento !== 'string' || !numero_documento.trim()){
            return res.status(400).json({error: "numero de documento invalido"})
        }

        if(typeof nombre_razon_social !== 'string' || !nombre_razon_social.trim()){
            return res.status(400).json({error: "nombre de item invalido"})
        }

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