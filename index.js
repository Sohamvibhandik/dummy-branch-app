const express = require('express')
const bodyParser = require('body-parser')
const db = require('./db')
const client = require('prom-client')
const { v4: uuidv4 } = require('uuid')

const register = new client.Registry()
client.collectDefaultMetrics({ register })

const app = express()
app.use(bodyParser.json())

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (e) {
    res.status(500).json({ status: 'error' })
  }
})

app.get('/api/loans', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM loans ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/loans/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM loans WHERE id=$1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'not found' })
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/loans', async (req, res) => {
  try {
    const { applicant_name, amount, term } = req.body
    if (!applicant_name || !amount) return res.status(400).json({ error: 'applicant_name and amount required' })
    const id = uuidv4()
    const result = await db.query('INSERT INTO loans(id, applicant_name, amount, term, status, created_at) VALUES($1,$2,$3,$4,$5,NOW()) RETURNING *', [id, applicant_name, amount, term || 12, 'pending'])
    res.status(201).json(result.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/stats', async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) as total, SUM(amount) as total_amount, AVG(amount) as avg_amount FROM loans")
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const port = process.env.PORT || 8000
app.listen(port)
