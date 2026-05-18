export const day9 = {
  id: 9,
  title: 'DSA Part 2',
  subtitle: 'Trees, graphs, linked lists, dynamic programming, recursion',
  concepts: [
    {
      id: 'linked-lists',
      title: 'Linked Lists — Key Patterns',
      difficulty: 'medium',
      explanation: `Linked list patterns you need to know:
• Reversal — reverse the pointers
• Fast/slow pointers — cycle detection, find middle
• Merge sorted lists
• Remove Nth node from end

Always draw the pointer manipulation before coding. It's easy to lose track of which node is which.

Dummy node trick: prepend a dummy node to avoid edge cases at the head.`,
      code: `// Reverse a linked list — iterative
function reverseList(head) {
  let prev = null, curr = head
  while (curr) {
    const next = curr.next  // save next
    curr.next = prev        // reverse pointer
    prev = curr             // move prev forward
    curr = next             // move curr forward
  }
  return prev  // prev is the new head
}

// Detect cycle — Floyd's algorithm
function hasCycle(head) {
  let slow = head, fast = head
  while (fast && fast.next) {
    slow = slow.next
    fast = fast.next.next
    if (slow === fast) return true
  }
  return false
}

// Find middle node
function findMiddle(head) {
  let slow = head, fast = head
  while (fast && fast.next) {
    slow = slow.next
    fast = fast.next.next
  }
  return slow  // slow is at middle when fast reaches end
}

// Merge two sorted lists
function mergeTwoLists(l1, l2) {
  const dummy = { next: null }
  let curr = dummy
  while (l1 && l2) {
    if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next }
    else { curr.next = l2; l2 = l2.next }
    curr = curr.next
  }
  curr.next = l1 || l2
  return dummy.next
}`,
      interviewQ: 'How do you remove the Nth node from the end of a linked list?',
      interviewA: `Two-pointer trick. Move the fast pointer N+1 steps ahead. Then move both pointers until fast reaches null. At that point, slow is at the node just before the one to delete. Set slow.next = slow.next.next. One pass, O(n) time, O(1) space. The +1 is because we want slow to stop one node before the target, not on it, so we can do the deletion.`,
    },
    {
      id: 'trees',
      title: 'Binary Trees — Traversal & Patterns',
      difficulty: 'hard',
      explanation: `Binary tree traversals:
• Inorder (left, root, right) — gives sorted order for BST
• Preorder (root, left, right) — useful for copying trees
• Postorder (left, right, root) — useful for deleting trees
• Level order (BFS) — level by level using a queue

Most tree problems are solved with DFS (recursion) or BFS (queue). Think about what information you need to pass down (top-down) vs aggregate from children (bottom-up).`,
      code: `// DFS — recursive (most tree problems use this)
function maxDepth(root) {
  if (!root) return 0
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right))
}

// BFS — level order traversal
function levelOrder(root) {
  if (!root) return []
  const result = [], queue = [root]
  while (queue.length) {
    const level = []
    const size = queue.length  // process one level at a time
    for (let i = 0; i < size; i++) {
      const node = queue.shift()
      level.push(node.val)
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }
    result.push(level)
  }
  return result
}

// Validate BST — pass allowed range down
function isValidBST(root, min = -Infinity, max = Infinity) {
  if (!root) return true
  if (root.val <= min || root.val >= max) return false
  return isValidBST(root.left, min, root.val) &&
         isValidBST(root.right, root.val, max)
}

// Lowest Common Ancestor
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root
  const left = lowestCommonAncestor(root.left, p, q)
  const right = lowestCommonAncestor(root.right, p, q)
  return left && right ? root : left || right
}`,
      interviewQ: 'When do you use DFS vs BFS for tree problems?',
      interviewA: `BFS (level order) when the problem involves levels — "find the minimum depth", "return nodes level by level", "connect nodes at the same level". DFS when you're exploring paths or aggregating from children — "max depth", "path sum", "validate BST". DFS is usually simpler to write recursively. BFS needs an explicit queue but is iterative which avoids stack overflow on very deep trees.`,
    },
    {
      id: 'graphs',
      title: 'Graphs — BFS, DFS, Cycle Detection',
      difficulty: 'hard',
      explanation: `Graph representations:
• Adjacency list: { 0: [1, 2], 1: [3] } — space efficient for sparse graphs
• Adjacency matrix: grid[i][j] = 1 if edge — fast lookup for dense graphs

Key algorithms:
• BFS — shortest path in unweighted graph
• DFS — connected components, cycle detection, topological sort
• Union-Find — efficient connected components

Always track visited nodes to avoid infinite loops.`,
      code: `// BFS — shortest path
function bfs(graph, start, end) {
  const queue = [[start, 0]]  // [node, distance]
  const visited = new Set([start])

  while (queue.length) {
    const [node, dist] = queue.shift()
    if (node === end) return dist

    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push([neighbor, dist + 1])
      }
    }
  }
  return -1  // not reachable
}

// DFS — number of islands (grid graph)
function numIslands(grid) {
  let count = 0
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === '1') {
        count++
        dfs(grid, r, c)
      }
    }
  }
  return count
}

function dfs(grid, r, c) {
  if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] !== '1') return
  grid[r][c] = '0'  // mark visited
  dfs(grid, r+1, c); dfs(grid, r-1, c)
  dfs(grid, r, c+1); dfs(grid, r, c-1)
}`,
      interviewQ: 'How do you detect a cycle in a directed graph?',
      interviewA: `DFS with three states: unvisited, in current path (gray), and done (black). If you reach a gray node, there's a cycle — you've found a back edge. If you reach a black node, that path is already done, no cycle there. This is also how topological sort works — Kahn's algorithm uses in-degree counting instead, which is easier to implement iteratively. For undirected graphs, cycle detection is simpler — if you reach a visited node that isn't your parent, it's a cycle.`,
    },
    {
      id: 'dynamic-programming',
      title: 'Dynamic Programming — Core Patterns',
      difficulty: 'hard',
      explanation: `DP is just recursion + memoization (or bottom-up tabulation). Use it when:
• Problem has overlapping subproblems
• Problem has optimal substructure

Most DP problems follow one of these patterns:
• 1D DP: dp[i] depends on dp[i-1] or dp[i-2]
• 2D DP: dp[i][j] depends on neighbors
• Knapsack: include or exclude items
• String DP: LCS, edit distance

Start with recursion, memoize the overlapping calls.`,
      code: `// Fibonacci — bottom-up DP, O(n) time O(1) space
function fib(n) {
  if (n <= 1) return n
  let prev2 = 0, prev1 = 1
  for (let i = 2; i <= n; i++) {
    [prev2, prev1] = [prev1, prev1 + prev2]
  }
  return prev1
}

// Coin change — classic DP
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity)
  dp[0] = 0  // 0 coins needed to make 0
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) dp[i] = Math.min(dp[i], dp[i - coin] + 1)
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount]
}

// Longest Common Subsequence — 2D DP
function longestCommonSubsequence(text1, text2) {
  const m = text1.length, n = text2.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i-1] === text2[j-1]) dp[i][j] = dp[i-1][j-1] + 1
      else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1])
    }
  }
  return dp[m][n]
}`,
      interviewQ: 'How do you approach a DP problem you haven\'t seen before?',
      interviewA: `First try to write the recursive solution — what's the base case, what's the subproblem. If I see the same function called with the same arguments multiple times, that's the signal to memoize. Then I convert to bottom-up by filling a table from the smallest subproblem upward. The tricky part is defining what dp[i] or dp[i][j] represents — I write that in a comment before coding. Once the definition is clear, the transitions usually follow naturally.`,
    },
    {
      id: 'recursion',
      title: 'Recursion & Backtracking',
      difficulty: 'hard',
      explanation: `Backtracking is DFS on a decision tree. At each step you make a choice, recurse, then undo the choice (backtrack).

Use for: all permutations, all subsets, N-Queens, Sudoku solver.

Template:
1. Base case — record result
2. Try each choice
3. Recurse
4. Undo the choice`,
      code: `// All permutations of an array
function permutations(nums) {
  const result = []

  function backtrack(current, remaining) {
    if (remaining.length === 0) {
      result.push([...current])
      return
    }
    for (let i = 0; i < remaining.length; i++) {
      current.push(remaining[i])
      backtrack(current, remaining.filter((_, j) => j !== i))
      current.pop()  // undo
    }
  }

  backtrack([], nums)
  return result
}

// All subsets (power set)
function subsets(nums) {
  const result = []

  function backtrack(start, current) {
    result.push([...current])  // every state is a valid subset
    for (let i = start; i < nums.length; i++) {
      current.push(nums[i])
      backtrack(i + 1, current)
      current.pop()  // undo
    }
  }

  backtrack(0, [])
  return result
}

// Combination sum — can reuse elements
function combinationSum(candidates, target) {
  const result = []

  function backtrack(start, current, remaining) {
    if (remaining === 0) { result.push([...current]); return }
    if (remaining < 0) return
    for (let i = start; i < candidates.length; i++) {
      current.push(candidates[i])
      backtrack(i, current, remaining - candidates[i])  // i not i+1 (reuse)
      current.pop()
    }
  }

  backtrack(0, [], target)
  return result
}`,
      interviewQ: 'How is backtracking different from brute force?',
      interviewA: `Brute force generates all possibilities and filters. Backtracking prunes — it stops exploring a path as soon as it knows it can't lead to a valid solution. In combination sum, if the remaining target goes negative, we stop immediately instead of continuing to build that branch. This pruning is what makes backtracking practical. Worst case is still exponential but on real inputs it's much faster because large swaths of the search space get cut.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. What is a binary search tree and its time complexity?', a: `BST is a binary tree where every node's left subtree contains only smaller values and right subtree only larger values. Search, insert, delete are O(h) where h is the height. For a balanced BST, h = log n so O(log n). For a degenerate (linked-list-shaped) BST, h = n so O(n). Self-balancing trees like AVL or Red-Black maintain O(log n) by rebalancing on insert/delete.` },
    { q: 'Q2. What is a heap and when do you use it?', a: `A heap is a complete binary tree where the parent is always greater (max-heap) or smaller (min-heap) than its children. Get min/max: O(1). Insert: O(log n). Remove min/max: O(log n). Use a min-heap for: finding the Kth largest element, merging K sorted lists, Dijkstra's shortest path. JavaScript doesn't have a built-in heap — you'd use a sorted array for small inputs or implement one.` },
    { q: 'Q3. How does quicksort work?', a: `Pick a pivot, partition the array so all elements less than pivot go left, greater go right. Recursively sort left and right partitions. Average O(n log n) because each partition is roughly half. Worst case O(n²) when pivot is always the smallest or largest — random pivot or median-of-three avoids this. In-place, O(log n) space for call stack.` },
    { q: 'Q4. What is memoization?', a: `Caching the result of a function call so the same inputs don't get recomputed. For recursive functions with overlapping subproblems — like Fibonacci calling fib(3) 20 times — memoization makes it O(n) instead of O(2^n). You store results in a Map or object keyed by the inputs. Top-down DP is just recursion with memoization.` },
    { q: 'Q5. How would you implement a queue using two stacks?', a: `Stack 1 is the inbox, stack 2 is the outbox. Enqueue: push to stack 1. Dequeue: if stack 2 is empty, pop everything from stack 1 into stack 2 (reverses the order), then pop from stack 2. Amortized O(1) per operation — each element moves at most twice. This is the pattern Amazon SQS uses conceptually — one queue for writing, another for reading.` },
    { q: 'Q6. What is topological sort and when do you need it?', a: `Topological sort orders nodes in a directed acyclic graph so that all dependencies come before dependents. Classic use: task scheduling where task B depends on task A — A must come before B. Course prerequisites problem. Build systems. Two approaches: DFS (finish order reversed) or Kahn's algorithm (BFS using in-degree counts). Kahn's is easier to implement correctly in my experience.` },
    { q: 'Q7. How do you find the Kth largest element?', a: `Quickselect: partition like quicksort but only recurse into the side containing K. Average O(n), worst O(n²). Or use a min-heap of size K — push each element, if heap size exceeds K pop the minimum. After all elements, the top of the heap is the Kth largest. Heap approach is O(n log k) which is good when K is small. For a one-liner, sort and index from end — O(n log n) but fine for interviews.` },
    { q: 'Q8. What is Union-Find (Disjoint Set Union)?', a: `Data structure for tracking connected components efficiently. Two operations: find (which group does this belong to?) and union (merge two groups). With path compression and union by rank, both are nearly O(1) amortized. Used for: detecting cycles in undirected graphs, Kruskal's minimum spanning tree, connected components problems. It's faster than BFS/DFS for repeated connectivity queries.` },
    { q: 'Q9. How do you check if a binary tree is balanced?', a: `A tree is balanced if the height difference between left and right subtrees is at most 1, for every node. DFS from the bottom — compute height of each subtree. If any subtree is unbalanced, propagate -1 up as a flag. If both subtrees are balanced and the height difference is ≤ 1, return the actual height. O(n) time, O(h) space for the call stack.` },
    { q: 'Q10. What is the difference between a tree and a graph?', a: `A tree is a connected acyclic graph. Every tree is a graph, not every graph is a tree. Trees have exactly n-1 edges for n nodes, always connected, no cycles. Graphs can have cycles, disconnected components, and any number of edges. Binary trees add the constraint of at most 2 children per node. The algorithms overlap — tree DFS and BFS are just graph DFS/BFS on an acyclic connected graph.` },
  ]
}
