export const day1 = {
  id: 1,
  title: 'JavaScript + TypeScript',
  subtitle: 'Core concepts every Senior Full Stack Engineer must know cold',
  concepts: [
    {
      id: 'event-loop',
      title: 'Event Loop & Async Execution Model',
      difficulty: 'hard',
      explanation: `JavaScript is single-threaded — one call stack, one thing at a time. The Event Loop allows async operations by delegating tasks to Web APIs (browser) or libuv (Node.js).

Execution order: Synchronous code → Microtask queue (Promises, queueMicrotask) → Macrotask queue (setTimeout, setInterval, I/O).

This is why Promise callbacks always run before setTimeout callbacks, even with 0ms delay.`,
      code: `// Classic interview question — what's the output?
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// Output: 1, 4, 3, 2
// Why: Sync first → Microtasks (Promise) → Macrotasks (setTimeout)`,
      interviewQ: "Explain the Event Loop and why setTimeout(fn, 0) doesn't run immediately.",
      interviewA: `JS runs sync code first on the call stack. setTimeout goes to the Web API / libuv, then its callback hits the macrotask queue. The event loop only picks it up once the stack AND microtask queue are both empty. So even with 0ms delay, it runs after all sync code and all resolved promises.`,
      gotcha: 'Promise callbacks run before setTimeout callbacks, even if setTimeout has 0ms delay.',
    },
    {
      id: 'closures',
      title: 'Closures',
      difficulty: 'hard',
      explanation: `A closure is a function that retains access to its outer lexical scope even after the outer function has returned.

This enables data encapsulation, factory functions, and module patterns. Every function in JS is a closure — the question is whether it actually uses variables from an outer scope.`,
      code: `function makeCounter() {
  let count = 0;  // private variable — not accessible outside
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount:  () => count
  };
}
const counter = makeCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.getCount();  // 2 — count is private!

// Classic trap: var in loop
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Prints: 3, 3, 3 — all share same 'i'

// Fix: use let (block scoped)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Prints: 0, 1, 2 ✅`,
      interviewQ: 'What is a closure and can you give a real-world use case?',
      interviewA: `A closure is when a function remembers variables from its outer scope even after that scope is gone. Real world: I use closures for private state in module patterns — like a rate limiter that keeps count internally, or a debounce function that holds onto the timer ID between calls.`,
      tip: 'Use closures for private state in module patterns and factory functions.',
    },
    {
      id: 'promises',
      title: 'Promises & Async/Await',
      difficulty: 'hard',
      explanation: `A Promise represents a future value — pending, fulfilled, or rejected. Async/await is syntactic sugar over promises making async code readable.

Key methods:
• Promise.all — parallel, fails fast if any fail
• Promise.allSettled — parallel, never fails, gives all results
• Promise.race — first to settle wins
• Promise.any — first to SUCCEED wins`,
      code: `// Promise.all — runs in parallel, fails if any fail
const [user, orders] = await Promise.all([
  fetchUser(id),
  fetchOrders(id)
]);

// Promise.allSettled — never throws, gives all results
const results = await Promise.allSettled([
  fetchUser(id),
  fetchOrders(id)
]);
results.forEach(r => {
  if (r.status === 'fulfilled') console.log(r.value);
  else console.log('Failed:', r.reason);
});

// Timeout pattern using Promise.race
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);`,
      interviewQ: 'When would you use Promise.allSettled over Promise.all?',
      interviewA: `Promise.all fails the moment any single promise rejects — you lose all results. allSettled always resolves with a result for each promise, marked fulfilled or rejected. I use allSettled when I need all results regardless of failures — like sending notifications to multiple users where one failing shouldn't block the others.`,
      gotcha: 'Promise.all fails fast — if one rejects, all results are lost. Use Promise.allSettled when you need every result.',
    },
    {
      id: 'this',
      title: 'The "this" Keyword — 5 Binding Rules',
      difficulty: 'hard',
      explanation: `"this" refers to the object currently calling the function. Its value depends on HOW the function is called, not where it's defined.

5 Rules (priority order):
1. new binding — this = new object being created
2. Explicit — call(), apply(), bind() set this manually
3. Implicit — object before the dot owns this
4. Default — global object (undefined in strict mode)
5. Arrow functions — no own this, inherits from parent scope`,
      code: `// Rule 3: Implicit binding
const obj = { name: 'Jay', greet() { console.log(this.name); } };
obj.greet(); // 'Jay' — obj owns this

// Rule 5: Arrow function — inherits outer this
const timer = {
  count: 0,
  start() {
    setInterval(() => {        // arrow = no own this
      this.count++;            // this = timer object ✅
    }, 1000);
  }
};

// Common bug: losing this in callbacks
class Button {
  handleClick() { console.log(this); }
}
const btn = new Button();
document.addEventListener('click', btn.handleClick);         // ❌ this = document
document.addEventListener('click', btn.handleClick.bind(btn)); // ✅ this = btn`,
      interviewQ: 'What\'s the difference between arrow functions and regular functions regarding "this"?',
      interviewA: `Regular functions have their own this — determined by how they're called. Arrow functions have no this of their own — they inherit it from the enclosing lexical scope. So in React class components, I use arrow functions for event handlers to avoid binding issues. In Vue, I avoid arrow functions as method definitions because they'd lose access to the component instance.`,
      gotcha: 'Never use arrow functions as object methods if you need "this" to refer to the object.',
    },
    {
      id: 'var-let-const',
      title: 'var vs let vs const — Scope & Hoisting',
      difficulty: 'medium',
      explanation: `var: function scoped, hoisted and initialized to undefined immediately.
let/const: block scoped, hoisted but NOT initialized — accessing before declaration throws ReferenceError (Temporal Dead Zone).
const: must be initialized, cannot be reassigned — but the value itself can be mutated (arrays/objects).`,
      code: `// var — hoisted as undefined
console.log(x); // undefined (not an error)
var x = 5;

// let — TDZ: ReferenceError before declaration
console.log(y); // ReferenceError: Cannot access 'y' before initialization
let y = 5;

// const — block scoped, no reassignment
const arr = [1, 2];
arr.push(3);  // ✅ mutation allowed — arr still points to same array
arr = [];     // ❌ TypeError: Assignment to constant variable

// Block scope demo
{
  let blockScoped = 'only here';
  var funcScoped = 'everywhere in function';
}
console.log(funcScoped);  // ✅ works
console.log(blockScoped); // ❌ ReferenceError`,
      interviewQ: 'What is the Temporal Dead Zone?',
      interviewA: `The TDZ is the period between when a let/const variable is hoisted to the top of its block and when it actually gets initialized by the declaration statement. Accessing the variable during this window throws a ReferenceError. var doesn't have a TDZ — it's initialized to undefined immediately when hoisted.`,
    },
    {
      id: 'debounce-throttle',
      title: 'Debounce vs Throttle',
      difficulty: 'medium',
      explanation: `Debounce: waits until the user STOPS firing the event, then runs once. Use for search inputs, form validation, API calls on input change.

Throttle: runs at most once per time interval regardless of how many times it fires. Use for scroll handlers, window resize, button spam prevention.`,
      code: `// Debounce — wait for user to stop, then run
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
const debouncedSearch = debounce(callSearchAPI, 300);
// User types fast → only calls API 300ms after they stop typing

// Throttle — run at most once per interval
function throttle(fn, limit) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn(...args);
    }
  };
}
const throttledScroll = throttle(handleScroll, 200);
// Scroll fires 100 times/sec → handler runs max 5 times/sec`,
      interviewQ: 'Where have you used debounce or throttle in production?',
      interviewA: `In TalentFind I used debounce on the job search input — 300ms delay before hitting the API. Without it, every keystroke fired a request. In ATOFON I used throttle on the "Place Order" button to prevent double submissions when the network is slow. Standard pattern I apply to any search input or action button now.`,
      tip: 'Mention real use cases — search bars, scroll handlers, API rate limiting. Shows you understand performance.',
    },
    {
      id: 'deep-shallow',
      title: 'Shallow vs Deep Copy',
      difficulty: 'medium',
      explanation: `Shallow copy: copies top-level properties, but nested objects still share the same reference. Mutations to nested objects affect both copies.

Deep copy: completely independent copy at all levels. Changes to nested objects do not affect the original.`,
      code: `// Shallow copy — nested objects still share reference
const original = { a: 1, b: { c: 2 } };
const shallow = { ...original };        // or Object.assign({}, original)
shallow.b.c = 99;
console.log(original.b.c); // 99 — MUTATED! ❌

// Deep copy options
// Option 1: JSON (simple but loses functions, Dates, undefined)
const deep1 = JSON.parse(JSON.stringify(original));

// Option 2: structuredClone (modern, handles more types)
const deep2 = structuredClone(original); // ✅ recommended

deep2.b.c = 999;
console.log(original.b.c); // 2 — safe ✅`,
      interviewQ: 'What does JSON.parse(JSON.stringify()) lose and what should you use instead?',
      interviewA: `It loses functions, undefined values, Date objects (converts to string), Symbol keys, and breaks on circular references. For reliable deep copies I use structuredClone() which is now built into modern browsers and Node 17+. For older environments I use lodash's cloneDeep.`,
      gotcha: 'JSON.parse/stringify silently drops functions and converts Dates to strings. Use structuredClone() instead.',
    },
    {
      id: 'map-filter-reduce',
      title: 'Map, Filter, Reduce',
      difficulty: 'easy',
      explanation: `Three core functional array methods. All return new values without mutating the original array.

map: transforms each element, returns new array of same length.
filter: keeps elements matching condition, returns subset.
reduce: accumulates values into single result.`,
      code: `const orders = [
  { id: 1, amount: 200, status: 'paid' },
  { id: 2, amount: 150, status: 'pending' },
  { id: 3, amount: 300, status: 'paid' },
];

// Get total revenue from paid orders — chain all three
const revenue = orders
  .filter(o => o.status === 'paid')    // [order1, order3]
  .map(o => o.amount)                  // [200, 300]
  .reduce((sum, a) => sum + a, 0);     // 500

// Group by status using reduce
const grouped = orders.reduce((acc, order) => {
  const key = order.status;
  if (!acc[key]) acc[key] = [];
  acc[key].push(order);
  return acc;
}, {});
// { paid: [...], pending: [...] }`,
      interviewQ: 'What\'s the difference between map() and forEach()?',
      interviewA: `map returns a new array — use it when you need to transform data and capture the result. forEach returns undefined — use it for side effects like logging or updating state. You can chain after map (filter, reduce), you can't chain after forEach. Simple rule: if you need the output, use map.`,
    },
  ],

  interviewQA: [
    {
      q: 'Q1. What is the difference between == and === in JavaScript?',
      a: `=== checks value AND type — no surprises. == does type coercion first, so 1 == '1' is true, which is almost never what you want. I always use ===. The one exception I'd make is null == undefined — it catches both in a single check, which is occasionally useful.`
    },
    {
      q: 'Q2. Explain async/await and how it differs from Promises.',
      a: `async/await is just Promises with cleaner syntax — under the hood it compiles to .then() chains. The real win is error handling. try/catch reads way better than chained .catch(). One thing to remember: an async function always returns a Promise, even if you return a plain value inside it.`
    },
    {
      q: 'Q3. What is the difference between null and undefined?',
      a: `undefined is JS saying "you declared this but never gave it a value." null is you explicitly saying "nothing here." In my APIs I use null to mean intentionally empty, and undefined means the field wasn't included in the payload at all. Also — typeof null === 'object' is a known JS bug, just something you have to know.`
    },
    {
      q: 'Q4. What is event delegation and why is it useful?',
      a: `Instead of putting a listener on every child, you put one on the parent. Events bubble up, so you check event.target to know which child was clicked. Two big wins: way less memory usage, and it works for elements added to the DOM dynamically — which matters a lot when you're rendering lists from an API.`
    },
    {
      q: 'Q5. What are WeakMap and WeakSet, and when would you use them?',
      a: `WeakMap holds object keys but doesn't prevent garbage collection — when the object is cleaned up, its entry disappears automatically. Regular Map keeps a strong reference so the object stays in memory even if nothing else is using it. I'd use WeakMap to attach metadata to DOM nodes without worrying about cleanup causing memory leaks.`
    },
    {
      q: 'Q6. How does TypeScript help in large codebases?',
      a: `Biggest win: you catch bugs before they hit production. In a team, types act as living documentation — I don't need to trace through a whole function to know what shape the data is. Refactoring is also way safer. Rename a field and TypeScript immediately shows you every place that breaks instead of finding out at runtime.`
    },
    {
      q: 'Q7. What is the difference between call, apply, and bind?',
      a: `All three let you manually set what "this" is. call() runs immediately, args go in one by one. apply() also runs immediately but takes args as an array. bind() doesn't run it — it gives you back a new function with "this" permanently locked in. I use bind when passing a class method as a callback so it doesn't lose its this context.`
    },
    {
      q: 'Q8. What is a memory leak in JavaScript and how do you prevent it?',
      a: `It's when memory gets allocated but never freed, so your app slowly eats more and more RAM. Most common causes I've seen: event listeners not removed on component unmount, setInterval never cleared, closures holding onto objects longer than needed. In React the classic mistake is skipping the cleanup return in useEffect — listeners pile up on every re-render. Chrome DevTools Memory tab is the best way to catch it.`
    },
    {
      q: 'Q9. Explain Promise.all vs Promise.allSettled vs Promise.race.',
      a: `Promise.all runs everything in parallel — one fails and the whole thing fails. Use it when you need all results and a single failure should stop everything. allSettled also runs in parallel but never throws — you always get a result for each one, marked fulfilled or rejected. race gives you whichever promise finishes first. I've used race for timeout patterns — race the API call against a 5-second timeout promise.`
    },
    {
      q: 'Q10. What is the difference between interface and type in TypeScript?',
      a: `interface is for object shapes — it can be extended, it merges if you declare it twice, works well with classes. type is more flexible — you can do unions, intersections, computed types, primitives. In practice I use interface for API response shapes and class contracts, and type for things like Status = 'active' | 'pending' | 'inactive'.`
    },
    {
      q: 'Q11. How do you handle race conditions in async JavaScript?',
      a: `Classic case — user types fast in search, three API calls go out, the second one comes back last and overwrites the right result. Fix: give each request an ID and only process the response if it matches the latest one. Or use AbortController to cancel the previous call when a new one fires. In React I handle this in useEffect's cleanup function.`
    },
    {
      q: 'Q12. What are Generators and when would you use them?',
      a: `Functions you can pause and resume. yield pauses it, .next() picks it back up. Useful for processing large datasets without loading everything into memory at once — like reading a huge CSV row by row. In practice most teams use async iterators now for the same thing, but generators are the foundation underneath them.`
    },
    {
      q: 'Q13. Explain CommonJS vs ES Modules.',
      a: `CommonJS is require() and module.exports — what Node.js was built on, loads synchronously at runtime. ES Modules is import/export — statically analyzed at parse time so bundlers can tree-shake unused code. Node supports both now. The key difference that trips people up: CJS copies the exported value, ESM is a live binding — if the source changes, your import sees the change.`
    },
    {
      q: 'Q14. What is the difference between map() and forEach()?',
      a: `map returns a new array — use it when you want to transform data. forEach returns undefined — use it when you just want to do something for each item and don't need a result. Simple rule: if you need to chain or capture the output, use map. If you're just logging or triggering a side effect, use forEach.`
    },
    {
      q: 'Q15. What are TypeScript Decorators and where have you used them?',
      a: `Decorators are functions that wrap a class or method to add behavior without touching the original code. In NestJS they're everywhere — @Controller(), @Get(), @Injectable(), @Body(). The idea is AOP — you pull cross-cutting stuff like auth, validation, and logging out of your business logic and put it in decorators instead. Makes the core code much cleaner to read.`
    },
  ]
}
