const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('ListTags Component', function() {

    this.timeout(10000);

    it('should successfully list tags from Intercom', async function() {

        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            this.skip('INTERCOM_ACCESS_TOKEN not set');
        }

        const mockContext = {
            auth: { accessToken: process.env.INTERCOM_ACCESS_TOKEN },
            messages: { in: { content: {} } },
            properties: {}, // Add missing properties object
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => ({ data, port })
        };

        const ListTags = require('../../src/appmixer/intercom/core/ListTags/ListTags');
        const result = await ListTags.receive(mockContext);

        assert(result, 'Result should be defined');
        assert(result.data, 'Result data should be defined');
        assert(Array.isArray(result.data.tags), 'Tags should be an array');
        console.log(`✓ Listed ${result.data.tags.length} tags successfully`);

        if (result.data.tags.length > 0) {
            const tag = result.data.tags[0];
            assert(tag.id, 'Tag should have an id');
            assert(tag.name, 'Tag should have a name');
            assert(tag.type === 'tag', 'Tag type should be "tag"');
            console.log(`✓ Sample tag: ${tag.name} (ID: ${tag.id})`);
        }
    });

    it('should handle request errors gracefully', async function() {

        const mockContext = {
            auth: { accessToken: 'invalid_token' },
            messages: { in: { content: {} } },
            properties: {}, // Add missing properties object
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => ({ data, port })
        };

        const ListTags = require('../../src/appmixer/intercom/core/ListTags/ListTags');

        try {
            await ListTags.receive(mockContext);
            assert.fail('Should have thrown an error with invalid token');
        } catch (error) {
            // Check if it's an HTTP error with proper response
            assert(error.response, 'Should be an HTTP error');
            assert(error.response.status === 401, 'Should return 401 for invalid token');
            console.log('✓ Correctly handled invalid authentication');
        }
    });
});
