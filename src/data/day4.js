export const day4 = {
  id: 4,
  title: 'Node.js + FastAPI',
  subtitle: 'REST design, authentication, middleware, error handling, async patterns',
  concepts: [
    {
      id: 'node-event-loop',
      title: 'Node.js Event Loop & Non-Blocking I/O',
      difficulty: 'hard',
      explanation: `Node.js is single-threaded but handles thousands of concurrent connections through non-blocking I/O and the event loop.

When Node encounters I/O (file read, DB query, HTTP request), it delegates to libuv thread pool, frees the main thread to handle other requests, and processes the callback when I/O completes.

This makes Node excellent for I/O-heavy workloads (APIs, real-time apps) but NOT for CPU-heavy work (image processing, ML) — which blocks the main thread.`,
      code: `// Blocking (bad) — blocks entire server for 2 seconds
app.get('/bad', (req, res) => {
  const data = fs.readFileSync('file.txt')  // ❌ blocks event loop
  res.send(data)
})

// Non-blocking (good)
app.get('/good', async (req, res) => {
  const data = await fs.promises.readFile('file.txt')  // ✅ async
  res.send(data)
})

// CPU-intensive — use worker threads
const { Worker } = require('worker_threads')
app.get('/heavy', (req, res) => {
  const worker = new Worker('./heavy-task.js')
  worker.on('message', result => res.json(result))
})`,
      interviewQ: 'How does Node.js handle concurrent requests if it\'s single-threaded?',
      interviewA: `Node uses non-blocking I/O through libuv. When a request hits an I/O operation — DB query, file read, external API call — Node hands it off to the OS or libuv's thread pool and immediately moves on to the next request. When the I/O finishes, the callback goes into the event queue and gets picked up when the call stack is empty. So Node can handle thousands of concurrent connections with a single thread as long as you're not doing CPU-heavy work that blocks the main thread.`,
    },
    {
      id: 'middleware',
      title: 'Express Middleware Pattern',
      difficulty: 'medium',
      explanation: `Middleware functions have access to req, res, and next. They execute in order and can modify the request/response or terminate the chain.

Types: application-level, router-level, error-handling, built-in, third-party.

The order you register middleware matters — auth middleware must come before route handlers it protects.`,
      code: `// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded  // attach user to request
    next()              // continue to next middleware or route
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

// Rate limiting middleware
const rateLimit = require('express-rate-limit')
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })

// Apply to routes
app.use('/api', limiter)
app.use('/api/protected', authenticate)
app.get('/api/protected/profile', (req, res) => {
  res.json(req.user)  // user is available because authenticate ran first
})

// Error handling middleware (4 params — must be last)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message })
})`,
      interviewQ: 'How do you structure middleware in a large Express application?',
      interviewA: `I separate middleware into: global middleware (morgan, cors, json parsing — applied to all routes), auth middleware (applied to protected route groups), validation middleware (express-validator or joi schemas per route), and a global error handler at the end. In ARC Parcel I had different middleware chains for the partner portal vs admin portal since their auth requirements differed. Keeping middleware composable and single-purpose makes it easy to mix and match.`,
    },
    {
      id: 'jwt-auth',
      title: 'JWT Authentication & Session Management',
      difficulty: 'hard',
      explanation: `JWT (JSON Web Token) is a stateless auth mechanism. Token contains encoded claims — user ID, role, expiry. Server signs it with a secret; clients send it in Authorization header.

Access token: short-lived (15 min), used for API calls.
Refresh token: long-lived (7 days), used only to get new access tokens.

Dual-session prevention (like I built in TalentFind): store session ID in DB, check on each request, invalidate old session when new login detected.`,
      code: `// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

// Refresh token endpoint
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    // Verify token is in DB (not revoked)
    const stored = await db.refreshTokens.findOne({ token: refreshToken })
    if (!stored) return res.status(401).json({ message: 'Token revoked' })

    const tokens = generateTokens(decoded.userId)
    res.json(tokens)
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' })
  }
})`,
      interviewQ: 'How did you implement the dual-session prevention in TalentFind?',
      interviewA: `When a user logged in, we generated a session ID (UUID) and stored it in the DB alongside the user ID and device info. Every access token contained that session ID. On each request, our auth middleware checked if the session ID in the token matched the current active session in the DB. If someone logged in from a new device, we detected the mismatch, returned has_existing_session: true with the device name, and showed the modal asking if they wanted to force logout the other session.`,
      tip: 'Store refresh tokens in DB — this is the only way to invalidate them. JWTs can\'t be revoked otherwise.',
    },
    {
      id: 'rest-design',
      title: 'REST API Design Best Practices',
      difficulty: 'medium',
      explanation: `Good REST API design makes your API predictable, self-documenting, and easy to consume.

Key principles: resource-based URLs, correct HTTP methods, consistent status codes, pagination, versioning, error format consistency.`,
      code: `// ✅ Good REST API design

// Resources (nouns, not verbs)
GET    /api/v1/candidates           // list
GET    /api/v1/candidates/:id       // single
POST   /api/v1/candidates           // create
PATCH  /api/v1/candidates/:id       // partial update
DELETE /api/v1/candidates/:id       // delete

// Nested resources
GET    /api/v1/candidates/:id/documents
POST   /api/v1/candidates/:id/documents

// Query params for filtering, sorting, pagination
GET /api/v1/candidates?status=active&page=1&limit=20&sort=-createdAt

// Consistent error response format
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "field": "email"
  }
}

// Versioning in URL (most practical)
/api/v1/candidates  →  /api/v2/candidates`,
      interviewQ: 'What HTTP status codes do you use and when?',
      interviewA: `200 OK for successful GET/PATCH. 201 Created for successful POST. 204 No Content for successful DELETE. 400 Bad Request for validation errors. 401 Unauthorized when token is missing or invalid. 403 Forbidden when the user is authenticated but doesn't have permission. 404 Not Found. 409 Conflict for duplicates. 422 Unprocessable Entity for valid JSON but invalid business logic. 500 for unexpected server errors — never expose stack traces in production.`,
    },
    {
      id: 'fastapi',
      title: 'FastAPI Fundamentals',
      difficulty: 'medium',
      explanation: `FastAPI is a modern Python web framework built on Starlette and Pydantic. Key advantages:

• Automatic OpenAPI/Swagger docs
• Pydantic models for automatic request validation
• Async/await support natively
• Type hints drive everything — validation, serialization, docs`,
      code: `from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# Pydantic model — auto-validates request body
class CandidateCreate(BaseModel):
    name: str
    email: str
    role: str
    organisation_id: int

# Dependency injection — reusable auth
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

# Route with validation, auth, and auto-docs
@app.post("/candidates", status_code=201)
async def create_candidate(
    data: CandidateCreate,           # auto-validates body
    current_user = Depends(get_current_user)  # auth injected
):
    candidate = await db.candidates.create(data.dict())
    return candidate`,
      interviewQ: 'Why did you choose FastAPI over Express for TalentFind\'s backend?',
      interviewA: `The team was already using Python for some data processing scripts, so FastAPI let us unify the backend language. The automatic Swagger docs were huge for the frontend team — no manual API documentation to maintain. Pydantic models handle validation automatically, which reduced boilerplate significantly. And async support is first-class — no callback hell or manual promise chaining. For a recruitment platform with complex data shapes, Pydantic's nested model validation saved a lot of time.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. What is the difference between authentication and authorisation?', a: `Authentication is verifying who you are — "are you who you say you are?" (login with password, token validation). Authorisation is what you're allowed to do — "you're logged in, but can you access this resource?" In TalentFind I handled both: JWT for auth, then an ACL system that checked the user's role against the resource they were requesting.` },
    { q: 'Q2. How do you handle errors in an Express application?', a: `I use a combination: try/catch in async route handlers, a custom error class hierarchy (AppError, ValidationError, NotFoundError), and a global error handling middleware as the last middleware registered. The global handler checks the error type and sends appropriate status codes. In production it logs the full error but only sends a generic message to the client — never stack traces.` },
    { q: 'Q3. What is CORS and how do you configure it?', a: `CORS is a browser security mechanism that blocks requests from a different origin than the server. For APIs used by a frontend on a different domain, you configure CORS headers to allow specific origins. In production I whitelist specific origins rather than using * — so only my frontend domain can call the API. For development I allow localhost:3000 or whatever port the frontend runs on.` },
    { q: 'Q4. How do you prevent SQL injection in Node.js?', a: `Use parameterized queries or an ORM. Never concatenate user input into SQL strings. With Sequelize (which I used in ARC Parcel), the ORM handles parameterization automatically. For raw queries, use sequelize.query with replacements option. I also validate and sanitize input at the API layer before it ever reaches the database.` },
    { q: 'Q5. How do you structure a large Node.js application?', a: `I use a layered architecture: routes → controllers → services → repositories. Routes just define endpoints and call controllers. Controllers handle HTTP — parse request, call service, format response. Services contain business logic — pure functions, no Express dependencies. Repositories handle DB access — all queries in one place. This makes testing easy — I can unit test services without spinning up Express or hitting a real DB.` },
    { q: 'Q6. What is the difference between process.nextTick and setImmediate?', a: `process.nextTick runs before the next iteration of the event loop — it's in the microtask queue along with Promises. setImmediate runs in the check phase of the event loop, after I/O callbacks. So nextTick fires before setImmediate. I use nextTick sparingly — putting too much in it can starve I/O callbacks. setImmediate is safer for deferring work without blocking.` },
    { q: 'Q7. How do you implement rate limiting?', a: `For basic rate limiting I use the express-rate-limit package — easy to configure window and max requests. For more advanced cases in a distributed system (multiple server instances), you need a shared store like Redis so all instances track the same counter. In ARC Parcel I implemented rate limiting on the login endpoint specifically — 5 failed attempts triggers a 15-minute lockout.` },
    { q: 'Q8. How do you handle file uploads in Node.js?', a: `Multer middleware for handling multipart/form-data. For large files or files that need to be stored long-term, I stream directly to AWS S3 using presigned URLs — the client uploads directly to S3, bypassing the server. This avoids memory pressure on the API server. In TalentFind all candidate documents (CVs, certificates) used this S3 presigned URL approach.` },
    { q: 'Q9. What is clustering in Node.js and when would you use it?', a: `Node runs on a single core by default. Clustering lets you spawn multiple worker processes (one per CPU core) sharing the same port. The master process distributes incoming connections. For a CPU-bound workload on an 8-core machine, clustering gives you roughly 8x throughput. In practice I use PM2 cluster mode in production — it handles clustering, auto-restarts crashed workers, and zero-downtime reloads.` },
    { q: 'Q10. How did you deploy your Node.js apps to production?', a: `In ARC Parcel we used AWS EC2 with PM2 for process management — PM2 keeps the app running, handles clustering, and auto-restarts on crash. Nginx sat in front as a reverse proxy handling SSL termination and load balancing. Docker containers for consistency between environments. GitLab CI/CD pipeline ran tests, built the Docker image, and pushed to the EC2 instance on merge to main.` },
  ]
}
