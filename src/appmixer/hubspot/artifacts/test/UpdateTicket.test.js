'use strict';
const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const HubSpot = require('../../Hubspot.js');

describe('UpdateTicket', () => {

    const component = require('../../crm/UpdateTicket/UpdateTicket.js');
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

    it('patches only the set properties and returns an empty object', async () => {

        context.messages.in.content = { ticketId: '9', priority: 'LOW', subject: '', hsPipelineStage: '4' };
        hubspotStub.resolves({ data: { id: '9' } });

        await component.receive(context);

        const [method, path, payload] = hubspotStub.firstCall.args;
        assert.equal(method, 'patch');
        assert.equal(path, 'crm/v3/objects/tickets/9');
        assert.deepEqual(payload, { properties: { hs_ticket_priority: 'LOW', hs_pipeline_stage: '4' } });
        assert.deepEqual(context.sendJson.firstCall.args, [{}, 'out']);
    });

    it('throws without a ticket ID or without anything to update', async () => {

        context.messages.in.content = { priority: 'LOW' };
        await assert.rejects(() => component.receive(context), /Ticket ID is required/);
        context.messages.in.content = { ticketId: '9' };
        await assert.rejects(() => component.receive(context), /at least one ticket property/);
        assert.equal(hubspotStub.callCount, 0);
    });
});
