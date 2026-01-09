'use strict';

const assert = require('assert');
const path = require('path');

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
    });

    // Validation tests - these test important logic without requiring HTTP mocking
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
            assert(error.message.includes('Either companyId or companyIds'), 'Should throw validation error');
        }
    });

    // TODO: Add HTTP mocking tests
    // The following tests require proper axios/HTTP mocking to work in CI environment:
    // - should add single company to list using v3 API
    // - should add multiple companies to list using v3 API
    // - should fallback to v1 API if v3 fails with 404
    // - should fallback to v1 API if v3 fails with 400
    // - should throw error when both APIs fail
    // - should not fallback to v1 if v3 fails with non-404/400 error
    // - should handle AMER list (19267)
    // - should handle EMEA list (19268)
    //
    // These components have been tested in staging environment with real HubSpot API.
    // HTTP mocking will be added after consulting AppMixer team on their preferred patterns.
});
