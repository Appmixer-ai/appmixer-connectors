'use strict';

const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const DeleteUserList = require('../../core/DeleteUserList/DeleteUserList.js');
const { applyGoogleAdsConfig } = require('./helpers');

describe('DeleteUserList', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        applyGoogleAdsConfig(context);
    });

    it('should require Customer ID', async () => {
        context.messages.in.content = {
            developerToken: 'token'
        };

        await assert.rejects(() => DeleteUserList.receive(context), {
            message: 'Customer ID is required!'
        });
    });

    it('should require developer token in backoffice config', async () => {
        context.messages.in.content = {
            customerId: '123',
            userListId: '456'
        };
        context.config = {};

        await assert.rejects(() => DeleteUserList.receive(context), {
            message: 'Developer Token is required in backoffice config!'
        });
    });

    it('should require User List ID or Resource Name', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'token'
        };

        await assert.rejects(() => DeleteUserList.receive(context), {
            message: 'User List ID or Resource Name is required!'
        });
    });

    it('should delete user list by userListId', async () => {
        context.messages.in.content = {
            customerId: '7107133715',
            developerToken: 'test-token',
            userListId: '123456'
        };

        context.httpRequest.resolves({
            data: { results: [] }
        });

        await DeleteUserList.receive(context);

        assert.strictEqual(context.httpRequest.callCount, 1);
        const call = context.httpRequest.getCall(0);
        assert.strictEqual(call.args[0].method, 'POST');
        assert(call.args[0].url.includes('userLists:mutate'));
        assert(call.args[0].data.operations[0].remove);
        assert(call.args[0].data.operations[0].remove.includes('userLists/123456'));

        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[0].success, true);
    });

    it('should delete user list by userListResourceName', async () => {
        context.messages.in.content = {
            customerId: '7107133715',
            developerToken: 'test-token',
            userListResourceName: 'customers/7107133715/userLists/123456'
        };

        context.httpRequest.resolves({
            data: { results: [] }
        });

        await DeleteUserList.receive(context);

        assert.strictEqual(context.httpRequest.callCount, 1);
        const call = context.httpRequest.getCall(0);
        assert.strictEqual(call.args[0].method, 'POST');
        assert(call.args[0].url.includes('userLists:mutate'));
        assert.strictEqual(call.args[0].data.operations[0].remove, 'customers/7107133715/userLists/123456');

        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[0].success, true);
    });

    it('should use loginCustomerId from user input', async () => {
        context.messages.in.content = {
            customerId: '7107133715',
            loginCustomerId: '5338559342',
            userListId: '123456'
        };

        context.httpRequest.resolves({
            data: { results: [] }
        });

        await DeleteUserList.receive(context);

        assert.strictEqual(context.httpRequest.callCount, 1);
        const call = context.httpRequest.getCall(0);
        assert(call.args[0].headers);

        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[0].success, true);
    });
});
