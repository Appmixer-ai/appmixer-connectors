'use strict';

const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const UpdateUserList = require('../../core/UpdateUserList/UpdateUserList');
const { applyGoogleAdsConfig } = require('./helpers');

describe('UpdateUserList', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        applyGoogleAdsConfig(context);
    });

    describe('Required inputs validation', () => {

        it('throws when customerId is missing', async () => {
            context.messages.in.content = {
                developerToken: 'dev-token',
                userListId: '12345',
                name: 'Updated Name'
            };

            await assert.rejects(() => UpdateUserList.receive(context), {
                message: 'Customer ID is required!'
            });
        });

        it('throws when developer token is missing in backoffice config', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                userListId: '12345',
                name: 'Updated Name'
            };
            context.config = {};

            await assert.rejects(() => UpdateUserList.receive(context), {
                message: 'Developer Token is required in backoffice config!'
            });
        });

        it('throws when userListId and userListResourceName are both missing', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                name: 'Updated Name'
            };

            await assert.rejects(() => UpdateUserList.receive(context), {
                message: 'User List ID or User List Resource Name is required!'
            });
        });

        it('throws when no fields are provided for update', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
                // No name, description, membershipLifeSpan, or integrationCode
            };

            await assert.rejects(() => UpdateUserList.receive(context), {
                message: /At least one field must be provided for update/
            });
        });
    });

    describe('Valid update operations', () => {

        it('updates user list name', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                name: 'Updated Audience Name'
            };

            context.httpRequest.resolves({
                data: {
                    results: [{
                        resourceName: 'customers/7107133715/userLists/9329730810',
                        id: '9329730810',
                        name: 'Updated Audience Name',
                        description: 'Original description',
                        type: 'CRM_BASED',
                        membershipStatus: 'OPEN',
                        membershipLifeSpan: 30,
                        integrationCode: null
                    }]
                }
            });

            await UpdateUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
            assert.strictEqual(context.sendJson.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.name, 'Updated Audience Name');
            assert.strictEqual(result.id, '9329730810');

            // Verify the API request contains update operation with correct mask
            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.ok(requestBody.operations[0].update);
            assert.strictEqual(requestBody.operations[0].update.name, 'Updated Audience Name');
            assert.ok(requestBody.operations[0].updateMask.paths.includes('name'));
        });

        it('updates description', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                description: 'Updated description'
            };

            context.httpRequest.resolves({
                data: {
                    results: [{
                        resourceName: 'customers/7107133715/userLists/9329730810',
                        id: '9329730810',
                        description: 'Updated description'
                    }]
                }
            });

            await UpdateUserList.receive(context);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.ok(requestBody.operations[0].update.description);
            assert.strictEqual(requestBody.operations[0].update.description, 'Updated description');
            assert.ok(requestBody.operations[0].updateMask.paths.includes('description'));
        });

        it('updates membership life span', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                membershipLifeSpan: 60
            };

            context.httpRequest.resolves({
                data: {
                    results: [{
                        resourceName: 'customers/7107133715/userLists/9329730810',
                        membershipLifeSpan: 60
                    }]
                }
            });

            await UpdateUserList.receive(context);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.strictEqual(requestBody.operations[0].update.membershipLifeSpan, 60);
            assert.ok(requestBody.operations[0].updateMask.paths.includes('membership_life_span'));
        });

        it('updates integration code', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                integrationCode: 'EXT-12345'
            };

            context.httpRequest.resolves({
                data: {
                    results: [{
                        resourceName: 'customers/7107133715/userLists/9329730810',
                        integrationCode: 'EXT-12345'
                    }]
                }
            });

            await UpdateUserList.receive(context);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.strictEqual(requestBody.operations[0].update.integrationCode, 'EXT-12345');
            assert.ok(requestBody.operations[0].updateMask.paths.includes('integration_code'));
        });

        it('updates multiple fields at once', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                name: 'New Name',
                description: 'New description',
                membershipLifeSpan: 90
            };

            context.httpRequest.resolves({
                data: {
                    results: [{
                        resourceName: 'customers/7107133715/userLists/9329730810',
                        id: '9329730810',
                        name: 'New Name',
                        description: 'New description',
                        membershipLifeSpan: 90
                    }]
                }
            });

            await UpdateUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.name, 'New Name');
            assert.strictEqual(result.description, 'New description');
            assert.strictEqual(result.membershipLifeSpan, 90);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            const maskPaths = requestBody.operations[0].updateMask.paths;
            assert.ok(maskPaths.includes('name'));
            assert.ok(maskPaths.includes('description'));
            assert.ok(maskPaths.includes('membership_life_span'));
            assert.strictEqual(maskPaths.length, 3);
        });

        it('accepts userListResourceName instead of userListId', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListResourceName: 'customers/7107133715/userLists/9329730810',
                name: 'Updated Name'
            };

            context.httpRequest.resolves({
                data: {
                    results: [{
                        resourceName: 'customers/7107133715/userLists/9329730810',
                        name: 'Updated Name'
                    }]
                }
            });

            await UpdateUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.resourceName, 'customers/7107133715/userLists/9329730810');
        });

        it('sends correct update mask format', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                name: 'New Name',
                integrationCode: 'CODE-123'
            };

            context.httpRequest.resolves({
                data: {
                    results: [{
                        resourceName: 'customers/7107133715/userLists/9329730810',
                        name: 'New Name',
                        integrationCode: 'CODE-123'
                    }]
                }
            });

            await UpdateUserList.receive(context);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.ok(Array.isArray(requestBody.operations[0].updateMask.paths));
            assert.strictEqual(requestBody.operations[0].updateMask.paths.length, 2);
        });

        it('handles no expiration (10000 days) for membership life span', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                membershipLifeSpan: 10000
            };

            context.httpRequest.resolves({
                data: {
                    results: [{
                        resourceName: 'customers/7107133715/userLists/9329730810',
                        membershipLifeSpan: 10000
                    }]
                }
            });

            await UpdateUserList.receive(context);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.strictEqual(requestBody.operations[0].update.membershipLifeSpan, 10000);
        });
    });
});
