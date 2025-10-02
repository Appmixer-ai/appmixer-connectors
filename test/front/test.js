'use strict';

const assert = require('assert');

// Include module tests
require('./channels/test.js');
require('./comments/test.js');
require('./contacts/test.js');
require('./drafts/test.js');

describe('front connector', () => {
    it('should exist', () => {
        const service = require('../../src/appmixer/front/service.json');
        const auth = require('../../src/appmixer/front/auth');
        const bundle = require('../../src/appmixer/front/bundle.json');
        const quota = require('../../src/appmixer/front/quota');

        assert.strictEqual(service.name, 'appmixer.front');
        assert.strictEqual(service.version, '1.0.0');
        assert.strictEqual(bundle.name, 'appmixer.front');
        assert.strictEqual(bundle.version, '1.0.0');
        assert.strictEqual(auth.type, 'apiKey');
        assert.ok(quota.rules.length > 0);
    });

    it('should have channels module', () => {
        const fs = require('fs');
        const path = require('path');

        const channelsPath = path.join(__dirname, '../../src/appmixer/front/channels');
        assert.ok(fs.existsSync(channelsPath), 'Channels directory should exist');

        const components = fs.readdirSync(channelsPath);
        assert.ok(components.includes('ListChannels'), 'ListChannels component should exist');
        assert.ok(components.includes('CreateChannel'), 'CreateChannel component should exist');
        assert.ok(components.includes('GetChannel'), 'GetChannel component should exist');
        assert.ok(components.includes('UpdateChannel'), 'UpdateChannel component should exist');
        assert.ok(components.includes('ValidateChannel'), 'ValidateChannel component should exist');
    });

    it('should have comments module', () => {
        const fs = require('fs');
        const path = require('path');

        const commentsPath = path.join(__dirname, '../../src/appmixer/front/comments');
        assert.ok(fs.existsSync(commentsPath), 'Comments directory should exist');

        const components = fs.readdirSync(commentsPath);
        assert.ok(components.includes('CreateComment'), 'CreateComment component should exist');
        assert.ok(components.includes('ListComments'), 'ListComments component should exist');
        assert.ok(components.includes('GetComment'), 'GetComment component should exist');
        assert.ok(components.includes('UpdateComment'), 'UpdateComment component should exist');
    });

    it('should have contacts module', () => {
        const fs = require('fs');
        const path = require('path');

        const contactsPath = path.join(__dirname, '../../src/appmixer/front/contacts');
        assert.ok(fs.existsSync(contactsPath), 'Contacts directory should exist');

        const components = fs.readdirSync(contactsPath);
        assert.ok(components.includes('CreateContact'), 'CreateContact component should exist');
        assert.ok(components.includes('GetContact'), 'GetContact component should exist');
        assert.ok(components.includes('UpdateContact'), 'UpdateContact component should exist');
        assert.ok(components.includes('DeleteContact'), 'DeleteContact component should exist');
        assert.ok(components.includes('SearchContacts'), 'SearchContacts component should exist');
        assert.ok(components.includes('ListContactNotes'), 'ListContactNotes component should exist');
        assert.ok(components.includes('CreateContactNote'), 'CreateContactNote component should exist');
    });

    it('should have drafts module', () => {
        const fs = require('fs');
        const path = require('path');

        const draftsPath = path.join(__dirname, '../../src/appmixer/front/drafts');
        assert.ok(fs.existsSync(draftsPath), 'Drafts directory should exist');

        const components = fs.readdirSync(draftsPath);
        assert.ok(components.includes('CreateDraft'), 'CreateDraft component should exist');
        assert.ok(components.includes('GetDraft'), 'GetDraft component should exist');
        assert.ok(components.includes('ListDrafts'), 'ListDrafts component should exist');
        assert.ok(components.includes('UpdateDraft'), 'UpdateDraft component should exist');
        assert.ok(components.includes('DeleteDraft'), 'DeleteDraft component should exist');
    });
});
