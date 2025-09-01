'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const sinon = require('sinon');

describe('FindGroups Component', function() {

    this.timeout(30000);
    let context;
    let FindGroups;

    before(function() {
        // Skip all tests if the API key is not set
        if (!process.env.MAILERLITE_API_KEY) {
            console.log('Skipping tests - MAILERLITE_API_KEY not set');
            this.skip();
        }

        // Load the component
        FindGroups = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/FindGroups/FindGroups.js'));
    });

    beforeEach(function() {
        // Mock context
        context = {
            auth: {
                apiKey: process.env.MAILERLITE_API_KEY
            },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
            httpRequest: require('axios'),
            sendJson: sinon.stub(),
            log: sinon.stub(),
            CancelError: Error
        };
    });

    it('should find groups with default limit', async function() {
        context.messages.in.content = {
            outputType: 'array'
        };

        await FindGroups.receive(context);

        assert(context.sendJson.called, 'sendJson should be called');
        const [data, port] = context.sendJson.firstCall.args;

        // Should send to either 'out' or 'notFound' port
        assert(['out', 'notFound'].includes(port), `Should send to out or notFound port, got: ${port}`);

        if (port === 'out') {
            if (context.messages.in.content.outputType === 'array') {
                assert(typeof data === 'object', 'Data should be an object when outputType is array');
                assert(Array.isArray(data.result), 'Data.result should be an array when outputType is array');
                assert(typeof data.count === 'number', 'Data.count should be a number when outputType is array');
            } else {
                assert(Array.isArray(data), 'Data should be an array for non-array outputType');
            }
        } else if (port === 'notFound') {
            assert.deepStrictEqual(data, {}, 'Data should be empty object when sent to notFound port');
        }
    });

    it('should find groups with custom limit', async function() {
        context.messages.in.content = {
            outputType: 'array',
            limit: 50
        };

        await FindGroups.receive(context);

        assert(context.sendJson.called, 'sendJson should be called');
        const [data, port] = context.sendJson.firstCall.args;

        // Should send to either 'out' or 'notFound' port
        assert(['out', 'notFound'].includes(port), `Should send to out or notFound port, got: ${port}`);

        if (port === 'out') {
            if (context.messages.in.content.outputType === 'array') {
                assert(typeof data === 'object', 'Data should be an object when outputType is array');
                assert(Array.isArray(data.result), 'Data.result should be an array when outputType is array');
                assert(typeof data.count === 'number', 'Data.count should be a number when outputType is array');
            } else {
                assert(Array.isArray(data), 'Data should be an array for non-array outputType');
            }
        } else if (port === 'notFound') {
            assert.deepStrictEqual(data, {}, 'Data should be empty object when sent to notFound port');
        }
    });

    it('should respect limit parameter cap of 100', async function() {
        context.messages.in.content = {
            outputType: 'array',
            limit: 200
        };

        await FindGroups.receive(context);

        assert(context.sendJson.called, 'sendJson should be called');
        const [data, port] = context.sendJson.firstCall.args;

        // Should send to either 'out' or 'notFound' port
        assert(['out', 'notFound'].includes(port), `Should send to out or notFound port, got: ${port}`);

        if (port === 'out') {
            if (context.messages.in.content.outputType === 'array') {
                assert(typeof data === 'object', 'Data should be an object when outputType is array');
                assert(Array.isArray(data.result), 'Data.result should be an array when outputType is array');
                assert(typeof data.count === 'number', 'Data.count should be a number when outputType is array');
                // Limit should be capped at 100, so we shouldn't get more than 100 results
                assert(data.result.length <= 100, 'Should not return more than 100 groups due to limit cap');
            } else {
                assert(Array.isArray(data), 'Data should be an array for non-array outputType');
                assert(data.length <= 100, 'Should not return more than 100 groups due to limit cap');
            }
        }
    });
});
