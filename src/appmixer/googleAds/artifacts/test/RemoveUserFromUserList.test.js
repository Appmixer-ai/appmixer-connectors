'use strict';

const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const RemoveUserFromUserList = require('../../core/RemoveUserFromUserList/RemoveUserFromUserList');
const { applyGoogleAdsConfig } = require('./helpers');

describe('RemoveUserFromUserList', () => {

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

            await assert.rejects(() => RemoveUserFromUserList.receive(context), {
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

            await assert.rejects(() => RemoveUserFromUserList.receive(context), {
                message: 'Developer Token is required in backoffice config!'
            });
        });

        it('throws when userListId and userListResourceName are both missing', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                email: 'test@example.com'
            };

            await assert.rejects(() => RemoveUserFromUserList.receive(context), {
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

            await assert.rejects(() => RemoveUserFromUserList.receive(context), {
                message: /At least one user identifier is required/
            });
        });
    });

    describe('Valid removal operations with different identifier types', () => {

        it('removes user with email identifier', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                email: 'test@example.com'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z',
                    resourceName: 'customers/7107133715/userLists/9329730810'
                }
            });

            await RemoveUserFromUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
            assert.strictEqual(context.sendJson.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.receivedOperationsCount, 1);
            assert.strictEqual(result.userListResourceName, 'customers/7107133715/userLists/9329730810');

            // Verify the API request contains 'remove' operation
            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.ok(requestBody.operations[0].remove);
            assert.ok(requestBody.operations[0].remove.userIdentifiers);
            assert.ok(requestBody.operations[0].remove.userIdentifiers[0].hashedEmail);
        });

        it('removes user with phone number identifier', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                phoneNumber: '+14155552671'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await RemoveUserFromUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
            assert.strictEqual(context.sendJson.callCount, 1);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.ok(requestBody.operations[0].remove);
            assert.ok(requestBody.operations[0].remove.userIdentifiers[0].hashedPhoneNumber);
        });

        it('removes user with address identifier', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                firstName: 'John',
                lastName: 'Doe',
                countryCode: 'US',
                postalCode: '94043'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await RemoveUserFromUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.ok(requestBody.operations[0].remove);
            assert.ok(requestBody.operations[0].remove.userIdentifiers[0].addressInfo);
            assert.strictEqual(requestBody.operations[0].remove.userIdentifiers[0].addressInfo.countryCode, 'US');
            assert.ok(requestBody.operations[0].remove.userIdentifiers[0].addressInfo.hashedFirstName);
            assert.ok(requestBody.operations[0].remove.userIdentifiers[0].addressInfo.hashedLastName);
        });

        it('removes user with mobileId identifier', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                mobileId: 'AEBE52E7-03EE-455A-B3C4-E57283966239'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await RemoveUserFromUserList.receive(context);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.ok(requestBody.operations[0].remove);
            assert.strictEqual(requestBody.operations[0].remove.userIdentifiers[0].mobileId, 'AEBE52E7-03EE-455A-B3C4-E57283966239');
        });

        it('removes user with thirdPartyUserId identifier', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                thirdPartyUserId: 'user_12345_abc'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await RemoveUserFromUserList.receive(context);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.ok(requestBody.operations[0].remove);
            assert.strictEqual(requestBody.operations[0].remove.userIdentifiers[0].thirdPartyUserId, 'user_12345_abc');
        });

        it('accepts userListResourceName instead of userListId', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListResourceName: 'customers/7107133715/userLists/9329730810',
                email: 'test@example.com'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await RemoveUserFromUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);

            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.userListResourceName, 'customers/7107133715/userLists/9329730810');
        });

        it('sends remove operation (not create)', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                email: 'test@example.com'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await RemoveUserFromUserList.receive(context);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            // Verify that 'remove' key exists and 'create' does not
            assert.ok(requestBody.operations[0].remove, 'remove operation should be present');
            assert.strictEqual(requestBody.operations[0].create, undefined, 'create operation should not be present');
        });

        it('includes consent when provided', async () => {
            context.messages.in.content = {
                customerId: '7107133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                email: 'test@example.com',
                adUserDataConsent: 'GRANTED',
                adPersonalizationConsent: 'DENIED'
            };

            context.httpRequest.resolves({
                data: {
                    receivedOperationsCount: 1,
                    uploadDateTime: '2026-02-26T11:00:00Z'
                }
            });

            await RemoveUserFromUserList.receive(context);

            const requestBody = context.httpRequest.getCall(0).args[0].data;
            assert.ok(requestBody.operations[0].remove.consent);
            assert.strictEqual(requestBody.operations[0].remove.consent.adUserData, 'GRANTED');
            assert.strictEqual(requestBody.operations[0].remove.consent.adPersonalization, 'DENIED');
        });
    });
});
