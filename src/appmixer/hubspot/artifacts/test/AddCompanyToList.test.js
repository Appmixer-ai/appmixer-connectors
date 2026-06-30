'use strict';

const assert = require('assert');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

const componentPath = '../../crm/AddCompanyToList/AddCompanyToList';
const component = require(componentPath);
const { createMockContext } = require('../../../../../test/utils');

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
            assert.equal(error.message, 'Company IDs are required!');
        }
    });
});
