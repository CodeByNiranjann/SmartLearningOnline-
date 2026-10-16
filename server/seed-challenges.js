import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingChallenge from './models/CodingChallenge.js';

dotenv.config();

const challenges = [
  {
    title: 'Two Sum',
    description: 'Find two numbers in an array that add up to a specific target and return their indices.',
    problemStatement: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the same element twice.

You can return the answer in any order.`,
    category: 'Data Structures & Algorithms',
    difficulty: 'Easy',
    tags: ['Arrays', 'Hash Table', 'Placement Prep', 'FAANG'],
    companyTags: ['Google', 'Amazon', 'Microsoft', 'Adobe'],
    points: 10,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    examples: [
      {
        input: '[2,7,11,15], 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: '[3,2,4], 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
    ],
    testCases: [
      {
        input: '[[2,7,11,15], 9]',
        expectedOutput: '[0,1]',
        isHidden: false,
        explanation: 'Basic test case',
      },
      {
        input: '[[3,2,4], 6]',
        expectedOutput: '[1,2]',
        isHidden: false,
        explanation: 'Unordered indices',
      },
      {
        input: '[[3,3], 6]',
        expectedOutput: '[0,1]',
        isHidden: true,
        explanation: 'Duplicate values',
      },
      {
        input: '[[-1,-2,-3,-4,-5], -8]',
        expectedOutput: '[2,4]',
        isHidden: true,
        explanation: 'Negative values',
      },
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
  // Write your code here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      python: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
    },
    solution: {
      javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      python: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []`,
    },
    hints: [
      'A brute force approach would be to check all pairs O(n²), can we do better using extra space?',
      'Can you use a Hash Map to check in O(1) if the complement (target - current) has already been seen?',
    ],
    approachExplanation: 'Use a hash map to store the value and its index as you iterate through the list. For each element, check if (target - num) exists in the map.',
    timeComplexity: 'O(n) - Single pass through the array',
    spaceComplexity: 'O(n) - Space used by the hash map',
  },
  {
    title: 'Valid Parentheses',
    description: 'Determine if an input string with brackets "()[]{}" is valid and properly closed.',
    problemStatement: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    category: 'Data Structures & Algorithms',
    difficulty: 'Easy',
    tags: ['Stack', 'Strings', 'Placement Prep'],
    companyTags: ['Amazon', 'Facebook', 'Bloomberg'],
    points: 10,
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only "()[]{}"',
    ],
    examples: [
      {
        input: '"()"',
        output: 'true',
        explanation: 'Simple valid pair.',
      },
      {
        input: '"()[]{}"',
        output: 'true',
        explanation: 'Multiple valid pairs.',
      },
      {
        input: '"(]"',
        output: 'false',
        explanation: 'Mismatched closing bracket.',
      },
    ],
    testCases: [
      {
        input: '["()"]',
        expectedOutput: 'true',
        isHidden: false,
      },
      {
        input: '["()[]{}"]',
        expectedOutput: 'true',
        isHidden: false,
      },
      {
        input: '["(]"]',
        expectedOutput: 'false',
        isHidden: false,
      },
      {
        input: '["{[]}"]',
        expectedOutput: 'true',
        isHidden: true,
      },
      {
        input: '["([)]"]',
        expectedOutput: 'false',
        isHidden: true,
      },
    ],
    starterCode: {
      javascript: `function isValid(s) {
  // Write your code here
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}`,
    },
    hints: [
      'Consider using a Last-In-First-Out (LIFO) data structure like a Stack.',
      'Whenever you encounter a closing bracket, the top of the stack must be its matching opener.',
    ],
    approachExplanation: 'Push openers onto a stack. When encountering a closer, pop and verify matching type. If stack is empty at the end, it is valid.',
    timeComplexity: 'O(n) - Single scan over string',
    spaceComplexity: 'O(n) - Stack stores open brackets',
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Find the length of the longest substring with unique characters using sliding window.',
    problemStatement: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.`,
    category: 'Algorithms',
    difficulty: 'Medium',
    tags: ['Sliding Window', 'Strings', 'Hash Table'],
    companyTags: ['Amazon', 'Google', 'Microsoft', 'Uber'],
    points: 20,
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    examples: [
      {
        input: '"abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: '"bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: '"pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with length 3.',
      },
    ],
    testCases: [
      {
        input: '["abcabcbb"]',
        expectedOutput: '3',
        isHidden: false,
      },
      {
        input: '["bbbbb"]',
        expectedOutput: '1',
        isHidden: false,
      },
      {
        input: '["pwwkew"]',
        expectedOutput: '3',
        isHidden: false,
      },
      {
        input: '[""]',
        expectedOutput: '0',
        isHidden: true,
      },
      {
        input: '["dvdf"]',
        expectedOutput: '3',
        isHidden: true,
      },
    ],
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {
  // Write your code here
  let maxLen = 0;
  let start = 0;
  const seen = new Map();

  for (let end = 0; end < s.length; end++) {
    const char = s[end];
    if (seen.has(char) && seen.get(char) >= start) {
      start = seen.get(char) + 1;
    }
    seen.set(char, end);
    maxLen = Math.max(maxLen, end - start + 1);
  }

  return maxLen;
}`,
    },
    hints: [
      'Use a sliding window defined by two pointers `start` and `end`.',
      'Record the most recent index where each character appeared.',
    ],
    approachExplanation: 'Move right pointer, and if character was already observed in current window, bump left pointer to index + 1.',
    timeComplexity: 'O(n) - Single pass',
    spaceComplexity: 'O(min(m, n)) - Set / Map bounded by alphabet size',
  },
  {
    title: 'Merge Two Sorted Lists',
    description: 'Merge two sorted arrays / lists into a single sorted array.',
    problemStatement: `You are given two sorted arrays of integers \`list1\` and \`list2\`.

Merge the two arrays into one sorted array and return it. The array should be made by splicing together the elements of the first two arrays.`,
    category: 'Data Structures & Algorithms',
    difficulty: 'Easy',
    tags: ['Two Pointers', 'Arrays', 'Sorting'],
    companyTags: ['Microsoft', 'Apple', 'Goldman Sachs'],
    points: 10,
    constraints: [
      'The number of elements in both lists is in the range [0, 50].',
      '-100 <= Node.val <= 100',
      'Both list1 and list2 are sorted in non-decreasing order.',
    ],
    examples: [
      {
        input: '[1,2,4], [1,3,4]',
        output: '[1,1,2,3,4,4]',
      },
    ],
    testCases: [
      {
        input: '[[1,2,4], [1,3,4]]',
        expectedOutput: '[1,1,2,3,4,4]',
        isHidden: false,
      },
      {
        input: '[[], []]',
        expectedOutput: '[]',
        isHidden: false,
      },
      {
        input: '[[], [0]]',
        expectedOutput: '[0]',
        isHidden: true,
      },
    ],
    starterCode: {
      javascript: `function mergeTwoLists(list1, list2) {
  // Write your code here
  const result = [];
  let i = 0, j = 0;
  while (i < list1.length && j < list2.length) {
    if (list1[i] <= list2[j]) {
      result.push(list1[i++]);
    } else {
      result.push(list2[j++]);
    }
  }
  while (i < list1.length) result.push(list1[i++]);
  while (j < list2.length) result.push(list2[j++]);
  return result;
}`,
    },
    hints: [
      'Maintain two pointers at the start of each list.',
      'Pick the smaller element each step.',
    ],
    approachExplanation: 'Two pointers traverse both arrays in tandem, appending smaller elements.',
    timeComplexity: 'O(n + m)',
    spaceComplexity: 'O(n + m)',
  },
  {
    title: 'Maximum Subarray (Kadane Algorithm)',
    description: 'Find the contiguous subarray with the largest sum and return its sum.',
    problemStatement: `Given an integer array \`nums\`, find the subarray with the largest sum, and return *its sum*.`,
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'Arrays', 'Kadane', 'FAANG'],
    companyTags: ['Amazon', 'Microsoft', 'Google', 'Cisco'],
    points: 20,
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    examples: [
      {
        input: '[-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
      {
        input: '[1]',
        output: '1',
      },
      {
        input: '[5,4,-1,7,8]',
        output: '23',
      },
    ],
    testCases: [
      {
        input: '[[-2,1,-3,4,-1,2,1,-5,4]]',
        expectedOutput: '6',
        isHidden: false,
      },
      {
        input: '[[1]]',
        expectedOutput: '1',
        isHidden: false,
      },
      {
        input: '[[5,4,-1,7,8]]',
        expectedOutput: '23',
        isHidden: false,
      },
      {
        input: '[[-1,-2,-3]]',
        expectedOutput: '-1',
        isHidden: true,
      },
    ],
    starterCode: {
      javascript: `function maxSubArray(nums) {
  // Write your code here
  let currentSum = nums[0];
  let maxSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}`,
    },
    hints: [
      'Think about whether extending the previous subarray helps or if starting fresh at the current element is better.',
      'Kadane algorithm: at each position i, currentMax = max(nums[i], currentMax + nums[i]).',
    ],
    approachExplanation: 'Dynamic programming / Kadane’s: decide at each index whether to extend or reset.',
    timeComplexity: 'O(n) - Single linear pass',
    spaceComplexity: 'O(1) - Constant variables',
  },
  {
    title: 'Trapping Rain Water',
    description: 'Calculate how much water an elevation map can trap after raining.',
    problemStatement: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    category: 'Data Structures & Algorithms',
    difficulty: 'Hard',
    tags: ['Two Pointers', 'Dynamic Programming', 'Stack', 'Placement Prep'],
    companyTags: ['Google', 'Amazon', 'Facebook', 'Goldman Sachs'],
    points: 30,
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5',
    ],
    examples: [
      {
        input: '[0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The above elevation map can trap 6 units of rain water.',
      },
      {
        input: '[4,2,0,3,2,5]',
        output: '9',
      },
    ],
    testCases: [
      {
        input: '[[0,1,0,2,1,0,1,3,2,1,2,1]]',
        expectedOutput: '6',
        isHidden: false,
      },
      {
        input: '[[4,2,0,3,2,5]]',
        expectedOutput: '9',
        isHidden: false,
      },
      {
        input: '[[3,0,2,0,4]]',
        expectedOutput: '7',
        isHidden: true,
      },
    ],
    starterCode: {
      javascript: `function trap(height) {
  // Write your code here
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let water = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        water += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        water += rightMax - height[right];
      }
      right--;
    }
  }
  return water;
}`,
    },
    hints: [
      'At each index, trapped water is bounded by min(max_left, max_right) - height[i].',
      'Can you compute this with two pointers starting from ends?',
    ],
    approachExplanation: 'Two pointers moving inward keep track of highest walls on left and right sides.',
    timeComplexity: 'O(n) - Single traversal',
    spaceComplexity: 'O(1) - In-place two pointers',
  },
];

const seedChallenges = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/student-learning-platform';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for coding challenges seed');

    await CodingChallenge.deleteMany({});
    console.log('Cleared existing coding challenges');

    const created = await CodingChallenge.insertMany(challenges);
    console.log(`Seeded ${created.length} coding challenges successfully!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding challenges:', error);
    process.exit(1);
  }
};

seedChallenges();
