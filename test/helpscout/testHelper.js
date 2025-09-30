const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Check if HelpScout access token is available and skip tests if not
 * @param {Object} context - Mocha test context (this)
 * @returns {boolean} - true if token is available, false if skipped
 */
function checkAccessTokenOrSkip(context) {
    if (!process.env.HELPSCOUT_ACCESS_TOKEN) {
        console.log('⚠️  HELPSCOUT_ACCESS_TOKEN not found - skipping HelpScout tests');
        context.skip();
        return false;
    }
    return true;
}

module.exports = {
    checkAccessTokenOrSkip
};
