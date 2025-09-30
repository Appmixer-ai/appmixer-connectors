'use strict';

const assert = require('assert');
const { checkAccessTokenOrSkip } = require('./testHelper');

describe('GetCurrentUser', function() {
    this.timeout(30000); // 30 second timeout

    const componentPath = '../../src/appmixer/helpscout/core/GetCurrentUser/GetCurrentUser.js';
    let component;

    before(function() {
        // Skip all tests if no access token is available
        checkAccessTokenOrSkip(this);
        component = require(componentPath);
    });

    it('should return current user profile', async () => {

        // Mock context
        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert(typeof data === 'object');
                assert(typeof data.id === 'number');
                assert(typeof data.firstName === 'string');
                assert(typeof data.email === 'string');
                return data;
            }
        };

        // Execute component
        const result = await component.receive(context);
        assert(result);
    });
});
