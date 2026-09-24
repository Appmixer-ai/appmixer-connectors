const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const routes = require('../../routes');

describe('ServiceNow POST /events handler', () => {

    const WEBHOOK_SECRET = 'test-webhook-secret';
    const h = {
        response: body => ({ code: statusCode => ({ body, statusCode }) })
    };
    const payload = {
        type: 'dev123.service-now.com.incident.insert',
        data: { sys_id: 'abc', number: 'INC0010001' }
    };

    let context;
    let handler;

    beforeEach(async () => {

        context = {
            ...testUtils.createMockContext(),
            http: {
                router: {
                    register: sinon.stub()
                }
            },
            config: { webhookSecret: WEBHOOK_SECRET }
        };

        await routes(context);
        handler = context.http.router.register.getCall(0).args[0].options.handler;
    });

    it('triggers listeners when the shared secret matches', async () => {

        const response = await handler({ headers: { 'x-appmixer-webhook-secret': WEBHOOK_SECRET }, payload }, h);

        assert.deepEqual(response, {});
        assert.equal(context.triggerListeners.callCount, 1);
        assert.deepEqual(context.triggerListeners.getCall(0).args[0], { eventName: payload.type, payload: payload.data });
    });

    it('rejects a request without the shared secret', async () => {

        const response = await handler({ headers: {}, payload }, h);

        assert.equal(response.statusCode, 401);
        assert.equal(context.triggerListeners.callCount, 0);
    });

    it('rejects a request with a wrong shared secret', async () => {

        const response = await handler({ headers: { 'x-appmixer-webhook-secret': 'attacker' }, payload }, h);

        assert.equal(response.statusCode, 401);
        assert.equal(context.triggerListeners.callCount, 0);
    });

    it('rejects every request when the shared secret is not configured', async () => {

        context.config = {};
        const response = await handler({ headers: { 'x-appmixer-webhook-secret': '' }, payload }, h);

        assert.equal(response.statusCode, 401);
        assert.equal(context.triggerListeners.callCount, 0);
    });
});
