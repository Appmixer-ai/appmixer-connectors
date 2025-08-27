'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const { createMockContext } = require('../utils');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('googleMeet/GetSpace', () => {
    it('requires name', async () => {
        const component = require('../../src/appmixer/googleMeet/space/GetSpace/GetSpace');
        const context = createMockContext({ CancelError: Error, messages: { in: { content: {} } } });
        await assert.rejects(() => component.receive(context));
    });

    it('calls API', async () => {
        const component = require('../../src/appmixer/googleMeet/space/GetSpace/GetSpace');
        let sent;
        const context = createMockContext({
            auth: { accessToken: process.env.GOOGLE_MEET_ACCESS_TOKEN || 'test-token' },
            messages: { in: { content: { name: 'spaces/xyz' } } },
            httpRequest: async ({ method, url, headers }) => {
                assert.strictEqual(method, 'GET');
                assert.ok(url.includes('https://meet.googleapis.com/v2/spaces/'));
                assert.ok(headers.Authorization);
                return { data: { name: 'spaces/xyz' } };
            },
            sendJson: (data) => { sent = data; }
        });
        await component.receive(context);
        assert.strictEqual(sent.name, 'spaces/xyz');
    });
});
