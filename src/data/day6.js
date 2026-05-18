export const day6 = {
  id: 6,
  title: 'System Design Fundamentals',
  subtitle: 'Scalability, load balancing, caching, microservices, message queues',
  concepts: [
    {
      id: 'scalability',
      title: 'Scalability — Vertical vs Horizontal',
      difficulty: 'medium',
      explanation: `Vertical scaling: add more power to one machine (more CPU, RAM). Simple but has a ceiling.

Horizontal scaling: add more machines. Needs load balancer, stateless services, shared storage.

Key principle: design stateless services — keep session state in Redis, not in memory. That way any server can handle any request.`,
      code: `// Stateless service design — session in Redis, not memory

// ❌ Stateful — breaks horizontal scaling
let sessions = {}  // lives on one server

// ✅ Stateless — works with any number of servers
const session = await redis.get(\`session:\${token}\`)

// Load balancer distributes to any instance
// Server 1, Server 2, Server 3 — all can handle the request
// because session data is in shared Redis`,
      interviewQ: 'How would you scale a Node.js app from 100 to 100,000 users?',
      interviewA: `First, make it stateless — move sessions to Redis. Then put multiple instances behind a load balancer like Nginx or AWS ALB. Add a read replica for the database — most apps are 80% reads. Add caching with Redis for frequent queries. CDN for static assets. After that it's about identifying bottlenecks with monitoring — usually it's the DB first, then specific hot endpoints.`,
    },
    {
      id: 'load-balancing',
      title: 'Load Balancing & Reverse Proxy',
      difficulty: 'medium',
      explanation: `Load balancer distributes traffic across multiple servers. Nginx is the most common in practice.

Algorithms: Round Robin (default), Least Connections (sends to least busy), IP Hash (same client → same server, useful for non-Redis sessions).

Health checks: load balancer pings /health endpoint, removes dead servers automatically.`,
      code: `# Nginx load balancer config
upstream api_servers {
  least_conn;  # send to least busy server
  server api1.example.com:3000;
  server api2.example.com:3000;
  server api3.example.com:3000;
}

server {
  listen 80;
  location /api {
    proxy_pass http://api_servers;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # Health check endpoint
  location /health {
    return 200 'OK';
  }
}

# PM2 cluster mode (single server horizontal scaling)
pm2 start app.js -i max  # one process per CPU core`,
      interviewQ: 'What is a reverse proxy and how is it different from a load balancer?',
      interviewA: `A reverse proxy sits in front of your servers and forwards client requests. It can do SSL termination, compression, caching, and routing. A load balancer specifically distributes traffic across multiple servers. In practice Nginx does both — it's my reverse proxy AND load balancer. The client talks to Nginx, Nginx talks to whichever backend server has the least load.`,
    },
    {
      id: 'caching-layers',
      title: 'Caching Layers — CDN, Application, Database',
      difficulty: 'hard',
      explanation: `Caching at different layers:

1. CDN (Cloudflare, CloudFront) — static assets, images, even API responses. Closest to the user.
2. Application cache (Redis) — frequently read data, sessions, rate limit counters.
3. Database query cache — DB caches query results internally.
4. Browser cache — HTTP cache headers (Cache-Control, ETag).

Cache invalidation is the hard part — stale data causes bugs. Common strategies: TTL expiry, event-based invalidation (delete cache when data changes).`,
      code: `// Application cache with invalidation pattern

// Cache on read
async function getOrgCandidates(orgId) {
  const key = \`org:\${orgId}:candidates\`
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)

  const data = await db.query('SELECT * FROM candidates WHERE org_id = ?', [orgId])
  await redis.setex(key, 300, JSON.stringify(data))  // 5 min TTL
  return data
}

// Invalidate on write
async function createCandidate(orgId, data) {
  await db.query('INSERT INTO candidates ...', data)
  await redis.del(\`org:\${orgId}:candidates\`)  // bust the cache
}

// HTTP cache headers
res.set('Cache-Control', 'public, max-age=3600')  // CDN caches for 1hr
res.set('ETag', hashOfContent)  // browser revalidates`,
      interviewQ: 'What is cache stampede and how do you prevent it?',
      interviewA: `Cache stampede is when a popular cache key expires and hundreds of requests all hit the DB simultaneously to rebuild it. Prevention: probabilistic early expiry (start rebuilding before TTL hits), mutex lock (only one process rebuilds, others wait), or background refresh (a job refreshes the cache before it expires). In ARC we used a mutex approach for the hub stats dashboard — first request acquires a lock, rebuilds, releases; others wait for the lock.`,
    },
    {
      id: 'microservices',
      title: 'Monolith vs Microservices',
      difficulty: 'hard',
      explanation: `Monolith: single deployable unit. Simple to develop, test, debug. All code in one repo. Becomes painful at scale — every deploy is full app, one bug can take down everything.

Microservices: each service owns one domain, deployed independently. Good for large teams. Hard parts: service discovery, network failures, distributed tracing, data consistency across services.

Rule of thumb: start with a monolith, extract services when you feel the pain.`,
      code: `// Monolith — everything in one process
app.use('/api/candidates', candidateRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/billing', billingRoutes)

// Microservices — separate deployments
// candidate-service: PORT 3001
// job-service: PORT 3002
// billing-service: PORT 3003
// API Gateway routes to correct service

// Service-to-service communication
// REST (synchronous) — simple, easy to debug
const candidates = await axios.get('http://candidate-service/internal/list')

// Message Queue (async) — decoupled, more resilient
await rabbitMQ.publish('candidate.created', { candidateId: 123 })
// billing-service subscribes and handles independently`,
      interviewQ: 'When would you choose microservices over a monolith?',
      interviewA: `When different parts of the system have genuinely different scaling needs — like if your video processing needs 10x the compute of your API layer. Or when you have multiple large teams stepping on each other's deployments. Both ARC and TalentFind were monoliths — the right call at that scale. I wouldn't jump to microservices unless the team is 20+ engineers or you've actually hit the ceiling with a monolith.`,
    },
    {
      id: 'message-queues',
      title: 'Message Queues — RabbitMQ, SQS, Redis Pub/Sub',
      difficulty: 'medium',
      explanation: `Message queues decouple producers and consumers. The producer sends a message and moves on — the consumer processes it when ready.

Use cases: async job processing (emails, SMS, reports), rate limiting heavy tasks, spreading load from traffic spikes.

RabbitMQ: full-featured, supports routing, dead letter queues.
AWS SQS: managed, simpler, integrates with Lambda.
Redis pub/sub: lightweight, no persistence (if consumer is down, message is lost).
BullMQ: Redis-based job queue with retry logic — popular in Node.`,
      code: `// BullMQ — Redis-based job queue in Node.js
import { Queue, Worker } from 'bullmq'

// Producer — add job and move on
const emailQueue = new Queue('emails', { connection: redisConfig })

await emailQueue.add('send-welcome', {
  to: 'user@example.com',
  template: 'welcome',
  data: { name: 'Jay' }
})

// Consumer — process in background
const worker = new Worker('emails', async (job) => {
  const { to, template, data } = job.data
  await sendEmail(to, template, data)
}, {
  connection: redisConfig,
  concurrency: 5,  // process 5 jobs at once
})

worker.on('completed', job => console.log('Email sent:', job.id))
worker.on('failed', (job, err) => console.error('Email failed:', err))`,
      interviewQ: 'Where would you use a message queue in a real application?',
      interviewA: `In ATOFON, when an order was placed we didn't send the SMS inline — that would slow down the order response. Instead we pushed a job to a queue and returned the API response immediately. The worker picked it up and sent the SMS async. Same for email notifications and invoice generation. Any operation that doesn't need to complete before responding to the user is a good candidate for a queue.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. What is CAP theorem?', a: `Distributed systems can only guarantee 2 of 3: Consistency (every read gets the latest write), Availability (system always responds), Partition tolerance (works even when network splits). In practice network partitions happen, so you choose CP or AP. PostgreSQL is CP — consistent but may reject requests during a partition. Cassandra is AP — always available but may return stale data.` },
    { q: 'Q2. What is database sharding?', a: `Sharding splits a database horizontally — different rows go to different DB instances. Like users A-M go to shard 1, N-Z to shard 2. This scales writes and storage beyond what one machine can handle. Hard part: cross-shard queries become expensive, and rebalancing shards when you add more is painful. Most companies reach for read replicas before sharding.` },
    { q: 'Q3. What is the difference between SQL and NoSQL scaling?', a: `SQL scales vertically easily, horizontally is hard — you need sharding which is complex. NoSQL (Cassandra, MongoDB) was designed for horizontal scaling from the start — add nodes, data spreads automatically. But you give up joins and often ACID guarantees. For most startups SQL with read replicas handles millions of users fine before you need NoSQL-level scaling.` },
    { q: 'Q4. What is an API gateway?', a: `An API gateway sits in front of all your services and handles cross-cutting concerns — auth, rate limiting, routing, SSL, logging. Clients talk to one endpoint, gateway routes to the right service. AWS API Gateway, Kong, Nginx can all play this role. In microservices it simplifies the client — they don't need to know about 10 different service URLs.` },
    { q: 'Q5. How do you handle session management in a horizontally scaled app?', a: `Store sessions in Redis, not in server memory. If sessions are in memory and the load balancer sends the next request to a different server, the session is gone. Redis is shared across all instances — any server can read the session. This is one of the first things you fix when scaling beyond one server.` },
    { q: 'Q6. What is circuit breaker pattern?', a: `Circuit breaker wraps calls to external services. If the service keeps failing, the breaker "trips" and stops sending requests for a cooldown period — returns a default response instead. This prevents cascade failures where one slow service brings down everything waiting for it. After cooldown it tries again (half-open state). Libraries like opossum do this in Node.` },
    { q: 'Q7. What is eventual consistency?', a: `In distributed systems, when you write to one node, it takes time to replicate to others. During that window, different nodes may return different data — eventually they sync up. Systems like DynamoDB and Cassandra are eventually consistent by default. It's acceptable for things like social media likes but not for bank balances.` },
    { q: 'Q8. How would you design a URL shortener?', a: `Core: take long URL, generate short 6-char code, store mapping in DB, redirect on hit. Scale concerns: read-heavy so cache hot URLs in Redis. For the short code: base62 encoding of an auto-increment ID. 6 chars of base62 = 56 billion unique URLs. Serve redirect from CDN edge for fast response. DB needs index on short code. Rate limit the create endpoint.` },
    { q: 'Q9. What is a CDN and when would you use it?', a: `CDN stores copies of your content at edge nodes around the world — user gets content from the nearest node. Use it for: static assets (JS, CSS, images), media files, and even cacheable API responses. Cloudflare is what I've used — it also adds DDoS protection and handles SSL. Even on small projects, putting images and assets behind a CDN cuts load time significantly for international users.` },
    { q: 'Q10. What is rate limiting and how do you implement it at scale?', a: `Rate limiting caps how many requests a client can make in a time window. For a single server, express-rate-limit is fine. For multiple servers, you need a shared counter — Redis with INCR + EXPIRE. Token bucket algorithm is good for burst tolerance — user gets 100 tokens per minute, each request costs 1. If they burst 100 in 10 seconds, they wait for tokens to refill. Sliding window is more accurate but heavier.` },
  ]
}
