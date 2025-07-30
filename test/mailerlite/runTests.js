const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Check if MAILERLITE_ACCESS_TOKEN is available
if (!process.env.MAILERLITE_ACCESS_TOKEN) {
    console.error('ERROR: MAILERLITE_ACCESS_TOKEN environment variable is not set');
    console.error('Please set the MAILERLITE_ACCESS_TOKEN in your .env file');
    process.exit(1);
}

// Import all test modules
const findSubscribersTests = require('./FindSubscribers.test');
const createSubscriberTests = require('./CreateSubscriber.test');
const getSubscriberTests = require('./GetSubscriber.test');
const findGroupsTests = require('./FindGroups.test');
const findCampaignsTests = require('./FindCampaigns.test');
const getCampaignStatsTests = require('./GetCampaignStats.test');
const sendCampaignTests = require('./SendCampaign.test');

async function runAllTests() {
    console.log('🧪 Starting Mailerlite Connector Tests');
    console.log('=====================================\\n');
    
    const testResults = [];
    
    // Test order is important - some tests depend on data from previous tests
    const testSuites = [
        { name: 'FindGroups', tests: findGroupsTests },
        { name: 'FindSubscribers', tests: findSubscribersTests },
        { name: 'CreateSubscriber', tests: createSubscriberTests },
        { name: 'GetSubscriber', tests: getSubscriberTests },
        { name: 'FindCampaigns', tests: findCampaignsTests },
        { name: 'GetCampaignStats', tests: getCampaignStatsTests },
        { name: 'SendCampaign', tests: sendCampaignTests }
    ];
    
    for (const suite of testSuites) {
        console.log(`📂 Running ${suite.name} tests...`);
        
        for (const [testName, testFunction] of Object.entries(suite.tests)) {
            const fullTestName = `${suite.name}.${testName}`;
            
            try {
                console.log(`  🔧 ${fullTestName}`);
                await testFunction();
                console.log(`  ✅ ${fullTestName} - PASSED\\n`);
                testResults.push({ test: fullTestName, status: 'PASSED' });
            } catch (error) {
                console.error(`  ❌ ${fullTestName} - FAILED`);
                console.error(`     Error: ${error.message}\\n`);
                testResults.push({ test: fullTestName, status: 'FAILED', error: error.message });
            }
        }
    }
    
    // Summary
    console.log('\\n📊 Test Results Summary');
    console.log('========================');
    
    const passed = testResults.filter(r => r.status === 'PASSED').length;
    const failed = testResults.filter(r => r.status === 'FAILED').length;
    
    console.log(`Total tests: ${testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
        console.log('\\n❌ Failed tests:');
        testResults.filter(r => r.status === 'FAILED').forEach(r => {
            console.log(`  - ${r.test}: ${r.error}`);
        });
    }
    
    console.log('\\n🏁 Testing completed!');
    
    if (failed > 0) {
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests };
