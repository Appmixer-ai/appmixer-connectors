'use strict';
const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const HubSpot = require('../../Hubspot.js');

describe('CreateAssociation', () => {

    const component = require('../../crm/CreateAssociation/CreateAssociation.js');
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

    it('creates the default association without a type ID', async () => {

        context.messages.in.content = { fromObjectType: '0-1', fromObjectId: '11', toObjectType: '0-2', toObjectId: '22' };
        hubspotStub.resolves({ data: {} });

        await component.receive(context);

        assert.deepEqual(hubspotStub.firstCall.args.slice(0, 2), ['put', 'crm/v4/objects/0-1/11/associations/default/0-2/22']);
        assert.deepEqual(context.sendJson.firstCall.args, [{
            fromObjectType: '0-1', fromObjectId: '11', toObjectType: '0-2', toObjectId: '22',
            associationCategory: '', associationTypeId: ''
        }, 'out']);
    });

    it('creates a labeled association with a type ID', async () => {

        context.messages.in.content = {
            fromObjectType: '0-1', fromObjectId: '11', toObjectType: '0-2', toObjectId: '22',
            associationTypeId: '1', associationCategory: 'HUBSPOT_DEFINED'
        };
        hubspotStub.resolves({ data: {} });

        await component.receive(context);

        assert.deepEqual(hubspotStub.firstCall.args, ['put', 'crm/v4/objects/0-1/11/associations/0-2/22', [
            { associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }
        ]]);
        assert.equal(context.sendJson.firstCall.args[0].associationTypeId, '1');
    });

    it('rejects a type ID that is not a number', async () => {

        context.messages.in.content = { fromObjectType: '0-1', fromObjectId: '11', toObjectType: '0-2', toObjectId: '22', associationTypeId: 'abc' };
        await assert.rejects(() => component.receive(context), /whole number/);
        assert.equal(hubspotStub.callCount, 0);
    });
});
