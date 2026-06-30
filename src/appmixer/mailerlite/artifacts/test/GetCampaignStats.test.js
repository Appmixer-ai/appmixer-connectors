'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const sinon = require('sinon');

describe('GetCampaignStats Component', function() {

    this.timeout(30000);
    let context;
    let GetCampaignStats;
    let testCampaignId;

    before(async function() {
        // Skip all tests if the API key is not set
        if (!process.env.MAILERLITE_API_KEY) {
            console.log('Skipping tests - MAILERLITE_API_KEY not set');
            this.skip();
        }

        // Load the component
        GetCampaignStats = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/GetCampaignStats/GetCampaignStats.js'));

        // We need a campaign ID to test with. Let's use FindCampaigns to get one
        const FindCampaigns = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/FindCampaigns/FindCampaigns.js'));
        const findContext = {
            auth: {
                apiKey: process.env.MAILERLITE_API_KEY
            },
            messages: {
                in: {
                    content: {
                        outputType: 'first',
                        limit: 1
                    }
                }
            },
            properties: {
                generateOutputPortOptions: false
            },
            httpRequest: require('axios'),
            sendJson: sinon.stub()
        };

        await FindCampaigns.receive(findContext);

        if (findContext.sendJson.called) {
            const [output, outputPort] = findContext.sendJson.firstCall.args;
            if (outputPort === 'out' && output?.id) {
                testCampaignId = output.id;
            }
        }

        if (!testCampaignId) {
            console.log('No campaigns found to test with');
            this.skip();
        }
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

    it('should get campaign stats by ID', async function() {
        context.messages.in.content = {
            campaignId: testCampaignId
        };

        await GetCampaignStats.receive(context);

        assert.ok(context.sendJson.calledOnce);
        const [output, outputPort] = context.sendJson.firstCall.args;
        assert.strictEqual(outputPort, 'out');
        assert.strictEqual(typeof output, 'object');
        assert.strictEqual(output.id, testCampaignId);
        assert.ok(output.name);
        assert.ok(output.type);
        assert.ok(output.status);
    });

    it('should throw error when campaign ID is missing', async function() {
        context.messages.in.content = {};

        let error;
        try {
            await GetCampaignStats.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Campaign ID is required!');
        assert.ok(!context.sendJson.called);
    });
});
