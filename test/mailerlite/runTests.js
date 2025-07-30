const { spawn } = require('child_process');
const path = require('path');

// Run Mocha tests for Mailerlite connector
function runTests() {
    return new Promise((resolve, reject) => {
        const testDir = path.join(__dirname);
        
        // Run mocha with the test files
        const mocha = spawn('npx', ['mocha', 
            'FindGroups.test.js',
            'FindSubscribers.test.js', 
            'CreateSubscriber.test.js',
            'GetSubscriber.test.js',
            'FindCampaigns.test.js',
            'CreateCampaign.test.js',
            'GetCampaignStats.test.js',
            'SendCampaign.test.js',
            '--timeout', '30000',
            '--reporter', 'spec'
        ], {
            cwd: testDir,
            stdio: 'inherit',
            env: { ...process.env }
        });

        mocha.on('close', (code) => {
            if (code === 0) {
                console.log('\n✅ All Mailerlite connector tests completed successfully!');
                resolve();
            } else {
                console.log(`\n❌ Tests failed with exit code ${code}`);
                reject(new Error(`Tests failed with exit code ${code}`));
            }
        });

        mocha.on('error', (error) => {
            console.error('Error running tests:', error);
            reject(error);
        });
    });
}

// Check environment variables
if (!process.env.MAILERLITE_ACCESS_TOKEN) {
    console.error('❌ ERROR: MAILERLITE_ACCESS_TOKEN not found in environment');
    console.error('Please ensure the token is set in test/.env file');
    process.exit(1);
}

console.log('🧪 Running Mailerlite Connector Tests');
console.log('====================================');
console.log('Token available:', process.env.MAILERLITE_ACCESS_TOKEN ? '✅' : '❌');
console.log('Subscriber ID available:', process.env.MAILERLITE_SUBSCRIBER_ID ? '✅' : '❌');
console.log('');

runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});
