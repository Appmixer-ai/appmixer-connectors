const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindConversations Component', function() {
    let context;
    let FindConversations;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindConversations = require(path.join(__dirname, '../../src/appmixer/intercom/core/FindConversations/FindConversations.js'));

        // Mock context
        context = {
            auth: {
                accessToken: process.env.INTERCOM_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            sendJson: function(data, port) {
                return { data, port };
            },
            httpRequest: require('./httpRequest.js'),
            log: function(level, message, data) {
                if (level === 'error') {
                    console.error(`[${level}] ${message}`, data || '');
                }
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            },
            properties: {}
        };
    });

    it('should list conversations without query', async function() {
        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            const result = await FindConversations.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return conversation data');
            assert(Array.isArray(result.data), 'Should return an array');
        } catch (error) {
            console.error('Error finding conversations:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should search conversations with query', async function() {
        context.messages.in.content = {
            query: 'test',
            outputType: 'array'
        };

        try {
            const result = await FindConversations.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return conversation data');
            assert(Array.isArray(result.data), 'Should return an array');
        } catch (error) {
            console.error('Error searching conversations:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should handle structured query object', async function() {
        context.messages.in.content = {
            query: {
                operator: 'AND',
                value: [
                    {
                        field: 'source.type',
                        operator: '=',
                        value: 'conversation'
                    }
                ]
            },
            outputType: 'array'
        };

        try {
            const result = await FindConversations.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return conversation data');
            assert(Array.isArray(result.data), 'Should return an array');
        } catch (error) {
            console.error('Error searching conversations with structured query:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should return output port options when generateOutputPortOptions is true', async function() {
        context.properties.generateOutputPortOptions = true;
        context.messages.in.content = {
            outputType: 'first'
        };

        try {
            const result = await FindConversations.receive(context);

            assert(result, 'Should return a result');
            // This should return options instead of actual data
        } catch (error) {
            console.error('Error generating output port options:', error.response?.data || error.message);
            throw error;
        }
    });
});
