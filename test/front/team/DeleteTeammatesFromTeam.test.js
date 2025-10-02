'use strict';

const assert = require('assert');

describe('DeleteTeammatesFromTeam Component', function() {

    let component;

    beforeEach(function() {
        component = require('../../../src/appmixer/front/team/DeleteTeammatesFromTeam/DeleteTeammatesFromTeam.js');
    });

    it('should expose receive method', function() {
        assert(typeof component.receive === 'function');
    });

    it('should validate required team_id input', async function() {
        const context = {
            messages: {
                in: {
                    content: {
                        teammate_ids: 'tmt_123,tmt_456'
                    }
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

    it('should validate required teammate_ids input', async function() {
        const context = {
            messages: {
                in: {
                    content: {
                        team_id: 'tea_123'
                    }
                }
            },
            CancelError: class extends Error { }
        };

        try {
            await component.receive(context);
            assert.fail('Should throw CancelError for missing teammate_ids');
        } catch (error) {
            assert(error.message === 'Teammate IDs are required.', 'Should throw correct error message');
        }
    });

    it('should parse comma-separated teammate IDs into array', async function() {
        const mockResponse = { success: true };

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        team_id: 'tea_123',
                        teammate_ids: 'tmt_123,tmt_456,tmt_789'
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

        assert(Array.isArray(requestConfig.data.teammate_ids), 'Should convert teammate IDs to array');
        assert.deepEqual(requestConfig.data.teammate_ids, ['tmt_123', 'tmt_456', 'tmt_789'], 'Should split comma-separated IDs correctly');
    });

    it('should handle single teammate ID', async function() {
        const mockResponse = { success: true };

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        team_id: 'tea_123',
                        teammate_ids: 'tmt_123'
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

        assert(Array.isArray(requestConfig.data.teammate_ids), 'Should convert single teammate ID to array');
        assert.deepEqual(requestConfig.data.teammate_ids, ['tmt_123'], 'Should handle single ID correctly');
    });

    it('should make DELETE request to correct URL', async function() {
        const mockResponse = { success: true };

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        team_id: 'tea_123',
                        teammate_ids: 'tmt_123,tmt_456'
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

        assert(requestConfig.method === 'DELETE', 'Should use DELETE method');
        assert(requestConfig.url === 'https://api2.frontapp.com/teams/tea_123/teammates', 'Should use correct URL');
        assert(requestConfig.headers.Authorization === 'Bearer test_token', 'Should use correct authorization header');
        assert(requestConfig.headers['Content-Type'] === 'application/json', 'Should use correct content type');
    });

    it('should send empty object to out port', async function() {
        const mockResponse = { success: true };

        let outputData = null;
        let outputPort = null;

        const context = {
            messages: {
                in: {
                    content: {
                        team_id: 'tea_123',
                        teammate_ids: 'tmt_123,tmt_456'
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

        assert.deepEqual(outputData, {}, 'Should send empty object to output for delete operation');
        assert(outputPort === 'out', 'Should send to out port');
    });
});
