export const day7 = {
  id: 7,
  title: 'System Design — Your Projects',
  subtitle: 'Deep dive into ARC Parcel, TalentFind, and ATOFON architecture',
  concepts: [
    {
      id: 'arc-architecture',
      title: 'ARC Parcel — System Architecture',
      difficulty: 'hard',
      explanation: `ARC Parcel is a multi-hub parcel delivery management system. Architecture challenges:
• Multi-hub structure — each hub manages its own fleet, routes, and operations independently
• 900,000+ shipment records needing fast reporting
• Commission and payment calculations involving complex business rules
• Multiple user roles: HQ admin, hub manager, vehicle operators, customers

Tech stack: Node.js + Express, MySQL, Sequelize ORM, AWS EC2, Redis, Nginx, PM2`,
      code: `// ARC System Architecture (conceptual)

// Layer 1: Nginx reverse proxy (SSL, load balancing)
// Layer 2: Node.js API (PM2 cluster, 4 workers)
// Layer 3: Business Logic Services
//   ├── ShipmentService — tracking, status updates
//   ├── VehicleService — indent management, routing
//   ├── CommissionService — payment calculations
//   └── ReportService — analytics, exports
// Layer 4: MySQL (primary) + Redis (cache)
// Layer 5: AWS S3 (documents, exports)

// Key design decision: MySQL Views for reports
CREATE VIEW commission_summary AS
SELECT
  v.hub_id,
  v.zone,
  COUNT(s.id) as shipment_count,
  SUM(s.amount) as total_amount,
  SUM(s.amount * commission_rate) as commission
FROM vehicle_indents v
JOIN shipments s ON s.indent_id = v.id
WHERE s.status = 'delivered'
GROUP BY v.hub_id, v.zone, v.route_date;

// Application just queries the view
const report = await db.query('SELECT * FROM commission_summary WHERE hub_id = ?', [hubId])`,
      interviewQ: 'Walk me through the architecture of ARC Parcel.',
      interviewA: `ARC is a multi-hub delivery platform — think of it as a mini logistics network with a central HQ and regional hubs, each managing their own fleet and routes. The backend is Node.js behind Nginx with PM2 cluster mode spinning up 4 workers. MySQL is the main DB — we had 900K+ shipment records so I built composite indexes on the most common filter combos and used MySQL views for the heavy reporting queries. Redis cached hub-level stats and dashboard data. AWS EC2 for hosting, S3 for document storage, and a GitLab CI/CD pipeline that ran tests and deployed on merge to main.`,
    },
    {
      id: 'arc-performance',
      title: 'ARC Parcel — Performance Challenges',
      difficulty: 'hard',
      explanation: `Key performance problems solved in ARC:

1. Report generation: 12 seconds → 2 seconds
   - Added MySQL views + composite indexes on shipment_date + zone_id

2. Shipment list (900K records): 8 second load → 2 seconds
   - Server-side pagination (LIMIT/OFFSET with index scan)
   - Cursor-based pagination for sequential navigation

3. Dashboard data: Cached hub stats in Redis with 5-min TTL

4. N+1 query issue: eager loading with Sequelize include`,
      code: `// Before: N+1 — 1 + 900 queries for shipment list
const indents = await VehicleIndent.findAll({ where: { hubId } })
for (const indent of indents) {
  indent.shipments = await Shipment.findAll({ where: { indentId: indent.id } })
}

// After: single JOIN query with eager loading
const indents = await VehicleIndent.findAll({
  where: { hubId },
  include: [{ model: Shipment, as: 'shipments' }]  // JOIN in one query
})

// Cursor-based pagination for 900K shipment table
const shipments = await Shipment.findAll({
  where: {
    hubId,
    id: { [Op.gt]: lastSeenId }  // uses primary key index
  },
  order: [['id', 'ASC']],
  limit: 50
})`,
      interviewQ: 'What was the hardest technical problem you solved in ARC Parcel?',
      interviewA: `The commission report. It needed to join vehicle indents, shipment records, route data, and payment rates across multiple hubs — a 6-table join on 900K records. First run took 12 seconds. I analyzed it with EXPLAIN ANALYZE, found it was doing full table scans on shipment_date and zone_id. Added a composite index on those two columns, then moved the join logic into a MySQL view so the application just queried a pre-defined view. Got it down to 1.8 seconds. The view also gave us a clean contract — frontend knew exactly what columns to expect.`,
    },
    {
      id: 'talentfind-architecture',
      title: 'TalentFind — Architecture & Key Features',
      difficulty: 'hard',
      explanation: `TalentFind is a B2B recruitment platform. Key architectural challenges:
• Multi-tenant — each organisation has isolated data
• Dual-session prevention — can't be logged in on 2 devices
• Document management — CVs, certificates stored on S3
• Role-based access (SuperAdmin, OrgAdmin, Recruiter, Interviewer)
• Real-time interview scheduling with conflict detection

Tech stack: FastAPI (Python), Vue 3, PostgreSQL, Redis, AWS S3, Celery for async tasks`,
      code: `# TalentFind — Multi-tenant data isolation
# Every query scoped to org_id from JWT token

# FastAPI dependency — ensures tenant isolation
async def get_current_org(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    return payload['org_id']  # from JWT

@app.get("/candidates")
async def list_candidates(
    org_id: int = Depends(get_current_org),
    db: Session = Depends(get_db)
):
    # All queries automatically scoped to org
    return db.query(Candidate).filter(Candidate.org_id == org_id).all()

# Dual-session prevention
class SessionManager:
    async def create_session(self, user_id, device_info):
        existing = await db.sessions.find_one({'user_id': user_id, 'active': True})
        if existing:
            return {'has_existing_session': True, 'device': existing.device_info}

        session_id = str(uuid4())
        await redis.setex(f'session:{session_id}', 86400, user_id)
        return {'session_id': session_id, 'tokens': generate_tokens(user_id, session_id)}`,
      interviewQ: 'How did you implement multi-tenancy in TalentFind?',
      interviewA: `Shared database, isolated data — every table has an org_id column. The JWT token contains the org_id, and our auth middleware extracts it. Every query is automatically scoped to that org_id — no raw query can return data from another org. We also added a PostgreSQL row-level security policy as a safety net. For the admin panel we had a SuperAdmin role with a separate token that could bypass org scoping, but that code path was explicitly gated.`,
    },
    {
      id: 'atofon-architecture',
      title: 'ATOFON — B2B E-Commerce Architecture',
      difficulty: 'medium',
      explanation: `ATOFON connects FMCG sellers to retailers — B2B e-commerce for fast-moving consumer goods.

Key challenges:
• Inventory sync — multiple sellers, stock changes rapidly
• Order flow — decrement inventory → create order → create ledger → send SMS (transactional)
• OTP authentication — Redis-based, 5-minute expiry
• Product catalogue caching — read-heavy, rarely changes

Tech stack: Node.js, MySQL, Redis, AWS SNS for SMS`,
      code: `// ATOFON — Full order flow with transaction
async function placeOrder(buyerId, cartItems) {
  const t = await sequelize.transaction()

  try {
    // 1. Check + decrement inventory atomically
    for (const item of cartItems) {
      const [updated] = await Product.decrement('stock', {
        by: item.quantity,
        where: { id: item.productId, stock: { [Op.gte]: item.quantity } },
        transaction: t
      })
      if (!updated) throw new Error(\`Out of stock: \${item.productId}\`)
    }

    // 2. Create order
    const order = await Order.create({ buyerId, total: calcTotal(cartItems) }, { transaction: t })

    // 3. Create finance ledger entry
    await Ledger.create({ orderId: order.id, type: 'DEBIT', amount: order.total }, { transaction: t })

    await t.commit()

    // 4. Async — push SMS job to queue (outside transaction)
    await smsQueue.add('order-confirmation', { buyerId, orderId: order.id })

    return order
  } catch (err) {
    await t.rollback()
    throw err
  }
}`,
      interviewQ: 'How did you handle inventory race conditions in ATOFON?',
      interviewA: `Two buyers could try to buy the last unit simultaneously. The naive approach — check stock, then decrement — has a race condition window. I used a conditional decrement: UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?. The WHERE clause acts as an optimistic lock. If the update affects 0 rows, stock was insufficient and we throw immediately inside a transaction. This is atomic at the DB level so no race condition.`,
    },
    {
      id: 'system-design-interview',
      title: 'Handling System Design Questions in Interviews',
      difficulty: 'medium',
      explanation: `Framework for any system design question:

1. Clarify requirements (5 min) — scale, features, constraints
2. Estimate scale — users, QPS, storage
3. High-level design — components, data flow
4. Deep dive — DB schema, API design, bottlenecks
5. Identify trade-offs — what you'd improve with more time

Common mistakes: jumping to solution without clarifying, over-engineering, not mentioning trade-offs.`,
      code: `// Design template for any system

// Step 1: Requirements
// Functional: what the system does
// Non-functional: scale, latency, availability

// Step 2: Scale estimation
// 1M users, 10% DAU = 100K active/day
// 100K / 86400 = ~1.2 QPS average, ~12 QPS peak

// Step 3: High level components
// Client → CDN → Load Balancer → API Servers → DB + Cache

// Step 4: Data model
// Candidates table: id, org_id, name, email, status, created_at
// Jobs table: id, org_id, title, description, status
// Applications table: id, candidate_id, job_id, stage, created_at

// Step 5: API design
// POST /candidates → create
// GET  /candidates?status=active → list with filter
// PATCH /candidates/:id/stage → move pipeline stage

// Step 6: Identify bottlenecks + solutions
// DB reads → add index, read replica, Redis cache
// DB writes → connection pool, batch inserts
// API → horizontal scaling, rate limiting`,
      interviewQ: 'How do you approach a system design question you\'ve never seen before?',
      interviewA: `Start by asking clarifying questions — what's the scale, what features actually matter. Then draw the basic components: clients, API servers, DB. I work from simple to complex — first make it work, then make it scale. I always mention the DB schema early because it shows I'm thinking concretely. Then identify the bottleneck — usually reads, so add cache and read replica. The interviewer wants to see that you can reason through trade-offs, not that you memorize the perfect answer.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. How did ARC Parcel handle multi-hub data isolation?', a: `Every table has hub_id as a column. The JWT token contains hub_id and user role. Hub managers can only see their hub's data — every query is scoped to their hub_id. HQ admin has a superadmin role in the token that bypasses hub scoping. This was enforced in a middleware layer so no route handler could accidentally return cross-hub data.` },
    { q: 'Q2. What was the biggest scale challenge in ARC Parcel?', a: `The shipment table hitting 900K records while the report page tried to aggregate all of it. I tackled it in layers: composite indexes on the most common filter columns, MySQL views to pre-define complex joins, server-side pagination so we never pulled all rows, and Redis caching for hub-level stats that didn't need to be real-time. Took report generation from 12 seconds to under 2.` },
    { q: 'Q3. How did TalentFind handle document storage?', a: `All candidate documents — CVs, certificates, ID proofs — went to AWS S3. We never stored files on the API server. The flow: client requests a presigned upload URL from the API, uploads directly to S3 without going through our server, then sends us the S3 key. On download, we generate a presigned read URL with a 1-hour expiry. This keeps our API server stateless and avoids memory pressure from large files.` },
    { q: 'Q4. How did you implement role-based access in TalentFind?', a: `Four roles: SuperAdmin, OrgAdmin, Recruiter, Interviewer. Role is in the JWT payload. We had an ACL middleware that checked route-level permissions — a map of route + method to required role. Interviewers could only see candidates assigned to them. Recruiters could create and move candidates. OrgAdmins could manage users within their org. SuperAdmin could access everything. The middleware ran before route handlers so no business logic needed to check roles.` },
    { q: 'Q5. How did ATOFON handle OTP authentication?', a: `Buyer requests an OTP — we generate a 6-digit code, store it in Redis with a 5-minute TTL keyed by phone number, and send via AWS SNS. On verification, we check Redis for the key, compare the code, delete it on success (so it can't be reused), and issue a JWT. Redis's built-in TTL handles expiry — no cleanup job needed. Rate limited to 3 OTP requests per 10 minutes per phone number.` },
    { q: 'Q6. What would you do differently if rebuilding ARC Parcel today?', a: `A few things. First, start with TypeScript — half our runtime bugs were type errors. Second, use a job queue from day one for heavy operations like PDF report generation instead of blocking the API response. Third, add proper observability — structured logging and a service like Datadog earlier. We were flying blind when things went wrong in production. And write more integration tests — unit tests alone didn't catch the N+1 issues.` },
    { q: 'Q7. How did you handle database migrations in production for ARC?', a: `We used Sequelize CLI migrations — each migration has up and down. Critical rule: never modify an existing migration, always create a new one. For production we had a separate checklist — run migration on staging first, verify rollback works, then apply to UAT, then production. Migrations always ran before the new code deployed so the DB schema was ready when the new code came up.` },
    { q: 'Q8. How did TalentFind handle the interview scheduling feature?', a: `Interviewers have availability slots stored in the DB. When scheduling, we query for available slots that don't conflict with existing scheduled interviews — a time overlap check in SQL. The interviewer sees available windows, picks one, and both get a calendar invite via email. Celery task handles the email async. We also stored Google Calendar event IDs so we could cancel/reschedule by updating the event directly.` },
    { q: 'Q9. What monitoring did you set up for your projects?', a: `In ARC we had PM2's built-in metrics plus basic CloudWatch alarms on EC2 CPU and memory. Error logging with Winston — structured JSON logs that CloudWatch could query. An uptime monitor that pinged /health every minute and alerted on Slack if it went down. Could have been better — no distributed tracing. In a new project I'd add Datadog or Grafana from day one.` },
    { q: 'Q10. How would you design TalentFind to handle 10x the current load?', a: `Current bottleneck would be the PostgreSQL DB. First add a read replica and point all candidate list queries there. Cache the most common dashboard queries in Redis. Move file processing (CV parsing, document validation) to a Celery queue so API stays responsive. Horizontally scale the FastAPI instances behind a load balancer. If the DB is still a bottleneck, partition the candidates table by org_id — most queries are already scoped to one org so cross-partition queries would be rare.` },
  ]
}
