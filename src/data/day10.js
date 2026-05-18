export const day10 = {
  id: 10,
  title: 'Project Deep Dive — ARC Parcel',
  subtitle: 'Everything about ARC: architecture, decisions, challenges, metrics',
  concepts: [
    {
      id: 'arc-overview',
      title: 'ARC Parcel — Full Project Overview',
      difficulty: 'medium',
      explanation: `ARC Parcel is a multi-hub parcel delivery management platform built for a logistics company.

The platform serves three distinct user groups:
• Hub Managers — manage their hub's fleet, routes, and driver operations
• HQ Administrators — oversee all hubs, generate reports, manage finances
• Vehicle Operators / Drivers — receive route assignments, update shipment status

Scale: 15 hubs, 900,000+ shipment records, 200+ active vehicle operators.

Built from scratch — designed the schema, APIs, and frontend.`,
      code: `// Core entities in ARC Parcel

// Hub — regional office
{ id, name, city, region, manager_id, status }

// Vehicle Indent — trip authorization from hub to zone
{ id, hub_id, zone, route_date, vehicle_type, amount, status, driver_id }

// Shipment — individual parcel
{ id, indent_id, tracking_number, sender, recipient, status,
  weight, amount, created_at, delivered_at }

// Commission Record — payment owed to hub/driver
{ id, hub_id, indent_id, driver_id, commission_rate, amount,
  status: 'pending' | 'approved' | 'paid' }

// Key relationships:
// Hub → many Indents → many Shipments
// Indent → Commission record
// Driver → many Indents`,
      interviewQ: 'Tell me about ARC Parcel — what did you build?',
      interviewA: `ARC Parcel is a delivery management system I built for a logistics company — they had 15 hubs across the country and were managing everything with spreadsheets. I built the full platform from scratch: Node.js backend, MySQL database, React frontend. The system covers vehicle indent management (authorizing trips), shipment tracking across the delivery lifecycle, commission calculation for drivers and hubs, and reporting for HQ. I designed the DB schema, built all the APIs, and handled the frontend including complex report views with large datasets.`,
    },
    {
      id: 'arc-tech-decisions',
      title: 'ARC — Technical Decisions & Rationale',
      difficulty: 'medium',
      explanation: `Key technical decisions made in ARC:

1. MySQL over PostgreSQL — client's team was familiar with MySQL, existing infrastructure
2. Sequelize ORM — type-safe queries, migration support, easier than raw SQL for CRUD
3. MySQL Views for reports — complex joins pre-defined, application queries like a table
4. PM2 cluster mode — utilize all CPU cores on the EC2 instance
5. Nginx as reverse proxy — SSL termination, serve static files, proxy to Node
6. Redis for session + caching — hub-level stats cached, sessions stored externally`,
      code: `// Why MySQL Views for report queries

// Option 1: Complex join in every API call
// ❌ Hard to maintain, duplicated across endpoints
async function getCommissionReport(hubId, date) {
  return db.query(\`
    SELECT v.id, v.zone, v.amount, SUM(s.amount) as shipment_total,
           COUNT(s.id) as count, p.rate as commission_rate
    FROM vehicle_indents v
    JOIN shipments s ON s.indent_id = v.id
    JOIN commission_rates p ON p.hub_id = v.hub_id AND p.zone = v.zone
    WHERE v.hub_id = ? AND v.route_date = ?
    GROUP BY v.id
  \`, [hubId, date])
}

// Option 2: MySQL View — define once, query simply
// ✅ Clean, reusable, easier to optimize
CREATE VIEW commission_report_view AS
  SELECT v.id, v.hub_id, v.zone, v.route_date, v.amount,
         SUM(s.amount) as shipment_total, COUNT(s.id) as shipment_count,
         p.rate as commission_rate
  FROM vehicle_indents v
  JOIN shipments s ON s.indent_id = v.id
  JOIN commission_rates p ON p.hub_id = v.hub_id AND p.zone = v.zone
  GROUP BY v.id, v.hub_id, v.zone, v.route_date, v.amount, p.rate;

// Application code becomes simple
async function getCommissionReport(hubId, date) {
  return db.query('SELECT * FROM commission_report_view WHERE hub_id = ? AND route_date = ?', [hubId, date])
}`,
      interviewQ: 'Why did you use MySQL views for the reporting feature?',
      interviewA: `Two reasons. First, the join logic was complex — 5-6 tables involved in commission calculations — and I didn't want to duplicate it across multiple API endpoints. A view gives me one place to define it, and if the business logic changes I update it once. Second, it gave the frontend a clean, predictable schema — they just queried the view like a table and knew exactly what columns to expect. Views also allowed the DBA to optimize the underlying query without changing any application code.`,
    },
    {
      id: 'arc-challenges',
      title: 'ARC — Hardest Challenges Solved',
      difficulty: 'hard',
      explanation: `Challenge 1: Report performance (12s → 1.8s)
• Added composite indexes on (shipment_date, zone_id) and (hub_id, status)
• Used EXPLAIN ANALYZE to identify full table scans
• MySQL views to pre-define complex joins
• Result: 85% reduction in report load time

Challenge 2: Commission calculation accuracy
• Commission rules vary by hub, zone, and vehicle type
• Built a rule engine with priority-based matching
• Used DB transactions to ensure indent + commission always written together

Challenge 3: Multi-hub data isolation
• Hub managers should never see other hubs' data
• hub_id in every query, enforced in middleware from JWT`,
      code: `// Commission rule engine — priority-based matching
async function calculateCommission(indent) {
  // Find the most specific rule that applies
  const rules = await CommissionRule.findAll({
    where: {
      hub_id: { [Op.in]: [indent.hub_id, null] },  // hub-specific or global
      zone: { [Op.in]: [indent.zone, null] },
      vehicle_type: { [Op.in]: [indent.vehicle_type, null] }
    },
    order: [['priority', 'DESC']]  // most specific first
  })

  if (!rules.length) throw new Error('No commission rule found')
  const rule = rules[0]

  return {
    indent_id: indent.id,
    hub_id: indent.hub_id,
    rate: rule.rate,
    amount: indent.amount * rule.rate,
    status: 'pending'
  }
}

// Index strategy that fixed the report
CREATE INDEX idx_shipments_date_zone ON shipments(shipment_date, zone_id);
CREATE INDEX idx_shipments_hub_status ON shipments(hub_id, status);
CREATE INDEX idx_indents_hub_date ON vehicle_indents(hub_id, route_date);`,
      interviewQ: 'What was the N+1 problem you fixed in ARC?',
      interviewA: `In the shipment list page, I was fetching all vehicle indents for a hub, then inside a loop fetching each indent's shipments separately. For 200 indents, that was 201 DB queries per page load. Caught it by logging query counts in development — it was obvious once I saw 200+ queries in the console. Fixed by adding an include in the Sequelize findAll — one JOIN query instead of 200+. Page went from 3 seconds to 200ms. After that I made it a habit to always check query count in Sequelize debug mode when building list views.`,
    },
    {
      id: 'arc-frontend',
      title: 'ARC — Frontend Architecture',
      difficulty: 'medium',
      explanation: `Frontend: React.js with Redux for state management.

Key frontend challenges:
• Large data tables — 900K shipment records, needed server-side pagination
• Complex forms — vehicle indent creation with dynamic fields based on vehicle type
• Role-based UI — hub managers see different views than HQ admin
• Report exports — CSV/PDF generation for commission and payment reports`,
      code: `// Server-side paginated shipment table
const ShipmentTable = () => {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['shipments', page, filters],
    queryFn: () => api.getShipments({ page, limit: 50, ...filters })
  })

  return (
    <div>
      <FilterBar onChange={setFilters} />
      <table>
        {data?.shipments.map(s => <ShipmentRow key={s.id} shipment={s} />)}
      </table>
      <Pagination
        current={page}
        total={data?.total}
        pageSize={50}
        onChange={setPage}
      />
    </div>
  )
}

// Role-based navigation
const Sidebar = () => {
  const { user } = useSelector(state => state.auth)

  return (
    <nav>
      {user.role === 'HQ_ADMIN' && <NavItem to="/reports">Reports</NavItem>}
      {user.role === 'HQ_ADMIN' && <NavItem to="/all-hubs">All Hubs</NavItem>}
      <NavItem to="/indents">Vehicle Indents</NavItem>
      <NavItem to="/shipments">Shipments</NavItem>
      {['HQ_ADMIN', 'HUB_MANAGER'].includes(user.role) && (
        <NavItem to="/commission">Commission</NavItem>
      )}
    </nav>
  )
}`,
      interviewQ: 'How did you handle the 900K shipment records on the frontend?',
      interviewA: `Never loaded more than 50 records at a time. Server-side pagination with LIMIT/OFFSET in the API — the UI sends page number and active filters, API returns 50 records and a total count. For the table rows I used React.memo so individual rows didn't re-render when unrelated state changed. Export to CSV was done server-side too — the API generated the file and streamed it back rather than sending all data to the browser to process. This kept the UI fast regardless of how many records were in the DB.`,
    },
    {
      id: 'arc-deployment',
      title: 'ARC — DevOps & Deployment',
      difficulty: 'medium',
      explanation: `Deployment stack:
• AWS EC2 (t3.medium) — app server
• MySQL on AWS RDS — managed DB with automated backups
• Redis on AWS ElastiCache — session and cache
• AWS S3 — document storage
• Nginx — reverse proxy, SSL, serve React build
• PM2 — process management, cluster mode, auto-restart
• GitLab CI/CD — test → build → deploy on merge to main`,
      code: `# GitLab CI/CD pipeline
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - npm install
    - npm test

build:
  stage: build
  script:
    - npm run build
    - docker build -t arc-api .
    - docker push $CI_REGISTRY/arc-api:$CI_COMMIT_SHA

deploy:
  stage: deploy
  only:
    - main
  script:
    - ssh ec2-user@$EC2_HOST "
        docker pull $CI_REGISTRY/arc-api:$CI_COMMIT_SHA &&
        pm2 reload arc-api --update-env &&
        echo 'Deploy complete'
      "

# PM2 ecosystem config
module.exports = {
  apps: [{
    name: 'arc-api',
    script: 'server.js',
    instances: 'max',  // one per CPU core
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}`,
      interviewQ: 'How did you set up CI/CD for ARC Parcel?',
      interviewA: `GitLab pipelines with three stages — test, build, deploy. On every merge to main, it ran the test suite, built a Docker image, pushed to GitLab Container Registry, then SSHed into the EC2 instance and did a rolling reload with PM2. PM2's reload command does a graceful restart — it spins up new workers before killing old ones, so there was zero downtime during deploys. Database migrations ran as a separate step before the app reload, with a flag to skip them if nothing changed.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. What is ARC Parcel and what problem does it solve?', a: `It's a delivery management platform for a logistics company with 15 hubs. Before this, they tracked everything in spreadsheets — vehicle assignments, shipment status, commission calculations, payments. I built a centralized system where each hub manages their operations digitally, HQ gets real-time visibility across all hubs, and commission calculations that took days now happen automatically.` },
    { q: 'Q2. What was the tech stack for ARC?', a: `Node.js with Express for the backend, React with Redux for the frontend, MySQL on AWS RDS, Redis on ElastiCache, AWS S3 for documents, Nginx as reverse proxy, PM2 for process management, Docker and GitLab CI/CD for deployment. The whole thing runs on a t3.medium EC2 instance with PM2 in cluster mode to use all cores.` },
    { q: 'Q3. How did you design the database schema for ARC?', a: `Core tables: hubs, vehicle_indents (trip authorizations), shipments (individual parcels), commission_rules, commission_records, and users. Shipments belong to indents, indents belong to hubs. Commission rules have hub/zone/vehicle_type combinations with a priority system — more specific rules win. I used foreign keys throughout and added composite indexes on the most common filter combinations after profiling slow queries.` },
    { q: 'Q4. How did you handle authentication and authorization in ARC?', a: `JWT for auth — access token (15 min) and refresh token (7 days). Three roles: HQ_ADMIN, HUB_MANAGER, OPERATOR. Role is in the JWT payload. Middleware checks role for protected routes. Hub managers have their hub_id in the token too — every query is scoped to that hub_id, enforced in middleware. HQ admins get all hubs. Operators can only view their own routes and update shipment status.` },
    { q: 'Q5. What were the commission calculation rules?', a: `Rules were based on hub, zone, and vehicle type — a truck delivering to Zone A from Hub Chennai gets a different rate than a bike delivery in Zone B from Hub Mumbai. We built a rule table with priority scoring — hub-specific + zone-specific + vehicle-specific rule wins over generic rules. The calculation happened as part of the indent creation transaction so commission records were always in sync with trip records.` },
    { q: 'Q6. How did you implement the PDF report generation?', a: `Server-side, using Puppeteer. The API received report parameters, fetched data from the DB (including the MySQL view for commission data), rendered an HTML template, and used Puppeteer to generate the PDF. Returned as a binary stream with appropriate Content-Type headers. The frontend just opened it in a new tab. Generating PDFs in the browser is unreliable for complex layouts — doing it server-side meant consistent output.` },
    { q: 'Q7. Did ARC Parcel have any real-time features?', a: `Shipment status updates were near-real-time via polling — operators updated status on their mobile interface, hub managers saw it refresh every 30 seconds on their dashboard. We considered WebSockets but polling was simpler and sufficient — status changes aren't second-by-second events. The dashboard cached hub stats in Redis for 5 minutes so the polling didn't hammer the DB.` },
    { q: 'Q8. What was the hardest bug you debugged in ARC?', a: `Commission records getting created twice for some indents. Took two days to find. The indent creation endpoint was being called twice due to a retry on the frontend — a 500 error was being retried automatically. The DB transaction created the indent and commission record together, but a bug in the commission calculation caused a JS error after the DB commit, so the API returned 500 even though the DB write succeeded. Frontend retried, created a duplicate. Fixed by adding idempotency — check if commission record already exists before creating, and fixing the calculation error.` },
    { q: 'Q9. How did you handle the mobile interface for operators?', a: `Responsive web app — operators used their phones to access the same application. I used React with mobile-first breakpoints, large touch targets for the status update buttons, and simplified the operator view to just show their assigned indents and shipments for the day. The most common action — updating shipment status — was a single tap. We tested on actual Android phones used in the field.` },
    { q: 'Q10. What would you improve about ARC Parcel if you had more time?', a: `TypeScript from the start — we had runtime type bugs that TS would have caught. Real-time notifications when a shipment's status changes using WebSockets or Server-Sent Events. Better observability — structured logging with correlation IDs so I could trace a request across all services. And automated testing coverage was low — mostly manual testing. I'd add integration tests for the critical commission calculation and payment flows.` },
  ]
}
