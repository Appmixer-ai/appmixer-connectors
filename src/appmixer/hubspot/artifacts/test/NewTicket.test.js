'use strict';
const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const HubSpot = require('../../Hubspot.js');

describe('NewTicket', () => {

    const component = require('../../crm/NewTicket/NewTicket.js');
    let context;
    let hubspotStub;

    beforeEach(() => {

        context = testUtils.createMockContext();
        context.auth = { accessToken: 'token' };
        context.messages = { in: { content: {} } };
        context.properties = {};
        hubspotStub = sinon.stub(HubSpot.prototype, 'call');
    });

    afterEach(() => {

        hubspotStub.restore();
    });

    const HOUR = 60 * 60 * 1000;

    it('start() remembers the start time and watches from there', async () => {

        await component.start(context);

        const state = context.saveState.firstCall.args[0];
        assert.ok(state.startedAt > 0);
        assert.equal(state.lastPollAt, state.startedAt);
        assert.deepEqual(state.known, {});
    });

    it('tick() emits unseen tickets oldest first and keeps the known ones', async () => {

        const startedAt = Date.now() - HOUR;
        context.state = { startedAt, lastPollAt: Date.now() - 60000, known: { 1: Date.now() - 120000 } };
        context.properties = { pipeline: '0', properties: 'subject' };
        const iso = (ms) => new Date(ms).toISOString();
        hubspotStub.onFirstCall().resolves({ data: { results: [
            { id: '3', properties: { createdate: iso(Date.now() - 1000) } },
            { id: '2', properties: { createdate: iso(Date.now() - 30000) } },
            { id: '1', properties: { createdate: iso(Date.now() - 120000) } }
        ] } });
        hubspotStub.onSecondCall().resolves({ data: { results: [{ id: '3' }, { id: '2' }] } });

        await component.tick(context);

        const searchBody = hubspotStub.firstCall.args[2];
        assert.equal(hubspotStub.firstCall.args[1], 'crm/v3/objects/tickets/search');
        assert.deepEqual(searchBody.sorts, [{ propertyName: 'createdate', direction: 'DESCENDING' }]);
        assert.equal(searchBody.filterGroups[0].filters[0].propertyName, 'createdate');
        assert.equal(searchBody.filterGroups[0].filters[0].operator, 'GTE');
        assert.deepEqual(searchBody.filterGroups[0].filters[1], { propertyName: 'hs_pipeline', operator: 'EQ', value: '0' });

        assert.equal(hubspotStub.secondCall.args[1], 'crm/v3/objects/tickets/batch/read');
        assert.deepEqual(hubspotStub.secondCall.args[2], { inputs: [{ id: '2' }, { id: '3' }], properties: ['subject'] });
        // Emitted in creation order even though batch/read answered in another order.
        assert.deepEqual(context.sendJson.getCalls().map(call => call.args), [[{ id: '2' }, 'ticket'], [{ id: '3' }, 'ticket']]);

        const saved = context.saveState.lastCall.args[0];
        assert.equal(saved.startedAt, startedAt);
        assert.deepEqual(Object.keys(saved.known).sort(), ['1', '2', '3']);
    });

    it('tick() ignores tickets created before the trigger started', async () => {

        const startedAt = Date.now() - 1000;
        context.state = { startedAt, lastPollAt: startedAt, known: {} };
        hubspotStub.resolves({ data: { results: [
            { id: '7', properties: { createdate: new Date(startedAt - 5000).toISOString() } }
        ] } });

        await component.tick(context);

        assert.equal(hubspotStub.callCount, 1);
        assert.equal(context.sendJson.callCount, 0);
    });

    it('an empty answer does not forget the known tickets', async () => {

        const now = Date.now();
        context.state = { startedAt: now - HOUR, lastPollAt: now - 60000, known: { 5: now - 30000 } };
        hubspotStub.resolves({ data: { results: [] } });

        await component.tick(context);

        assert.equal(context.sendJson.callCount, 0);
        assert.deepEqual(Object.keys(context.saveState.lastCall.args[0].known), ['5']);
    });

    it('test() emits the newest ticket without saving state', async () => {

        context.properties = { properties: 'subject' };
        hubspotStub.onFirstCall().resolves({ data: { results: [{ id: '8' }] } });
        hubspotStub.onSecondCall().resolves({ data: { results: [{ id: '8', properties: { subject: 'A' } }] } });

        await component.test(context);

        assert.deepEqual(context.sendJson.firstCall.args, [{ id: '8', properties: { subject: 'A' } }, 'ticket']);
        assert.equal(context.saveState.callCount, 0);
    });

    it('test() throws when there is no ticket', async () => {

        hubspotStub.resolves({ data: { results: [] } });
        await assert.rejects(() => component.test(context), /No tickets found/);
    });
});
