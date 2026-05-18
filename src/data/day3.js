export const day3 = {
  id: 3,
  title: 'Vue.js Deep Dive',
  subtitle: 'Reactivity system, Vuex, Composition API, lifecycle hooks',
  concepts: [
    {
      id: 'reactivity',
      title: 'Vue Reactivity System',
      difficulty: 'hard',
      explanation: `Vue 3 uses Proxy-based reactivity. When you access a reactive property, Vue tracks it as a dependency. When you modify it, Vue notifies all dependent effects to re-run.

Vue 2 used Object.defineProperty — which couldn't detect property addition/deletion (needed Vue.set).
Vue 3 uses Proxy — handles all property operations transparently.

Key reactive APIs: ref() for primitives, reactive() for objects, computed() for derived state.`,
      code: `import { ref, reactive, computed, watch, watchEffect } from 'vue'

// ref — for primitives (access with .value in script)
const count = ref(0)
count.value++  // in script
// In template: {{ count }} (no .value needed)

// reactive — for objects
const user = reactive({ name: 'Jay', age: 28 })
user.name = 'Jayanth'  // reactive, no .value needed

// computed — cached, only re-runs when dependencies change
const fullName = computed(() => \`\${user.firstName} \${user.lastName}\`)

// watch — explicit, runs when specific source changes
watch(count, (newVal, oldVal) => {
  console.log('count changed:', oldVal, '->', newVal)
})

// watchEffect — auto-tracks dependencies
watchEffect(() => {
  console.log('count is:', count.value)  // runs whenever count changes
})`,
      interviewQ: 'What is the difference between ref and reactive in Vue 3?',
      interviewA: `ref wraps a value in an object with a .value property — needed for primitives since Proxy can't intercept a raw number or string. reactive uses Proxy directly on an object, so no .value needed. In templates, Vue auto-unwraps refs so you don't type .value there. My preference: use ref for everything — it's more explicit and you always know what's reactive. reactive can lose reactivity if you destructure it.`,
      gotcha: 'Destructuring a reactive object breaks reactivity. Use toRefs() to destructure safely.',
    },
    {
      id: 'composition-api',
      title: 'Composition API vs Options API',
      difficulty: 'medium',
      explanation: `Options API organizes code by option type (data, methods, computed, watch). Composition API organizes by logical concern — all related logic for one feature stays together.

Composition API advantages:
• Better TypeScript support
• Easier code reuse via composables
• No "this" confusion
• Logic for one feature stays together instead of split across data/methods/computed`,
      code: `// Options API (Vue 2 style — still valid in Vue 3)
export default {
  data() { return { count: 0, user: null } },
  computed: { doubled() { return this.count * 2 } },
  methods: { increment() { this.count++ } },
  mounted() { this.fetchUser() }
}

// Composition API (Vue 3 — recommended)
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)
    const increment = () => count.value++

    onMounted(() => fetchUser())

    return { count, doubled, increment }
  }
}

// Script Setup (even cleaner — auto-exposes to template)
<script setup>
const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>`,
      interviewQ: 'Why did Vue 3 introduce the Composition API?',
      interviewA: `Three main reasons. First, code organisation — in Options API, logic for one feature is scattered across data, methods, computed, and watch. In Composition API everything for one feature lives together. Second, reusability — you can extract logic into composables (like React hooks) and share across components without mixins. Third, TypeScript — Options API's "this" is hard to type properly. Composition API is just plain functions and variables that TypeScript understands perfectly.`,
    },
    {
      id: 'vuex',
      title: 'Vuex State Management',
      difficulty: 'medium',
      explanation: `Vuex is Vue's official state management library. It follows a strict unidirectional data flow:

Component → dispatch(action) → commit(mutation) → state → component

State: single source of truth
Mutations: synchronous state changes (only way to change state)
Actions: async operations, commit mutations when done
Getters: computed properties from state`,
      code: `// Vuex Store
const store = createStore({
  state: {
    candidates: [],
    isLoading: false
  },
  getters: {
    activeCandidates: state => state.candidates.filter(c => c.active)
  },
  mutations: {
    SET_CANDIDATES(state, candidates) {
      state.candidates = candidates  // synchronous only
    },
    SET_LOADING(state, val) {
      state.isLoading = val
    }
  },
  actions: {
    async fetchCandidates({ commit }) {
      commit('SET_LOADING', true)
      const data = await api.getCandidates()
      commit('SET_CANDIDATES', data)
      commit('SET_LOADING', false)
    }
  }
})

// In component
import { useStore } from 'vuex'
const store = useStore()
store.dispatch('fetchCandidates')
const candidates = computed(() => store.getters.activeCandidates)`,
      interviewQ: 'Why must state only be changed through mutations in Vuex?',
      interviewA: `Mutations are the only place Vuex allows state changes because they're synchronous and tracked. Vue DevTools can record every mutation and let you time-travel — stepping back through state history. If you mutated state directly anywhere, that tracking breaks. Actions handle async work, then commit mutations when done — this keeps the actual state change always synchronous and traceable.`,
    },
    {
      id: 'lifecycle',
      title: 'Vue Lifecycle Hooks',
      difficulty: 'medium',
      explanation: `Vue component lifecycle in order:
1. setup() — Composition API entry point
2. beforeCreate → created (Options API, before DOM)
3. beforeMount → mounted (DOM attached)
4. beforeUpdate → updated (reactive data changed)
5. beforeUnmount → unmounted (cleanup here)

In Composition API: onMounted, onUpdated, onUnmounted, onBeforeMount, etc.`,
      code: `<script setup>
import { onMounted, onUpdated, onUnmounted, onBeforeUnmount } from 'vue'

onMounted(() => {
  // DOM is ready — fetch data, set up subscriptions, add event listeners
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUpdated(() => {
  // Called after reactive data change caused a re-render
  // Be careful — can cause infinite loops if you modify reactive data here
})

onBeforeUnmount(() => {
  // Clean up before component is destroyed
  window.removeEventListener('resize', handleResize)
  clearInterval(timer)
})

onUnmounted(() => {
  // Component is destroyed — final cleanup
})
</script>`,
      interviewQ: 'Where do you fetch data in a Vue component and why?',
      interviewA: `In onMounted — that's when the component is attached to the DOM and ready to receive data. You could fetch in created (before mount) but the DOM isn't ready yet which matters if you need to manipulate it post-fetch. For server-side rendering with Nuxt, you'd use useFetch or useAsyncData composables instead, since onMounted doesn't run on the server.`,
    },
    {
      id: 'computed-watch',
      title: 'computed vs watch vs watchEffect',
      difficulty: 'medium',
      explanation: `computed: derived state, cached, returns a value. Only re-runs when its reactive dependencies change.

watch: observe specific reactive source, run a callback with old and new values. Good for side effects in response to specific data changes.

watchEffect: auto-tracks all reactive dependencies used inside it. Runs immediately and re-runs when any dependency changes.`,
      code: `// computed — derived, cached, always returns value
const fullName = computed(() => \`\${firstName.value} \${lastName.value}\`)

// watch — specific source, explicit, old + new values
watch(userId, async (newId, oldId) => {
  // Only runs when userId changes
  await fetchUserById(newId)
}, { immediate: true })  // immediate: run on first render too

// watch multiple sources
watch([firstName, lastName], ([newFirst, newLast]) => {
  console.log('name changed:', newFirst, newLast)
})

// watchEffect — auto-tracks, runs immediately
watchEffect(() => {
  // Vue tracks that this reads userId and searchTerm
  fetchResults(userId.value, searchTerm.value)
  // Runs whenever either changes
})`,
      interviewQ: 'When would you use watch vs watchEffect?',
      interviewA: `Use watch when you need the old value, need to watch specific sources explicitly, or need lazy execution (watchEffect always runs immediately). Use watchEffect when you want Vue to automatically track dependencies — good for effects that read multiple reactive values. I tend to use watch more in practice because it's more explicit about what triggers the effect, which makes the code easier to reason about.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. What is the difference between v-show and v-if?', a: `v-if conditionally renders — the element is added/removed from the DOM. v-show always renders but toggles display:none. Use v-if when the condition rarely changes (saves initial render cost). Use v-show when toggling frequently — avoids DOM insertion/deletion overhead. For a modal that opens/closes often, v-show. For content that renders based on user role and doesn't change, v-if.` },
    { q: 'Q2. What is a Vue composable and how does it differ from a mixin?', a: `A composable is a function using Composition API to encapsulate and reuse stateful logic. Unlike mixins, composables have clear input/output — no magic property injection, no naming conflicts, and full TypeScript support. For example, I extracted our dual-session detection logic into a useSessionGuard composable that any login component can import and use without duplicating code.` },
    { q: 'Q3. How do you pass data between parent and child in Vue?', a: `Parent to child: props. Child to parent: emit. For deeply nested or sibling components: Vuex store or provide/inject. provide/inject is Vue's context API equivalent — the parent provides a value, any descendant can inject it without prop drilling through every level.` },
    { q: 'Q4. What is the key attribute in v-for and why is it required?', a: `key gives Vue a stable identity for each list item so it can track additions, removals, and reorders efficiently. Without key, Vue reuses existing DOM nodes by position which causes bugs when items move. Always use the item's unique ID as key, never the array index — index changes when items are added or removed, defeating the purpose.` },
    { q: 'Q5. How did you handle the dual-session prevention in TalentFind with Vue?', a: `When the login API returned has_existing_session: true, I showed a CModal asking the user to confirm logout of the other session. The tricky part was the button styling — STM's global SCSS was overriding CoreUI's small button with min-width: 150px. Fixed it with a non-scoped style block targeting .modal-footer .btn with !important overrides. The actual dual-session logic used Vuex actions: confirmDualLogin and cancelDualLogin.` },
    { q: 'Q6. What is Vue\'s provide/inject and when would you use it?', a: `provide/inject is Vue's way to pass data deeply without prop drilling. A parent provides a value, any descendant can inject it — skipping all intermediate components. I use it for things like a shared form state in a multi-step form where the parent form component provides the state object and each step injects it directly. Less boilerplate than threading props 3 levels deep.` },
    { q: 'Q7. How do you handle forms in Vue?', a: `v-model for two-way binding on inputs. For complex forms I use vee-validate or write custom composables. In TalentFind I used Vuelidate for form validation — it integrates nicely with reactive state and gives field-level validation status. For file uploads I used a custom useFileUpload composable that handled validation, upload progress, and S3 presigned URL flow.` },
    { q: 'Q8. What is Vuex module and when do you split into modules?', a: `When the store grows large, you split it into modules — each module has its own state, mutations, actions, and getters. With namespaced: true, you dispatch like store.dispatch('auth/login') instead of store.dispatch('login'). I split TalentFind's store into auth, candidates, jobs, and notifications modules. Kept each file focused and made it easy to find where a specific piece of state lives.` },
    { q: 'Q9. How do you optimize Vue app performance?', a: `Key techniques: lazy load routes with defineAsyncComponent, use v-show for frequently toggled elements, avoid expensive computations in templates (use computed instead), use shallowRef/shallowReactive for large objects where deep reactivity isn't needed, and virtual scrolling for long lists. In TalentFind we also split vendor chunks in vite.config to reduce initial bundle size.` },
    { q: 'Q10. How does Vue 3 handle TypeScript compared to Vue 2?', a: `Much better. Script setup with defineProps<{...}>() and defineEmits<{...}>() gives full type inference. Composition API is just plain TypeScript functions — no "this" typing issues. In Vue 2 you needed vue-class-component decorator to get decent TS support. Now I write all Vue 3 components in TypeScript by default — the editor catches prop type mismatches and missing required props at development time.` },
  ]
}
