'use strict';
const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const HubSpot = require('../../Hubspot.js');

describe('CreateTicket', () => {

    const component = require('../../crm/CreateTicket/CreateTicket.js');
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

    it('creates a ticket with properties and associations', async () => {

        context.messages.in.content = {
            subject: 'Login broken',
            content: 'Error 500',
            hsPipeline: '0',
            hsPipelineStage: '1',
            priority: 'HIGH',
            hubSpotOwnerId: '',
            additionalProperties: { AND: [{ name: 'external_id', value: 'X-1' }] },
            contactIds: '101, 102',
            companyIds: '201',
            dealIds: ['301']
        };
        hubspotStub.resolves({ data: { id: '9', properties: { subject: 'Login broken' } } });

        await component.receive(context);

        assert.equal(hubspotStub.callCount, 1);
        const [method, path, payload] = hubspotStub.firstCall.args;
        assert.equal(method, 'post');
        assert.equal(path, 'crm/v3/objects/tickets');
        assert.deepEqual(payload.properties, {
            subject: 'Login broken',
            content: 'Error 500',
            hs_pipeline: '0',
            hs_pipeline_stage: '1',
            hs_ticket_priority: 'HIGH',
            external_id: 'X-1'
        });
        assert.deepEqual(payload.associations.map(a => [a.to.id, a.types[0].associationTypeId]), [
            ['101', 16], ['102', 16], ['201', 339], ['301', 28]
        ]);
        assert.equal(payload.associations[0].types[0].associationCategory, 'HUBSPOT_DEFINED');
        assert.deepEqual(context.sendJson.firstCall.args, [{ id: '9', properties: { subject: 'Login broken' } }, 'ticket']);
    });

    it('sends no associations when none are set', async () => {

        context.messages.in.content = { subject: 'A', hsPipelineStage: '1' };
        hubspotStub.resolves({ data: { id: '9' } });

        await component.receive(context);

        assert.equal(hubspotStub.firstCall.args[2].associations, undefined);
    });

    it('requires the subject and the status', async () => {

        context.messages.in.content = { hsPipelineStage: '1' };
        await assert.rejects(() => component.receive(context), /Ticket Name is required/);
        context.messages.in.content = { subject: 'A' };
        await assert.rejects(() => component.receive(context), /Ticket Status is required/);
        assert.equal(hubspotStub.callCount, 0);
    });
});
