#!/usr/bin/env node

/**
 * Linear Connector Test Runner
 * 
 * This script runs the Linear connector tests using the Appmixer test utilities.
 * It can be used to run specific tests or the entire test suite.
 */

const path = require('path');
const { spawn } = require('child_process');

// Test configuration
const TEST_DIR = __dirname;
const TEST_TIMEOUT = 30000;

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';

// Define test configurations
const testConfigs = {
    all: {
        description: 'Run all Linear connector tests',
        files: ['index.test.js'],
        env: {}
    },
    issues: {
        description: 'Run issue management tests',
        files: ['FindIssues.test.js', 'CreateIssue.test.js', 'GetIssue.test.js', 'DeleteIssue.test.js'],
        env: {}
    },
    comments: {
        description: 'Run comment management tests', 
        files: ['FindComments.test.js', 'CreateComment.test.js', 'GetComment.test.js', 'UpdateComment.test.js', 'DeleteComment.test.js'],
        env: {}
    },
    graphql: {
        description: 'Run GraphQL execution tests',
        files: ['ExecuteGraphQLQuery.test.js'],
        env: {}
    },
    safe: {
        description: 'Run non-destructive tests only',
        files: ['FindIssues.test.js', 'CreateIssue.test.js', 'GetIssue.test.js', 'FindComments.test.js', 'CreateComment.test.js', 'GetComment.test.js', 'UpdateComment.test.js', 'ExecuteGraphQLQuery.test.js'],
        env: {}
    },
    destructive: {
        description: 'Run destructive tests (DELETE operations)',
        files: ['DeleteIssue.test.js', 'DeleteComment.test.js'],
        env: { LINEAR_ENABLE_DESTRUCTIVE_TESTS: 'true' }
    }
};

// Display help
if (testType === 'help' || testType === '--help' || testType === '-h') {
    console.log('Linear Connector Test Runner');
    console.log('');
    console.log('Usage: node run-tests.js [test-type]');
    console.log('');
    console.log('Available test types:');
    Object.entries(testConfigs).forEach(([key, config]) => {
        console.log(`  ${key.padEnd(12)} - ${config.description}`);
    });
    console.log('');
    console.log('Examples:');
    console.log('  node run-tests.js all         # Run all tests');
    console.log('  node run-tests.js issues      # Run only issue tests');
    console.log('  node run-tests.js safe        # Run non-destructive tests');
    console.log('  node run-tests.js destructive # Run DELETE operation tests');
    console.log('');
    process.exit(0);
}

// Get test configuration
const config = testConfigs[testType];
if (!config) {
    console.error(`❌ Unknown test type: ${testType}`);
    console.error('Run "node run-tests.js help" to see available options');
    process.exit(1);
}

// Check environment
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (!process.env.LINEAR_ACCESS_TOKEN) {
    console.error('❌ LINEAR_ACCESS_TOKEN not found in test/.env file');
    console.error('💡 Please add your Linear OAuth2 access token to test/.env');
    console.error('📖 See test/linear/README.md for setup instructions');
    process.exit(1);
}

console.log(`🚀 Starting Linear connector tests: ${config.description}`);
console.log(`📁 Test directory: ${TEST_DIR}`);
console.log(`⏱️  Timeout: ${TEST_TIMEOUT}ms`);
console.log('');

// Prepare test command
const testFiles = config.files.join(' ');
const mochaArgs = [
    '--timeout', TEST_TIMEOUT.toString(),
    '--reporter', 'spec',
    ...config.files
];

// Set environment variables
const testEnv = {
    ...process.env,
    ...config.env
};

// Run tests
const mocha = spawn('npx', ['mocha', ...mochaArgs], {
    cwd: TEST_DIR,
    env: testEnv,
    stdio: 'inherit'
});

mocha.on('close', (code) => {
    if (code === 0) {
        console.log('');
        console.log('✅ All tests passed!');
    } else {
        console.log('');
        console.log(`❌ Tests failed with exit code ${code}`);
        console.log('💡 Check the output above for error details');
    }
    process.exit(code);
});

mocha.on('error', (error) => {
    console.error('❌ Failed to run tests:', error.message);
    console.error('💡 Make sure you have installed dependencies: npm install');
    process.exit(1);
});
