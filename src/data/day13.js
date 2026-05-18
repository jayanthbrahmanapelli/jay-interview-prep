export const day13 = {
  id: 13,
  title: 'HR + Salary Negotiation',
  subtitle: 'Offer evaluation, counter-offers, notice period, negotiation scripts',
  concepts: [
    {
      id: 'salary-research',
      title: 'Research Your Market Value',
      difficulty: 'easy',
      explanation: `Know your number before any conversation. Research from multiple sources:

• Glassdoor, LinkedIn Salary, AmbitionBox — role + location + years
• Levels.fyi — for product companies and startups (more accurate)
• Talk to people in similar roles at similar companies
• Factor in: base salary, variable pay, ESOPs, benefits

For a 3-year full-stack developer in Bangalore (2026 benchmark):
• Service companies (TCS, Wipro, Infosys): 8-15 LPA
• Product startups: 15-28 LPA
• Mid-size product companies: 18-30 LPA
• Target range: 18-22 LPA as a strong full-stack with 3 projects`,
      code: `// Salary calculation framework

// Current CTC breakdown (understand what you have)
Base: 10,00,000
Variable (bonus): 1,00,000 (10% of base)
PF (employer): 21,600
Insurance: 50,000
// Total CTC: ~11,71,600

// Target calculation (18 LPA ask)
Base: 15,00,000  // 15 LPA base is clean to negotiate on
Variable: 2,00,000  // ~13% variable
Benefits: 1,00,000
// Total: 18 LPA

// Hike percentage
// (Target - Current) / Current × 100
// (18 - 12) / 12 × 100 = 50% hike

// Note: hike percentage matters less than market rate
// If market pays 18 and you're at 12, 50% hike is justified`,
      interviewQ: 'How did you arrive at your expected salary?',
      interviewA: `I researched Glassdoor, LinkedIn Salary, and AmbitionBox for full-stack developers with 4 years of experience in Bangalore with a similar stack — Node.js, React, Vue, PostgreSQL. The range I saw was 16-22 LPA for product companies. My current skills match the 18-20 LPA band — I've built production systems handling 900K records, deployed on AWS, worked across the full stack. So I'm expecting 18-20 LPA. What's the budget for this role?`,
    },
    {
      id: 'negotiation-tactics',
      title: 'Negotiation Tactics & Scripts',
      difficulty: 'medium',
      explanation: `Core principles:
1. Never give a number first if you can avoid it — ask for their range
2. Always negotiate — the first offer is never the best offer
3. Negotiate the total package — base, variable, joining bonus, stock
4. Don't accept on the spot — always take 24-48 hours to "review"
5. Have a competing offer or be willing to walk away — that's your leverage

The person who says a number first is at a disadvantage. Let them anchor, then push up.`,
      code: `// Script: When asked "What are your salary expectations?"
"I'm more interested in understanding the role and how I can contribute.
Could you share the budget range for this position?
I want to make sure we're aligned before committing to a number."

// If they push:
"Based on my research and experience, I'm looking in the 18-20 LPA range.
But I'm open to discussion based on the full package and growth opportunity."

// Script: Responding to an offer below your target
"Thank you for the offer — I'm genuinely excited about this role.
The offer is X. Based on my research and conversations, I was expecting Y.
Is there flexibility to get to Y?"
// Then STOP TALKING. Silence is powerful.

// Script: Asking for more without another offer
"I'm very interested in joining the team. Based on market rates for this
role in Bangalore and my experience with production systems at scale,
could we look at [specific number]? That would make this decision easy for me."

// Script: If they say "this is our maximum"
"I understand. Let me ask — is there flexibility on the joining bonus
or the variable component? That would help bridge the gap."`,
      interviewQ: 'How do you handle salary negotiation?',
      interviewA: `I don't negotiate from ego, I negotiate from research. I know what similar roles pay and I can defend my number with that data. I try not to give the first number — I ask about their range. If they push, I give my range confidently. When I get an offer below target, I thank them, express genuine interest in the role, and ask directly if there's flexibility. I always counter at least once — the worst they can say is no, and most companies expect a counter.`,
    },
    {
      id: 'offer-evaluation',
      title: 'Evaluating an Offer — Beyond the Number',
      difficulty: 'medium',
      explanation: `Total compensation components:
• Base salary — fixed monthly, the number that compounds future hikes
• Variable pay — performance bonus, usually 10-20% of base
• Joining bonus — one-time, helps bridge notice period salary loss
• ESOPs/RSUs — equity (valuable at funded startups, worthless at most others)
• Annual hike cycle — when and how much
• Benefits — health insurance coverage, PF, gratuity

Non-monetary factors that matter a lot:
• Tech stack — will you grow here?
• Team quality — will they make you better?
• Product quality — will you be proud of what you build?
• WFH flexibility — saves real money on commute and time`,
      code: `// Offer comparison framework

Company A              Company B
Base: 16 LPA          Base: 18 LPA
Variable: 2 LPA       Variable: 1.5 LPA
Total: 18 LPA         Total: 19.5 LPA

But also consider:
Company A: Service company, CRUD work, old stack (Java Spring)
           5-day WFH, 2hr commute daily, no equity
Company B: Funded startup, challenging problems, modern stack
           3-day WFH, 30-min commute, 0.1% ESOP (could be worth a lot)

Real comparison:
Company A:
  - Commute cost: 12,000/month × 12 = 1.44 LPA/year
  - Time: 4hr/day × 240 work days = 960 hours lost
  - Growth: slow (standardized processes, legacy code)

Company B:
  - Actually more valuable despite "lower" total on paper
  - Stack experience compounds your future value`,
      interviewQ: 'What factors matter most to you when evaluating an offer?',
      interviewA: `Three things in order. First, will I grow technically — the stack, the scale of problems, the quality of the engineers around me. Second, the base salary, because that's what future hikes are built on. Third, work model and location — WFH saves real money and time. Variable and joining bonuses are nice but I don't weight them heavily because they're not guaranteed. I'd take a 5% lower offer at a company that will make me significantly better in two years.`,
    },
    {
      id: 'notice-period',
      title: 'Notice Period — Handling the Conversation',
      difficulty: 'easy',
      explanation: `In India, most companies have a 30-90 day notice period. Negotiation tactics:

• Buyout — new company pays your current company to release you early
• Garden leave — company pays but you don't work (rare)
• Negotiate down — often notice can be reduced with manager approval
• Start date negotiation — ask new company for a later start date

Be honest about your notice period from the start. Don't agree to a start date you can't meet — it's a bad way to start a new job.

If you have leave days accumulated: many companies allow using earned leaves to reduce effective notice.`,
      code: `// Notice period conversation script

// Recruiter: "When can you join?"
"My current notice period is 30 days. With accumulated leaves,
I can potentially join in 3 weeks. How flexible is the start date?"

// If they need someone immediately:
"I understand the urgency. I can check if my current employer would
accept a buyout — does your company support notice period buyout?"

// Negotiating with current employer:
"I've received an offer. I'd like to discuss early release.
I'm happy to complete my critical deliverables and create
thorough handover documentation to make the transition smooth."

// Offer letter before resignation:
// ALWAYS get the offer letter in writing before resigning.
// Verbal offers can be withdrawn. Get everything on paper.`,
      interviewQ: 'When can you join us?',
      interviewA: `My notice period is 30 days. I have some earned leaves I can apply, so realistically I could join in about 3 weeks. But I'd want to finish my current handover properly — I don't want to leave my team in a bad spot. Is 3-4 weeks from offer acceptance workable for you?`,
    },
    {
      id: 'questions-to-ask',
      title: 'Questions to Ask the Interviewer',
      difficulty: 'easy',
      explanation: `"Do you have any questions for us?" is not just courtesy — it's your chance to evaluate them. Ask things you genuinely want to know. Not asking questions looks passive.

Good categories:
• Team and engineering culture
• Tech stack and technical debt situation
• Growth and career path
• How decisions are made
• Why the role is open (someone quit? team growth? replacement?)

Avoid: salary questions in technical rounds, questions answered on the website, generic questions like "what does a typical day look like" if you haven't researched.`,
      code: `// Best questions by stage

// Technical round
"What does the current tech stack look like and are there plans to evolve it?"
"What's the biggest technical challenge the team is working through right now?"
"How does the team handle code reviews and technical standards?"
"What does onboarding look like for new engineers?"

// Hiring manager round
"What would success look like for this role in the first 90 days?"
"What are the biggest opportunities for the person in this role?"
"How does the team make technical decisions — is it top-down or collaborative?"
"Why is this position open — new headcount or replacement?"

// HR round
"What does the performance review process look like?"
"How often do promotions happen and what drives them?"
"What's the typical tenure of engineers on the team?"

// Power question (use sparingly — advanced)
"Based on our conversation today, is there anything about my background
that gives you pause? I'd rather address it now than leave it open."`,
      interviewQ: 'Do you have any questions for us?',
      interviewA: `Yes, a few. What's the biggest technical challenge the team is actively working on right now? And I'm curious — how does the team handle technical debt vs new feature work — is there a process or does it depend on the project? Also, what does growth look like for an engineer who comes in and performs well? What's the next step after senior developer?`,
    },
  ],
  interviewQA: [
    { q: 'Q1. What is your current CTC and expected CTC?', a: `My current CTC is [X] LPA. Based on my experience building production systems end-to-end — AWS deployment, performance optimization, multi-tenant architecture — and market research for this role in Bangalore, I'm looking at 18-20 LPA. What's the budgeted range for this position?` },
    { q: 'Q2. Do you have competing offers?', a: `I'm at various stages with a few companies. I haven't made any decisions yet because I want to find the right fit, not just the highest number. This role and company are genuinely interesting to me, which is why I'm here.` },
    { q: 'Q3. Why do you want to leave your current company?', a: `I've had good learning there — built systems from scratch, owned real production problems. I'm looking for a bigger engineering team with stronger practices and harder problems. My current company is great for ownership but smaller than where I want to grow next.` },
    { q: 'Q4. Are you comfortable with the location / relocation?', a: `Yes, completely comfortable. I've done my research on the location and I'm ready to make the move. Is there a relocation support policy for this role?` },
    { q: 'Q5. What is your notice period?', a: `30 days. With accumulated leaves I could potentially join in 3 weeks. I want to make sure I handover properly — not something I'd want to shortcut. Is 3-4 weeks workable for the start date?` },
    { q: 'Q6. Are you open to a service agreement / bond?', a: `I'd want to understand the specifics — duration, conditions, and what triggers the bond. A short bond with reasonable conditions at a company I'm genuinely excited about isn't a deal-breaker, but I'd want to review the terms carefully before agreeing.` },
    { q: 'Q7. The role requires X technology you haven\'t used. Are you comfortable?', a: `Yes — I've learned new technologies on the job before. When we moved to FastAPI for TalentFind, I'd only done Node.js backends. I got productive within 2 weeks. If the fundamentals are solid, picking up a new framework or tool is a matter of time and practice, not starting from zero.` },
    { q: 'Q8. What do you know about our company / product?', a: `[Research this before every interview — genuinely read about them, don't fake it. Know: what they build, who their customers are, recent news, tech stack if public, their scale. Companies notice when you've actually done homework vs when you googled them 5 minutes before.]` },
    { q: 'Q9. How soon can you give us an answer after an offer?', a: `I'd want 24-48 hours to review the offer letter carefully and discuss with family. I won't drag it out — once I've made a decision I'll communicate immediately. Is that timeline okay?` },
    { q: 'Q10. Is salary negotiable?', a: `Yes — I believe negotiation is normal and healthy. I'm not trying to squeeze maximum money out of a company I want to work at, I just want to make sure the number reflects market rates and my experience level. What's the range for this role?` },
  ]
}
