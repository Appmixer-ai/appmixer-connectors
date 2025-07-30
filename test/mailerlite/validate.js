const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Simple validation script to test one component
async function validateComponent() {
    console.log('🔍 Quick Validation Test');
    console.log('========================');
    
    // Check environment
    if (!process.env.MAILERLITE_ACCESS_TOKEN) {
        console.log('❌ MAILERLITE_ACCESS_TOKEN not found in environment');
        return false;
    }
    
    console.log('✅ MAILERLITE_ACCESS_TOKEN found');
    console.log('✅ MAILERLITE_SUBSCRIBER_ID:', process.env.MAILERLITE_SUBSCRIBER_ID ? 'available' : 'not set');
    
    // Load and test FindSubscribers component
    try {
        const FindSubscribers = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/FindSubscribers/FindSubscribers.js'));
        const httpRequest = require('./httpRequest.js');
        
        const context = {
            auth: {
                apiToken: process.env.MAILERLITE_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: { outputType: 'array' }
                }
            },
            properties: {},
            httpRequest: httpRequest,
            sendJson: function(data, port) {
                console.log('📊 FindSubscribers Result:', {
                    port: port,
                    dataType: typeof data,
                    isArray: Array.isArray(data?.result),
                    count: data?.count,
                    firstItem: data?.result?.[0] ? {
                        id: data.result[0].id,
                        email: data.result[0].email,
                        status: data.result[0].status
                    } : 'No items'
                });
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
        
        console.log('🔧 Testing FindSubscribers component...');
        await FindSubscribers.receive(context);
        console.log('✅ FindSubscribers test passed!');
        
        return true;
        
    } catch (error) {
        console.log('❌ FindSubscribers test failed:');
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

// Test GetSubscriber if ID is available
async function testGetSubscriber() {
    if (!process.env.MAILERLITE_SUBSCRIBER_ID) {
        console.log('⏭️ Skipping GetSubscriber test - no MAILERLITE_SUBSCRIBER_ID');
        return true;
    }
    
    try {
        const GetSubscriber = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/GetSubscriber/GetSubscriber.js'));
        const httpRequest = require('./httpRequest.js');
        
        const context = {
            auth: {
                apiToken: process.env.MAILERLITE_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: { subscriber_id: process.env.MAILERLITE_SUBSCRIBER_ID }
                }
            },
            properties: {},
            httpRequest: httpRequest,
            sendJson: function(data, port) {
                console.log('📊 GetSubscriber Result:', {
                    port: port,
                    dataType: typeof data,
                    id: data?.id,
                    email: data?.email,
                    status: data?.status
                });
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
        
        console.log('🔧 Testing GetSubscriber component...');
        await GetSubscriber.receive(context);
        console.log('✅ GetSubscriber test passed!');
        
        return true;
        
    } catch (error) {
        console.log('❌ GetSubscriber test failed:');
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

// Run validation
validateComponent()
    .then(success => {
        if (success) {
            return testGetSubscriber();
        }
        return false;
    })
    .then(success => {
        console.log('');
        if (success) {
            console.log('🎉 Quick validation successful! Components are working.');
            console.log('');
            console.log('To run full test suite:');
            console.log('cd test/mailerlite && npm test');
            console.log('or');
            console.log('cd test/mailerlite && npx mocha *.test.js --timeout 30000');
        } else {
            console.log('❌ Validation failed. Check your configuration and try again.');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 Validation script error:', error);
        process.exit(1);
    });
