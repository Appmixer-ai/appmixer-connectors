'use strict';

const path = require('path');
const assert = require('assert');
const sinon = require('sinon');

const auth = require(path.join(__dirname, '../../src/appmixer/hubbi/auth.js'));

describe('Hubbi auth', function () {

    function ctx(overrides) {
        return Object.assign({
            baseUrl: 'https://test.hubbi.nl/',
            clientKey: 'abcdef123456',
            token: 'jwt',
            httpRequest: sinon.stub().resolves({ data: [] })
        }, overrides);
    }

    it('is declared as an apiKey auth with the expected fields', function () {
        assert.strictEqual(auth.type, 'apiKey');
        const fields = Object.keys(auth.definition.auth);
        assert.deepStrictEqual(fields, ['baseUrl', 'token', 'clientKey']);
    });

    it('validate calls ListTargetHubs and returns true', async function () {
        const context = ctx();
        const result = await auth.definition.validate(context);
        assert.strictEqual(result, true);
        const req = context.httpRequest.firstCall.args[0];
        assert.strictEqual(
            req.url,
            'https://test.hubbi.nl/Flows/Home/ListTargetHubs?clientKey=abcdef123456'
        );
        assert.strictEqual(req.headers.Authorization, 'Bearer jwt');
    });

    it('requestProfileInfo returns an account name with a masked client key', async function () {
        const context = ctx();
        const info = await auth.definition.requestProfileInfo(context);
        assert.strictEqual(info.name, 'HubBI (abc...456)');
    });

    it('does not mask a short client key', async function () {
        const context = ctx({ clientKey: 'abc' });
        const info = await auth.definition.requestProfileInfo(context);
        assert.strictEqual(info.name, 'HubBI (abc)');
    });
});
