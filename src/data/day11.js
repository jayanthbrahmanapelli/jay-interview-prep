export const day11 = {
  id: 11,
  title: 'Project Deep Dive — TalentFind + ATOFON',
  subtitle: 'Architecture, decisions, and challenges from both projects',
  concepts: [
    {
      id: 'talentfind-overview',
      title: 'TalentFind — Full Project Overview',
      difficulty: 'medium',
      explanation: `TalentFind is a B2B recruitment platform used by HR teams and staffing agencies.

What it does:
• Candidate pipeline management — track candidates through interview stages
• Job posting and management — create JDs, assign recruiters
• Document management — CV, certificates stored on S3
• Interview scheduling — calendar-based, conflict detection
• Dual-session prevention — only one active login per user
• Multi-tenant — each organisation's data is isolated

Built with FastAPI (Python) + Vue 3 + PostgreSQL + Redis + AWS S3.`,
      code: `// TalentFind — User roles and permissions
// SuperAdmin — platform admin, sees all orgs
// OrgAdmin — manages their organisation, users, and jobs
// Recruiter — manages candidates, moves pipeline
// Interviewer — views assigned candidates, submits feedback

// Data model overview
Organisations { id, name, subscription_plan, settings }
Users { id, org_id, role, name, email, last_session_id }
Jobs { id, org_id, title, description, status, created_by }
Candidates { id, org_id, name, email, phone, current_stage }
JobApplications { id, job_id, candidate_id, stage, assigned_recruiter }
Interviews { id, application_id, interviewer_id, scheduled_at, status }
Documents { id, candidate_id, type, s3_key, uploaded_at }

// Pipeline stages
// Applied → Screening → Technical → HR Round → Offer → Hired / Rejected`,
      interviewQ: 'What is TalentFind and what did you build?',
      interviewA: `TalentFind is a recruitment platform — think a simplified version of Greenhouse or Lever but for mid-sized Indian companies. I built it with a team of 3. My responsibilities were the FastAPI backend, Vue 3 frontend, and the full auth system including the dual-session prevention feature. Key things I'm proud of: the multi-tenant data isolation, the document management flow using S3 presigned URLs, and the interview scheduling with conflict detection.`,
    },
    {
      id: 'talentfind-dual-session',
      title: 'TalentFind — Dual Session Prevention',
      difficulty: 'hard',
      explanation: `Business requirement: a user can only be logged in on one device at a time. If they log in from a new device, they see a modal showing the existing session's device info and must confirm to force-logout the other session.

Implementation:
1. On login, check DB for existing active session
2. If found, return has_existing_session: true with device info
3. Frontend shows confirmation modal
4. User confirms → backend invalidates old session, creates new one
5. Old device's next request fails auth (session ID mismatch)`,
      code: `# FastAPI — dual session logic
from fastapi import HTTPException
from uuid import uuid4

async def login(credentials: LoginSchema, db: Session, request: Request):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Check for existing session
    existing_session = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_active == True
    ).first()

    if existing_session and not credentials.force_login:
        return {
            "has_existing_session": True,
            "device_info": existing_session.device_info,
            "session_id": existing_session.id
        }

    # Force login — invalidate existing session
    if existing_session:
        existing_session.is_active = False
        db.commit()

    # Create new session
    session_id = str(uuid4())
    device_info = parse_device(request.headers.get("User-Agent"))

    new_session = UserSession(
        user_id=user.id,
        session_id=session_id,
        device_info=device_info,
        is_active=True
    )
    db.add(new_session)
    db.commit()

    # JWT contains session_id — checked on every request
    token = create_token({"user_id": user.id, "session_id": session_id})
    return {"access_token": token}`,
      interviewQ: 'How did you implement dual session prevention — walk me through it end to end.',
      interviewA: `When a user logs in, we query the sessions table for any active session with their user ID. If we find one, we return has_existing_session: true along with the device info so the frontend can show "You're already logged in on iPhone 14 — continue?" in a modal. If they confirm, the frontend resends with force_login: true. Backend marks the old session as inactive and creates a new one. The JWT contains the session ID. On every request, our auth middleware checks: does the session_id in the token match the current active session in the DB? If the user's other device sends a request after being logged out, its session ID is now inactive — 401, redirected to login. Clean and simple.`,
    },
    {
      id: 'talentfind-s3-documents',
      title: 'TalentFind — Document Management with S3',
      difficulty: 'medium',
      explanation: `All candidate documents (CVs, certificates, ID proofs) stored on AWS S3.

Flow for upload:
1. Client requests presigned upload URL from API
2. API generates a presigned S3 PUT URL (valid 5 minutes)
3. Client uploads directly to S3 using that URL
4. Client notifies API with the S3 key
5. API stores the document record in DB

Flow for download:
1. Client requests document download
2. API generates a presigned GET URL (valid 1 hour)
3. Client downloads directly from S3

Benefits: API server never handles file bytes, no memory pressure, files don't traverse our servers.`,
      code: `# Generate presigned upload URL
import boto3
from uuid import uuid4

s3 = boto3.client('s3')

@app.post("/candidates/{candidate_id}/documents/upload-url")
async def get_upload_url(
    candidate_id: int,
    file_name: str,
    file_type: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify candidate belongs to user's org
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.org_id == current_user.org_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404)

    # Generate unique S3 key
    s3_key = f"org/{current_user.org_id}/candidates/{candidate_id}/{uuid4()}/{file_name}"

    # Presigned URL — valid for 5 minutes
    upload_url = s3.generate_presigned_url(
        'put_object',
        Params={'Bucket': 'talentfind-docs', 'Key': s3_key, 'ContentType': file_type},
        ExpiresIn=300
    )

    return {"upload_url": upload_url, "s3_key": s3_key}

@app.post("/candidates/{candidate_id}/documents")
async def save_document(candidate_id: int, s3_key: str, doc_type: str, db: Session = Depends(get_db)):
    doc = Document(candidate_id=candidate_id, s3_key=s3_key, doc_type=doc_type)
    db.add(doc)
    db.commit()
    return doc`,
      interviewQ: 'Why use presigned URLs instead of uploading through your API?',
      interviewA: `Three reasons. First, performance — the API server never touches the file bytes, so no memory spikes on large CVs. Second, scalability — if we're handling 1,000 concurrent uploads, they all go directly to S3, not through our API servers. Third, cost — we're not paying for bandwidth on files going through EC2. The only thing our API does is generate the URL and store the S3 key. S3 is designed for this — it's orders of magnitude more scalable for file storage than any API server we'd run.`,
    },
    {
      id: 'atofon-overview',
      title: 'ATOFON — B2B E-Commerce Platform',
      difficulty: 'medium',
      explanation: `ATOFON is a B2B marketplace connecting FMCG sellers (distributors) to retailers (kirana stores, small shops).

What it does:
• Sellers list products with pricing and inventory
• Retailers browse by zone/area, add to cart, place orders
• OTP-based authentication for retailers (no password needed)
• Order lifecycle: placed → confirmed → dispatched → delivered
• Finance ledger — credits and debits per order per seller
• SMS notifications at each status change via AWS SNS

Built with Node.js + MySQL + Redis (OTP + cache) + AWS SNS.`,
      code: `// ATOFON — Key entities

Sellers { id, name, gst_number, zone_ids, bank_details, status }
Products { id, seller_id, name, sku, category, price, stock, min_order_qty }
Buyers { id, name, phone, address, zone_id, credit_limit }
Orders { id, buyer_id, seller_id, status, total, created_at }
OrderItems { id, order_id, product_id, quantity, price_at_order }
Ledger { id, seller_id, order_id, type: 'CREDIT'|'DEBIT', amount, created_at }

// OTP auth flow
// 1. Buyer enters phone number
// 2. API generates 6-digit OTP, stores in Redis with 5-min TTL
// 3. SNS sends OTP via SMS
// 4. Buyer enters OTP → verified → JWT issued
// 5. OTP deleted from Redis (can't reuse)`,
      interviewQ: 'What is ATOFON and what problem does it solve?',
      interviewA: `ATOFON digitizes the supply chain between FMCG distributors and small retailers. Before this, retailers would call the distributor's salesperson to place orders — lots of manual work, errors in order taking, no visibility. ATOFON gives retailers a mobile-friendly interface to browse products and place orders anytime. Sellers get real-time inventory management and automated finance tracking. I built the core ordering system, OTP auth, product catalogue, and the finance ledger.`,
    },
    {
      id: 'atofon-ordering',
      title: 'ATOFON — Order Flow & Inventory Management',
      difficulty: 'hard',
      explanation: `The order flow is the heart of ATOFON. It must be atomic — you can't have:
• An order without inventory decremented
• A ledger entry without an order
• A half-created order

Solution: database transactions wrapping the entire flow.

Inventory race condition: two buyers ordering the last unit simultaneously. Solution: conditional decrement at DB level (not check-then-update, but atomic update with condition).`,
      code: `// Atomic order placement — full transaction
async function placeOrder(buyerId, items) {
  const t = await sequelize.transaction({ isolationLevel: 'READ COMMITTED' })

  try {
    // 1. Validate & decrement inventory atomically
    for (const item of items) {
      const [updatedRows] = await sequelize.query(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ? AND status = "active"',
        { replacements: [item.qty, item.productId, item.qty], transaction: t }
      )
      if (updatedRows === 0) {
        throw new Error(\`Insufficient stock for product \${item.productId}\`)
      }
    }

    // 2. Create order
    const order = await Order.create({
      buyer_id: buyerId,
      total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
      status: 'PLACED'
    }, { transaction: t })

    // 3. Create order items
    await OrderItem.bulkCreate(
      items.map(i => ({ order_id: order.id, product_id: i.productId, quantity: i.qty, price: i.price })),
      { transaction: t }
    )

    // 4. Create ledger entry for seller
    await Ledger.create({
      seller_id: items[0].sellerId,
      order_id: order.id,
      type: 'CREDIT',
      amount: order.total
    }, { transaction: t })

    await t.commit()

    // 5. Async — send SMS (outside transaction, non-critical)
    await smsQueue.add('order-placed', { buyerId, orderId: order.id })

    return order
  } catch (err) {
    await t.rollback()
    throw err
  }
}`,
      interviewQ: 'How did you handle the case where two buyers try to buy the last item simultaneously?',
      interviewA: `Classic race condition. If I check stock first and then decrement, there's a window where both buyers pass the check but only one should get the item. The fix is to make the check and decrement a single atomic operation at the DB level: UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?. The WHERE clause with the stock check means only one of the concurrent updates succeeds — the other gets 0 rows affected and we throw an out-of-stock error and rollback. No separate lock needed, the DB handles it.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. Why did TalentFind use FastAPI instead of Express?', a: `The team was already using Python for some data processing work, so FastAPI let us unify the backend language. The automatic Swagger docs were a big win — frontend team didn't need separate API documentation. Pydantic models handled request validation automatically, saving a lot of boilerplate. Async support is first-class in FastAPI. For a domain with complex nested data shapes like recruitment, Pydantic's model validation was very useful.` },
    { q: 'Q2. How did TalentFind handle multi-tenancy?', a: `Shared database, isolated by org_id. Every table has org_id. The JWT token contains org_id, extracted by auth middleware and added to the request context. Every query is automatically scoped — the middleware layer enforces it so individual route handlers don't have to remember. We also added PostgreSQL row-level security as a safety net. SuperAdmin tokens are separate and explicitly bypass org scoping.` },
    { q: 'Q3. What was the interview scheduling feature in TalentFind?', a: `Interviewers set their availability as weekly recurring slots. When a recruiter schedules an interview, the system checks available slots and shows options that don't conflict with existing bookings. Conflict detection is a SQL query: find slots where no scheduled interview overlaps with the requested time window. On confirmation, both parties get an email with calendar invite. Celery handled the email sending async so the API response was immediate.` },
    { q: 'Q4. How did ATOFON handle OTP authentication?', a: `Buyer enters phone number, we generate a random 6-digit OTP and store it in Redis keyed by phone number with a 5-minute TTL. AWS SNS sends the OTP via SMS. When buyer submits OTP, we check Redis — if found and matches, we delete it (single use) and issue a JWT. If Redis key expired, OTP is gone — buyer has to request again. Redis handles expiry automatically. Rate limited to 3 OTP requests per 10 minutes per number.` },
    { q: 'Q5. How did you cache product data in ATOFON?', a: `Product catalogue is read-heavy — retailers browse constantly but sellers don't update prices every minute. Cache-aside pattern: on a product list request, check Redis first. Cache miss: fetch from DB, store in Redis with 30-minute TTL. On any product update by the seller, invalidate the cache key for that seller's products. Took the product listing API from 400ms to under 20ms for cache hits. The seller-scoped cache key meant one seller's update only invalidated their products, not everyone's.` },
    { q: 'Q6. What was the finance ledger in ATOFON?', a: `Every order creates a CREDIT entry for the seller. Returns and cancellations create DEBIT entries. The ledger is append-only — we never update or delete entries, only add new ones. Current balance is always the sum of all entries. This gives complete audit history. Month-end settlement is just summing all CREDIT minus DEBIT for the period. Immutable financial records are a best practice — much safer than updating a running balance.` },
    { q: 'Q7. What was a bug that made it to production in either project?', a: `In ATOFON, duplicate commission records were being created. The order endpoint was getting retried by the client on timeout — the DB transaction committed successfully but a JS error afterward caused a 500 response. Client saw 500 and retried. Second call found the order already existed but the idempotency check was missing for commission records, so it created a second one. Fixed by adding idempotency on order_id before creating commission entries, and fixing the original JS error.` },
    { q: 'Q8. How did you handle file size limits for CV uploads in TalentFind?', a: `Two layers. First, the presigned URL is scoped — we set Content-Length-Range in S3 bucket policy to reject uploads above 10MB. So even if someone bypasses the frontend validation, S3 rejects the upload. Second, frontend validation checks file size and type before even requesting the presigned URL. We also stored the file size in the Documents table so we could show it in the UI and enforce storage quotas per organisation.` },
    { q: 'Q9. What monitoring did ATOFON have in production?', a: `Basic CloudWatch alarms on EC2 CPU and RDS connections. PM2 with auto-restart on crash and Slack notification on restart via PM2-slack hook. A UptimeRobot monitor pinging /health every minute. Error logging with Winston writing structured JSON logs. For the SMS queue we monitored queue depth — if it grew beyond 100 items, it likely meant the worker was stuck and we'd get an alert. Would add proper distributed tracing in a rebuild.` },
    { q: 'Q10. What would you improve about TalentFind?', a: `The pipeline stage transitions needed more structure — currently any recruiter can move a candidate to any stage. Should have been a state machine with defined valid transitions. Also, the interview scheduling had no timezone handling — all times stored as IST, which worked for the current users but would break for any international use. And I'd add end-to-end tests for the auth flow and dual-session logic — those were only manually tested which made me nervous about regressions.` },
  ]
}
