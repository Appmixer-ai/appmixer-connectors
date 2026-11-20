'use strict';

const assert = require('assert');
const sinon = require('sinon');

const DeletePost = require('../../shares/DeletePost/DeletePost');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

function createContext(input = {}) {

    return {
        CancelError,
        auth: { accessToken: 'token-1' },
        messages: { in: { content: input } },
        httpRequest: sinon.stub().resolves({ status: 204, headers: {} }),
        sendJson: sinon.stub()
    };
}

describe('linkedin DeletePost', function() {

    it('requires the post ID', async function() {

        const context = createContext({ postId: '  ' });
        await assert.rejects(DeletePost.receive(context), { name: 'CancelError', message: 'Post ID is required!' });
        assert.strictEqual(context.httpRequest.callCount, 0);
    });

    it('rejects a value that is not a post URN', async function() {

        const context = createContext({ postId: '7241234567890123456' });
        await assert.rejects(DeletePost.receive(context), { name: 'CancelError', message: /must be a post URN/ });
        assert.strictEqual(context.httpRequest.callCount, 0);
    });

    it('deletes a share by its encoded URN and sends {}', async function() {

        const context = createContext({ postId: 'urn:li:share:7241234567890123456' });

        await DeletePost.receive(context);

        const request = context.httpRequest.firstCall.args[0];
        assert.strictEqual(request.method, 'DELETE');
        assert.strictEqual(request.url, 'https://api.linkedin.com/rest/posts/urn%3Ali%3Ashare%3A7241234567890123456');
        assert.strictEqual(request.headers['LinkedIn-Version'], '202608');
        assert.strictEqual(request.headers['X-Restli-Protocol-Version'], '2.0.0');
        assert.strictEqual(request.headers['X-RestLi-Method'], 'DELETE');
        assert.strictEqual(request.headers.Authorization, 'Bearer token-1');
        assert.deepStrictEqual(context.sendJson.firstCall.args, [{}, 'out']);
    });

    it('accepts an already encoded ugcPost URN without double encoding', async function() {

        const context = createContext({ postId: 'urn%3Ali%3AugcPost%3A42' });

        await DeletePost.receive(context);

        const request = context.httpRequest.firstCall.args[0];
        assert.strictEqual(request.url, 'https://api.linkedin.com/rest/posts/urn%3Ali%3AugcPost%3A42');
    });
});
