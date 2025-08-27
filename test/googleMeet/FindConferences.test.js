'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const { createMockContext } = require('../utils');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('googleMeet/FindConferences', () => {
    it('generates out port options', async () => {
        const component = require('../../src/appmixer/googleMeet/conferenceRecords/FindConferences/FindConferences');
        let sent;
        const context = createMockContext({
            properties: { generateOutputPortOptions: true },
            messages: { in: { content: { outputType: 'array' } } },
            sendJson: (data) => { sent = data; }
        });
        await component.receive(context);
        assert.ok(Array.isArray(sent));
    });

    it('returns array', async () => {
        const component = require('../../src/appmixer/googleMeet/conferenceRecords/FindConferences/FindConferences');
        let sent;
        const context = createMockContext({
            auth: { accessToken: process.env.GOOGLE_MEET_ACCESS_TOKEN || 'test-token' },
            messages: { in: { content: { outputType: 'array' } } },
            httpRequest: async () => ({ data: { conferenceRecords: [{ name: 'conferenceRecords/1' }] } }),
            sendJson: (data) => { sent = data; }
        });
        await component.receive(context);
        assert.strictEqual(sent.count, 1);
        assert.ok(Array.isArray(sent.result));
    });
});
