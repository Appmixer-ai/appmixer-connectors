'use strict';
const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const HubSpot = require('../../Hubspot.js');

describe('FindTickets', () => {

    const component = require('../../crm/FindTickets/FindTickets.js');
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

    it('searches with filters and follows the pagination', async () => {

        context.messages.in.content = {
            filters: { AND: [
                { propertyName: 'hs_pipeline_stage', operator: 'EQ', value: '1' },
                { propertyName: 'hubspot_owner_id', operator: 'HAS_PROPERTY' }
            ] },
            properties: 'subject, hs_ticket_priority',
            outputType: 'array'
        };
        hubspotStub.onFirstCall().resolves({ data: { results: [{ id: '1' }], paging: { next: { after: '200' } } } });
        hubspotStub.onSecondCall().resolves({ data: { results: [{ id: '2' }] } });

        await component.receive(context);

        assert.equal(hubspotStub.callCount, 2);
        const firstBody = hubspotStub.firstCall.args[2];
        assert.equal(hubspotStub.firstCall.args[1], 'crm/v3/objects/tickets/search');
        assert.deepEqual(firstBody.filterGroups, [{ filters: [
            { propertyName: 'hs_pipeline_stage', operator: 'EQ', value: '1' },
            { propertyName: 'hubspot_owner_id', operator: 'HAS_PROPERTY' }
        ] }]);
        assert.deepEqual(firstBody.properties, ['subject', 'hs_ticket_priority']);
        assert.equal(firstBody.limit, 200);
        assert.equal(hubspotStub.secondCall.args[2].after, '200');
        assert.deepEqual(context.sendJson.firstCall.args, [{ result: [{ id: '1' }, { id: '2' }], count: 2 }, 'out']);
    });

    it('sends notFound when nothing matches', async () => {

        context.messages.in.content = { query: 'nothing', outputType: 'first' };
        hubspotStub.resolves({ data: { results: [] } });

        await component.receive(context);

        assert.equal(hubspotStub.firstCall.args[2].query, 'nothing');
        assert.equal(hubspotStub.firstCall.args[2].filterGroups, undefined);
        assert.deepEqual(context.sendJson.firstCall.args, [{ query: 'nothing' }, 'notFound']);
    });

    it('requires a query or a filter, and a value for comparing operators', async () => {

        context.messages.in.content = { outputType: 'array' };
        await assert.rejects(() => component.receive(context), /search query or at least one filter/);
        context.messages.in.content = { filters: { AND: [{ propertyName: 'subject', operator: 'EQ' }] } };
        await assert.rejects(() => component.receive(context), /a value is required/);
        assert.equal(hubspotStub.callCount, 0);
    });
});
