'use strict';
const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const HubSpot = require('../../Hubspot.js');

describe('GetCompany', () => {

    const component = require('../../crm/GetCompany/GetCompany.js');
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

    it('gets a company by a unique property', async () => {

        context.messages.in.content = { companyId: 'EXT-1', idProperty: 'external_id', properties: 'name,domain', associations: 'contacts' };
        hubspotStub.resolves({ data: { id: '5', properties: { name: 'Acme' } } });

        await component.receive(context);

        const [method, path, params] = hubspotStub.firstCall.args;
        assert.equal(method, 'get');
        assert.equal(path, 'crm/v3/objects/companies/EXT-1');
        assert.deepEqual(params, { archived: false, idProperty: 'external_id', properties: 'name,domain', associations: 'contacts' });
        assert.deepEqual(context.sendJson.firstCall.args, [{ id: '5', properties: { name: 'Acme' } }, 'company']);
    });

    it('sends notFound on 404 and rethrows other errors', async () => {

        context.messages.in.content = { companyId: '404' };
        hubspotStub.rejects(Object.assign(new Error('Not found'), { status: 404 }));
        await component.receive(context);
        assert.deepEqual(context.sendJson.firstCall.args, [{ companyId: '404' }, 'notFound']);

        hubspotStub.rejects(Object.assign(new Error('Forbidden'), { status: 403 }));
        await assert.rejects(() => component.receive(context), /Forbidden/);
    });
});
