'use strict';

const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const AddUserToUserList = require('../../core/AddUserToUserList/AddUserToUserList');
const { applyGoogleAdsConfig } = require('./helpers');

describe('AddUserToUserList', () => {

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
                email: 'test@example.com'
            };

            await assert.rejects(() => AddUserToUserList.receive(context), {
                message: 'Customer ID is required!'
            });
        });

        it('throws when developer token is missing in backoffice config', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                userListId: '12345',
                email: 'test@example.com'
            };
            context.config = {};

            await assert.rejects(() => AddUserToUserList.receive(context), {
                message: 'Developer Token is required in backoffice config!'
            });
        });

        it('throws when userListId and userListResourceName are both missing', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                email: 'test@example.com'
            };

            await assert.rejects(() => AddUserToUserList.receive(context), {
                message: 'User List ID or User List Resource Name is required!'
            });
        });

        it('throws when no user identifier is provided', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '12345'
                // No email, phoneNumber, firstName/lastName/countryCode, mobileId, or thirdPartyUserId
            };

            await assert.rejects(() => AddUserToUserList.receive(context), {
                message: /At least one user identifier is required/
            });
        });

        it('throws when only firstName is provided without lastName and countryCode', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '12345',
                firstName: 'John'
                // Missing lastName and countryCode
            };

            await assert.rejects(() => AddUserToUserList.receive(context), {
                message: /At least one user identifier is required/
            });
        });

        it('throws when firstName and lastName provided without countryCode', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '12345',
                firstName: 'John',
                lastName: 'Doe'
                // Missing countryCode - address identifier requires all three
            };

            await assert.rejects(() => AddUserToUserList.receive(context), {
                message: /At least one user identifier is required/
            });
        });
    });

    describe('Valid inputs with different identifier types', () => {

        it('succeeds with email identifier', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                email: 'test@example.com',
                operation: 'create',
                adUserDataConsent: 'GRANTED'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z',
                    resourceName: 'customers/7107133715/userLists/9329730810'
                }
            });

            await AddUserToUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
            assert.strictEqual(context.sendJson.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.receivedOperationsCount, 1);
            assert.strictEqual(result.userListResourceName, 'customers/7107133715/userLists/9329730810');
            assert.strictEqual(result.operation, 'create');
        });

        it('succeeds with phone number identifier', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                phoneNumber: '+14155552671',
                operation: 'create'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await AddUserToUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
            assert.strictEqual(context.sendJson.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.receivedOperationsCount, 1);
            assert.strictEqual(result.operation, 'create');
        });

        it('succeeds with address identifier (firstName + lastName + countryCode)', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                firstName: 'John',
                lastName: 'Doe',
                countryCode: 'US',
                postalCode: '94043',
                operation: 'create'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await AddUserToUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
            assert.strictEqual(context.sendJson.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.receivedOperationsCount, 1);
        });

        it('succeeds with mobileId identifier', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                mobileId: 'AEBE52E7-03EE-455A-B3C4-E57283966239',
                operation: 'create'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await AddUserToUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
            assert.strictEqual(context.sendJson.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.receivedOperationsCount, 1);
        });

        it('succeeds with thirdPartyUserId identifier', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                thirdPartyUserId: 'user_12345_abc',
                operation: 'create'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await AddUserToUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
            assert.strictEqual(context.sendJson.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.receivedOperationsCount, 1);
        });

        it('accepts userListResourceName instead of userListId', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListResourceName: 'customers/7107133715/userLists/9329730810',
                email: 'test@example.com',
                operation: 'create'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await AddUserToUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
            assert.strictEqual(context.sendJson.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.userListResourceName, 'customers/7107133715/userLists/9329730810');
        });

        it('defaults operation to "create"', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                email: 'test@example.com'
                // No operation specified - should default to 'create'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await AddUserToUserList.receive(context);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.operation, 'create');
        });

        it('allows remove operation', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                email: 'test@example.com',
                operation: 'remove'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await AddUserToUserList.receive(context);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.operation, 'remove');
        });
    });
});
