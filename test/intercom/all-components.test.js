const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

describe('Intercom Connector - All Components', function() {
    this.timeout(60000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping all Intercom tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }
    });

    // Import all component tests
    require('./CreateContact.test.js');
    require('./CreateUpdateCompany.test.js');
    require('./CreateConversation.test.js');
    require('./FindContacts.test.js');
    require('./FindCompanies.test.js');
    require('./FindConversations.test.js');
    require('./GetContact.test.js');
    require('./GetCompany.test.js');
    require('./GetConversation.test.js');
    require('./ListTags.test.js');
    require('./SendMessage.test.js');
    require('./ReplytoConversation.test.js');
    require('./UpdateContact.test.js');
});
