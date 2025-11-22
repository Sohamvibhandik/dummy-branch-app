// index.js
const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const pino = require("pino");
const db = require("./db");
const client = require("prom-client");

const logger = pino();

const app = express();
app.use(bodyParser.json());

// request logging middleware
app.use((req, res, next) => {
  const id = uuidv4();
  req.id = id;
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      msg: "request_finished",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      req_id: id
    });
  });
  next();
});

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "code"],
  buckets: [50, 100, 300, 500, 1000, 2000]
});

app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on("finish", () => {
    end({ method: req.method, route: req.path, code: res.statusCode });
  });
  next();
});

// DB-aware healthcheck
app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    return res.json({ status: "ok", db: "connected" });
  } catch (err) {
    logger.error({ msg: "healthcheck_db_error", error: err.message });
    return res.status(500).json({ status: "error", db: "down", error: err.message });
  }
});

// metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.send(await client.register.metrics());
  } catch (err) {
    logger.error({ msg: "metrics_error", error: err.message });
    res.status(500).send(err.message);
  }
});

// ---- Loan endpoints (GET + POST) ----
app.get("/api/loans", async (req, res) => {
  try {
    const result = await db.query("SELECT id, applicant_name, amount, term, status, created_at FROM loans ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    logger.error({ msg: "get_loans_error", error: err.message });
    res.status(500).json({ error: "failed to fetch loans" });
  }
});

app.post("/api/loans", async (req, res) => {
  try {
    const { applicant_name, amount, term } = req.body;
    if (!applicant_name || !amount) {
      return res.status(400).json({ error: "applicant_name and amount are required" });
    }
    const id = uuidv4();
    await db.query(
      "INSERT INTO loans (id, applicant_name, amount, term) VALUES ($1, $2, $3, $4)",
      [id, applicant_name, amount, term || null]
    );
    const row = { id, applicant_name, amount, term: term || null, status: null };
    res.status(201).json(row);
  } catch (err) {
    logger.error({ msg: "create_loan_error", error: err.message });
    res.status(500).json({ error: "failed to create loan" });
  }
});

// start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  logger.info({ msg: "server_started", port: PORT });
});
   