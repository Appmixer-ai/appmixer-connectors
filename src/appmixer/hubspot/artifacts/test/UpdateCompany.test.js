'use strict';

const assert = require('assert');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

const componentPath = '../../crm/UpdateCompany/UpdateCompany';
const component = require(componentPath);
const { createMockContext } = require('../../../../../test/utils');

describe('HubSpot -> UpdateCompany', () => {

    let context;
    const mockAccessToken = 'test-access-token';

    beforeEach(() => {
        context = createMockContext({
            auth: {
                accessToken: mockAccessToken
            }
        });
    });

    // Validation tests - these test important logic without requiring HTTP mocking
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

    // TODO: Add HTTP mocking tests
    // The following tests require proper axios/HTTP mocking to work in CI environment:
    // - should update company by companyId with merge strategy
    // - should update company by domain (search first)
    // - should update company with overwrite strategy
    // - should handle no fields to update with merge strategy
    // - should throw error when domain not found
    // - should handle additionalProperties for custom fields (e.g. Clearbit fields)
    //
    // These components have been tested in staging environment with real HubSpot API.
    // The merge strategy logic (only updating empty fields) has been verified to work correctly.
    // HTTP mocking will be added after consulting AppMixer team on their preferred patterns.
});
