const { execSync } = require('child_process');

// Set working directory to project root
const projectRoot = '/Users/sayamnasir/Documents/GitHub/appmixer-connectors';
process.chdir(projectRoot);

// Test data
const testEmail = `test-validation-${Date.now()}@example.com`;
let testSubscriberId = null;

const tests = [
    {
        name: 'FindGroups',
        path: './src/appmixer/mailerlite/core/FindGroups',
        input: '{"in":{"outputType":"array"}}',
        description: 'Lists all subscriber groups'
    },
    {
        name: 'FindSubscribers',
        path: './src/appmixer/mailerlite/core/FindSubscribers',
        input: '{"in":{"outputType":"array"}}',
        description: 'Lists all subscribers'
    },
    {
        name: 'CreateSubscriber',
        path: './src/appmixer/mailerlite/core/CreateSubscriber',
        input: `{"in":{"email":"${testEmail}","name":"Test Validation User"}}`,
        description: 'Creates a new subscriber'
    },
    {
        name: 'GetSubscriber',
        path: './src/appmixer/mailerlite/core/GetSubscriber',
        input: `{"in":{"email":"${testEmail}"}}`,
        description: 'Gets subscriber by email'
    },
    {
        name: 'FindCampaigns',
        path: './src/appmixer/mailerlite/core/FindCampaigns',
        input: '{"in":{"outputType":"array"}}',
        description: 'Lists all campaigns'
    }
];

const successfulTests = [];
const failedTests = [];

console.log('🧪 Mailerlite Connector Validation');
console.log('==================================\\n');

// Check environment
if (!process.env.MAILERLITE_ACCESS_TOKEN || process.env.MAILERLITE_ACCESS_TOKEN === 'your_actual_mailerlite_token_here') {
    console.log('❌ MAILERLITE_ACCESS_TOKEN not properly set in environment');
    console.log('Please set your Mailerlite API token in the environment or .env file');
    process.exit(1);
}

console.log('✅ MAILERLITE_ACCESS_TOKEN is set\\n');

for (const test of tests) {
    try {
        console.log(`🔧 Testing ${test.name} - ${test.description}`);

        const command = `npx appmixer test component "${test.path}" -i '${test.input}'`;
        console.log(`Command: ${command}`);

        const result = execSync(command, {
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 30000,
            env: { ...process.env }
        });

        console.log(`✅ ${test.name} - PASSED`);
        console.log(`Result: ${result.slice(0, 200)}...\\n`);

        successfulTests.push({
            name: test.name,
            command: command,
            description: test.description
        });

        // Extract useful data for next tests
        if (test.name === 'CreateSubscriber' && result.includes('id')) {
            try {
                const match = result.match(/"id"\\s*:\\s*"([^"]+)"/);
                if (match) {
                    testSubscriberId = match[1];
                    console.log(`📝 Captured subscriber ID: ${testSubscriberId}`);
                }
            } catch (e) {
                console.log('Could not extract subscriber ID');
            }
        }

    } catch (error) {
        console.log(`❌ ${test.name} - FAILED`);
        console.log(`Error: ${error.message}\\n`);

        failedTests.push({
            name: test.name,
            error: error.message,
            description: test.description
        });
    }
}

// Summary
console.log('\\n📊 Validation Summary');
console.log('====================');
console.log(`Total tests: ${tests.length}`);
console.log(`Passed: ${successfulTests.length}`);
console.log(`Failed: ${failedTests.length}`);

if (failedTests.length > 0) {
    console.log('\\n❌ Failed tests:');
    failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
    });
}

console.log('\\n✅ Successful test commands:');
successfulTests.forEach(test => {
    console.log(`# ${test.name} - ${test.description}`);
    console.log(test.command);
    console.log('');
});
