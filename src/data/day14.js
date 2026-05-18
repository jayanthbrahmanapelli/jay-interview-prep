export const day14 = {
  id: 14,
  title: 'Mock Interview Simulator',
  subtitle: 'Full interview rounds — technical, system design, behavioural, HR',
  concepts: [
    {
      id: 'startup-coding',
      title: 'Startup Coding Round — What They Actually Ask',
      difficulty: 'hard',
      explanation: `Startups don't do LeetCode Hard. They test if you can write real working code fast.

What startups actually ask:
• Write a debounce / throttle function
• Implement a simple LRU cache
• Write an Express middleware (auth, rate limit, logger)
• Write a SQL query (joins, aggregation, window functions)
• Fix a bug in this code snippet
• Implement pagination (cursor-based)
• Write a class with specific behavior
• Flatten nested objects / arrays
• Build a simple pub/sub or event emitter

Format: usually 45-60 min, shared editor (CodeSandbox, HackerRank, or Google Docs), may or may not run the code.

Key advice: talk while you code. Startups hire for culture fit too — they want to see how you think, not just the final answer.`,
      code: `// ── PROBLEM 1: Implement debounce (asked very frequently) ──
function debounce(fn, delay) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
// Usage: const search = debounce(callAPI, 300)


// ── PROBLEM 2: Implement throttle ──
function throttle(fn, limit) {
  let lastCall = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      return fn.apply(this, args)
    }
  }
}


// ── PROBLEM 3: LRU Cache (get O(1), put O(1)) ──
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.cache = new Map()  // Map preserves insertion order
  }
  get(key) {
    if (!this.cache.has(key)) return -1
    const val = this.cache.get(key)
    this.cache.delete(key)      // remove
    this.cache.set(key, val)    // re-insert at end = most recent
    return val
  }
  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key)
    else if (this.cache.size >= this.capacity) {
      this.cache.delete(this.cache.keys().next().value)  // delete oldest
    }
    this.cache.set(key, value)
  }
}


// ── PROBLEM 4: Flatten nested object ──
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = prefix ? \`\${prefix}.\${key}\` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], fullKey))
    } else {
      acc[fullKey] = obj[key]
    }
    return acc
  }, {})
}
// flattenObject({ a: { b: { c: 1 } }, d: 2 })
// → { 'a.b.c': 1, d: 2 }


// ── PROBLEM 5: Implement Promise.all from scratch ──
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = []
    let completed = 0
    if (promises.length === 0) return resolve([])
    promises.forEach((p, i) => {
      Promise.resolve(p)
        .then(val => {
          results[i] = val
          completed++
          if (completed === promises.length) resolve(results)
        })
        .catch(reject)
    })
  })
}


// ── PROBLEM 6: Deep equal check ──
function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (a === null || b === null) return false
  const keysA = Object.keys(a), keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every(key => deepEqual(a[key], b[key]))
}


// ── PROBLEM 7: Group array of objects by key ──
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = item[key]
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})
}
// groupBy(orders, 'status') → { paid: [...], pending: [...] }`,
      interviewQ: 'Implement a function that deep clones an object without using JSON.parse/JSON.stringify.',
      interviewA: `Use recursion. Base case: if the value is not an object or is null, return it directly. For arrays, map each element through the clone function. For objects, create a new object and recursively clone each property. This handles nested structures but won't handle special objects like Date, Map, Set, or circular references — for production use structuredClone() which handles all of those. In an interview, mentioning these edge cases after writing the basic version shows senior-level thinking.`,
    },
    {
      id: 'startup-backend-coding',
      title: 'Startup Backend Coding — Node.js + SQL Problems',
      difficulty: 'hard',
      explanation: `Backend-focused startups will give you real problems — write an API endpoint, write a SQL query, fix a bug in existing code.

Common backend coding rounds:
• Write a rate limiter middleware
• Write a pagination helper
• Write a SQL query with joins and aggregation
• Implement a simple event emitter
• Write an auth middleware
• Find and fix the bug in this async code
• Write a retry function with exponential backoff

These test if you can actually build — not just talk about it.`,
      code: `// ── PROBLEM 1: Rate limiter middleware (Redis-based) ──
const rateLimit = (limit, windowSec) => async (req, res, next) => {
  const key = \`ratelimit:\${req.ip}\`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, windowSec)
  if (count > limit) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: windowSec
    })
  }
  res.setHeader('X-RateLimit-Remaining', limit - count)
  next()
}
// Usage: app.post('/login', rateLimit(5, 60), loginHandler)


// ── PROBLEM 2: Cursor-based pagination ──
async function getPaginatedCandidates(orgId, cursor, limit = 20) {
  const where = { org_id: orgId }
  if (cursor) where.id = { [Op.gt]: cursor }  // after last seen ID

  const items = await Candidate.findAll({
    where,
    order: [['id', 'ASC']],
    limit: limit + 1  // fetch one extra to check if more exist
  })

  const hasMore = items.length > limit
  if (hasMore) items.pop()  // remove the extra

  return {
    data: items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    hasMore
  }
}


// ── PROBLEM 3: Retry with exponential backoff ──
async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)  // 1s, 2s, 4s
        console.log(\`Attempt \${attempt + 1} failed. Retrying in \${delay}ms...\`)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}
// Usage: const data = await withRetry(() => fetchFromExternalAPI())


// ── PROBLEM 4: Simple EventEmitter ──
class EventEmitter {
  constructor() { this.events = {} }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = []
    this.events[event].push(listener)
    return this
  }
  off(event, listener) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(l => l !== listener)
    return this
  }
  emit(event, ...args) {
    if (!this.events[event]) return
    this.events[event].forEach(listener => listener(...args))
    return this
  }
  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
  }
}


// ── PROBLEM 5: SQL — Top 3 candidates per org by application count ──
/*
SELECT org_id, candidate_id, name, application_count
FROM (
  SELECT
    c.org_id,
    c.id as candidate_id,
    c.name,
    COUNT(ja.id) as application_count,
    ROW_NUMBER() OVER (
      PARTITION BY c.org_id
      ORDER BY COUNT(ja.id) DESC
    ) as rank
  FROM candidates c
  LEFT JOIN job_applications ja ON ja.candidate_id = c.id
  WHERE c.status = 'active'
  GROUP BY c.org_id, c.id, c.name
) ranked
WHERE rank <= 3;
*/

// ── PROBLEM 6: Find the bug ──
// What's wrong with this code?
async function getUserOrders(userId) {
  const user = await User.findById(userId)
  const orders = await Order.find({ userId })
  // Bug: if User.findById throws, Order.find still runs
  // Bug: no error handling, caller gets unhandled rejection
  // Bug: two sequential awaits — should be Promise.all if independent
  return { user, orders }
}
// Fixed:
async function getUserOrdersFixed(userId) {
  const [user, orders] = await Promise.all([
    User.findById(userId),
    Order.find({ userId })
  ])
  if (!user) throw new NotFoundError('User')
  return { user, orders }
}`,
      interviewQ: 'Given an array of numbers, find the two numbers that add up to a target — explain your approach before coding.',
      interviewA: `First approach that comes to mind is brute force — two nested loops, check every pair. O(n²) time. Better approach: hash map. Loop once, for each number check if the complement (target minus current) is already in the map. If yes, found the pair. If no, store the current number. O(n) time, O(n) space. I'd ask: can there be duplicates? Can the same element be used twice? Are all numbers positive? These constraints might open up other approaches. Then I'd code the hash map solution since it's optimal and straightforward to implement correctly.`,
    },
    {
      id: 'mock-round1',
      title: 'Mock Round 1 — JavaScript + React (30 min)',
      difficulty: 'hard',
      explanation: `This is a typical first technical round for a senior full-stack role.
Format: 3-4 coding questions or concept deep-dives + project discussion.

Start strong — first impressions matter. Think out loud. If you're stuck, say what you're thinking: "I'm considering a hash map approach here because we need O(1) lookup..."

Timing: 5 min concepts, 15 min coding, 10 min project questions.`,
      code: `// Question 1: Implement debounce
function debounce(fn, delay) {
  let timer
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// Question 2: Flatten nested array
function flatten(arr) {
  return arr.reduce((flat, item) =>
    Array.isArray(item) ? [...flat, ...flatten(item)] : [...flat, item], [])
}
// Or: arr.flat(Infinity)

// Question 3: React — why does this cause infinite re-render?
useEffect(() => {
  setData(processData(data))
}, [data])  // ❌ data changes → effect runs → data changes → infinite loop
// Fix: either don't include data in deps, or use functional update

// Question 4: Explain the Virtual DOM
// "React keeps a JS copy of the DOM in memory. On state change, it builds
// a new virtual tree, diffs against the old one, and applies only the
// changed nodes to the real DOM. Real DOM operations are expensive —
// this batching is what makes React fast."`,
      interviewQ: 'Implement a function that memoizes the results of a function call.',
      interviewA: `Memoize stores previous call results keyed by arguments. On the next call with the same arguments, return the cached result instead of recalculating. Implementation: wrap the function, maintain a Map, serialize the arguments as a key, check cache before calling the original function. Works perfectly for pure functions — same input always gives same output. For functions with side effects or that depend on external state, memoization can give stale results.`,
    },
    {
      id: 'mock-round2',
      title: 'Mock Round 2 — System Design (45 min)',
      difficulty: 'hard',
      explanation: `Common system design questions for your level (4 years, full-stack):

• Design a URL shortener
• Design a notification system
• Design a job board / recruitment system (close to your experience)
• Design a rate limiter
• Design a caching system

Framework: clarify → estimate scale → high-level design → deep dive → trade-offs

For your experience level: they want to see you can design something that works and scales to 10x current load. They're not expecting Google-scale.`,
      code: `// Design: Notification System (email + SMS + push)

// Step 1: Requirements
// - Send notifications on events (order placed, interview scheduled)
// - Channels: email, SMS, in-app
// - Scale: 10K events/day initially, needs to scale
// - Reliability: notifications must not be lost

// Step 2: Components
// Event Producer → Message Queue → Notification Workers → Channels
//                             ↓
//                      Notification Log (DB)

// Step 3: Data model
Notifications { id, user_id, type, channel, status, created_at, sent_at }
Templates { id, type, channel, subject, body_template }

// Step 4: Worker design (BullMQ)
const emailWorker = new Worker('notifications', async (job) => {
  const { userId, type, data } = job.data
  const user = await getUser(userId)
  const template = await getTemplate(type, 'email')
  const body = renderTemplate(template.body, data)
  await sendEmail(user.email, template.subject, body)
  await logNotification(userId, type, 'email', 'sent')
}, { concurrency: 10 })

// Step 5: Reliability
// - At-least-once delivery via queue (retry on failure)
// - Idempotency key to avoid duplicate sends
// - Dead letter queue for failed after max retries
// - Monitoring: queue depth, failure rate alerts`,
      interviewQ: 'Design a rate limiter for an API that allows 100 requests per minute per user.',
      interviewA: `For a single server, in-memory counter works. For distributed systems, Redis. Token bucket or sliding window algorithm. Redis implementation: on each request, INCR the counter for the user key. If it's the first request (count = 1), set EXPIRE to 60 seconds. If count > 100, return 429 Too Many Requests. The atomic INCR + EXPIRE means no race conditions. Sliding window is more accurate — you track requests by timestamp using a sorted set — but token bucket is simpler and good enough for most cases.`,
    },
    {
      id: 'mock-round3',
      title: 'Mock Round 3 — Node.js + Database (30 min)',
      difficulty: 'hard',
      explanation: `Backend-focused round. Common questions:

• Explain the Node.js event loop
• How would you handle 10,000 concurrent requests?
• Write a complex SQL query
• Explain database transactions and when you use them
• How do you handle errors in Express?
• What is connection pooling?

Your strongest advantage: real production experience. Always bring it back to something you actually built.`,
      code: `// Question: Write a query to find the top 5 candidates
// with the most job applications in the last 30 days

SELECT
  c.id,
  c.name,
  c.email,
  COUNT(ja.id) as application_count
FROM candidates c
INNER JOIN job_applications ja ON ja.candidate_id = c.id
WHERE ja.created_at >= NOW() - INTERVAL '30 days'
  AND c.status = 'active'
GROUP BY c.id, c.name, c.email
ORDER BY application_count DESC
LIMIT 5;

// Index needed: (created_at) on job_applications
// And (status) or (org_id, status) on candidates

// Question: Handle this with proper error handling
app.get('/candidates', async (req, res, next) => {
  try {
    const orgId = req.user.org_id  // from JWT middleware
    const { page = 1, status } = req.query

    const candidates = await CandidateService.list({
      orgId,
      status,
      page: parseInt(page),
      limit: 50
    })

    res.json({ success: true, data: candidates })
  } catch (err) {
    next(err)  // global error handler catches it
  }
})`,
      interviewQ: 'Explain how you would debug a slow API endpoint in production.',
      interviewA: `First, I add timing logs to narrow down where the time is being spent — is it the DB query, an external API call, or processing? Then I look at the DB queries for that endpoint — enable slow query log and check EXPLAIN ANALYZE. 90% of the time it's a missing index or an N+1 query. If it's external API calls, I'd add a timeout and consider caching the response. I'd also check if it's a specific user or data pattern causing it — sometimes it's a single user with 10,000 records and everyone else is fine. Reproduce in staging with production-like data before making changes.`,
    },
    {
      id: 'mock-behavioural',
      title: 'Mock Behavioural Round (20 min)',
      difficulty: 'medium',
      explanation: `Behavioural rounds often overlap with HR. Common question themes:
• Leadership and ownership
• Conflict and collaboration
• Learning and growth
• Handling pressure / deadlines
• Why this company / role

Interviewers are evaluating: communication clarity, self-awareness, and whether you'd be a good teammate. Energy matters — show genuine interest.`,
      code: `// Practice answers — time yourself, aim for 90-120 seconds each

// "Describe yourself in 3 sentences"
"I'm a full-stack developer with 4 years of experience building
production systems — mostly Node.js, React, Vue, and PostgreSQL.
I've owned projects end-to-end from schema design to AWS deployment.
I care most about writing code that solves real problems cleanly."

// "What are you most proud of technically?"
"The ARC Parcel commission report. I took a 12-second report query
down to 1.8 seconds through index optimization and MySQL views.
It was my first time really going deep on query analysis — EXPLAIN ANALYZE,
understanding index selectivity, composite index ordering.
That project taught me more about databases than anything else."

// "Why this company specifically?"
[Research required — this must be specific to the company]
"I looked at your engineering blog / GitHub / product —
I noticed you're using [X technology]. I've been working with [similar]
and I think there's a real alignment. Also, [specific thing about the company]
is genuinely interesting to me because [reason]."`,
      interviewQ: 'Tell me about yourself.',
      interviewA: `I'm a full-stack developer, 3 years in. I started with Node.js and React building ARC Parcel — a logistics platform for 15 hubs managing 900K shipments. That gave me real experience with performance optimization, multi-hub data management, and end-to-end deployment on AWS. More recently I worked on TalentFind, a recruitment platform, where I used FastAPI and Vue 3, and built features like dual-session prevention and document management with S3. I'm comfortable across the stack — backend, frontend, DB optimization, DevOps. I'm here because I want to work on bigger problems with a stronger engineering team.`,
    },
    {
      id: 'pre-interview-checklist',
      title: 'Pre-Interview Checklist & Day-Of Preparation',
      difficulty: 'easy',
      explanation: `The day before:
• Research the company — product, tech stack, recent news, Glassdoor reviews
• Review the job description — map your experience to each bullet point
• Prepare 3 questions to ask them
• Know your resume cold — every line you've written, be ready to talk about it
• Get a good night's sleep — cognitive function drops significantly on poor sleep

Day of:
• Technical test in browser: leetcode.com, ensure IDE-like editor if coding
• 15 minutes early for in-person, 5 minutes for virtual
• Have water, silence your phone
• Camera, mic, lighting check for virtual`,
      code: `// Pre-interview research template

Company: [Name]
Product: [What they build, who uses it]
Tech stack: [If public — GitHub, job posts, engineering blog]
Recent news: [Funding, product launches, acquisitions]
Interviewers: [LinkedIn check — their background, experience]

// Job description mapping
JD Requirement → My Experience
"Experience with Node.js" → ARC Parcel backend, ATOFON
"PostgreSQL / MySQL" → TalentFind (PG), ARC (MySQL)
"AWS" → EC2, S3, RDS, ElastiCache across all projects
"Performance optimization" → ARC report: 12s → 2s
"Redis" → TalentFind (sessions), ATOFON (OTP + cache)

// Questions prepared
1. [Technical: stack / challenge]
2. [Team: culture / growth]
3. [Role: success definition]

// Mental prep
// - They want to hire, not fail you. They're rooting for you.
// - Stuck? Say "Let me think through this" — don't freeze silently
// - Wrong answer? Correct yourself — "Actually, let me revise that"
// - It's a conversation, not an interrogation`,
      interviewQ: 'Is there anything you want to add before we close?',
      interviewA: `I'd just say I'm genuinely excited about this role — the problems you're working on and the tech align well with where I want to grow. I've prepared hard for this and I'd love the opportunity to contribute. If there's anything from today's conversation you'd like me to elaborate on, I'm happy to. Otherwise, what are the next steps in the process?`,
    },
  ],
  interviewQA: [
    { q: 'Q1. Tell me about yourself. (The pitch that gets you moved forward)', a: `I'm a full-stack developer with 4 years of experience, and what sets me apart is that I've owned production systems end to end — not just features, but entire platforms from blank schema to AWS deployment. The project I'm most proud of is ARC Parcel — a logistics platform I built for a company managing 15 regional hubs and over 900,000 shipment records. I designed the DB schema, built the Node.js API, the React frontend, Redis caching layer, and set up the CI/CD pipeline. Real problems — a commission report taking 12 seconds, I brought it to under 2 with index optimization and MySQL views. After that, TalentFind — a B2B recruitment SaaS — where I designed the FastAPI backend and Vue 3 frontend. Multi-tenant architecture, dual-session prevention, document management with S3 presigned URLs. I'm also someone who uses AI seriously as a tool — Claude Code and Claude Agent daily — which means I move faster on implementation without dropping quality. I'm looking for a senior role where the engineering bar is high and the problems are genuinely complex. Based on what I've seen of your product and team, that's exactly what this is.` },
    { q: 'Q2. Walk me through your resume.', a: `Start with current/most recent. ARC Parcel — my most complete ownership, built the whole platform. Then TalentFind — different stack (FastAPI, Vue), bigger team, my specific contributions. ATOFON — B2B e-commerce, the ordering and inventory system. Each project I try to lead with what I built and the impact, not just the tech. End with skills and education briefly.` },
    { q: 'Q3. How do you stay updated with new technologies?', a: `A mix of things. I follow a few engineers on Twitter/X who share practical takes — not hype. Changelog and JS Weekly newsletters for what's actually shipping. When something comes up in a project, I learn it deeply rather than surface level. I also build small throwaway projects when I want to learn something properly — reading docs is fine, actually building with it is how it sticks.` },
    { q: 'Q4. What is the most complex feature you have built?', a: `The vehicle indent to commission payment flow in ARC Parcel. It involved: creating the trip authorization, assigning the vehicle and driver, tracking all shipments under that indent, applying commission rules based on hub/zone/vehicle type, and generating payment records. All of this had to be transactional — partial writes would corrupt financial data. I also built the MySQL view that aggregated it for reporting and the PDF generation pipeline.` },
    { q: 'Q5. How do you handle code reviews?', a: `For giving reviews: I focus on correctness, then clarity, then performance. I try to ask questions rather than make demands — "What happens if X is null here?" rather than "This will break if X is null." I'm specific about what's a blocker vs a suggestion. For receiving reviews: I don't take it personally, I ask for clarification on anything I don't understand, and I appreciate when reviewers catch things I missed — that's the whole point.` },
    { q: 'Q6. What is the difference between a senior and a mid-level developer?', a: `Senior developers own problems, not just tasks. They think about edge cases before being asked. They write code that the next developer can understand. They push back on requirements that don't make sense. They communicate blockers early instead of being stuck silently. And they consider non-functional requirements — performance, security, maintainability — not just "does this work?" I'm working toward that — I'm strong on the technical side and improving on the communication and mentoring side.` },
    { q: 'Q7. Describe your development workflow.', a: `I work in short cycles. Understand the requirement completely first — ask questions, draw it out if complex. Then schema or interface design before writing any code — thinking about the data model upfront saves rework. Build a minimal working version, test it with edge cases, then clean it up. PR with description of what and why. I also check query performance on any DB-heavy feature before it goes to review.` },
    { q: 'Q8. How do you handle a requirement that keeps changing?', a: `I try to understand why it's changing first. Sometimes requirements change because the user saw the prototype and realized they wanted something different — that's healthy. Sometimes it's indecision higher up — that needs different handling. For frequent changes, I build more loosely coupled — config-driven behavior, separate constants from logic. And I flag when changes have ripple effects so there are no surprises on timeline.` },
    { q: 'Q9. What technologies are you learning right now?', a: `TypeScript more deeply — I've used it in small amounts but I want to be fully proficient, especially for complex generic types. Docker and container orchestration — I've used Docker but want to get into Kubernetes at a basic level. And I've been looking at Redis streams as a message queue alternative to understand the tradeoffs versus BullMQ.` },
    { q: 'Q10. Do you have any questions for us?', a: `Yes — what does the engineering team's technical decision process look like? Is it top-down from the architect or does the team propose and debate solutions? Also, what's the biggest technical challenge the team is actively working on? And for this role specifically — what would success look like in the first 90 days?` },
    { q: 'Q11. Do you use AI tools in your work? How?', a: `Yes — Claude Code and Claude Agent are part of my daily workflow. Claude Code runs in my terminal while I'm coding — I use it for generating boilerplate, scaffolding new features, and reviewing logic before it goes to PR. Claude Agent handles multi-step tasks across multiple files — like setting up a whole feature structure or refactoring a pattern across a service. The key thing I'm clear on: I review and own everything that goes in. The architecture decisions, the schema design, the edge cases — those are mine. AI compresses the time on mechanical work so I can spend more on the parts that actually need engineering judgment. I have strong hands-on experience with it and it genuinely makes me faster.` },
    { q: 'Q12. How do you make sure AI-generated code is production quality?', a: `Same process as any code — I read it, I understand it, I test it. I don't ship code I can't explain. If Claude generates something and I can't tell you why every line is there, it doesn't go in. I also tend to use AI for the first draft, then refactor to match our team's conventions and add proper error handling. The way I think about it: Claude is a very fast junior developer that never gets tired. The senior review and judgment layer is still entirely mine.` },
  ]
}
