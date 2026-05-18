export const day8 = {
  id: 8,
  title: 'DSA Part 1',
  subtitle: 'Arrays, strings, hash maps, two pointers, sliding window',
  concepts: [
    {
      id: 'arrays-strings',
      title: 'Arrays & Strings — Core Patterns',
      difficulty: 'medium',
      explanation: `Most array/string problems fall into a small set of patterns:

1. Two pointers — one from each end, or fast/slow pointer
2. Sliding window — subarray of variable or fixed size
3. Prefix sums — precompute cumulative sums for range queries
4. Hash map — trade space for O(1) lookups

Time complexity cheat sheet:
• Array access: O(1)
• Array search: O(n)
• Sort: O(n log n)
• Hash map get/set: O(1) average`,
      code: `// Two Sum — classic hash map O(n)
function twoSum(nums, target) {
  const map = new Map()  // value → index
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (map.has(complement)) return [map.get(complement), i]
    map.set(nums[i], i)
  }
}

// Valid Anagram — frequency map
function isAnagram(s, t) {
  if (s.length !== t.length) return false
  const freq = {}
  for (const c of s) freq[c] = (freq[c] || 0) + 1
  for (const c of t) {
    if (!freq[c]) return false
    freq[c]--
  }
  return true
}

// Prefix sum — range sum query O(1) after O(n) build
function buildPrefix(nums) {
  const prefix = [0]
  for (const n of nums) prefix.push(prefix.at(-1) + n)
  return prefix
}
// Sum from index l to r inclusive:
// prefix[r+1] - prefix[l]`,
      interviewQ: 'What is your approach when you see an array problem?',
      interviewA: `First I check if sorting helps — sorted arrays unlock two-pointer and binary search. Then I check if a hash map would help — if I'm looking for pairs or complements. If it's a subarray problem I think sliding window. If I need range sums, prefix sum. I try to name the pattern before writing code — it's much easier to implement once you know which template to apply.`,
    },
    {
      id: 'sliding-window',
      title: 'Sliding Window Pattern',
      difficulty: 'medium',
      explanation: `Sliding window is for contiguous subarrays or substrings. Two variants:

Fixed window: window size is constant, slide it across.
Variable window: expand right pointer, shrink left pointer when condition breaks.

Recognize the pattern when: "find longest/shortest subarray that satisfies condition", "find all substrings of size k".`,
      code: `// Longest substring without repeating characters
// Variable sliding window — O(n)
function lengthOfLongestSubstring(s) {
  const seen = new Set()
  let left = 0, maxLen = 0

  for (let right = 0; right < s.length; right++) {
    // Shrink from left until no duplicate
    while (seen.has(s[right])) {
      seen.delete(s[left])
      left++
    }
    seen.add(s[right])
    maxLen = Math.max(maxLen, right - left + 1)
  }
  return maxLen
}

// Maximum sum of subarray of size k
// Fixed sliding window — O(n)
function maxSubarraySum(nums, k) {
  let windowSum = nums.slice(0, k).reduce((a, b) => a + b, 0)
  let maxSum = windowSum

  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k]  // add new, drop old
    maxSum = Math.max(maxSum, windowSum)
  }
  return maxSum
}`,
      interviewQ: 'How do you know when to use sliding window vs two pointers?',
      interviewA: `Sliding window is specifically for contiguous subarrays or substrings. Two pointers is broader — works for sorted arrays, linked lists, problems where you're comparing elements from both ends. The overlap is when you have a window that expands and contracts, which is technically two pointers. I think of sliding window as a special case of two pointers where both move in the same direction.`,
    },
    {
      id: 'hash-maps',
      title: 'Hash Maps & Sets — When to Use Them',
      difficulty: 'easy',
      explanation: `Hash maps are your go-to when you need O(1) lookup. Common use cases:
• Count frequencies (char count, word count)
• Check if element was seen before
• Store parent/previous in path-finding
• Group elements by a property

JavaScript: use Map for key-value, Set for unique values.
Prefer Map over plain object when keys are non-strings or insertion order matters.`,
      code: `// Group anagrams — O(n * m) where m is string length
function groupAnagrams(strs) {
  const map = new Map()
  for (const str of strs) {
    const key = str.split('').sort().join('')  // sorted chars as key
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(str)
  }
  return [...map.values()]
}

// First non-repeating character
function firstUniqChar(s) {
  const freq = new Map()
  for (const c of s) freq.set(c, (freq.get(c) || 0) + 1)
  for (let i = 0; i < s.length; i++) {
    if (freq.get(s[i]) === 1) return i
  }
  return -1
}

// Subarray sum equals K (prefix sum + hash map)
function subarraySum(nums, k) {
  const map = new Map([[0, 1]])  // prefix sum → count
  let sum = 0, count = 0
  for (const num of nums) {
    sum += num
    count += map.get(sum - k) || 0
    map.set(sum, (map.get(sum) || 0) + 1)
  }
  return count
}`,
      interviewQ: 'When would you use a Set instead of a Map?',
      interviewA: `Set when you only care about existence — "have I seen this element?" Map when you need to store associated data — "how many times have I seen it?" or "what index was it at?". For detecting duplicates in an array, Set is perfect. For counting frequencies or storing pairs, Map. Sets also give you intersection and union operations easily which are handy for certain problems.`,
    },
    {
      id: 'binary-search',
      title: 'Binary Search — Beyond Simple Search',
      difficulty: 'hard',
      explanation: `Binary search runs on any sorted array in O(log n). The template is always the same — the trick is figuring out what condition to binary search on.

Advanced uses:
• Search in rotated sorted array
• Find first/last occurrence
• Search on answer space (binary search on the answer, not the array)

Key: always define what left and right represent, and what condition moves each pointer.`,
      code: `// Classic binary search
function binarySearch(nums, target) {
  let left = 0, right = nums.length - 1
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2)  // avoid overflow
    if (nums[mid] === target) return mid
    else if (nums[mid] < target) left = mid + 1
    else right = mid - 1
  }
  return -1
}

// Find first occurrence (leftmost)
function firstOccurrence(nums, target) {
  let left = 0, right = nums.length - 1, result = -1
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2)
    if (nums[mid] === target) {
      result = mid
      right = mid - 1  // keep searching left
    } else if (nums[mid] < target) left = mid + 1
    else right = mid - 1
  }
  return result
}

// Search in rotated sorted array
function searchRotated(nums, target) {
  let left = 0, right = nums.length - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (nums[mid] === target) return mid
    // Left half is sorted
    if (nums[left] <= nums[mid]) {
      if (target >= nums[left] && target < nums[mid]) right = mid - 1
      else left = mid + 1
    } else {  // Right half is sorted
      if (target > nums[mid] && target <= nums[right]) left = mid + 1
      else right = mid - 1
    }
  }
  return -1
}`,
      interviewQ: 'What does "binary search on the answer" mean?',
      interviewA: `Instead of searching for a value in an array, you binary search on the range of possible answers. Classic example: "find the minimum capacity of a ship that can ship all packages in D days." The answer is between max(packages) and sum(packages). For each candidate capacity, check if it's feasible. Binary search to find the minimum feasible value. I find it once you spot that the feasibility check is monotonic — if capacity X works, X+1 also works — binary search is applicable.`,
    },
    {
      id: 'sorting',
      title: 'Sorting Algorithms — What Matters in Interviews',
      difficulty: 'medium',
      explanation: `You won't implement merge sort in a real interview but you need to know the concepts.

• Quicksort: O(n log n) avg, O(n²) worst. In-place. What JavaScript uses.
• Mergesort: O(n log n) always. Stable. Extra space O(n).
• Heapsort: O(n log n). In-place but not stable.
• Counting sort: O(n + k) when range is small (k = max value).

For most problems: just use .sort() and explain you know it's O(n log n). Interviewers want the algorithm around sorting, not the sort itself.`,
      code: `// Merge sort — classic divide and conquer
function mergeSort(arr) {
  if (arr.length <= 1) return arr
  const mid = Math.floor(arr.length / 2)
  const left = mergeSort(arr.slice(0, mid))
  const right = mergeSort(arr.slice(mid))
  return merge(left, right)
}

function merge(left, right) {
  const result = []
  let i = 0, j = 0
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++])
    else result.push(right[j++])
  }
  return [...result, ...left.slice(i), ...right.slice(j)]
}

// Custom sort — sort by multiple criteria
const candidates = [
  { name: 'Jay', score: 85 },
  { name: 'Ali', score: 92 },
  { name: 'Sam', score: 85 }
]
candidates.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score  // desc by score
  return a.name.localeCompare(b.name)               // asc by name if tie
})`,
      interviewQ: 'Why is quicksort preferred over mergesort in most implementations?',
      interviewA: `Quicksort is in-place — O(log n) space for the call stack vs O(n) extra space for mergesort. In practice, cache performance is also better because quicksort works on contiguous sections of the original array. The O(n²) worst case is avoided with good pivot selection (median-of-three or random pivot). For stable sort requirements — like sorting objects where equal elements must keep their original order — mergesort wins.`,
    },
  ],
  interviewQA: [
    { q: 'Q1. What is time and space complexity?', a: `Time complexity describes how the runtime grows relative to input size. Space complexity is the same for memory. O(1) is constant — doesn't grow. O(n) grows linearly. O(n²) grows quadratically — loops inside loops. O(log n) is halving the problem each step — binary search. When comparing solutions, you usually want to minimize time first, then space. Sometimes you trade space for time — that's what hash maps do.` },
    { q: 'Q2. How do you find duplicates in an array?', a: `Three approaches: sort and check adjacent elements O(n log n) space O(1), use a Set and check if element was already seen O(n) time and space, or use a hash map if you need to count occurrences. If the array contains integers in range 1 to n, you can use the array itself as a hash map with index tricks — O(n) time, O(1) space. Pick based on constraints.` },
    { q: 'Q3. What is the difference between a stack and a queue?', a: `Stack is LIFO — last in first out. Like a stack of plates, you add and remove from the top. Queue is FIFO — first in first out. Like a line, first person in is first to leave. Stack use cases: undo/redo, function call stack, matching brackets. Queue use cases: BFS traversal, job queues, print spoolers. In JavaScript, both can be implemented with arrays — stack uses push/pop, queue uses push/shift (or use a deque for O(1) operations).` },
    { q: 'Q4. How do you reverse a string in place?', a: `Two-pointer approach: one pointer at start, one at end, swap characters, move both inward. O(n) time, O(1) space. In JavaScript strings are immutable so you split to array first. split("").reverse().join("") is the one-liner but for an interview showing the two-pointer approach is better since it demonstrates the pattern.` },
    { q: 'Q5. What is a palindrome and how do you check for it?', a: `A palindrome reads the same forwards and backwards. For a string: two pointers from both ends, compare characters. If any mismatch, not a palindrome. For a linked list it's trickier — find the midpoint, reverse the second half, compare. Or copy to array and use two pointers. The two-pointer on a string is O(n) time, O(1) space.` },
    { q: 'Q6. How would you find the maximum subarray sum?', a: `Kadane's algorithm. Maintain a running sum — if adding the next element increases it, include it. If the running sum goes negative, reset to the current element (start fresh). Track the maximum seen so far. O(n) time, O(1) space. The insight is: a negative prefix can only hurt your sum, so restart whenever the running sum drops below 0.` },
    { q: 'Q7. How do you merge two sorted arrays?', a: `Two pointers, one in each array. Compare the current elements, take the smaller one, advance that pointer. When one array is exhausted, append the rest of the other. O(n + m) time where n and m are the two lengths. This is the merge step from mergesort. Important edge case: handle when one array runs out before the other.` },
    { q: 'Q8. What is the two-pointer pattern?', a: `Two pointers that move through the array — usually one from each end toward the middle, or both moving in the same direction at different speeds. Useful on sorted arrays for pair-sum problems, removing duplicates, or three-sum. For linked lists, fast and slow pointers detect cycles (Floyd's algorithm) or find the midpoint. The key is that two pointers avoid nested loops and get O(n) instead of O(n²).` },
    { q: 'Q9. How do you rotate an array by k positions?', a: `Classic trick: reverse the whole array, then reverse the first k elements, then reverse the remaining n-k elements. Three reverses total — O(n) time, O(1) space. Alternative is using extra array but that's O(n) space. The reverse trick is elegant once you see it. Make sure to handle k > n by doing k = k % n to avoid unnecessary full rotations.` },
    { q: 'Q10. What is the difference between Array.indexOf and Array.includes?', a: `indexOf returns the index of the element or -1 if not found. includes returns a boolean. Use includes when you just want to know if it's there — cleaner and more readable. Both are O(n). For frequent lookups, convert to a Set first — then .has() is O(1). This matters when you're checking membership inside a loop.` },
  ]
}
