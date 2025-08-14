'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const { createMockContext } = require('../utils');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('googleMeet/UpdateSpace', () => {
    it('requires name and updateMask', async () => {
        const component = require('../../src/appmixer/googleMeet/core/UpdateSpace/UpdateSpace');
        const context = createMockContext({ CancelError: Error, messages: { in: { content: {} } } });
        await assert.rejects(() => component.receive(context));

        const context2 = createMockContext({ CancelError: Error, messages: { in: { content: { name: 'spaces/xyz' } } } });
        await assert.rejects(() => component.receive(context2));
    });

    it('calls PATCH with updateMask and sends {}', async () => {
        const component = require('../../src/appmixer/googleMeet/core/UpdateSpace/UpdateSpace');
        let sent;
        const context = createMockContext({
            auth: { accessToken: process.env.GOOGLE_MEET_ACCESS_TOKEN || 'test-token' },
            messages: { in: { content: { name: 'spaces/xyz', updateMask: 'spaceType,config', 'space|spaceType': 'MEETING' } } },
            httpRequest: async ({ method, url, headers, params, data }) => {
                assert.strictEqual(method, 'PATCH');
                assert.ok(url.includes('https://meet.googleapis.com/v2/spaces/'));
                assert.ok(headers.Authorization);
                assert.strictEqual(params.updateMask, 'spaceType,config');
                assert.strictEqual(data.spaceType, 'MEETING');
                return { data: { ok: true } };
            },
            sendJson: (data) => { sent = data; }
        });
        await component.receive(context);
        assert.deepStrictEqual(sent, {});
    });
});
