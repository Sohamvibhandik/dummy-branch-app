const http = require('http')
const options = { method: 'GET', host: process.env.HOST || 'localhost', port: process.env.PORT || 8000, path: '/health' }
const req = http.request(options, res => { console.log('status', res.statusCode); process.exit(0) })
req.on('error', ()=>{ console.error('error'); process.exit(1) })
req.end()
