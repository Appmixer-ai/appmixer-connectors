'use strict';

const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const routes = require('../../routes');

const TENANT_OWN = 'a2cc9b6e-9458-4c7d-93cc-f02b81b0594f';
const TENANT_OTHER = 'b2cc9b6e-9458-4c7d-93cc-f02b81b0594f';
const TOKEN = 'xero-access-token-secret';

describe('Xero plugin listener verification', function() {

    let context;
    let onListenerAdded;

    beforeEach(async function() {

        context = {
            ...testUtils.createMockContext(),
            http: { router: { register: sinon.stub() } },
            config: {},
            log: sinon.stub(),
            httpRequest: sinon.stub().resolves({
                data: [
                    { id: 'c1', tenantId: TENANT_OWN, tenantType: 'ORGANISATION', tenantName: 'Own Org' }
                ]
            })
        };
        await routes(context);
        onListenerAdded = context.onListenerAdded.getCall(0).args[0];
    });

    const assertTokenNeverLogged = () => {
        for (const call of context.log.getCalls()) {
            assert(!JSON.stringify(call.args).includes(TOKEN), 'access token must not be logged');
        }
    };

    it('registers the hook on plugin start', function() {

        assert.equal(context.onListenerAdded.callCount, 1);
    });

    it('accepts a listener for a tenant of the connection and drops the token', async function() {

        const listener = { eventName: `INVOICE.CREATE:${TENANT_OWN}`, params: { accessToken: TOKEN } };
        await onListenerAdded(listener);

        assert.deepEqual(listener.params, {});
        const request = context.httpRequest.getCall(0).args[0];
        assert.equal(request.method, 'GET');
        assert.equal(request.url, 'https://api.xero.com/connections');
        assert.equal(request.headers.Authorization, `Bearer ${TOKEN}`);
        assertTokenNeverLogged();
    });

    it('rejects a listener for an organisation the connection is not authorised for', async function() {

        const listener = { eventName: `CONTACT.UPDATE:${TENANT_OTHER}`, params: { accessToken: TOKEN } };
        await assert.rejects(onListenerAdded(listener), err => {
            assert.equal(err.statusCode, 403);
            return true;
        });
        assert.equal(listener.params.accessToken, undefined);
        assertTokenNeverLogged();
    });

    it('rejects when the token is not valid (Xero 401)', async function() {

        const error = new Error('Request failed with status code 401');
        error.response = { status: 401 };
        error.config = { headers: { Authorization: `Bearer ${TOKEN}` } };
        context.httpRequest.rejects(error);

        const listener = { eventName: `INVOICE.UPDATE:${TENANT_OWN}`, params: { accessToken: TOKEN } };
        await assert.rejects(onListenerAdded(listener), err => {
            assert.equal(err.statusCode, 401);
            assert(!err.message.includes(TOKEN));
            return true;
        });
        assert.equal(listener.params.accessToken, undefined);
        assertTokenNeverLogged();
    });

    it('rejects an event name without a tenant', async function() {

        await assert.rejects(onListenerAdded({ eventName: 'INVOICE.CREATE:', params: { accessToken: TOKEN } }));
        await assert.rejects(onListenerAdded({ eventName: 'INVOICE.CREATE', params: { accessToken: TOKEN } }));
        assert.equal(context.httpRequest.callCount, 0);
    });

    it('accepts and logs a listener without a token during the transition period', async function() {

        const listener = { eventName: `INVOICE.CREATE:${TENANT_OTHER}` };
        await onListenerAdded(listener);

        assert.equal(context.httpRequest.callCount, 0);
        assert(context.log.calledWith('warn', 'xero-plugin-listener-accepted-without-token'));
    });

    it('rejects a listener without a token when requireListenerToken is set', async function() {

        context.config.requireListenerToken = 'true';
        await assert.rejects(onListenerAdded({ eventName: `INVOICE.CREATE:${TENANT_OWN}`, params: {} }), err => {
            assert.equal(err.statusCode, 401);
            return true;
        });
        assert.equal(context.httpRequest.callCount, 0);
    });
});

describe('Xero triggers send the access token with the registration', function() {

    for (const name of ['NewInvoice', 'UpdatedInvoice', 'NewContact', 'UpdatedContact']) {
        it(name, async function() {

            const trigger = require(`../../accounting/${name}/${name}`);
            const context = {
                ...testUtils.createMockContext(),
                properties: { tenantId: TENANT_OWN },
                auth: { accessToken: TOKEN },
                log: sinon.stub()
            };
            await trigger.start(context);

            const [eventName, params] = context.addListener.getCall(0).args;
            assert(eventName.endsWith(`:${TENANT_OWN}`));
            assert.deepEqual(params, { accessToken: TOKEN });
            assert(!JSON.stringify(context.log.getCalls().map(c => c.args)).includes(TOKEN));
        });
    }
});
