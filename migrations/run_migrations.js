const fs = require('fs')
const path = require('path')
const db = require('../db')
async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'init.sql')).toString()
  await db.query(sql)
  process.exit(0)
}
run().catch(e => { console.error(e); process.exit(1) })
