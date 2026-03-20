/**
 * Test script for Technical Interview API
 * 
 * Run with: node backend/test-technical-interview.js
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Test configuration
let testToken = '';
let testJobId = '';
let testAttemptId = '';
let testQuestionId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}\n`)
};

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testHealthCheck() {
  log.section('Health Check Tests');
  
  try {
    const backendHealth = await axios.get(`${API_URL}/health`);
    if (backendHealth.data.status === 'ok') {
      log.success('Backend is healthy');
    } else {
      throw new Error('Backend health check failed');
    }
  } catch (error) {
    log.error(`Backend health check failed: ${error.message}`);
    return false;
  }

  try {
    const aiHealth = await axios.get(`${AI_SERVICE_URL}/ai/technical/health`);
    if (aiHealth.data.status === 'ok') {
      log.success('AI Service (Technical Interview) is healthy');
    } else {
      throw new Error('AI Service health check failed');
    }
  } catch (error) {
    log.error(`AI Service health check failed: ${error.message}`);
    log.warning('AI evaluation may fall back to heuristics');
  }

  return true;
}

async function testAuthentication() {
  log.section('Authentication Test');
  
  // Note: This assumes you have a test user in your database
  // You may need to create one first or update these credentials
  const testCredentials = {
    email: process.env.TEST_CANDIDATE_EMAIL || 'test@example.com',
    password: process.env.TEST_CANDIDATE_PASSWORD || 'password123'
  };

  try {
    const response = await axios.post(`${API_URL}/auth/login`, testCredentials);
    testToken = response.data.data.token;
    log.success('Authentication successful');
    log.info(`Token: ${testToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    log.error(`Authentication failed: ${error.response?.data?.message || error.message}`);
    log.warning('Please ensure you have a test candidate user in your database');
    log.info('You can create one through the signup page or manually in the database');
    return false;
  }
}

async function testStartInterview() {
  log.section('Start Interview Test');
  
  if (!testToken) {
    log.error('No auth token available. Skipping test.');
    return false;
  }

  // Note: This assumes you have a test job with technical interview enabled
  // You may need to create one first or update this job ID
  const jobId = process.env.TEST_JOB_ID;
  if (!jobId) {
    log.warning('No TEST_JOB_ID in .env file');
    log.info('Please configure a job with technical interview enabled');
    return false;
  }

  try {
    const response = await axios.post(
      `${API_URL}/api/technical/start`,
      { jobId },
      { headers: { Authorization: `Bearer ${testToken}` } }
    );

    const data = response.data.data;
    testAttemptId = data.attemptId;
    testQuestionId = data.questions[0]?.id;

    log.success('Interview started successfully');
    log.info(`Attempt ID: ${testAttemptId}`);
    log.info(`Questions loaded: ${data.questions.length}`);
    log.info(`Duration: ${Math.round((new Date(data.endsAt) - new Date(data.startedAt)) / 60000)} minutes`);
    
    if (data.questions.length > 0) {
      log.info(`First question: ${data.questions[0].question.substring(0, 50)}...`);
    }

    return true;
  } catch (error) {
    log.error(`Start interview failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAIEvaluation() {
  log.section('AI Evaluation Test');
  
  const testRequest = {
    question: 'What is a binary search tree and what are its key properties?',
    answer: 'A binary search tree is a data structure where each node has at most two children. The left child is always smaller than the parent, and the right child is always larger. This property makes searching efficient with O(log n) time complexity in a balanced tree.',
    expectedConcepts: ['binary tree', 'left smaller', 'right larger', 'O(log n)'],
    topic: 'Data Structures'
  };

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/ai/technical/evaluate`,
      testRequest,
      { timeout: 30000 }
    );

    const evaluation = response.data;
    log.success('AI evaluation successful');
    log.info(`Score: ${evaluation.score}/10`);
    log.info(`Correctness: ${evaluation.correctness}/10`);
    log.info(`Depth: ${evaluation.depth}/10`);
    log.info(`Clarity: ${evaluation.clarity}/10`);
    log.info(`Feedback: ${evaluation.feedback.substring(0, 80)}...`);

    return true;
  } catch (error) {
    log.error(`AI evaluation failed: ${error.response?.data?.detail || error.message}`);
    log.warning('Check if AI service is running and Ollama is available');
    return false;
  }
}

async function testSubmitAnswer() {
  log.section('Submit Answer Test');
  
  if (!testToken || !testAttemptId || !testQuestionId) {
    log.error('Missing required test data. Skipping test.');
    return false;
  }

  const testAnswer = 'A binary search tree is a node-based data structure where each node contains a key and has at most two children. The left subtree contains only nodes with keys less than the parent node, and the right subtree contains only nodes with keys greater than the parent node. This property is called the BST property and it enables efficient searching, insertion, and deletion operations.';

  try {
    const response = await axios.post(
      `${API_URL}/api/technical/submit-answer`,
      {
        attemptId: testAttemptId,
        questionId: testQuestionId,
        answer: testAnswer
      },
      { headers: { Authorization: `Bearer ${testToken}` } }
    );

    const evaluation = response.data.data;
    log.success('Answer submitted and evaluated');
    log.info(`Score: ${evaluation.score}/10`);
    log.info(`Feedback: ${evaluation.feedback.substring(0, 80)}...`);

    return true;
  } catch (error) {
    log.error(`Submit answer failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetStatus() {
  log.section('Get Status Test');
  
  if (!testToken) {
    log.error('No auth token available. Skipping test.');
    return false;
  }

  const jobId = process.env.TEST_JOB_ID;
  if (!jobId) {
    log.warning('No TEST_JOB_ID in .env file');
    return false;
  }

  try {
    const response = await axios.get(
      `${API_URL}/api/technical/status`,
      {
        params: { jobId },
        headers: { Authorization: `Bearer ${testToken}` }
      }
    );

    const status = response.data.data;
    log.success('Status retrieved successfully');
    log.info(`Status: ${status.status}`);
    log.info(`Answered: ${status.answeredCount}/${status.totalQuestions}`);
    if (status.finalScore) {
      log.info(`Final Score: ${status.finalScore}/10`);
    }

    return true;
  } catch (error) {
    log.error(`Get status failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log(`
╔═══════════════════════════════════════════╗
║  Technical Interview API Test Suite      ║
╚═══════════════════════════════════════════╝
  `);

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    { name: 'Health Check', fn: testHealthCheck, critical: true },
    { name: 'Authentication', fn: testAuthentication, critical: true },
    { name: 'AI Evaluation', fn: testAIEvaluation, critical: false },
    { name: 'Start Interview', fn: testStartInterview, critical: false },
    { name: 'Submit Answer', fn: testSubmitAnswer, critical: false },
    { name: 'Get Status', fn: testGetStatus, critical: false }
  ];

  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    
    if (success) {
      results.passed++;
    } else {
      results.failed++;
      if (test.critical) {
        log.error(`Critical test failed: ${test.name}. Stopping test suite.`);
        break;
      }
    }

    await sleep(500); // Brief pause between tests
  }

  // Summary
  log.section('Test Summary');
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  
  if (results.failed === 0) {
    log.success('All tests passed! 🎉');
  } else {
    log.warning(`${results.failed} test(s) failed. Please review the errors above.`);
  }

  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  log.error(`Test suite error: ${error.message}`);
  process.exit(1);
});
