'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const { createMockContext } = require('../utils');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('googleMeet/EndActiveConference', () => {
    it('requires name', async () => {
        const component = require('../../src/appmixer/googleMeet/core/EndActiveConference/EndActiveConference');
        const context = createMockContext({ CancelError: Error, messages: { in: { content: {} } } });
        await assert.rejects(() => component.receive(context));
    });

    it('calls POST endActiveConference', async () => {
        const component = require('../../src/appmixer/googleMeet/core/EndActiveConference/EndActiveConference');
        let sent;
        const context = createMockContext({
            auth: { accessToken: process.env.GOOGLE_MEET_ACCESS_TOKEN || 'test-token' },
            messages: { in: { content: { name: 'spaces/xyz' } } },
            httpRequest: async ({ method, url, headers }) => {
                assert.strictEqual(method, 'POST');
                assert.ok(url.endsWith('spaces/spaces%2Fxyz:endActiveConference') || url.includes('spaces/')); // encoded
                assert.ok(headers.Authorization);
                return { data: { success: true } };
            },
            sendJson: (data) => { sent = data; }
        });
        await component.receive(context);
        assert.deepStrictEqual(sent, { success: true });
    });
});
