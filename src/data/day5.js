export const day5 = {
  id: 5,
  title: 'Databases',
  subtitle: 'PostgreSQL, MySQL, MongoDB, Redis — indexing, joins, transactions, caching',
  concepts: [
    {
      id: 'indexes',
      title: 'Database Indexes',
      difficulty: 'hard',
      explanation: `An index is a data structure (usually B-tree) that speeds up data retrieval at the cost of extra storage and slower writes.

When to add an index: columns used in WHERE, JOIN ON, ORDER BY clauses, columns with high cardinality (many distinct values).

When NOT to index: small tables, columns with low cardinality (gender: M/F), columns rarely used in queries, tables with very high write rate.`,
      code: `-- Check if query uses index
EXPLAIN ANALYZE SELECT * FROM candidates WHERE email = 'jay@test.com';

-- Create index
CREATE INDEX idx_candidates_email ON candidates(email);

-- Composite index — order matters
-- Good for: WHERE status = 'active' AND org_id = 5
-- Good for: WHERE status = 'active' (uses leftmost prefix)
-- NOT used for: WHERE org_id = 5 alone
CREATE INDEX idx_candidates_status_org ON candidates(status, org_id);

-- Partial index — only indexes active candidates (smaller, faster)
CREATE INDEX idx_active_candidates ON candidates(created_at)
WHERE status = 'active';

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'candidates';`,
      interviewQ: 'What is the difference between a clustered and non-clustered index?',
      interviewA: `A clustered index determines the physical order of rows in the table — so there can only be one per table. In MySQL InnoDB, the primary key IS the clustered index. A non-clustered index is a separate structure pointing to the actual row locations. When you query by a non-clustered index, it finds the pointer, then looks up the actual row — called a "table lookup" or "bookmark lookup." If you're querying all columns via a non-clustered index frequently, consider a covering index that includes all needed columns.`,
      tip: 'Run EXPLAIN ANALYZE before and after adding an index to verify it\'s being used. Indexes aren\'t always used — the query planner decides.',
    },
    {
      id: 'joins',
      title: 'SQL Joins & Query Optimization',
      difficulty: 'hard',
      explanation: `INNER JOIN: rows matching in both tables.
LEFT JOIN: all rows from left + matching from right (NULL if no match).
RIGHT JOIN: all rows from right + matching from left.
FULL OUTER JOIN: all rows from both tables.

Query optimization: use indexes on join columns, avoid SELECT *, filter early with WHERE, avoid functions on indexed columns in WHERE clause.`,
      code: `-- Find all candidates with their organisation name
SELECT c.name, c.email, o.name as org_name, j.title as applied_for
FROM candidates c
INNER JOIN organisations o ON c.org_id = o.id
LEFT JOIN job_applications ja ON ja.candidate_id = c.id
LEFT JOIN jobs j ON ja.job_id = j.id
WHERE c.status = 'active'
  AND o.country = 'UK'
ORDER BY c.created_at DESC
LIMIT 50;

-- ❌ Bad: function on indexed column kills index
WHERE YEAR(created_at) = 2025

-- ✅ Good: range query uses index
WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'

-- CTE for readability
WITH active_candidates AS (
  SELECT * FROM candidates WHERE status = 'active'
)
SELECT ac.name, COUNT(ja.id) as applications
FROM active_candidates ac
LEFT JOIN job_applications ja ON ja.candidate_id = ac.id
GROUP BY ac.id, ac.name
HAVING COUNT(ja.id) > 3;`,
      interviewQ: 'How did you write complex queries in your projects?',
      interviewA: `In ARC Parcel I wrote MySQL views for commission and payment reports — these joined vehicle records, routes, and payment tables across multiple hubs. The queries were complex enough that I created views so the application layer just queried the view like a table. I also added composite indexes on the most common filter combinations — status + hub_id and shipment_date + zone — which dropped report generation time from 12 seconds to under 2.`,
    },
    {
      id: 'transactions',
      title: 'Database Transactions & ACID',
      difficulty: 'hard',
      explanation: `ACID properties:
• Atomicity — all or nothing. Either all operations in a transaction succeed or none do.
• Consistency — transaction brings DB from one valid state to another.
• Isolation — concurrent transactions don't interfere with each other.
• Durability — committed transactions survive crashes.

Isolation levels (least to most strict): READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE`,
      code: `// Sequelize transaction example (ARC Parcel pattern)
const t = await sequelize.transaction()
try {
  // Create vehicle indent
  const indent = await VehicleIndent.create({
    hub_id: data.hubId,
    zone: data.zone,
    amount: data.amount,
    status: 'pending'
  }, { transaction: t })

  // Update hub vehicle count
  await Hub.increment('pending_count', {
    where: { id: data.hubId },
    transaction: t
  })

  // Create audit log entry
  await AuditLog.create({
    entity: 'vehicle_indent',
    entity_id: indent.id,
    action: 'CREATED',
    user_id: req.user.id
  }, { transaction: t })

  await t.commit()
  return indent
} catch (error) {
  await t.rollback()  // all changes undone
  throw error
}`,
      interviewQ: 'When and why did you use database transactions in your projects?',
      interviewA: `In ATOFON whenever an order was placed, I used transactions for the entire flow — decrement seller inventory, create the order record, create the finance ledger entry, and trigger the SMS notification log. If any step failed, the whole thing rolled back so we never had an order without inventory deducted or a payment entry without an order. Financial data especially needs transactions — partial writes are worse than a failed write.`,
    },
    {
      id: 'redis',
      title: 'Redis — Caching Patterns',
      difficulty: 'medium',
      explanation: `Redis is an in-memory data store — sub-millisecond reads/writes. Common use cases: caching, session storage, rate limiting, pub/sub, job queues.

Caching strategies:
• Cache-aside (lazy): check cache first, on miss fetch from DB and populate cache.
• Write-through: write to cache and DB simultaneously.
• Write-behind: write to cache, async write to DB.
• Cache-through: all reads/writes go through cache layer.`,
      code: `const redis = require('ioredis')
const client = new redis(process.env.REDIS_URL)

// Cache-aside pattern (most common)
async function getCandidates(orgId) {
  const cacheKey = \`candidates:org:\${orgId}\`

  // 1. Check cache
  const cached = await client.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // 2. Cache miss — fetch from DB
  const candidates = await db.candidates.findAll({ where: { orgId } })

  // 3. Store in cache with TTL (1 hour)
  await client.setex(cacheKey, 3600, JSON.stringify(candidates))

  return candidates
}

// Invalidate cache on update
async function updateCandidate(id, data) {
  await db.candidates.update(data, { where: { id } })
  // Invalidate related caches
  const candidate = await db.candidates.findByPk(id)
  await client.del(\`candidates:org:\${candidate.orgId}\`)
}

// Rate limiting with Redis
async function checkRateLimit(userId) {
  const key = \`ratelimit:\${userId}\`
  const count = await client.incr(key)
  if (count === 1) await client.expire(key, 60)  // first request, set 60s window
  return count <= 100  // allow 100 requests per minute
}`,
      interviewQ: 'How did you use Redis in ATOFON?',
      interviewA: `Two main uses. First, caching product catalogue data — product details, pricing, and seller zone configs were read-heavy and rarely changed. I cached them with a 30-minute TTL and invalidated on any update. This took the product listing API from 400ms to under 20ms. Second, session storage for OTP flows — when a buyer requested an OTP, I stored it in Redis with a 5-minute expiry. Redis's built-in TTL handled expiry automatically without any cleanup jobs.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. What is the N+1 query problem and how do you solve it?', a: `N+1 happens when you fetch N items and then make a separate DB query for each one — so 1 query to get 100 orders + 100 queries to get each order's customer = 101 queries. Fix: eager loading. In Sequelize use include to join related data in one query. In raw SQL use JOIN. In GraphQL use DataLoader to batch queries. I caught this in ARC's shipment list — added eager loading for hub and zone data which dropped from 800 queries to 1.` },
    { q: 'Q2. What is database normalization and when would you denormalize?', a: `Normalization removes data redundancy by splitting data into related tables. 1NF: atomic values. 2NF: no partial dependencies. 3NF: no transitive dependencies. I'd denormalize for read-heavy queries where joins are too expensive — like storing the total order amount on the order record instead of summing line items every time. Denormalization trades storage for query speed.` },
    { q: 'Q3. What is a database connection pool and why does it matter?', a: `Creating a DB connection is expensive — TCP handshake, authentication, SSL. A connection pool maintains a set of open connections and reuses them. Without pooling, high-traffic apps create and destroy connections constantly, crushing DB performance. In Node.js, Sequelize uses pool automatically. Configuration matters — too small and requests queue up, too large and you overwhelm the DB. Typical starting point: min 5, max 20.` },
    { q: 'Q4. What is the difference between SQL and NoSQL databases?', a: `SQL (PostgreSQL, MySQL): structured schema, ACID transactions, great for relational data with complex queries. NoSQL (MongoDB): flexible schema, horizontal scaling, great for documents, hierarchical data, or when schema changes frequently. I use PostgreSQL for most projects — structured data benefits from the relational model and ACID guarantees. I used MongoDB in the Training Institute Management System where each course's structure varied enough that a flexible schema made sense.` },
    { q: 'Q5. How do you handle database migrations in production?', a: `I use migration files — each migration has an up and down function. Run up to apply, down to rollback. In Sequelize that's sequelize-cli migrations. Key practices: never modify an existing migration (create a new one instead), always test rollback, deploy migrations before deploying code changes that depend on them. In ARC Parcel I maintained separate migration scripts for dev, UAT, and production with a checklist to verify each environment before promotion.` },
    { q: 'Q6. What is a foreign key and what is cascading?', a: `A foreign key is a column that references the primary key of another table — enforces referential integrity. Cascading defines what happens to related records when the parent is deleted or updated. ON DELETE CASCADE deletes child records automatically. ON DELETE SET NULL nullifies the foreign key. ON DELETE RESTRICT (default) prevents deletion if children exist. I use RESTRICT by default to prevent accidental data loss and handle cleanup explicitly in application code.` },
    { q: 'Q7. How do you handle pagination for large datasets?', a: `Two approaches: offset pagination (LIMIT 20 OFFSET 100 — simple but slow for large offsets, DB still scans all skipped rows) and cursor pagination (WHERE id > lastId LIMIT 20 — constant time, uses index). For ATOFON's order history which could have thousands of records, I used cursor-based pagination on created_at + id for consistent performance. Offset is fine for admin panels with < 10k rows.` },
    { q: 'Q8. What is a database deadlock and how do you prevent it?', a: `A deadlock is when two transactions each hold a lock the other needs — neither can proceed. Example: Transaction A locks row 1 then tries to lock row 2. Transaction B locked row 2 and tries to lock row 1. Both wait forever. Prevention: always acquire locks in the same order across transactions, keep transactions short, use SELECT FOR UPDATE only when necessary. PostgreSQL detects and automatically kills one of the transactions on deadlock.` },
    { q: 'Q9. What indexes did you create in your projects?', a: `In ARC Parcel: composite index on (shipment_date, zone_id) for the shipment report queries, index on (hub_id, status) for the vehicle management dashboard. In TalentFind: index on (org_id, status) for candidate listing, index on email for login lookups. I always ran EXPLAIN ANALYZE before and after to verify the index was being picked up by the query planner.` },
    { q: 'Q10. How do you back up and restore databases in production?', a: `PostgreSQL: pg_dump for logical backups, pg_basebackup for physical. Schedule automated daily dumps to S3 with retention policy. For MySQL in ARC Parcel we used RDS automated backups with 7-day retention. Key thing: regularly test restores — a backup you've never restored is not a real backup. I set up a quarterly drill where we actually restored to a test environment to verify the backup was valid.` },
  ]
}
