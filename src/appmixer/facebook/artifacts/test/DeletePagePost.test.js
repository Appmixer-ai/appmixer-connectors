'use strict';

const assert = require('assert');
const sinon = require('sinon');

const DeletePagePost = require('../../page/DeletePagePost/DeletePagePost');
const { BASE_URL } = require('../../lib');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

function createContext(content) {

    const httpRequest = sinon.stub();
    httpRequest.get = sinon.stub().resolves({ data: { id: '1002114906324065', name: 'Test Page', access_token: 'page-token' } });
    httpRequest.resolves({ status: 200, data: { success: true } });

    return {
        auth: { accessToken: 'user-token' },
        messages: { in: { content } },
        httpRequest,
        sendJson: sinon.stub().resolves(),
        CancelError
    };
}

describe('facebook DeletePagePost', function() {

    it('deletes the post with the page token and returns an empty object', async function() {

        const context = createContext({ pageId: '1002114906324065', postId: ' 1002114906324065_122101234567890123 ' });

        await DeletePagePost.receive(context);

        const tokenUrl = new URL(context.httpRequest.get.firstCall.args[0]);
        assert.strictEqual(tokenUrl.pathname.endsWith('/1002114906324065'), true);
        assert.strictEqual(tokenUrl.searchParams.get('fields'), 'access_token,name');
        assert.strictEqual(tokenUrl.searchParams.get('access_token'), 'user-token');

        const request = context.httpRequest.firstCall.args[0];
        assert.strictEqual(request.method, 'DELETE');
        assert.strictEqual(request.url, `${BASE_URL}/1002114906324065_122101234567890123?access_token=page-token`);
        assert.deepStrictEqual(context.sendJson.firstCall.args, [{}, 'out']);
    });

    it('takes the page from the post ID when Page is empty', async function() {

        const context = createContext({ postId: '107198938765432_122101234567890123' });

        await DeletePagePost.receive(context);

        assert.strictEqual(new URL(context.httpRequest.get.firstCall.args[0]).pathname.endsWith('/107198938765432'), true);
        assert.strictEqual(context.httpRequest.callCount, 1);
    });

    it('rejects a missing or malformed input without calling the API', async function() {

        const missing = createContext({});
        await assert.rejects(DeletePagePost.receive(missing), /Post ID is required/);

        const malformed = createContext({ pageId: '1', postId: '../me/accounts' });
        await assert.rejects(DeletePagePost.receive(malformed), /Invalid Post ID/);

        const noPage = createContext({ postId: '122101234567890123' });
        await assert.rejects(DeletePagePost.receive(noPage), /Page is required/);

        const badPage = createContext({ pageId: 'me', postId: '1_2' });
        await assert.rejects(DeletePagePost.receive(badPage), /Invalid Page ID/);

        for (const context of [missing, malformed, noPage, badPage]) {
            assert.strictEqual(context.httpRequest.get.callCount, 0);
            assert.strictEqual(context.httpRequest.callCount, 0);
        }
    });

    it('passes API errors through', async function() {

        const context = createContext({ postId: '1_2' });
        context.httpRequest.rejects(new Error('Request failed with status code 400'));

        await assert.rejects(DeletePagePost.receive(context), /status code 400/);
        assert.strictEqual(context.sendJson.callCount, 0);
    });
});
