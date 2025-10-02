'use strict';

const assert = require('assert');

describe('GetTeam Component', function() {

    let component;

    beforeEach(function() {
        component = require('../../../src/appmixer/front/team/GetTeam/GetTeam.js');
    });

    it('should expose receive method', function() {
        assert(typeof component.receive === 'function');
    });

    it('should validate required team_id input', async function() {
        const context = {
            messages: {
                in: {
                    content: {}
                }
            },
            CancelError: class extends Error { }
        };

        try {
            await component.receive(context);
            assert.fail('Should throw CancelError for missing team_id');
        } catch (error) {
            assert(error.message === 'Team ID is required.', 'Should throw correct error message');
        }
    });

    it('should make GET request to correct URL', async function() {
        const mockResponse = {
            id: 'tea_12345',
            name: 'Test Team',
            description: 'A test team'
        };

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        team_id: 'tea_12345'
                    }
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            CancelError: Error,
            httpRequest: async (config) => {
                requestConfig = config;
                return { data: mockResponse };
            },
            sendJson: (data, port) => {
                return { data, port };
            }
        };

        await component.receive(context);

        assert(requestConfig.method === 'GET', 'Should use GET method');
        assert(requestConfig.url === 'https://api2.frontapp.com/teams/tea_12345', 'Should use correct URL');
        assert(requestConfig.headers.Authorization === 'Bearer test_token', 'Should use correct authorization header');
    });

    it('should send response to out port', async function() {
        const mockResponse = {
            id: 'tea_12345',
            name: 'Test Team',
            description: 'A test team'
        };

        let outputData = null;
        let outputPort = null;

        const context = {
            messages: {
                in: {
                    content: {
                        team_id: 'tea_12345'
                    }
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            CancelError: Error,
            httpRequest: async () => ({ data: mockResponse }),
            sendJson: (data, port) => {
                outputData = data;
                outputPort = port;
                return { data, port };
            }
        };

        await component.receive(context);

        assert.deepEqual(outputData, mockResponse, 'Should send response data to output');
        assert(outputPort === 'out', 'Should send to out port');
    });
});
