const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Test the auth system
describe('auth', () => {

    it('should complete authentication test', async function() {
        this.timeout(5000);

        const auth = require('../../src/appmixer/retool/auth');
        const context = {
            baseUrl: process.env.RETOOL_BASE_URL || 'https://your-retool-domain.com',
            apiToken: process.env.RETOOL_ACCESS_TOKEN,
            httpRequest: require('../utils').httpRequest
        };

        // Test validation
        const result = await auth.definition.validate(context);
        assert.strictEqual(result, true, 'Authentication should succeed');

        // Test profile info
        const profileInfo = await auth.definition.requestProfileInfo(context);
        assert(profileInfo, 'Should return profile information');
        assert(profileInfo.email, 'Profile should contain email');
    });
});