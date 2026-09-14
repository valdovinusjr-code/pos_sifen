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

export const listar_Documento = async(req, res)=>{
    try{
        const sql = 
        `
        SELECT 
        id_documento_electronico, 
        id_venta, 
        id_tipo_documento, 
        id_timbrado, 
        cdc, 
        numero_documento, 
        id_estado_documento, 
        fecha_emision, 
        xml_payload
	    FROM 
        facturacion.documento_electronico;
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

export const listar_tipos = async(req, res)=>{
    try{
        const sql = 
        `
        SELECT id_tipo_evento, idescripcion
	    FROM catalogos.tipo_evento;
        `

        const {rows} = await pool.query(sql)
        if(rows.length === 0){
            return res.status(404).json({error: 'el tipo de evento no existe'})
        }

        res.status(200).json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const listar_eventos = async(req, res)=>{
    try{
        const sql = 
        `
        SELECT id_evento_documento, id_documento_electronico, te.id_tipo_evento, te.idescripcion AS idescripcion, motivo, fecha_evento
	    FROM facturacion.evento_documento ed JOIN catalogos.tipo_evento te ON ed.id_tipo_evento = te.id_tipo_evento;
        `

        const {rows} = await pool.query(sql)
        if(rows.length === 0){
            return res.status(404).json({error: 'el tipo de evento no existe'})
        }

        res.status(200).json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const asignar = async(req, res)=>{
    const {id_documento_electronico, id_tipo_evento, motivo} = req.body
    if(id_documento_electronico === null || id_documento_electronico === undefined || 
        id_tipo_evento === null || id_tipo_evento === undefined ||
        !motivo){
        return res.status(400).json({error: 'los datos no pueden quedar vacios'})
        }

    const cliente = await pool.connect()

    try{
        await cliente.query('BEGIN')
        const {rows: estado} = await cliente.query(`
            SELECT ed.id_estado_documento, cat.idescripcion
            FROM facturacion.documento_electronico ed
            JOIN catalogos.estado_documento cat ON cat.id_estado_documento = ed.id_estado_documento
            WHERE ed.id_documento_electronico = $1
            `, [id_documento_electronico])

        if(estado.length === 0){
            await cliente.query('ROLLBACK')
            return res.status(404).json({error: 'documento invalido'})
        }

        const {rows: tipo_evento} = await cliente.query(`
            SELECT idescripcion FROM catalogos.tipo_evento WHERE id_tipo_evento = $1
            `, [id_tipo_evento])

        if(tipo_evento.length === 0){
            await cliente.query('ROLLBACK')
            return res.status(404).json({error: "evento inexistente"})
        }
        const estadoActual = estado[0].idescripcion.toUpperCase()

        if(estadoActual === 'CANCELADO' || estadoActual === 'INUTILIZADO'){
            await cliente.query('ROLLBACK')
            return res.status(400).json({error: 'EL documento ya esta cancelado/inutilizado'})
        }
        
        const {rows: evento_documento} = await cliente.query(
            `INSERT INTO facturacion.evento_documento(id_documento_electronico, id_tipo_evento, motivo) VALUES($1, $2, $3) RETURNING id_evento_documento`
            , [id_documento_electronico, id_tipo_evento, motivo])
        
        if(evento_documento.length === 0){
            await cliente.query('ROLLBACK')
            return res.status(404).json({error: "Error al insertar evento"})
        }
        const evento = evento_documento[0]

        const descripcion = tipo_evento[0].idescripcion === "Cancelacion" ? "Cancelado" : "Inutilizado"

        const {rows: estado_elegido} = await cliente.query(`
            SELECT id_estado_documento FROM catalogos.estado_documento WHERE idescripcion = $1
            `, [descripcion])
        
        const estado_id = estado_elegido[0].id_estado_documento

        const {rows: estado_actualizado} = await cliente.query
        (
            `UPDATE facturacion.documento_electronico SET id_estado_documento = $1 WHERE id_documento_electronico = $2 RETURNING id_documento_electronico`, [estado_id, id_documento_electronico]
        )

        if(estado_actualizado.length === 0){
            await cliente.query('ROLLBACK')
            return res.status(400).json({error: 'actualizacion de estado ha fallado'})
        }
        await cliente.query('COMMIT')
        res.status(201).json({
            evento_insertado: evento.id_evento_documento
        })

    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }finally{
        cliente.release()
    }
}