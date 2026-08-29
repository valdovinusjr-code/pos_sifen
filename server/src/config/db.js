import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import express from 'express'
import pkg from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const {Pool} = pkg

const app = express()
app.use(express.json())

const pool = new Pool ({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE
})



export default pool
