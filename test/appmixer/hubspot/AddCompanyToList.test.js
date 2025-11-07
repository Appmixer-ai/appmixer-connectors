'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const componentPath = '../../../src/appmixer/hubspot/crm/AddCompanyToList/AddCompanyToList';
const component = require(componentPath);
const { createMockContext } = require('../../utils');

describe('HubSpot -> AddCompanyToList', () => {

    let context;
    const mockAccessToken = 'test-access-token';

    beforeEach(() => {
        context = createMockContext({
            auth: {
                accessToken: mockAccessToken
            }
        });

        context.sendJson.returns({ success: true });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should add single company to list using v3 API', async () => {
        const mockResponse = {
            data: {
                success: true
            }
        };

        context.httpRequest = sinon.stub().resolves(mockResponse);

        context.messages = {
            in: {
                content: {
                    listId: '19267',
                    companyId: '123'
                }
            }
        };

        await component.receive(context);

        // Verify PUT request was made to v3 API
        assert.strictEqual(context.httpRequest.callCount, 1, 'Should make 1 HTTP request');
        const requestArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(requestArgs.method, 'put', 'Should use PUT method');
        assert(requestArgs.url.includes('/crm/v3/lists/19267/memberships/add'), 'Should use v3 Lists API');
        assert.deepStrictEqual(requestArgs.data.recordIds, ['123'], 'Should send recordIds array');

        // Verify sendJson was called with success
        assert.strictEqual(context.sendJson.callCount, 1, 'Should call sendJson once');
        const sendJsonArgs = context.sendJson.getCall(0).args[0];
        assert.strictEqual(sendJsonArgs.success, true, 'Should return success');
        assert.strictEqual(sendJsonArgs.listId, '19267', 'Should return listId');
        assert.deepStrictEqual(sendJsonArgs.companyIds, ['123'], 'Should return companyIds');
        assert.strictEqual(sendJsonArgs.count, 1, 'Should return count of 1');
    });

    it('should add multiple companies to list using v3 API', async () => {
        const mockResponse = {
            data: {
                success: true
            }
        };

        context.httpRequest = sinon.stub().resolves(mockResponse);

        context.messages = {
            in: {
                content: {
                    listId: '19268',
                    companyIds: ['456', '789', '101']
                }
            }
        };

        await component.receive(context);

        // Verify request
        assert.strictEqual(context.httpRequest.callCount, 1, 'Should make 1 HTTP request');
        const requestArgs = context.httpRequest.getCall(0).args[0];
        assert(requestArgs.url.includes('/crm/v3/lists/19268/memberships/add'), 'Should use v3 Lists API');
        assert.deepStrictEqual(requestArgs.data.recordIds, ['456', '789', '101'], 'Should send all company IDs');

        // Verify response
        const sendJsonArgs = context.sendJson.getCall(0).args[0];
        assert.strictEqual(sendJsonArgs.count, 3, 'Should return count of 3');
        assert.deepStrictEqual(sendJsonArgs.companyIds, ['456', '789', '101'], 'Should return all company IDs');
    });

    it('should fallback to v1 API if v3 fails with 404', async () => {
        // First call (v3) fails with 404
        const v3Error = new Error('Not found');
        v3Error.status = 404;

        // Second call (v1) succeeds
        const mockV1Response = {
            data: {
                success: true
            }
        };

        context.httpRequest = sinon.stub();
        context.httpRequest.onFirstCall().rejects(v3Error);
        context.httpRequest.onSecondCall().resolves(mockV1Response);

        context.messages = {
            in: {
                content: {
                    listId: '12345',
                    companyId: '999'
                }
            }
        };

        await component.receive(context);

        // Verify both API calls were made
        assert.strictEqual(context.httpRequest.callCount, 2, 'Should make 2 HTTP requests (v3 + v1)');

        // Verify v3 attempt
        const v3Args = context.httpRequest.getCall(0).args[0];
        assert(v3Args.url.includes('/crm/v3/lists/'), 'Should try v3 API first');

        // Verify v1 fallback
        const v1Args = context.httpRequest.getCall(1).args[0];
        assert.strictEqual(v1Args.method, 'post', 'Should use POST for v1');
        assert(v1Args.url.includes('/contacts/v1/lists/12345/add'), 'Should fallback to v1 API');
        assert.deepStrictEqual(v1Args.data.ids, [parseInt('999')], 'Should send ids as integers for v1');
        assert.deepStrictEqual(v1Args.data.vids, [], 'Should send empty vids array');
        assert.deepStrictEqual(v1Args.data.emails, [], 'Should send empty emails array');

        // Verify response indicates v1 was used
        const sendJsonArgs = context.sendJson.getCall(0).args[0];
        assert.strictEqual(sendJsonArgs.success, true, 'Should return success');
        assert.strictEqual(sendJsonArgs.apiVersion, 'v1', 'Should indicate v1 API was used');
    });

    it('should fallback to v1 API if v3 fails with 400', async () => {
        const v3Error = new Error('Bad request');
        v3Error.status = 400;

        const mockV1Response = {
            data: {
                success: true
            }
        };

        context.httpRequest = sinon.stub();
        context.httpRequest.onFirstCall().rejects(v3Error);
        context.httpRequest.onSecondCall().resolves(mockV1Response);

        context.messages = {
            in: {
                content: {
                    listId: '54321',
                    companyIds: ['111', '222']
                }
            }
        };

        await component.receive(context);

        // Verify v1 fallback was used
        assert.strictEqual(context.httpRequest.callCount, 2, 'Should make 2 requests');
        const v1Args = context.httpRequest.getCall(1).args[0];
        assert(v1Args.url.includes('/contacts/v1/lists/'), 'Should fallback to v1');
        assert.deepStrictEqual(v1Args.data.ids, [111, 222], 'Should send company IDs as integers');
    });

    it('should throw error when listId is missing', async () => {
        context.messages = {
            in: {
                content: {
                    companyId: '123'
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('List ID is required'), 'Should throw validation error');
        }
    });

    it('should throw error when neither companyId nor companyIds is provided', async () => {
        context.messages = {
            in: {
                content: {
                    listId: '19267'
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Either companyId or companyIds is required'), 'Should throw validation error');
        }
    });

    it('should throw error when both APIs fail', async () => {
        const v3Error = new Error('V3 not found');
        v3Error.status = 404;

        const v1Error = new Error('V1 failed');

        context.httpRequest = sinon.stub();
        context.httpRequest.onFirstCall().rejects(v3Error);
        context.httpRequest.onSecondCall().rejects(v1Error);

        context.messages = {
            in: {
                content: {
                    listId: '99999',
                    companyId: '888'
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Failed to add companies to list'), 'Should throw combined error');
        }
    });

    it('should not fallback to v1 if v3 fails with non-404/400 error', async () => {
        const v3Error = new Error('Server error');
        v3Error.status = 500;

        context.httpRequest = sinon.stub();
        context.httpRequest.rejects(v3Error);

        context.messages = {
            in: {
                content: {
                    listId: '19267',
                    companyId: '123'
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.strictEqual(context.httpRequest.callCount, 1, 'Should only try v3 API');
            assert(error.message.includes('Server error'), 'Should throw original error');
        }
    });

    it('should handle AMER list (19267)', async () => {
        const mockResponse = {
            data: {
                success: true
            }
        };

        context.httpRequest = sinon.stub().resolves(mockResponse);

        context.messages = {
            in: {
                content: {
                    listId: '19267',
                    companyId: '123'
                }
            }
        };

        await component.receive(context);

        const requestArgs = context.httpRequest.getCall(0).args[0];
        assert(requestArgs.url.includes('/crm/v3/lists/19267/memberships/add'), 'Should use AMER list ID');
    });

    it('should handle EMEA list (19268)', async () => {
        const mockResponse = {
            data: {
                success: true
            }
        };

        context.httpRequest = sinon.stub().resolves(mockResponse);

        context.messages = {
            in: {
                content: {
                    listId: '19268',
                    companyId: '456'
                }
            }
        };

        await component.receive(context);

        const requestArgs = context.httpRequest.getCall(0).args[0];
        assert(requestArgs.url.includes('/crm/v3/lists/19268/memberships/add'), 'Should use EMEA list ID');
    });
});

