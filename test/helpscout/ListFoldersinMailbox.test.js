'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('ListFoldersinMailbox', () => {

    const componentPath = '../../src/appmixer/helpscout/core/ListFoldersinMailbox/ListFoldersinMailbox.js';
    let component;

    before(() => {
        component = require(componentPath);
    });

    it('should return list of folders in mailbox (array)', async () => {

        // First get a mailbox ID
        const mailboxResponse = await require('./httpRequest.js')({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/mailboxes',
            headers: {
                'Authorization': `Bearer ${process.env.HELPSCOUT_ACCESS_TOKEN}`
            }
        });

        const mailboxes = mailboxResponse.data['_embedded']?.mailboxes || [];
        if (mailboxes.length === 0) {
            console.log('No mailboxes found, skipping test');
            return;
        }

        const mailboxId = mailboxes[0].id;

        let sendJsonCalled = false;
        let sentData = null;
        
        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            properties: {},
            messages: {
                in: {
                    content: {
                        mailboxId: mailboxId,
                        outputType: 'array'
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                sendJsonCalled = true;
                sentData = data;
                assert.strictEqual(port, 'out');
                assert(data);
                assert(typeof data === 'object');
                assert(Array.isArray(data.result));
                assert(typeof data.count === 'number');
                console.log(`Found ${data.count} folders in mailbox ${mailboxId}`);
                return Promise.resolve(data);
            },
            CancelError: class extends Error {}
        };

        // Execute component
        await component.receive(context);
        
        // Verify that sendJson was called with correct data
        assert(sendJsonCalled, 'sendJson should have been called');
        assert(sentData, 'Data should have been sent');
    });

    it('should throw error when mailboxId is missing', async () => {

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            properties: {},
            messages: {
                in: {
                    content: {
                        outputType: 'array'
                        // Missing mailboxId
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: () => {},
            CancelError: class extends Error {}
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error for missing mailboxId');
        } catch (error) {
            assert(error.message.includes('Mailbox ID is required'));
        }
    });
});
