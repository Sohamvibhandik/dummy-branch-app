const { Pool } = require('pg')
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'branch',
  password: process.env.DB_PASSWORD || 'branchpass',
  database: process.env.DB_NAME || 'branchloans'
})
module.exports = {
  query: (text, params) => pool.query(text, params)
}
