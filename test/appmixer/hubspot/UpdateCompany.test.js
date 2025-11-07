'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const componentPath = '../../../src/appmixer/hubspot/crm/UpdateCompany/UpdateCompany';
const component = require(componentPath);
const { createMockContext } = require('../../utils');

describe('HubSpot -> UpdateCompany', () => {

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

    it('should update company by companyId with merge strategy', async () => {
        // Mock GET request to fetch existing company
        const existingCompany = {
            data: {
                id: '123',
                properties: {
                    domain: 'example.com',
                    name: 'Example Corp',
                    industry: 'Technology',
                    numberofemployees: '' // Empty field
                }
            }
        };

        // Mock PATCH request to update company
        const updatedCompany = {
            data: {
                id: '123',
                properties: {
                    domain: 'example.com',
                    name: 'Example Corp',
                    industry: 'Technology',
                    numberofemployees: '50'
                },
                updatedAt: '2025-01-15T12:00:00Z',
                updated: true
            }
        };

        // Setup httpRequest stub to return different responses based on URL
        context.httpRequest = sinon.stub();
        context.httpRequest.onFirstCall().resolves(existingCompany); // GET
        context.httpRequest.onSecondCall().resolves(updatedCompany); // PATCH

        context.messages = {
            in: {
                content: {
                    companyId: '123',
                    numberofemployees: '50',
                    industry: 'Software', // Should not update (not empty)
                    updateStrategy: 'merge'
                }
            }
        };

        await component.receive(context);

        // Verify GET request was made
        assert.strictEqual(context.httpRequest.callCount, 2, 'Should make 2 HTTP requests (GET + PATCH)');
        const getArgs = context.httpRequest.getCall(0).args[0];
        assert(getArgs.url.includes('/crm/v3/objects/companies/123'), 'Should GET existing company');

        // Verify PATCH request
        const patchArgs = context.httpRequest.getCall(1).args[0];
        assert.strictEqual(patchArgs.method, 'patch', 'Should use PATCH method');
        assert(patchArgs.url.includes('/crm/v3/objects/companies/123'), 'Should update correct company');
        assert.strictEqual(patchArgs.data.properties.numberofemployees, '50', 'Should update empty field');
        assert.strictEqual(patchArgs.data.properties.industry, undefined, 'Should not update non-empty field');

        // Verify sendJson was called
        assert.strictEqual(context.sendJson.callCount, 1, 'Should call sendJson once');
        const sendJsonArgs = context.sendJson.getCall(0).args;
        assert.strictEqual(sendJsonArgs[1], 'out', 'Should send to out port');
    });

    it('should update company by domain (search first)', async () => {
        // Mock search request
        const searchResponse = {
            data: {
                results: [
                    { id: '456', properties: { domain: 'test.com' } }
                ]
            }
        };

        // Mock existing company GET
        const existingCompany = {
            data: {
                id: '456',
                properties: {
                    domain: 'test.com',
                    name: ''
                }
            }
        };

        // Mock PATCH response
        const updatedCompany = {
            data: {
                id: '456',
                properties: {
                    domain: 'test.com',
                    name: 'Test Company'
                },
                updatedAt: '2025-01-15T12:00:00Z',
                updated: true
            }
        };

        context.httpRequest = sinon.stub();
        context.httpRequest.onCall(0).resolves(searchResponse); // Search
        context.httpRequest.onCall(1).resolves(existingCompany); // GET
        context.httpRequest.onCall(2).resolves(updatedCompany); // PATCH

        context.messages = {
            in: {
                content: {
                    domain: 'test.com',
                    name: 'Test Company',
                    updateStrategy: 'merge'
                }
            }
        };

        await component.receive(context);

        // Verify search was made
        assert.strictEqual(context.httpRequest.callCount, 3, 'Should make 3 requests (search + GET + PATCH)');
        const searchArgs = context.httpRequest.getCall(0).args[0];
        assert(searchArgs.url.includes('/crm/v3/objects/companies/search'), 'Should search for company');
        assert.strictEqual(searchArgs.data.filterGroups[0].filters[0].propertyName, 'domain', 'Should filter by domain');
        assert.strictEqual(searchArgs.data.filterGroups[0].filters[0].value, 'test.com', 'Should use provided domain');
    });

    it('should update company with overwrite strategy', async () => {
        const updatedCompany = {
            data: {
                id: '789',
                properties: {
                    domain: 'overwrite.com',
                    name: 'New Name',
                    industry: 'New Industry'
                },
                updatedAt: '2025-01-15T12:00:00Z',
                updated: true
            }
        };

        context.httpRequest = sinon.stub();
        context.httpRequest.onFirstCall().resolves(updatedCompany); // PATCH (no GET needed for overwrite)

        context.messages = {
            in: {
                content: {
                    companyId: '789',
                    name: 'New Name',
                    industry: 'New Industry',
                    updateStrategy: 'overwrite'
                }
            }
        };

        await component.receive(context);

        // With overwrite strategy, should only PATCH (no GET)
        assert.strictEqual(context.httpRequest.callCount, 1, 'Should only make PATCH request');
        const patchArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(patchArgs.method, 'patch', 'Should use PATCH method');
        assert.strictEqual(patchArgs.data.properties.name, 'New Name', 'Should update name');
        assert.strictEqual(patchArgs.data.properties.industry, 'New Industry', 'Should update industry');
    });

    it('should handle no fields to update with merge strategy', async () => {
        const existingCompany = {
            data: {
                id: '999',
                properties: {
                    domain: 'full.com',
                    name: 'Full Company',
                    industry: 'Tech'
                }
            }
        };

        context.httpRequest = sinon.stub();
        context.httpRequest.resolves(existingCompany);

        context.messages = {
            in: {
                content: {
                    companyId: '999',
                    name: 'Another Name', // All provided fields are already populated
                    industry: 'Another Industry',
                    updateStrategy: 'merge'
                }
            }
        };

        await component.receive(context);

        // Should GET twice: once for merge check, once to return existing
        assert.strictEqual(context.httpRequest.callCount, 2, 'Should make 2 GET requests');

        // Verify sendJson was called with updated: false
        const sendJsonArgs = context.sendJson.getCall(0).args[0];
        assert.strictEqual(sendJsonArgs.updated, false, 'Should indicate no update was made');
        assert(sendJsonArgs.message.includes('No empty fields'), 'Should include message about no updates');
    });

    it('should throw error when neither companyId nor domain is provided', async () => {
        context.messages = {
            in: {
                content: {
                    name: 'Test Company'
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Either companyId or domain is required'), 'Should throw validation error');
        }
    });

    it('should throw error when domain not found', async () => {
        const searchResponse = {
            data: {
                results: []
            }
        };

        context.httpRequest = sinon.stub();
        context.httpRequest.resolves(searchResponse);

        context.messages = {
            in: {
                content: {
                    domain: 'notfound.com',
                    name: 'Test'
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('not found'), 'Should throw not found error');
        }
    });

    it('should handle Clearbit fields correctly', async () => {
        const existingCompany = {
            data: {
                id: '111',
                properties: {
                    domain: 'clearbit.com',
                    name: '',
                    clearbit_company_name: '',
                    numberofemployees: '',
                    industry: ''
                }
            }
        };

        const updatedCompany = {
            data: {
                id: '111',
                properties: {
                    domain: 'clearbit.com',
                    name: 'Clearbit Inc',
                    clearbit_company_name: 'Clearbit Inc',
                    numberofemployees: '100',
                    industry: 'Data'
                },
                updatedAt: '2025-01-15T12:00:00Z',
                updated: true
            }
        };

        context.httpRequest = sinon.stub();
        context.httpRequest.onFirstCall().resolves(existingCompany);
        context.httpRequest.onSecondCall().resolves(updatedCompany);

        context.messages = {
            in: {
                content: {
                    companyId: '111',
                    name: 'Clearbit Inc',
                    clearbit_company_name: 'Clearbit Inc',
                    numberofemployees: '100',
                    industry: 'Data',
                    last_pageview_at: '2025-01-15T10:00:00Z',
                    pageviews_current_day: '5',
                    updateStrategy: 'merge'
                }
            }
        };

        await component.receive(context);

        const patchArgs = context.httpRequest.getCall(1).args[0];
        assert.strictEqual(patchArgs.data.properties.name, 'Clearbit Inc', 'Should update name');
        assert.strictEqual(patchArgs.data.properties.clearbit_company_name, 'Clearbit Inc', 'Should update Clearbit name');
        assert.strictEqual(patchArgs.data.properties.numberofemployees, '100', 'Should update employees');
        assert.strictEqual(patchArgs.data.properties.last_pageview_at, '2025-01-15T10:00:00Z', 'Should update intent metrics');
    });
});

