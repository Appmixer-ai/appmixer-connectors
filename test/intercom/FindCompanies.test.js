const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createMockContext } = require('../utils');
const httpRequest = require('./httpRequest');
const component = require('../../src/appmixer/intercom/core/FindCompanies/FindCompanies');

// Make createMockContext available globally
global.createMockContext = createMockContext;

describe('Intercom FindCompanies Component', function() {

    let context;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }
    });

    beforeEach(() => {
        context = global.createMockContext({
            auth: {
                accessToken: process.env.INTERCOM_ACCESS_TOKEN
            },
            httpRequest: httpRequest
        });
    });

    it('should list companies without query', async () => {
        context.messages = {
            in: {
                content: {
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const result = context.sendJson.firstCall.args[0];
        assert(result.result, 'Should return result');
        assert(Array.isArray(result.result), 'result should be an array');
        assert(typeof result.count === 'number', 'Should return count');
    });
});
