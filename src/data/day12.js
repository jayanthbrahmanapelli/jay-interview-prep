export const day12 = {
  id: 12,
  title: 'Behavioural Questions',
  subtitle: 'STAR method, leadership, conflict, growth — all the HR rounds',
  concepts: [
    {
      id: 'star-method',
      title: 'STAR Method — How to Structure Every Answer',
      difficulty: 'easy',
      explanation: `STAR = Situation, Task, Action, Result.

Every behavioural question gets this structure:
• Situation: context — what was happening, what was the project, who was involved
• Task: what was your specific role or responsibility
• Action: what YOU specifically did (not "we") — the choices you made
• Result: quantified outcome — time saved, bugs fixed, team impact

Keep it to 2-3 minutes. Lead with the result if it's impressive. Practice out loud — not in your head.`,
      code: `// STAR Template (fill in for each question)

Situation:
  "At [Company], we were building [feature/project].
   The context was [what was happening]."

Task:
  "My responsibility was to [specific role/ownership].
   The challenge was [what made it hard]."

Action:
  "I [specific action 1].
   Then I [specific action 2].
   I chose this approach because [reasoning]."

Result:
  "This resulted in [quantified outcome].
   The team / client [impact on others]."

// Common mistakes:
// ❌ "We did X" — use "I" for your actions
// ❌ No numbers — always quantify if possible
// ❌ Too long — stay under 3 minutes
// ❌ Skipping the result — that's the most important part`,
      interviewQ: 'How do you prepare for behavioural interviews?',
      interviewA: `I list out 6-8 stories from my real experience that cover the main categories — a technical challenge, a conflict, a time I led something, a failure, a time I had to learn fast. Then I map each story to STAR and practice saying it out loud. Most behavioural questions are variations of the same themes, so 8 good stories covers 90% of what gets asked. I also make sure each story has a number in the result — "40% faster", "reduced to 2 seconds" — because vague results don't stick.`,
    },
    {
      id: 'technical-challenges',
      title: 'Technical Challenge Stories',
      difficulty: 'medium',
      explanation: `Stories for: "Tell me about a hard technical problem you solved"

Your strongest stories from real projects:
1. ARC report performance: 12s → 2s with indexes + MySQL views
2. ARC N+1 query: 800 queries → 1 per page load
3. ATOFON race condition: atomic inventory decrement
4. TalentFind dual-session: session tracking in DB
5. ARC duplicate commission: idempotency fix

Structure each one with what you tried first, why it didn't work, what you learned, what actually fixed it.`,
      code: `// Story 1: Report Performance (best technical story)
// S: ARC Parcel commission report taking 12+ seconds
// T: My job to make it usable for hub managers
// A:
//   1. Added EXPLAIN ANALYZE — found full table scans
//   2. Added composite index on (shipment_date, zone_id)
//   3. Moved join logic into MySQL view
// R: 12s → 1.8s, 85% improvement

// Story 2: N+1 Query (show debugging skills)
// S: Shipment list page slow, users complaining
// T: Diagnose and fix
// A:
//   1. Enabled Sequelize query logging
//   2. Saw 200+ queries per page load
//   3. Added eager loading with include
// R: 800+ queries → 1, page load 3s → 200ms

// Story 3: Race Condition (show CS fundamentals)
// S: ATOFON — two buyers ordering last item simultaneously
// T: Ensure inventory is always accurate
// A: Changed from read-check-update to atomic conditional UPDATE
//    WHERE stock >= quantity (DB enforces atomicity)
// R: Zero oversell incidents in production`,
      interviewQ: 'Tell me about the hardest technical problem you\'ve solved.',
      interviewA: `The commission report in ARC Parcel. It was joining 6 tables across 900K shipment records and taking 12 seconds. Hub managers needed it daily — 12 seconds was unusable. I ran EXPLAIN ANALYZE and found it was doing full table scans on shipment_date and zone_id. Added a composite index on those two columns — that got it to 4 seconds. Then moved the entire join logic into a MySQL view so the query became simple. That got it to 1.8 seconds. The view also had a side benefit: if the business logic changed, I updated one place instead of hunting through application code. 85% improvement, managers stopped complaining.`,
    },
    {
      id: 'conflict-teamwork',
      title: 'Conflict & Teamwork Stories',
      difficulty: 'medium',
      explanation: `Common questions:
• "Tell me about a conflict with a teammate"
• "Tell me about a time you disagreed with your manager"
• "How do you handle a team member not meeting deadlines"

Key principles:
• Never speak badly of the other person
• Focus on the situation, not the person
• Show that you sought to understand their perspective
• Show the resolution was collaborative, not you "winning"`,
      code: `// Story: Disagreement on technical approach
// S: Team wanted to build a feature with direct API polling every 2s
// T: I had concerns about server load and battery drain on mobile
// A:
//   1. Raised concern in the sprint planning — backed with data
//      (polling 2s × 500 users = 250 req/s constant load)
//   2. Proposed WebSocket or longer polling interval as alternatives
//   3. Agreed to prototype both and measure
// R: Adopted 30s polling interval as compromise
//    Server load 10x lower than original proposal
//    Feature shipped on time

// Key: you didn't "win" — you found a better solution together

// Story: Teammate missing deadlines
// S: Backend teammate consistently missing sprint commitments
// T: As the person depending on their APIs, this was blocking me
// A:
//   1. Had a direct, private conversation — asked if there were blockers
//   2. Turned out they were unclear on requirements
//   3. We started daily 15-min syncs to unblock faster
// R: Delivery improved next sprint, no escalation needed`,
      interviewQ: 'Tell me about a time you disagreed with a technical decision.',
      interviewA: `In TalentFind, the initial plan was to store all candidate documents in the database as BLOBs. I disagreed — large BLOBs slow down every DB operation, backups become huge, and it doesn't scale. I made the case with concrete numbers: 200 candidates × 3 documents × 2MB each = 1.2GB in the DB just to start. Proposed S3 with presigned URLs instead — same developer experience, proper file storage. The team agreed after seeing the numbers. We built it with S3 and never hit file storage issues. The lesson was: come with data, not just opinions.`,
    },
    {
      id: 'leadership-initiative',
      title: 'Leadership & Initiative Stories',
      difficulty: 'medium',
      explanation: `Questions: "Tell me about a time you took initiative", "Describe a time you led without authority"

Good stories:
• Identifying and fixing a problem no one asked you to
• Proposing a better approach and getting buy-in
• Mentoring a junior teammate
• Setting up a process that improved the team

You don't need a manager title to show leadership. Proposing solutions, owning problems to completion, and helping teammates are all leadership.`,
      code: `// Story: Set up CI/CD without being asked
// S: ARC Parcel — deployments were manual, scary, inconsistent
// T: Not formally my job — I was a developer, not DevOps
// A:
//   1. Identified the risk — manual deploys meant human error
//   2. Researched GitLab CI/CD on my own time
//   3. Set up pipeline: test → build Docker → deploy to EC2
//   4. Walked the team through it
// R: Zero failed deploys post-pipeline
//    Deploy time: 40 minutes manual → 8 minutes automated
//    Team had confidence to deploy more frequently

// Story: Identified and fixed a security gap
// S: Noticed JWT tokens weren't being invalidated on logout
// T: This meant stolen tokens could be used indefinitely
// A:
//   1. Raised with team lead, explained the risk
//   2. Designed token blacklisting using Redis
//   3. Built and shipped it in one sprint
// R: Security gap closed, no incidents`,
      interviewQ: 'Tell me about a time you took initiative beyond your role.',
      interviewA: `In ARC Parcel, I noticed our deployments were fully manual — someone would SSH in, pull the code, run migrations, restart PM2. One wrong command and production was down. I set up a GitLab CI/CD pipeline completely on my own — not part of any sprint, just something I identified as a risk and fixed. Test → Docker build → deploy on merge to main. Took me a weekend to get right. After that, deploys went from 40 minutes of nerve-wracking manual work to 8-minute automated pipeline. Team started deploying twice as often because they weren't afraid of it anymore.`,
    },
    {
      id: 'failure-growth',
      title: 'Failure & Growth Stories',
      difficulty: 'medium',
      explanation: `"Tell me about a failure" is a trap many people avoid by giving a fake failure. Interviewers see through it.

Give a real failure. What matters is:
• You take ownership — not "the requirements were unclear"
• You learned something specific
• You applied that learning afterward

Good failure stories: shipping a bug to production, underestimating complexity, miscommunicating with a stakeholder, not asking for help soon enough.`,
      code: `// Story: Bug in production (real failure)
// S: ATOFON — deployed order flow, commission records duplicating
// T: Found it in production 2 days later
// A:
//   1. Took immediate ownership — didn't hide or blame
//   2. Fixed the duplicate records in the DB
//   3. Fixed the root cause (missing idempotency + JS error)
//   4. Added monitoring for commission record count
//   5. Wrote a post-mortem with what I'd do differently
// R: No recurrence, added idempotency to all critical writes

// What I learned:
// - Always add idempotency to financial write operations
// - A 500 response doesn't mean the write failed
// - Client retries are expected — design for them
// - Test retry scenarios explicitly`,
      interviewQ: 'Tell me about a time you failed. What did you learn?',
      interviewA: `In ATOFON, a bug I shipped created duplicate commission records — commission was being paid twice for some orders. I found it two days after deploy during a routine check, not through monitoring, which was embarrassing. The root cause was two things: a JS error after a successful DB write was returning 500, causing the client to retry, and I hadn't added idempotency to commission creation. I took ownership immediately, fixed the data, fixed the code. The learning that stuck: never assume a 500 means the write failed. Design for client retries. Since then every financial write I build has idempotency built in from the start.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. Why are you looking for a new opportunity?', a: `I've learned a lot from building ARC and contributing to TalentFind — full-stack ownership, production systems, real performance problems. I'm at a point where I want to work on larger-scale systems and with stronger engineering teams where I can grow faster. I'm looking for a role where I can go deeper technically, not just wider.` },
    { q: 'Q2. Where do you see yourself in 3 years?', a: `Leading technically in a product area — owning architecture decisions, mentoring junior developers, and being someone the team looks to when a hard problem comes up. I'm not chasing a manager title specifically, but I want to be someone who shapes how the team builds things, not just someone who executes tickets.` },
    { q: 'Q3. What is your biggest strength?', a: `Owning things end to end. I'm comfortable going from a blank schema to a deployed feature — backend, frontend, DB, DevOps. That's where I've created the most value — projects where someone needs to drive from concept to production, not just implement a spec. I also debug faster than most — I enjoy the detective work of finding why something breaks.` },
    { q: 'Q4. What is your biggest weakness?', a: `I tend to dive into implementation before fully documenting the design. It's worked on smaller teams but doesn't scale — when I came back to code I wrote 3 months ago, I sometimes had to re-derive why I made a decision. I've been getting better at writing technical decisions down in comments or PR descriptions before starting the build.` },
    { q: 'Q5. Tell me about a time you had to learn something quickly.', a: `When we decided to use FastAPI for TalentFind, I'd only done Node.js backends. I had 2 weeks before I was supposed to deliver the first set of APIs. I did the FastAPI tutorial in 2 days, built a small prototype, then started building real features while learning. The Pydantic validation model was the trickiest concept — took me 3-4 real attempts to really get how nested models work. Delivered the first set of APIs on time.` },
    { q: 'Q6. How do you handle tight deadlines?', a: `Break it into the absolute minimum that delivers value, and cut everything else. In ARC, we had a client demo in a week and I was behind on the report feature. I shipped the basic report — correct data, basic table, export to CSV. No filters, no date range picker, no PDF. Came back and added those in the next sprint. Hitting the demo date with 80% of the feature beats missing the deadline with 100%.` },
    { q: 'Q7. Describe your ideal work environment.', a: `Small to medium team where I have real ownership — not just implementing tickets but participating in technical decisions. A team that does code reviews and has engineering standards, not cowboy coding. Some async communication is fine, but enough synchronous time that collaboration actually happens. I work best when there's a clear product direction and I can focus for stretches without constant context switching.` },
    { q: 'Q8. How do you manage your time across multiple tasks?', a: `I timebox. Every day starts with deciding the top 2 things that need to happen. Deep work in the morning — code, architecture, anything that needs concentration. Meetings and async comms in the afternoon. If something is blocked, I switch to the next priority rather than sitting stuck. For longer projects, I break them into weekly milestones and check if I'm on track. If I'm not, I surface it early rather than at the deadline.` },
    { q: 'Q9. Tell me about a time you received difficult feedback.', a: `My tech lead told me my code was hard to follow — variable names were too short, no comments on non-obvious logic, functions doing too many things. It stung because I thought it was clean. But I asked for specific examples and realized they were right — I was optimizing for brevity at the cost of readability. Started naming variables for what they represent, not just type. Added comments explaining why, not what. The next code review was significantly cleaner.` },
    { q: 'Q10. What motivates you?', a: `Shipping things that get used. The moment someone tells me a feature I built made their job faster — that's the thing. Also hard technical problems. When something is broken and I can't immediately see why — that keeps me engaged in a way routine work doesn't. And I like seeing a project evolve — starting from a blank DB schema and ending up with something a real business runs on is genuinely satisfying.` },
  ]
}
