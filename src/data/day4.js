export const day4 = {
  id: 4,
  title: 'Node.js + FastAPI',
  subtitle: 'Event loop internals, streams, clustering, memory, error handling — Node.js deep dive',
  concepts: [
    {
      id: 'node-event-loop',
      title: 'Node.js Event Loop — All 6 Phases',
      difficulty: 'hard',
      explanation: `The event loop has 6 phases, executed in order on every tick:

1. Timers — executes setTimeout and setInterval callbacks
2. Pending callbacks — I/O errors deferred from previous iteration
3. Idle/Prepare — internal use only
4. Poll — fetches new I/O events, blocks here if nothing else pending
5. Check — setImmediate callbacks run here
6. Close callbacks — e.g. socket.on('close')

Microtasks (Promises, queueMicrotask, process.nextTick) run between EVERY phase — they drain completely before the next phase starts.

Order: process.nextTick > Promise.then > setImmediate > setTimeout`,
      code: `// Prove you know the phases — exact output order
setTimeout(() => console.log('setTimeout'), 0)
setImmediate(() => console.log('setImmediate'))
Promise.resolve().then(() => console.log('Promise'))
process.nextTick(() => console.log('nextTick'))
console.log('sync')

// Output:
// sync          ← call stack first
// nextTick      ← microtask, highest priority
// Promise       ← microtask
// setTimeout    ← timers phase
// setImmediate  ← check phase (after timers when inside I/O: always before setTimeout)

// The Poll phase is where Node WAITS for I/O
// If there's nothing to do, it blocks here
// This is why Node doesn't burn CPU at idle

// CPU blocking — kills the event loop
app.get('/bad', (req, res) => {
  // This runs for 2 seconds on the main thread
  // ALL other requests wait — no concurrency
  const start = Date.now()
  while (Date.now() - start < 2000) {}
  res.send('done')
})`,
      interviewQ: 'What is the order of execution: setTimeout(fn,0), setImmediate, Promise.then, process.nextTick?',
      interviewA: `process.nextTick first — it runs before anything else in the microtask queue. Then Promise.then — also a microtask. Then setTimeout — timers phase. Then setImmediate — check phase. The key thing: microtasks drain completely between every phase of the event loop. So if you chain 10 nextTicks, all 10 run before setTimeout gets a chance. I've used this to understand why a Promise callback runs before a setTimeout even with 0ms delay — they're in fundamentally different queues.`,
    },
    {
      id: 'streams',
      title: 'Node.js Streams — The Right Way to Handle Large Data',
      difficulty: 'hard',
      explanation: `Streams process data chunk by chunk without loading it all into memory. Four types:

• Readable — source of data (fs.createReadStream, http.IncomingMessage)
• Writable — destination (fs.createWriteStream, http.ServerResponse)
• Duplex — both (TCP sockets)
• Transform — transform as it passes (zlib, crypto)

Why streams matter: without them, reading a 2GB CSV into memory crashes your server. With streams, memory usage stays constant regardless of file size.

Backpressure: when the consumer is slower than the producer, the buffer fills up. pipe() handles this automatically.`,
      code: `const fs = require('fs')
const zlib = require('zlib')

// ❌ Wrong — loads entire file into memory
app.get('/download', async (req, res) => {
  const file = await fs.promises.readFile('report.csv')  // 2GB in RAM
  res.send(file)
})

// ✅ Right — streams chunks directly to client
app.get('/download', (req, res) => {
  res.setHeader('Content-Type', 'text/csv')
  fs.createReadStream('report.csv').pipe(res)  // constant memory usage
})

// Compressed file download — transform stream
app.get('/download-gz', (req, res) => {
  res.setHeader('Content-Encoding', 'gzip')
  fs.createReadStream('report.csv')
    .pipe(zlib.createGzip())   // transform: compress
    .pipe(res)                 // write to response
})

// Custom transform stream — parse CSV line by line
const { Transform } = require('stream')
const csvParser = new Transform({
  transform(chunk, encoding, callback) {
    const lines = chunk.toString().split('\\n')
    lines.forEach(line => {
      if (line) this.push(JSON.stringify(line.split(',')) + '\\n')
    })
    callback()
  }
})

fs.createReadStream('data.csv')
  .pipe(csvParser)
  .pipe(fs.createWriteStream('output.json'))`,
      interviewQ: 'What is backpressure in Node.js streams and how do you handle it?',
      interviewA: `Backpressure happens when data is being produced faster than it can be consumed — like reading a fast disk and writing to a slow network. If you don't handle it, the buffer in memory keeps growing until the process crashes. The right fix is to pause the readable stream when the writable stream's buffer is full and resume when it drains. pipe() does this automatically — that's actually its main value. If you're manually pushing data, you check the return value of writable.write() — if it returns false, the buffer is full and you should stop reading until the drain event fires.`,
    },
    {
      id: 'worker-threads-cluster',
      title: 'Worker Threads vs Cluster Mode',
      difficulty: 'hard',
      explanation: `Two ways to use multiple CPU cores in Node:

Cluster mode: forks multiple Node processes. Each has its own memory, event loop, and V8 instance. Master distributes incoming connections. Good for: scaling an HTTP server across all CPUs.

Worker Threads: multiple threads inside one process, shared memory possible via SharedArrayBuffer. No startup overhead. Good for: CPU-intensive work within a single request (image processing, encryption, heavy computation).

Rule: Cluster for network load distribution. Worker threads for CPU tasks within a request.`,
      code: `// Cluster mode — one worker per CPU core
const cluster = require('cluster')
const os = require('os')

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length
  console.log(\`Master \${process.pid} starting \${numCPUs} workers\`)

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker) => {
    console.log(\`Worker \${worker.process.pid} died — restarting\`)
    cluster.fork()  // auto-restart crashed workers
  })
} else {
  // Each worker runs the Express app
  const app = require('./app')
  app.listen(3000)
  console.log(\`Worker \${process.pid} started\`)
}

// Worker threads — CPU task off the main thread
const { Worker, isMainThread, parentPort } = require('worker_threads')

if (isMainThread) {
  app.post('/process-image', (req, res) => {
    const worker = new Worker('./image-worker.js', {
      workerData: { imageBuffer: req.body }
    })
    worker.on('message', result => res.json({ url: result }))
    worker.on('error', err => res.status(500).json({ error: err.message }))
  })
} else {
  // image-worker.js — runs in separate thread
  const { workerData } = require('worker_threads')
  const result = processImageHeavy(workerData.imageBuffer)
  parentPort.postMessage(result)
}

// PM2 cluster mode (production — easier than manual cluster)
// pm2 start app.js -i max  (one process per CPU)`,
      interviewQ: 'Node.js is single-threaded — how did you handle CPU-intensive work in production?',
      interviewA: `In ARC Parcel, PDF report generation was CPU-heavy — Puppeteer rendering complex tables. Running it inline would block the event loop for 3-4 seconds for every report request. I moved it to a Bull job queue — the HTTP request adds a job and returns immediately with a job ID, the worker process picks up the job and runs Puppeteer separately. The client polls for the result. This way the main API thread is never blocked. For clustering, we used PM2 with i max which spawns one process per CPU core — so on the EC2 instance with 4 cores, we get 4 independent event loops handling requests.`,
    },
    {
      id: 'error-handling',
      title: 'Production Error Handling — The Complete Pattern',
      difficulty: 'hard',
      explanation: `Three categories of errors in Node:

1. Operational errors — expected failures (DB down, validation fail, 404). Handle gracefully, return proper response.
2. Programmer errors — bugs (null dereference, wrong type). Crash and restart — trying to recover leads to undefined state.
3. Unhandled rejections/exceptions — if these slip through, crash and let PM2 restart.

Pattern: custom error classes → async wrapper → global Express error handler → process-level safety net.`,
      code: `// Custom error hierarchy
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true  // flag: safe to send to client
  }
}
class NotFoundError extends AppError {
  constructor(resource) {
    super(\`\${resource} not found\`, 404, 'NOT_FOUND')
  }
}
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

// Async wrapper — no try/catch in every route
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// Routes are clean
app.get('/candidates/:id', asyncHandler(async (req, res) => {
  const candidate = await CandidateService.findById(req.params.id)
  if (!candidate) throw new NotFoundError('Candidate')
  res.json(candidate)
}))

// ONE global error handler at the end
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const isOperational = err.isOperational || false

  // Log everything
  logger.error({ err, req: { method: req.method, url: req.url } })

  // Only send details for operational errors
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isOperational ? err.message : 'Something went wrong'
      // Never expose stack traces in production
    }
  })
})

// Process-level safety net
process.on('unhandledRejection', (reason) => {
  logger.fatal('Unhandled rejection:', reason)
  process.exit(1)  // let PM2 restart cleanly
})
process.on('uncaughtException', (err) => {
  logger.fatal('Uncaught exception:', err)
  process.exit(1)
})`,
      interviewQ: 'How do you handle errors in a production Node.js application?',
      interviewA: `I separate operational errors — things that are expected like 404, validation failures, DB timeouts — from programmer errors like null dereferences. Operational errors get handled gracefully with proper status codes. Programmer errors crash the process and PM2 restarts it — trying to recover from an unknown state is worse than restarting clean. In practice: custom error classes with isOperational flag, an asyncHandler wrapper so I never write try/catch in route handlers, and one global error middleware that logs everything and formats the response. In production the client never sees a stack trace — just a code and a message.`,
    },
    {
      id: 'memory-leaks',
      title: 'Memory Leaks in Node.js — Finding and Fixing',
      difficulty: 'hard',
      explanation: `Common causes of memory leaks in Node.js:
• Global variables accumulating data (caches without eviction)
• Event listeners not removed (especially in request handlers)
• Closures holding references to large objects
• Timers (setInterval) never cleared
• Sequelize/Mongoose connection leaks

Signs: process memory growing over time, GC running more frequently, eventually OOMKilled.

Tools: process.memoryUsage(), Node.js --inspect with Chrome DevTools heap snapshots, clinic.js.`,
      code: `// ❌ Memory leak — event listener added on every request
app.get('/data', (req, res) => {
  emitter.on('update', (data) => {  // new listener every request, never removed
    res.json(data)
  })
})

// ✅ Fixed — remove listener after use
app.get('/data', (req, res) => {
  const handler = (data) => {
    emitter.off('update', handler)  // remove after first use
    res.json(data)
  }
  emitter.on('update', handler)
})

// ❌ Memory leak — unbounded in-memory cache
const cache = {}  // grows forever
function getUser(id) {
  if (cache[id]) return cache[id]
  cache[id] = fetchFromDB(id)
  return cache[id]
}

// ✅ Fixed — LRU cache with size limit
const LRU = require('lru-cache')
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 5 })

// Monitor memory in production
setInterval(() => {
  const mem = process.memoryUsage()
  logger.info({
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(mem.rss / 1024 / 1024) + 'MB'
  })
}, 30000)

// Graceful shutdown — finish in-flight requests before dying
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully')
  server.close(async () => {
    await db.close()
    await redis.disconnect()
    process.exit(0)
  })
  // Force kill after 30s if hanging
  setTimeout(() => process.exit(1), 30000)
})`,
      interviewQ: 'Have you dealt with memory leaks in Node.js? How do you find them?',
      interviewA: `Yes — in ARC Parcel we had the process memory growing slowly over 12 hours then getting OOMKilled. First I checked process.memoryUsage() on a timer — heapUsed was climbing steadily, which ruled out GC issues. Used Node's --inspect flag and took heap snapshots in Chrome DevTools 10 minutes apart, then compared them — found event listeners accumulating on a shared EventEmitter inside a request handler. Every request was adding a listener and never removing it. Fixed by moving the listener outside the handler or using once() instead of on(). After that I added the memory logging to catch it early if it ever crept back.`,
    },
    {
      id: 'sequelize-patterns',
      title: 'Sequelize — Production Patterns You Actually Need',
      difficulty: 'medium',
      explanation: `Sequelize patterns that matter in real projects:

• Connection pool config — tune min/max for your DB
• Transactions — always use for multi-table writes
• Eager loading — use include to avoid N+1
• Raw queries with replacements — safe parameterized SQL
• Hooks — for audit logs, timestamps, data transforms
• Migrations — never modify existing, always add new`,
      code: `// Connection pool — critical for production
const sequelize = new Sequelize(process.env.DB_URL, {
  pool: {
    max: 20,      // max connections — don't overwhelm DB
    min: 5,       // keep 5 warm to avoid connection overhead
    acquire: 30000, // timeout waiting for connection
    idle: 10000   // close idle connection after 10s
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
})

// N+1 fix — eager loading with include
const indents = await VehicleIndent.findAll({
  where: { hub_id: hubId, status: 'active' },
  include: [
    { model: Shipment, as: 'shipments', required: false },
    { model: Driver, as: 'driver', attributes: ['id', 'name', 'phone'] }
  ],
  order: [['route_date', 'DESC']],
  limit: 50
})

// Raw query with parameterized values — prevents SQL injection
const report = await sequelize.query(
  \`SELECT hub_id, zone, COUNT(*) as total, SUM(amount) as revenue
   FROM shipments
   WHERE hub_id = :hubId AND route_date BETWEEN :from AND :to
   GROUP BY hub_id, zone\`,
  {
    replacements: { hubId, from: startDate, to: endDate },
    type: QueryTypes.SELECT
  }
)

// Hook for audit logging
Candidate.addHook('afterUpdate', async (candidate, options) => {
  const changed = candidate.changed()
  if (changed.length > 0) {
    await AuditLog.create({
      entity: 'candidate',
      entity_id: candidate.id,
      changed_fields: changed,
      user_id: options.userId  // passed via transaction options
    }, { transaction: options.transaction })
  }
})`,
      interviewQ: 'How do you prevent SQL injection when using raw queries in Sequelize?',
      interviewA: `Never concatenate user input into SQL strings — ever. Sequelize's query method takes a replacements option where you pass values separately and Sequelize parameterizes them for you. The DB driver sends the query structure and the values separately, so even if someone puts SQL in their input it's treated as a literal string, not SQL. I also avoid string template literals for SQL entirely — if I see a raw query being built with \`...\${userInput}...\` in a codebase, that's an immediate red flag I'll call out in code review.`,
    },
    {
      id: 'jwt-auth',
      title: 'JWT Authentication — Access + Refresh Token Pattern',
      difficulty: 'hard',
      explanation: `Access token: short-lived (15 min). Sent with every request. If stolen, expires quickly.
Refresh token: long-lived (7 days). Stored in DB. Used only to get new access tokens.

Why two tokens: if access token is stolen, attacker has 15 min max. Refresh token in DB can be revoked immediately. Short-lived access tokens are stateless — no DB hit per request.

Dual-session prevention (TalentFind): session ID in JWT, checked against DB on each request.`,
      code: `const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')

// Generate both tokens
const generateTokens = (userId, sessionId) => {
  const accessToken = jwt.sign(
    { userId, sessionId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { userId, sessionId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

// Auth middleware — validates token + checks session is still active
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ code: 'NO_TOKEN' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check session is still active in DB (dual-session prevention)
    const session = await UserSession.findOne({
      where: { session_id: decoded.sessionId, is_active: true }
    })
    if (!session) return res.status(401).json({ code: 'SESSION_EXPIRED' })

    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ code: 'TOKEN_EXPIRED' })
    return res.status(401).json({ code: 'INVALID_TOKEN' })
  }
}

// Refresh token endpoint
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

  // Verify refresh token exists in DB and not revoked
  const stored = await RefreshToken.findOne({
    where: { token: refreshToken, user_id: decoded.userId, revoked: false }
  })
  if (!stored) return res.status(401).json({ code: 'TOKEN_REVOKED' })

  // Rotate: revoke old, issue new
  await stored.update({ revoked: true })
  const tokens = generateTokens(decoded.userId, decoded.sessionId)
  await RefreshToken.create({ token: tokens.refreshToken, user_id: decoded.userId })

  res.json(tokens)
})`,
      interviewQ: 'Why store refresh tokens in the database? JWTs are supposed to be stateless.',
      interviewA: `Access tokens are stateless — no DB hit per request, just verify the signature. But refresh tokens need to be revocable. If a user logs out, their device is stolen, or you detect suspicious activity — you need to invalidate immediately. A pure stateless JWT can't be revoked before it expires. So refresh tokens live in the DB with a revoked flag. When someone uses a refresh token, you check DB, then rotate it — invalidate old, issue new. This is called refresh token rotation and it's the right pattern for security. The access token remains stateless and fast, the refresh token gets DB validation only when it's used — which is infrequent.`,
    },
    {
      id: 'rest-design',
      title: 'REST API Design — Production Standards',
      difficulty: 'medium',
      explanation: `Good REST API design makes your API predictable, self-documenting, and easy to consume.

Key principles: resource-based URLs, correct HTTP methods, consistent status codes, pagination, versioning, error format consistency, idempotency on writes.

A senior engineer thinks about: what happens on retry? Is this endpoint idempotent? What's the backward compatibility story?`,
      code: `// ✅ Resource-based URLs (nouns, not verbs)
GET    /api/v1/candidates           // list with filters
GET    /api/v1/candidates/:id       // single
POST   /api/v1/candidates           // create
PATCH  /api/v1/candidates/:id       // partial update
DELETE /api/v1/candidates/:id       // delete

// Filtering, sorting, pagination
GET /api/v1/candidates?status=active&org_id=5&page=1&limit=20&sort=-createdAt

// Nested resources
GET  /api/v1/candidates/:id/documents
POST /api/v1/candidates/:id/documents

// Consistent error format — every error looks the same
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "field": "email"        // optional: which field
  }
}

// Idempotency key — safe retries on POST
app.post('/orders', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key']

  if (idempotencyKey) {
    const existing = await Order.findOne({ where: { idempotency_key: idempotencyKey } })
    if (existing) return res.status(200).json(existing)  // return existing, don't duplicate
  }

  const order = await Order.create({ ...req.body, idempotency_key: idempotencyKey })
  res.status(201).json(order)
})`,
      interviewQ: 'What HTTP status codes do you use and when?',
      interviewA: `200 OK for successful GET/PATCH. 201 Created for successful POST — include Location header pointing to the new resource. 204 No Content for DELETE. 400 Bad Request for validation errors — malformed input. 401 Unauthorized — not authenticated. 403 Forbidden — authenticated but not allowed. 404 Not Found. 409 Conflict for duplicate resources. 422 Unprocessable Entity — valid JSON but business logic rejects it, like scheduling an interview in the past. 429 Too Many Requests for rate limiting. 500 for unexpected server errors — never expose stack traces in production.`,
    },
    {
      id: 'fastapi',
      title: 'FastAPI — What You Need to Know',
      difficulty: 'medium',
      explanation: `FastAPI is Python's modern web framework — Pydantic for validation, async/await natively, automatic Swagger docs.

Key advantage over Express: automatic request validation via Pydantic models — no manual joi/express-validator. The type annotation IS the validation.

Honest assessment: FastAPI is clean and fast to develop in. Used it in TalentFind. The Dependency Injection system is elegant for auth and DB sessions.`,
      code: `from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

app = FastAPI()

# Pydantic model = validation + docs (both in one)
class CandidateCreate(BaseModel):
    name: str
    email: EmailStr        # auto-validates email format
    phone: str
    org_id: int

# Dependency injection — reused across routes
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Route — clean, no try/catch needed for validation
@app.post("/candidates", status_code=201)
async def create_candidate(
    data: CandidateCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Pydantic already validated — data is clean
    candidate = Candidate(**data.dict(), created_by=current_user.id)
    db.add(candidate)
    db.commit()
    return candidate`,
      interviewQ: 'How is FastAPI different from Express for backend development?',
      interviewA: `The biggest difference in practice is validation. In Express you set up express-validator or joi separately and manually wire it up. In FastAPI, the Pydantic model IS the validation — you annotate types and it validates automatically, rejecting bad requests with clear error messages before your function even runs. The automatic Swagger docs at /docs are genuinely useful — the frontend team used them instead of a separate Postman collection. Async support is first class. The one thing I find Express better for is flexibility — FastAPI is more opinionated which is good for consistency but occasionally limiting. For a typed, API-first backend FastAPI is excellent.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. What is the difference between process.nextTick and Promise.then execution order?', a: `Both are microtasks but nextTick has higher priority — it drains before Promises do. So if you have nextTick and Promise.then both queued, all nextTick callbacks run first, then all Promise callbacks. In practice this matters when you're building libraries that need to defer work to after the current operation but before I/O — nextTick is the right tool there. Promise.then is for normal async flows.` },
    { q: 'Q2. How does connection pooling work in Node.js with Sequelize?', a: `Creating a DB connection is expensive — TCP handshake, auth, SSL negotiation. A pool keeps a set of open connections and reuses them. Sequelize creates a pool on startup — min connections warm and waiting, max prevents overwhelming the DB. When a request needs a connection, it takes one from the pool. When done, it returns it — not closes it. Without pooling, high-traffic apps create and destroy hundreds of connections per second, which crushes PostgreSQL. I tune min to 5 and max to 20 as a starting point and adjust based on DB connection limits.` },
    { q: 'Q3. How do you implement graceful shutdown in Node.js?', a: `Listen for SIGTERM (what Kubernetes/PM2 sends before killing the process). Stop accepting new connections with server.close(). Wait for in-flight requests to finish. Close DB connections and Redis connections cleanly. Then exit. Add a timeout — if it doesn't shut down within 30 seconds, force exit. Without graceful shutdown, requests in progress get cut off mid-response and DB connections leak. In production this is the difference between a clean deploy and users seeing errors during restarts.` },
    { q: 'Q4. What is the libuv thread pool and what operations use it?', a: `libuv is the C library underneath Node that handles async I/O. It has a default thread pool of 4 threads (configurable with UV_THREADPOOL_SIZE). File system operations, DNS lookups, and crypto operations use this pool — not the main thread. Network I/O (TCP, HTTP) uses the OS's async I/O mechanisms directly and doesn't need the thread pool. If you do heavy crypto like bcrypt for passwords, you can starve the thread pool. In that case increase UV_THREADPOOL_SIZE to match your CPU count.` },
    { q: 'Q5. How do you handle uncaught exceptions and unhandled promise rejections?', a: `process.on('uncaughtException') and process.on('unhandledRejection') are your last line of defense. When either fires, log the error with full context, then exit with process.exit(1). PM2 or Kubernetes will restart the process. The key thing: don't try to keep running after an uncaught exception — the application state is unknown and you'll cause harder-to-debug issues. Log, crash, restart clean. unhandledRejection became a fatal error in Node 15+ so this is less of a manual concern now, but the handlers are still good for logging before the crash.` },
    { q: 'Q6. Explain how you would implement rate limiting in a distributed Node.js system.', a: `Single server: express-rate-limit in memory is fine. Multiple servers: you need a shared counter because each server has its own memory. Redis with INCR + EXPIRE is the standard approach — atomic increment, check if over limit, set expiry on first request. Token bucket is more forgiving for bursts: users accumulate tokens at a fixed rate, each request costs tokens. If you run out, requests are rejected. Sliding window logs exact timestamps in a Redis sorted set — more accurate but heavier. For most APIs I use sliding window in Redis with a 60-second window.` },
    { q: 'Q7. What is the difference between EventEmitter and streams?', a: `EventEmitter is a general pub/sub mechanism — emit named events, listeners respond. Streams ARE EventEmitters under the hood — Readable emits data and end events, Writable emits drain and finish. The difference is that streams add buffering, backpressure, and the pipe interface on top of EventEmitter. Use streams for data flow — reading files, HTTP responses, DB cursors. Use EventEmitter for application events — user logged in, order placed, job completed.` },
    { q: 'Q8. How do you debug a Node.js application in production?', a: `Start with logs — structured JSON logging with Winston or Pino, correlation IDs per request so you can trace a full request chain. For memory issues: process.memoryUsage() on a timer, heap snapshots via --inspect. For CPU hotspots: clinic.js flame which profiles the event loop. For specific requests, you can temporarily enable verbose logging in production for specific user IDs without redeploying — just a feature flag. Never use console.log in production — it's synchronous and blocks the event loop.` },
    { q: 'Q9. How do you handle database transactions in Sequelize?', a: `sequelize.transaction() gives you a transaction object. Pass it to every query in the group via the transaction option. If any query throws, call t.rollback() in the catch block — all changes undo atomically. If all succeed, call t.commit(). I use managed transactions (sequelize.transaction(async t => {...})) which auto-commit and auto-rollback so I can't forget. Financial operations, anything touching 2+ tables, order creation — all of these need transactions. Partial writes in financial data are worse than a failed write.` },
    { q: 'Q10. What is the N+1 query problem and how did you solve it in your projects?', a: `N+1 is when you fetch N records and then make a separate query for each one to get related data. 1 query for 100 candidates, then 100 queries to get each candidate's applications = 101 queries. I caught it in ARC by enabling Sequelize logging and seeing 800+ queries in the console for one page load. Fixed with eager loading — include the related model in the findAll so Sequelize does a JOIN. One query instead of 801. After that I always check query count when building any list endpoint.` },
    { q: 'Q11. How does Node.js handle file uploads — what is the right pattern?', a: `Never buffer the entire file in memory. Use multer for multipart/form-data — it can stream to disk or directly to S3. For files going to S3, the cleanest pattern is presigned URLs: client requests an upload URL from your API, you generate a presigned S3 PUT URL valid for 5 minutes, client uploads directly to S3 bypassing your server entirely. Your server never touches the bytes. This means no memory pressure, no bandwidth cost on your EC2 instance, and S3 handles the upload at scale. We used this for all CV and document uploads in TalentFind.` },
    { q: 'Q12. What is middleware order in Express and why does it matter?', a: `Middleware executes in registration order — first in, first out. Body parsing must come before route handlers that read req.body. Auth middleware must come before protected routes. Error handler must be registered last with 4 parameters. If you register a middleware after the route that needs it, it never runs for that route. Common bug: putting cors() after your route definitions means cross-origin requests fail. I structure it: global middleware first (cors, body parser, morgan), then route groups with their specific middleware, then the global error handler last.` },
    { q: 'Q13. How would you implement an idempotent API endpoint?', a: `Idempotency means calling the same endpoint multiple times has the same effect as calling it once. Critical for payment and order APIs where clients retry on timeout. Pattern: client sends an Idempotency-Key header (UUID they generate). Server checks if that key exists in a cache or DB. If yes, return the stored response. If no, process normally and store the result against that key with a 24-hour TTL. So if the client retries because they got a network timeout, they get the original response without creating a duplicate order. I built this for the ATOFON order endpoint after we had duplicate commission records from client retries.` },
  ]
}
