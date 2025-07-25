const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testFindSpaces() {
    console.log('Testing FindSpaces component...');
    
    // Check if access token is available
    if (!process.env.GOOGLE_CHAT_ACCESS_TOKEN) {
        console.log('GOOGLE_CHAT_ACCESS_TOKEN not set - skipping test');
        return;
    }
    
    console.log('Access token found, proceeding with test...');
    
    try {
        // Load the component
        const FindSpaces = require(path.join(__dirname, '../../src/appmixer/googleChat/core/FindSpaces/FindSpaces.js'));
        
        // Create mock context
        const context = {
            auth: {
                accessToken: process.env.GOOGLE_CHAT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            },
            properties: {},
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            },
            sendJson: function(output, port) {
                console.log('=== FindSpaces Result ===');
                console.log('Port:', port);
                console.log('Data:', JSON.stringify(output, null, 2));
            }
        };
        
        // Test the component
        await FindSpaces.receive(context);
        
        console.log('✓ FindSpaces test completed successfully');
        
    } catch (error) {
        console.error('✗ FindSpaces test failed:');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testFindSpaces().catch(console.error);
