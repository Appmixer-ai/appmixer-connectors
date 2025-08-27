'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const { createMockContext } = require('../utils');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('googleMeet/CreateSpace', () => {
    it('creates a space', async () => {
        const component = require('../../src/appmixer/googleMeet/space/CreateSpace/CreateSpace');
        const context = createMockContext({
            auth: { accessToken: process.env.GOOGLE_MEET_ACCESS_TOKEN || 'test-token' },
            messages: { in: { content: { 'space|spaceType': 'MEETING' } } },
            httpRequest: async ({ method, url, headers, data }) => {
                // Minimal request shape check; return fake response for unit test
                assert.strictEqual(method, 'POST');
                assert.ok(url.includes('https://meet.googleapis.com/v2/spaces'));
                assert.ok(headers.Authorization);
                return { data: { name: 'spaces/xyz', meetingCode: 'abc-defg-hij', meetingUri: 'https://meet.google.com/abc-defg-hij', spaceType: 'MEETING' } };
            },
            sendJson: (data) => { assert.ok(data); return data; },
            CancelError: Error
        });

        const res = await component.receive(context);
        assert.ok(res);
    });
});
