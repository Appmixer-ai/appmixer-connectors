// Import all Linear test files
describe('Linear Connector Tests', function() {

    // Set overall timeout for all tests
    this.timeout(60000);

    before(function() {
        console.log('🔧 Starting Linear Connector Test Suite');
        console.log('📋 Testing OAuth2 authentication and GraphQL API integration');

        if (!process.env.LINEAR_ACCESS_TOKEN) {
            console.log('⚠️  LINEAR_ACCESS_TOKEN not set - skipping all tests');
            console.log('💡 To run tests, add LINEAR_ACCESS_TOKEN to test/.env file');
            this.skip();
        }
    });

    // Core functionality tests
    describe('Issue Management', function() {
        require('./FindIssues.test.js');
        require('./CreateIssue.test.js');
        require('./GetIssue.test.js');
        require('./DeleteIssue.test.js');
    });

    // Comment management tests
    describe('Comment Management', function() {
        require('./FindComments.test.js');
        require('./CreateComment.test.js');
        require('./GetComment.test.js');
        require('./UpdateComment.test.js');
        require('./DeleteComment.test.js');
    });

    // GraphQL execution tests
    describe('GraphQL Execution', function() {
        require('./ExecuteGraphQLQuery.test.js');
    });

    after(function() {
        console.log('✅ Linear Connector Test Suite Complete');
    });
});
