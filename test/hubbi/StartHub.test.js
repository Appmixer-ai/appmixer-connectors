'use strict';

const path = require('path');
const assert = require('assert');
const { createMockContext } = require('../utils');

const StartHub = require(path.join(__dirname, '../../src/appmixer/hubbi/core/StartHub/StartHub.js'));

describe('Hubbi StartHub', function () {

    let context;
    beforeEach(function () {
        context = createMockContext();
        context.auth = { baseUrl: 'https://test.hubbi.nl', clientKey: 'ck-1', token: 'jwt' };
        context.messages = { in: { content: { conversionKey: 'cv-1' } } };
    });

    it('throws CancelError when conversionKey is missing', async function () {
        context.messages.in.content.conversionKey = undefined;
        await assert.rejects(
            () => StartHub.receive(context),
            e => e.name === 'CancelError' && /Hub is required/.test(e.message)
        );
    });

    it('starts the hub and echoes the conversionKey', async function () {
        context.httpRequest.resolves({});
        await StartHub.receive(context);

        const req = context.httpRequest.firstCall.args[0];
        assert.strictEqual(
            req.url,
            'https://test.hubbi.nl/Flows/Home/HubsStart?clientKey=ck-1&conversionKey=cv-1'
        );
        assert.deepStrictEqual(context.sendJson.firstCall.args[0], { conversionKey: 'cv-1' });
        assert.strictEqual(context.sendJson.firstCall.args[1], 'out');
    });

    it('reclassifies HTTP 409 as a retryable (non-Cancel) error', async function () {
        const err = new Error('conflict');
        err.response = { status: 409 };
        context.httpRequest.rejects(err);
        await assert.rejects(
            () => StartHub.receive(context),
            e => e.name !== 'CancelError' && /409/.test(e.message)
        );
    });

    it('reclassifies HTTP 423 as a CancelError (no retry)', async function () {
        const err = new Error('locked');
        err.response = { status: 423 };
        context.httpRequest.rejects(err);
        await assert.rejects(
            () => StartHub.receive(context),
            e => e.name === 'CancelError' && /423/.test(e.message)
        );
    });

    it('propagates other HTTP errors untouched', async function () {
        const err = new Error('boom');
        err.response = { status: 500 };
        context.httpRequest.rejects(err);
        await assert.rejects(() => StartHub.receive(context), e => e === err);
    });
});
