'use strict';

const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const FindUserLists = require('../../core/FindUserLists/FindUserLists');
const { applyGoogleAdsConfig } = require('./helpers');

describe('FindUserLists', () => {

    describe('Required inputs validation', () => {

        let context;

        beforeEach(() => {
            context = testUtils.createMockContext();
            context.messages = { in: { content: {} } };
            applyGoogleAdsConfig(context);
        });

        it('throws when customerId is missing', async () => {
            context.messages.in.content = {};

            await assert.rejects(() => FindUserLists.receive(context), {
                message: 'Customer ID is required!'
            });
        });

        it('throws when developer token is missing in backoffice config', async () => {
            context.messages.in.content = { customerId: '123-456-7890' };
            context.config = {};

            await assert.rejects(() => FindUserLists.receive(context), {
                message: 'Developer Token is required in backoffice config!'
            });
        });
    });

    describe('Output type handling', () => {

        let context;

        beforeEach(() => {
            context = testUtils.createMockContext();
            context.messages = { in: { content: {} } };
            applyGoogleAdsConfig(context);
        });

        it('returns notFound when no user lists match (outputType=array)', async () => {
            context.messages.in.content = {
                customerId: '123-456-7890',
                developerToken: 'dev-token',
                outputType: 'array'
            };
            context.httpRequest.resolves({ data: [{ results: [] }] });

            await FindUserLists.receive(context);

            assert.strictEqual(context.sendJson.callCount, 1);
            assert.strictEqual(context.sendJson.getCall(0).args[1], 'notFound');
        });

        it('returns all items at once with outputType=array', async () => {
            context.messages.in.content = {
                customerId: '123-456-7890',
                developerToken: 'dev-token',
                outputType: 'array'
            };
            context.httpRequest.resolves({
                data: [{
                    results: [
                        {
                            userList: {
                                resourceName: 'customers/1234567890/userLists/111',
                                id: '111',
                                name: 'Audience 1',
                                description: 'Test 1',
                                type: 'CRM_BASED',
                                membershipStatus: 'OPEN',
                                sizeForDisplay: '100',
                                sizeForSearch: '95'
                            }
                        },
                        {
                            userList: {
                                resourceName: 'customers/1234567890/userLists/222',
                                id: '222',
                                name: 'Audience 2',
                                description: 'Test 2',
                                type: 'CRM_BASED',
                                membershipStatus: 'OPEN',
                                sizeForDisplay: '50',
                                sizeForSearch: '45'
                            }
                        }
                    ]
                }]
            });

            await FindUserLists.receive(context);

            assert.strictEqual(context.sendJson.callCount, 1);
            assert.strictEqual(context.sendJson.getCall(0).args[1], 'out');
            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.count, 2);
            assert.strictEqual(result.result.length, 2);
            assert.strictEqual(result.result[0].name, 'Audience 1');
            assert.strictEqual(result.result[1].name, 'Audience 2');
        });

        it('returns first item only with outputType=first', async () => {
            context.messages.in.content = {
                customerId: '123-456-7890',
                developerToken: 'dev-token',
                outputType: 'first'
            };
            context.httpRequest.resolves({
                data: [{
                    results: [
                        {
                            userList: {
                                id: '111',
                                name: 'Audience 1',
                                type: 'CRM_BASED'
                            }
                        },
                        {
                            userList: {
                                id: '222',
                                name: 'Audience 2',
                                type: 'CRM_BASED'
                            }
                        }
                    ]
                }]
            });

            await FindUserLists.receive(context);

            assert.strictEqual(context.sendJson.callCount, 1);
            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.name, 'Audience 1');
            assert.strictEqual(result.index, 0);
            assert.strictEqual(result.count, 2);
        });

        it('returns one item at a time with outputType=object', async () => {
            context.messages.in.content = {
                customerId: '123-456-7890',
                developerToken: 'dev-token',
                outputType: 'object'
            };
            context.httpRequest.resolves({
                data: [{
                    results: [
                        {
                            userList: {
                                id: '111',
                                name: 'Audience 1',
                                type: 'CRM_BASED'
                            }
                        },
                        {
                            userList: {
                                id: '222',
                                name: 'Audience 2',
                                type: 'CRM_BASED'
                            }
                        }
                    ]
                }]
            });

            await FindUserLists.receive(context);

            assert.strictEqual(context.sendJson.callCount, 2);
            const result1 = context.sendJson.getCall(0).args[0];
            const result2 = context.sendJson.getCall(1).args[0];
            assert.strictEqual(result1.name, 'Audience 1');
            assert.strictEqual(result1.index, 0);
            assert.strictEqual(result1.count, 2);
            assert.strictEqual(result2.name, 'Audience 2');
            assert.strictEqual(result2.index, 1);
            assert.strictEqual(result2.count, 2);
        });
    });

    describe('Query and filtering', () => {

        let context;

        beforeEach(() => {
            context = testUtils.createMockContext();
            context.messages = { in: { content: {} } };
            applyGoogleAdsConfig(context);
        });

        it('uses default query when searchQuery is empty', async () => {
            context.messages.in.content = {
                customerId: '123-456-7890',
                developerToken: 'dev-token',
                outputType: 'array'
            };
            context.httpRequest.resolves({ data: [{ results: [] }] });

            await FindUserLists.receive(context);

            assert(context.httpRequest.calledOnce);
        });

        it('supports custom GAQL query with WHERE clause', async () => {
            const customQuery = "SELECT user_list.id, user_list.name FROM user_list WHERE user_list.name = 'My Audience'";
            context.messages.in.content = {
                customerId: '123-456-7890',
                developerToken: 'dev-token',
                searchQuery: customQuery,
                outputType: 'array'
            };
            context.httpRequest.resolves({
                data: [{
                    results: [
                        {
                            userList: {
                                id: '111',
                                name: 'My Audience',
                                type: 'CRM_BASED'
                            }
                        }
                    ]
                }]
            });

            await FindUserLists.receive(context);

            assert.strictEqual(context.sendJson.callCount, 1);
            const result = context.sendJson.getCall(0).args[0];
            assert.strictEqual(result.result[0].name, 'My Audience');
        });

        it('supports loginCustomerId from backoffice config for cross-account access', async () => {
            context.messages.in.content = {
                customerId: '123-456-7890',
                outputType: 'array'
            };
            context.config.loginCustomerId = '9999999999';
            context.httpRequest.resolves({
                data: [{
                    results: [
                        {
                            userList: {
                                id: '111',
                                name: 'Cross-Account Audience',
                                type: 'CRM_BASED'
                            }
                        }
                    ]
                }]
            });

            await FindUserLists.receive(context);

            assert(context.httpRequest.calledOnce);
        });
    });

    describe('Output port schema generation', () => {

        let context;

        beforeEach(() => {
            context = testUtils.createMockContext();
            context.messages = { in: { content: { outputType: 'array' } } };
            context.properties = { generateOutputPortOptions: true };
            applyGoogleAdsConfig(context);
        });

        it('generates output port options', async () => {
            await FindUserLists.receive(context);

            assert.strictEqual(context.sendJson.callCount, 1);
            const options = context.sendJson.getCall(0).args[0];
            assert(Array.isArray(options));
            assert.strictEqual(options.length, 1);
            assert.strictEqual(options[0].value, 'result');
        });
    });
});
