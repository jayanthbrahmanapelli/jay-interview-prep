export const day2 = {
  id: 2,
  title: 'React.js Deep Dive',
  subtitle: 'Hooks, Virtual DOM, performance optimization, state management',
  concepts: [
    {
      id: 'virtual-dom',
      title: 'Virtual DOM & Reconciliation',
      difficulty: 'hard',
      explanation: `The Virtual DOM is a lightweight JS representation of the real DOM. React keeps two copies — the previous and the new. When state changes, React diffs them (reconciliation) and only updates what actually changed in the real DOM.

The diffing algorithm (Fiber) works in two phases:
• Render phase (pure, no side effects) — builds the new virtual tree
• Commit phase (has side effects) — applies changes to real DOM

Keys in lists help React identify which items changed without comparing every element.`,
      code: `// Without keys — React diffs by position (inefficient)
<ul>
  {items.map(item => <li>{item.name}</li>)}  // ❌ no key
</ul>

// With keys — React tracks by ID (efficient)
<ul>
  {items.map(item => <li key={item.id}>{item.name}</li>)}  // ✅
</ul>

// React.memo — prevents re-render if props didn't change
const UserCard = React.memo(({ user }) => {
  console.log('rendering UserCard');
  return <div>{user.name}</div>;
});`,
      interviewQ: 'What is the Virtual DOM and how does reconciliation work?',
      interviewA: `React keeps a virtual copy of the DOM in memory. When state changes, it builds a new virtual DOM tree and diffs it against the previous one — this is reconciliation. It then applies only the minimum set of changes to the real DOM. This batching is what makes React fast — real DOM operations are expensive, virtual DOM operations are just JS object comparisons.`,
      tip: 'Always use stable, unique keys in lists. Using array index as key breaks reconciliation when items are reordered.',
    },
    {
      id: 'hooks',
      title: 'React Hooks — All The Important Ones',
      difficulty: 'hard',
      explanation: `Hooks let you use state and lifecycle features in function components.

Most asked in interviews:
• useState — local state
• useEffect — side effects, lifecycle
• useCallback — memoize functions
• useMemo — memoize values
• useRef — mutable ref, DOM access
• useContext — consume context
• useReducer — complex state logic`,
      code: `// useState
const [count, setCount] = useState(0);

// useEffect — runs after render
useEffect(() => {
  fetchData();          // side effect
  return () => {        // cleanup (runs before next effect or unmount)
    cancelRequest();
  };
}, [dependency]);       // only re-run when dependency changes

// useCallback — memoize function reference
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);               // new function only when id changes

// useMemo — memoize computed value
const expensiveValue = useMemo(() => {
  return computeHeavyThing(data);
}, [data]);

// useRef — doesn't trigger re-render
const inputRef = useRef(null);
const timerRef = useRef(null);  // store timer ID between renders`,
      interviewQ: 'When would you use useCallback vs useMemo?',
      interviewA: `useCallback memoizes a function — returns the same function reference unless dependencies change. useMemo memoizes a computed value. Use useCallback when passing functions to child components wrapped in React.memo, so the child doesn't re-render just because the parent re-rendered. Use useMemo for expensive calculations you don't want to repeat every render. Don't overuse them — they have their own cost and only help when re-renders are actually a problem.`,
      gotcha: 'useEffect with empty array [] runs once on mount. Missing a dependency causes stale closure bugs. Include all values used inside the effect.',
    },
    {
      id: 'state-management',
      title: 'Redux vs Context API vs Zustand',
      difficulty: 'medium',
      explanation: `Three main options for global state in React.

Context API: built-in, good for low-frequency updates (theme, auth). Re-renders all consumers on any change.

Redux: predictable state container with actions and reducers. Great for complex state logic. Redux Toolkit makes it much less boilerplate.

Zustand: modern lightweight alternative. Simple API, doesn't re-render unless the specific slice you subscribed to changes.`,
      code: `// Redux Toolkit (modern Redux — less boilerplate)
import { createSlice, configureStore } from '@reduxjs/toolkit'

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: state => { state.value += 1 },
    decrement: state => { state.value -= 1 },
  }
})

// Zustand (simpler, modern)
import { create } from 'zustand'
const useStore = create(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}))

// Usage
const { count, increment } = useStore()`,
      interviewQ: 'When would you choose Redux over Context API?',
      interviewA: `Context is fine for things that don't change often — auth user, theme, language. But if you have complex state with many actions, need time-travel debugging, or updates happen frequently, Redux is better. Context re-renders every consumer on any change — Redux with useSelector only re-renders when the specific slice you're subscribed to changes. For new projects I'd consider Zustand — same benefits as Redux with far less boilerplate.`,
    },
    {
      id: 'performance',
      title: 'React Performance Optimization',
      difficulty: 'medium',
      explanation: `Key optimization techniques for production React apps.

Common causes of performance issues:
• Unnecessary re-renders
• Expensive computations on every render
• Large bundle sizes
• Unoptimized list rendering`,
      code: `// 1. React.memo — prevent re-render if props unchanged
const Header = React.memo(({ title }) => <h1>{title}</h1>);

// 2. Code splitting — lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>

// 3. Virtualize long lists — only render visible items
import { FixedSizeList } from 'react-window';
<FixedSizeList height={400} itemCount={10000} itemSize={35}>
  {({ index, style }) => <div style={style}>Row {index}</div>}
</FixedSizeList>

// 4. Avoid inline objects/functions in JSX
// ❌ Bad — new object every render triggers re-render
<Component style={{ color: 'red' }} />
// ✅ Good — stable reference
const style = useMemo(() => ({ color: 'red' }), []);
<Component style={style} />`,
      interviewQ: 'How did you handle performance issues in your React projects?',
      interviewA: `In ARC Parcel, the shipment list had 900,000+ records. I added server-side pagination so we never loaded more than 50 rows at a time. For the UI I used React.memo on the row components so they didn't re-render unless the row data actually changed. I also code-split the admin portal routes with React.lazy so the initial bundle size was smaller. The combination dropped the first load time from 8 seconds to under 2.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. What is the difference between controlled and uncontrolled components?', a: `Controlled: React state drives the input value. Every keystroke goes through setState. You have full control and can validate on every change. Uncontrolled: the DOM manages its own state, you access it with a ref when needed. Controlled is recommended for most cases — easier to validate, reset, and test. Uncontrolled is fine for simple file inputs or when integrating with non-React code.` },
    { q: 'Q2. What is the useEffect dependency array and what happens if you omit it?', a: `With []: runs once after mount, never again. With [dep1, dep2]: runs after mount and after any render where dep1 or dep2 changed. With nothing (omitted): runs after every single render. Omitting it is almost never what you want. Missing a dependency in the array causes stale closure bugs — the effect captures the old value and never sees updates.` },
    { q: 'Q3. How does React handle re-renders?', a: `Re-render is triggered by: setState, context value change, parent re-render, or forceUpdate. React re-renders the component and all its children unless you stop it with React.memo (for function components) or shouldComponentUpdate/PureComponent (class components). Just because a component re-renders doesn't mean the DOM updates — React diffs the virtual DOM and only commits actual changes.` },
    { q: 'Q4. What is React.StrictMode and what does it do?', a: `StrictMode is a development-only tool that helps find potential problems. It double-invokes renders and effects to surface side effects that aren't safe to run twice. Useful for catching deprecated lifecycle methods and accidental side effects in render. Has zero impact on production builds.` },
    { q: 'Q5. How do you share state between sibling components?', a: `Lift state up to the nearest common ancestor and pass it down as props. If the components are far apart in the tree, use Context API or a state manager like Zustand/Redux. For complex cross-component communication I prefer Zustand over prop drilling through 5 layers — cleaner and doesn't cause re-renders throughout the tree.` },
    { q: 'Q6. What are React Portals and when would you use them?', a: `Portals let you render a component's children outside the parent DOM hierarchy. Common use case: modals, tooltips, dropdowns that need to break out of overflow:hidden or z-index constraints from the parent. The component still behaves like it's inside the React tree for event bubbling and context access.` },
    { q: 'Q7. Explain the useReducer hook and when to prefer it over useState.', a: `useReducer takes a reducer function and initial state, returns [state, dispatch]. Better than useState when: state has multiple related sub-values, next state depends on previous state, state transitions are complex. Pattern is similar to Redux — dispatch an action, reducer handles it. Good for form state with multiple fields and validation logic.` },
    { q: 'Q8. What is prop drilling and how do you solve it?', a: `Prop drilling is passing props through multiple component layers that don't actually need the data — they just pass it down. Solutions: Context API for global data that many components need, component composition (passing components as props instead of data), or a state manager. In practice I combine them — Context for auth/theme, component composition for UI layout, Zustand for complex app state.` },
    { q: 'Q9. What is the difference between useEffect and useLayoutEffect?', a: `useEffect runs asynchronously after the browser paints — doesn't block visual update. useLayoutEffect runs synchronously after DOM mutations but before the browser paints. Use useLayoutEffect only when you need to read DOM layout (element position, size) and synchronously update it before the user sees the paint — like tooltip positioning. For everything else, useEffect.` },
    { q: 'Q10. How do you optimize a React app with a very large list?', a: `Three approaches I've used: server-side pagination (don't send 10,000 items to the client — send 50 at a time), virtual scrolling with react-window or react-virtual (only renders visible rows, keeps DOM node count low), and memoizing row components with React.memo so they don't re-render on parent state changes that don't affect them.` },
  ]
}
