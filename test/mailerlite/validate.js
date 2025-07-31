#!/usr/bin/env node

/**
 * Mailerlite Connector Validation Script
 * 
 * This script validates that the Mailerlite connector is properly configured
 * and can connect to the API successfully.
 */

const path = require('path');
const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m', 
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function validateConnection() {
    log('\n🧪 Mailerlite Connector Validation', colors.bold + colors.blue);
    log('====================================', colors.blue);
    
    // Check environment variable
    log('\n1. Checking Environment Configuration...', colors.yellow);
    
    if (!process.env.MAILERLITE_ACCESS_TOKEN) {
        log('❌ MAILERLITE_ACCESS_TOKEN not found in environment', colors.red);
        log('   Please set this in test/.env file', colors.red);
        log('   Get your token from: https://app.mailerlite.com/integrations/api', colors.blue);
        return false;
    }
    
    const token = process.env.MAILERLITE_ACCESS_TOKEN;
    log(`✅ Token found: ${token.substring(0, 10)}...${token.slice(-4)}`, colors.green);
    
    // Test API connection
    log('\n2. Testing API Connection...', colors.yellow);
    
    try {
        const response = await axios({
            method: 'GET',
            url: 'https://connect.mailerlite.com/api/timezones',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        });

        if (response.status === 200 && response.data && Array.isArray(response.data.data)) {
            log('✅ API connection successful', colors.green);
            log(`   Found ${response.data.data.length} timezones`, colors.green);
        } else {
            log('❌ Unexpected API response format', colors.red);
            return false;
        }
    } catch (error) {
        if (error.response) {
            log(`❌ API Error: ${error.response.status} - ${error.response.statusText}`, colors.red);
            if (error.response.status === 401) {
                log('   This usually means your API token is invalid or expired', colors.red);
                log('   Please check your token in the Mailerlite dashboard', colors.blue);
            }
        } else if (error.code === 'ENOTFOUND') {
            log('❌ Network Error: Cannot reach Mailerlite API', colors.red);
            log('   Please check your internet connection', colors.red);
        } else {
            log(`❌ Connection Error: ${error.message}`, colors.red);
        }
        return false;
    }
    
    // Test basic functionality
    log('\n3. Testing Component Loading...', colors.yellow);
    
    try {
        const FindSubscribers = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/FindSubscribers/FindSubscribers.js'));
        log('✅ FindSubscribers component loaded', colors.green);
        
        const CreateSubscriber = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/CreateSubscriber/CreateSubscriber.js'));
        log('✅ CreateSubscriber component loaded', colors.green);
        
        const auth = require(path.join(__dirname, '../../src/appmixer/mailerlite/auth.js'));
        log('✅ Authentication module loaded', colors.green);
        
    } catch (error) {
        log(`❌ Component loading error: ${error.message}`, colors.red);
        return false;
    }
    
    // Test a simple API call
    log('\n4. Testing Subscriber Listing...', colors.yellow);
    
    try {
        const response = await axios({
            method: 'GET',
            url: 'https://connect.mailerlite.com/api/subscribers',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: { limit: 5 },
            timeout: 10000
        });
        
        if (response.status === 200 && response.data) {
            const subscribers = response.data.data || [];
            log(`✅ Successfully retrieved ${subscribers.length} subscribers`, colors.green);
            
            if (subscribers.length > 0) {
                log(`   Sample subscriber: ${subscribers[0].email || 'N/A'}`, colors.green);
            }
        }
    } catch (error) {
        if (error.response && error.response.status !== 401) {
            log(`⚠️  Subscriber API warning: ${error.response.status}`, colors.yellow);
            log('   This might be normal if you have no subscribers', colors.yellow);
        } else {
            log(`❌ Subscriber API error: ${error.message}`, colors.red);
            return false;
        }
    }
    
    // Test groups endpoint
    log('\n5. Testing Groups Listing...', colors.yellow);
    
    try {
        const response = await axios({
            method: 'GET',
            url: 'https://connect.mailerlite.com/api/groups',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        });
        
        if (response.status === 200 && response.data) {
            const groups = response.data.data || [];
            log(`✅ Successfully retrieved ${groups.length} groups`, colors.green);
            
            if (groups.length > 0) {
                log(`   Sample group: ${groups[0].name || 'N/A'}`, colors.green);
            }
        }
    } catch (error) {
        if (error.response && error.response.status !== 401) {
            log(`⚠️  Groups API warning: ${error.response.status}`, colors.yellow);
            log('   This might be normal if you have no groups', colors.yellow);
        } else {
            log(`❌ Groups API error: ${error.message}`, colors.red);
            return false;
        }
    }
    
    log('\n✅ All validations passed!', colors.bold + colors.green);
    log('   Your Mailerlite connector is ready for testing', colors.green);
    log('\n📋 Next Steps:', colors.bold + colors.blue);
    log('   • Run full tests: node runTests.js', colors.blue);
    log('   • Or run individual tests: node -e "require(\'./FindSubscribers.test.js\')"', colors.blue);
    log('   • Check the testing guide for more details\n', colors.blue);
    
    return true;
}

// Run validation if called directly
if (require.main === module) {
    validateConnection().catch(error => {
        log(`\n❌ Validation failed: ${error.message}`, colors.red);
        process.exit(1);
    });
}

module.exports = validateConnection;
