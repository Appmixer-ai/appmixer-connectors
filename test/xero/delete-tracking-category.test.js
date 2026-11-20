'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const { createMockContext } = require('../utils');

const component = require(path.join(__dirname,
    '../../src/appmixer/xero/accounting/DeleteTrackingCategory/DeleteTrackingCategory.js'));

const contextFor = (content, client) => {
    const context = createMockContext();
    context.auth = { accessToken: 'token' };
    context.messages = { in: { content } };
    context.httpRequest.create = sinon.stub().returns(client);
    return context;
};

describe('appmixer.xero.accounting.DeleteTrackingCategory', () => {

    it('sends DELETE with the tenant header and outputs {}', async () => {
        const client = sinon.stub().resolves({ data: { TrackingCategories: [{ Status: 'DELETED' }] } });
        const context = contextFor({ tenantId: 'tenant-1', trackingCategoryId: 'cat-1' }, client);

        await component.receive(context);

        assert.strictEqual(context.httpRequest.create.firstCall.args[0].headers['Xero-tenant-id'], 'tenant-1');
        assert.strictEqual(client.firstCall.args[0].method, 'DELETE');
        assert.strictEqual(client.firstCall.args[0].url, '/api.xro/2.0/TrackingCategories/cat-1');
        assert.deepStrictEqual(context.sendJson.firstCall.args, [{}, 'out']);
    });

    it('requires the tenant and the tracking category', async () => {
        const client = sinon.stub();
        await assert.rejects(component.receive(contextFor({ trackingCategoryId: 'cat-1' }, client)),
            { name: 'CancelError', message: 'Tenant ID is required!' });
        await assert.rejects(component.receive(contextFor({ tenantId: 'tenant-1' }, client)),
            { name: 'CancelError', message: 'Tracking Category ID is required!' });
        assert.strictEqual(client.callCount, 0);
    });

    it('explains that a used category must be archived', async () => {
        const client = sinon.stub().rejects({
            response: {
                status: 400,
                data: {
                    ErrorNumber: 10,
                    Type: 'ValidationException',
                    Message: 'A validation exception occurred',
                    Elements: [{ ValidationErrors: [{ Message: 'The tracking category is in use.' }] }]
                }
            }
        });
        const context = contextFor({ tenantId: 'tenant-1', trackingCategoryId: 'cat-1' }, client);

        await assert.rejects(component.receive(context), err => {
            assert.strictEqual(err.name, 'CancelError');
            assert.match(err.message, /The tracking category is in use\./);
            assert.match(err.message, /archive/);
            return true;
        });
        assert.strictEqual(context.sendJson.callCount, 0);
    });

    it('rethrows other errors', async () => {
        const client = sinon.stub().rejects({ response: { status: 401, data: { Title: 'Unauthorized' } } });
        const context = contextFor({ tenantId: 'tenant-1', trackingCategoryId: 'cat-1' }, client);
        await assert.rejects(component.receive(context), { Title: 'Unauthorized' });
    });
});
