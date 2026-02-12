'use strict';

const assert = require('assert');
const sinon = require('sinon');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

const Hubspot = require('../../Hubspot');
const componentPath = '../../crm/UpdateCompany/UpdateCompany';
const component = require(componentPath);
const { createMockContext } = require('../../../../../test/utils');

describe('HubSpot -> UpdateCompany', () => {

    let context;
    let hubspotCallStub;
    const mockAccessToken = 'test-access-token';

    beforeEach(() => {
        context = createMockContext({
            auth: {
                accessToken: mockAccessToken
            }
        });
        hubspotCallStub = sinon.stub(Hubspot.prototype, 'call');
    });

    afterEach(() => {
        sinon.restore();
    });

    // Validation tests
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
            assert(error.message.includes('Either Company ID or domain is required'), 'Should throw validation error');
        }
    });

    // HTTP mocking tests using sinon stubs on Hubspot.prototype.call
    it('should update company by companyId with merge strategy', async () => {
        context.messages = {
            in: {
                content: {
                    companyId: '123',
                    name: 'New Name',
                    industry: 'Technology'
                }
            }
        };

        // First call: GET existing company (merge strategy fetches current data)
        hubspotCallStub.withArgs('get', 'crm/v3/objects/companies/123').resolves({
            data: {
                id: '123',
                properties: {
                    name: 'Existing Name',  // non-empty, should NOT be overwritten
                    industry: ''             // empty, should be updated
                }
            }
        });

        // Second call: PATCH with only the empty fields
        hubspotCallStub.withArgs('patch', 'crm/v3/objects/companies/123').resolves({
            data: {
                id: '123',
                properties: {
                    name: 'Existing Name',
                    industry: 'Technology'
                }
            }
        });

        await component.receive(context);

        // Verify PATCH was called with only the empty field (industry), not name
        const patchCall = hubspotCallStub.getCalls().find(c => c.args[0] === 'patch');
        assert(patchCall, 'PATCH should have been called');
        assert.strictEqual(patchCall.args[2].properties.industry, 'Technology');
        assert.strictEqual(patchCall.args[2].properties.name, undefined);

        // Verify sendJson called with updated: true
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const output = context.sendJson.getCall(0).args[0];
        assert.strictEqual(output.updated, true);
    });

    it('should update company by domain (search first)', async () => {
        context.messages = {
            in: {
                content: {
                    domain: 'example.com',
                    name: 'New Name'
                }
            }
        };

        // First call: POST search by domain
        hubspotCallStub.withArgs('post', 'crm/v3/objects/companies/search').resolves({
            data: {
                results: [{ id: '456' }]
            }
        });

        // Second call: GET existing company for merge strategy
        hubspotCallStub.withArgs('get', 'crm/v3/objects/companies/456').resolves({
            data: {
                id: '456',
                properties: {
                    domain: 'example.com',
                    name: ''  // empty, should be updated
                }
            }
        });

        // Third call: PATCH with updated fields
        hubspotCallStub.withArgs('patch', 'crm/v3/objects/companies/456').resolves({
            data: {
                id: '456',
                properties: {
                    domain: 'example.com',
                    name: 'New Name'
                }
            }
        });

        await component.receive(context);

        // Verify search was called with correct domain filter
        const searchCall = hubspotCallStub.getCalls().find(c => c.args[0] === 'post');
        assert(searchCall, 'Search POST should have been called');
        const filters = searchCall.args[2].filterGroups[0].filters;
        assert.strictEqual(filters[0].propertyName, 'domain');
        assert.strictEqual(filters[0].value, 'example.com');

        // Verify sendJson called with updated: true
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const output = context.sendJson.getCall(0).args[0];
        assert.strictEqual(output.updated, true);
    });

    it('should update company with overwrite strategy', async () => {
        context.messages = {
            in: {
                content: {
                    companyId: '123',
                    name: 'Overwritten Name',
                    industry: 'Finance',
                    updateStrategy: 'overwrite'
                }
            }
        };

        // Overwrite strategy skips the GET call, goes straight to PATCH
        hubspotCallStub.withArgs('patch', 'crm/v3/objects/companies/123').resolves({
            data: {
                id: '123',
                properties: {
                    name: 'Overwritten Name',
                    industry: 'Finance'
                }
            }
        });

        await component.receive(context);

        // Verify no GET call was made (overwrite doesn't check existing fields)
        const getCalls = hubspotCallStub.getCalls().filter(c => c.args[0] === 'get');
        assert.strictEqual(getCalls.length, 0, 'GET should not be called for overwrite strategy');

        // Verify PATCH includes all provided properties
        const patchCall = hubspotCallStub.getCalls().find(c => c.args[0] === 'patch');
        assert(patchCall, 'PATCH should have been called');
        assert.strictEqual(patchCall.args[2].properties.name, 'Overwritten Name');
        assert.strictEqual(patchCall.args[2].properties.industry, 'Finance');

        // Verify sendJson called with updated: true
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const output = context.sendJson.getCall(0).args[0];
        assert.strictEqual(output.updated, true);
    });

    it('should handle no fields to update with merge strategy', async () => {
        context.messages = {
            in: {
                content: {
                    companyId: '123',
                    name: 'Already Set'
                }
            }
        };

        const existingCompanyData = {
            id: '123',
            properties: {
                name: 'Already Set'  // non-empty, matches input -- nothing to update
            }
        };

        // First GET: merge strategy fetches existing company
        // Second GET: "no fields to update" path also fetches existing company
        hubspotCallStub.withArgs('get', 'crm/v3/objects/companies/123').resolves({
            data: existingCompanyData
        });

        await component.receive(context);

        // Verify no PATCH call was made
        const patchCalls = hubspotCallStub.getCalls().filter(c => c.args[0] === 'patch');
        assert.strictEqual(patchCalls.length, 0, 'PATCH should not be called when no fields to update');

        // Verify sendJson called with updated: false
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const output = context.sendJson.getCall(0).args[0];
        assert.strictEqual(output.updated, false);
        assert.strictEqual(output.message, 'No empty fields to update (merge strategy)');
    });

    it('should throw error when domain not found', async () => {
        context.messages = {
            in: {
                content: {
                    domain: 'nonexistent.com',
                    name: 'Some Company'
                }
            }
        };

        // Search returns empty results
        hubspotCallStub.withArgs('post', 'crm/v3/objects/companies/search').resolves({
            data: {
                results: []
            }
        });

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.strictEqual(error.message, 'Company with domain "nonexistent.com" not found!');
        }
    });

    it('should handle additionalProperties for custom fields (e.g. Clearbit fields)', async () => {
        context.messages = {
            in: {
                content: {
                    companyId: '123',
                    name: 'Test Corp',
                    updateStrategy: 'overwrite',
                    additionalProperties: {
                        AND: [
                            { name: 'clearbit_industry', value: 'Technology' },
                            { name: 'clearbit_employee_count', value: '500' },
                            { name: 'pageviews_last_30_days', value: '42' }
                        ]
                    }
                }
            }
        };

        hubspotCallStub.withArgs('patch', 'crm/v3/objects/companies/123').resolves({
            data: {
                id: '123',
                properties: {
                    name: 'Test Corp',
                    clearbit_industry: 'Technology',
                    clearbit_employee_count: '500',
                    pageviews_last_30_days: '42'
                }
            }
        });

        await component.receive(context);

        // Verify PATCH payload includes both standard and additional properties
        const patchCall = hubspotCallStub.getCalls().find(c => c.args[0] === 'patch');
        assert(patchCall, 'PATCH should have been called');
        const patchedProps = patchCall.args[2].properties;
        assert.strictEqual(patchedProps.name, 'Test Corp');
        assert.strictEqual(patchedProps.clearbit_industry, 'Technology');
        assert.strictEqual(patchedProps.clearbit_employee_count, '500');
        assert.strictEqual(patchedProps.pageviews_last_30_days, '42');

        // Verify sendJson called with updated: true
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const output = context.sendJson.getCall(0).args[0];
        assert.strictEqual(output.updated, true);
    });
});
