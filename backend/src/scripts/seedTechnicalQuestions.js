import { pool } from '../config/db.js';

/**
 * Seed technical interview questions
 * This script populates the technical_questions table with sample questions
 */

const sampleQuestions = [
  // Data Structures
  {
    question_text: "What is a binary search tree and what are its key properties? How does it differ from a regular binary tree?",
    topic: "Data Structures",
    difficulty: "medium",
    expected_concepts: ["binary tree", "BST properties", "left subtree", "right subtree", "ordering"],
    time_limit_seconds: 300
  },
  {
    question_text: "Explain what a hash table is and how it works. What is collision resolution and what are some common strategies to handle collisions?",
    topic: "Data Structures",
    difficulty: "medium",
    expected_concepts: ["hash function", "key-value pairs", "collision", "chaining", "open addressing"],
    time_limit_seconds: 300
  },
  {
    question_text: "What is the difference between a stack and a queue? Provide real-world examples where each would be most appropriate.",
    topic: "Data Structures",
    difficulty: "easy",
    expected_concepts: ["LIFO", "FIFO", "push", "pop", "enqueue", "dequeue"],
    time_limit_seconds: 240
  },
  {
    question_text: "Explain the concept of a linked list. What are the advantages and disadvantages compared to arrays?",
    topic: "Data Structures",
    difficulty: "easy",
    expected_concepts: ["nodes", "pointers", "dynamic memory", "traversal", "insertion"],
    time_limit_seconds: 240
  },

  // Algorithms
  {
    question_text: "Explain the difference between breadth-first search (BFS) and depth-first search (DFS). When would you use one over the other?",
    topic: "Algorithms",
    difficulty: "medium",
    expected_concepts: ["graph traversal", "queue", "stack", "shortest path", "level-order"],
    time_limit_seconds: 300
  },
  {
    question_text: "What is dynamic programming? Explain with an example how it differs from a recursive approach.",
    topic: "Algorithms",
    difficulty: "hard",
    expected_concepts: ["memoization", "optimal substructure", "overlapping subproblems", "bottom-up"],
    time_limit_seconds: 360
  },
  {
    question_text: "Explain the QuickSort algorithm. What is its average and worst-case time complexity?",
    topic: "Algorithms",
    difficulty: "medium",
    expected_concepts: ["divide and conquer", "pivot", "partitioning", "O(n log n)", "O(n²)"],
    time_limit_seconds: 300
  },
  {
    question_text: "What is binary search? What are the prerequisites for using binary search on a dataset?",
    topic: "Algorithms",
    difficulty: "easy",
    expected_concepts: ["sorted array", "divide and conquer", "O(log n)", "midpoint"],
    time_limit_seconds: 240
  },

  // Object-Oriented Programming
  {
    question_text: "Explain the four pillars of object-oriented programming: encapsulation, inheritance, polymorphism, and abstraction.",
    topic: "OOP",
    difficulty: "medium",
    expected_concepts: ["encapsulation", "inheritance", "polymorphism", "abstraction", "data hiding"],
    time_limit_seconds: 360
  },
  {
    question_text: "What is the difference between abstract classes and interfaces? When would you use one over the other?",
    topic: "OOP",
    difficulty: "medium",
    expected_concepts: ["abstract class", "interface", "implementation", "multiple inheritance"],
    time_limit_seconds: 300
  },
  {
    question_text: "Explain method overloading and method overriding. How are they different?",
    topic: "OOP",
    difficulty: "easy",
    expected_concepts: ["compile-time", "runtime", "polymorphism", "signature"],
    time_limit_seconds: 240
  },

  // System Design
  {
    question_text: "Explain what a load balancer is and why it's important in system design. What are some common load balancing algorithms?",
    topic: "System Design",
    difficulty: "medium",
    expected_concepts: ["scalability", "distribution", "round-robin", "least connections", "availability"],
    time_limit_seconds: 300
  },
  {
    question_text: "What is caching and why is it important? Explain different caching strategies like LRU, LFU, and FIFO.",
    topic: "System Design",
    difficulty: "medium",
    expected_concepts: ["cache", "performance", "LRU", "LFU", "eviction policy"],
    time_limit_seconds: 300
  },
  {
    question_text: "Explain the difference between SQL and NoSQL databases. When would you choose one over the other?",
    topic: "System Design",
    difficulty: "medium",
    expected_concepts: ["relational", "document store", "ACID", "scalability", "schema"],
    time_limit_seconds: 300
  },
  {
    question_text: "What is horizontal scaling vs vertical scaling? What are the trade-offs?",
    topic: "System Design",
    difficulty: "easy",
    expected_concepts: ["scale out", "scale up", "distributed systems", "cost", "complexity"],
    time_limit_seconds: 240
  },

  // Web Development
  {
    question_text: "Explain the difference between REST and GraphQL. What are the advantages and disadvantages of each?",
    topic: "Web Development",
    difficulty: "medium",
    expected_concepts: ["REST", "GraphQL", "endpoints", "query language", "over-fetching"],
    time_limit_seconds: 300
  },
  {
    question_text: "What is CORS (Cross-Origin Resource Sharing) and why is it important for web security?",
    topic: "Web Development",
    difficulty: "medium",
    expected_concepts: ["same-origin policy", "security", "headers", "preflight request"],
    time_limit_seconds: 300
  },
  {
    question_text: "Explain the difference between synchronous and asynchronous programming. How do callbacks, promises, and async/await relate to this?",
    topic: "Web Development",
    difficulty: "medium",
    expected_concepts: ["blocking", "non-blocking", "callbacks", "promises", "async/await"],
    time_limit_seconds: 300
  },
  {
    question_text: "What is the difference between authentication and authorization? Explain with examples.",
    topic: "Web Development",
    difficulty: "easy",
    expected_concepts: ["authentication", "authorization", "identity", "permissions", "JWT"],
    time_limit_seconds: 240
  },

  // Database
  {
    question_text: "Explain database normalization. What are the different normal forms and why are they important?",
    topic: "Database",
    difficulty: "hard",
    expected_concepts: ["normalization", "1NF", "2NF", "3NF", "redundancy", "dependency"],
    time_limit_seconds: 360
  },
  {
    question_text: "What is a database index? How does it improve query performance and what are the trade-offs?",
    topic: "Database",
    difficulty: "medium",
    expected_concepts: ["index", "B-tree", "query optimization", "write performance", "storage"],
    time_limit_seconds: 300
  },
  {
    question_text: "Explain ACID properties in databases. Why are they important for transaction management?",
    topic: "Database",
    difficulty: "medium",
    expected_concepts: ["atomicity", "consistency", "isolation", "durability", "transactions"],
    time_limit_seconds: 300
  },
  {
    question_text: "What is a database transaction? Explain the concept of rollback and commit.",
    topic: "Database",
    difficulty: "easy",
    expected_concepts: ["transaction", "commit", "rollback", "atomic operation"],
    time_limit_seconds: 240
  },

  // Operating Systems
  {
    question_text: "Explain the difference between a process and a thread. What are the advantages of using threads?",
    topic: "Operating Systems",
    difficulty: "medium",
    expected_concepts: ["process", "thread", "memory space", "context switching", "concurrency"],
    time_limit_seconds: 300
  },
  {
    question_text: "What is a deadlock? What are the four necessary conditions for a deadlock to occur?",
    topic: "Operating Systems",
    difficulty: "hard",
    expected_concepts: ["deadlock", "mutual exclusion", "hold and wait", "no preemption", "circular wait"],
    time_limit_seconds: 360
  },
  {
    question_text: "Explain virtual memory and why it's useful. What is paging?",
    topic: "Operating Systems",
    difficulty: "medium",
    expected_concepts: ["virtual memory", "physical memory", "paging", "page table", "address translation"],
    time_limit_seconds: 300
  }
];

const seedTechnicalQuestions = async () => {
  const client = await pool.connect();
  try {
    console.log('Seeding technical interview questions...');

    // Check if questions already exist
    const existingCount = await client.query('SELECT COUNT(*) FROM technical_questions');
    if (parseInt(existingCount.rows[0].count) > 0) {
      console.log(`Found ${existingCount.rows[0].count} existing questions. Skipping seed.`);
      console.log('To reseed, delete existing questions first: DELETE FROM technical_questions;');
      return;
    }

    // Insert questions
    let insertedCount = 0;
    for (const question of sampleQuestions) {
      await client.query(
        `INSERT INTO technical_questions 
         (question_text, topic, difficulty, expected_concepts, time_limit_seconds)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          question.question_text,
          question.topic,
          question.difficulty,
          question.expected_concepts,
          question.time_limit_seconds
        ]
      );
      insertedCount++;
    }

    console.log(`✅ Successfully seeded ${insertedCount} technical questions!`);

    // Show statistics
    const stats = await client.query(`
      SELECT topic, difficulty, COUNT(*) as count
      FROM technical_questions
      GROUP BY topic, difficulty
      ORDER BY topic, difficulty
    `);

    console.log('\nQuestion Statistics:');
    console.table(stats.rows);

  } catch (error) {
    console.error('Error seeding technical questions:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the seed
seedTechnicalQuestions()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
