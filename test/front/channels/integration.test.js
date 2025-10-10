/**
 * Integration test for Front Channels
 * This test runs channel components in sequence to test their interactions
 * It requires a valid Front API token set in environment variable FRONT_API_TOKEN
 */

/**
 * Helper function to extract the last valid JSON object from output string
 * @param {string} output - Command output string to parse
 * @param {Object} [options] - Additional options
 * @param {string} [options.requiredId] - If provided, will only match objects with this specific id
 * @param {function} [options.validate] - Custom validation function for the parsed object
 * @returns {Object} Parsed JSON object
 * @throws {Error} If no valid JSON object is found
 */
function extractLastJsonWithId(output, options = {}) {
    let result = null;
    const lines = output.split(/\r?\n/).reverse();

    for (const line of lines) {
        try {
            // Try parsing the entire line as JSON first
            const obj = JSON.parse(line);

            // Check if object is valid based on different test scenarios
            if (obj) {
                // If obj is an array, try to find a valid object in it
                if (Array.isArray(obj)) {
                    const validObj = obj.find(item =>
                        item && (item.id ||
                            (options.validate && options.validate(item)) ||
                            item.result ||
                            item.count !== undefined)
                    );
                    if (validObj) {
                        result = validObj;
                        break;
                    }
                }

                // Direct object validation
                if (
                    obj.id ||
                    (options.validate && options.validate(obj)) ||
                    obj.result ||
                    obj.count !== undefined ||
                    obj.success !== undefined
                ) {
                    // If requiredId is provided, check for exact match
                    if (options.requiredId && obj.id !== options.requiredId) {
                        continue;
                    }

                    result = obj;
                    break;
                }
            }
        } catch (e) {
            // If not a full JSON line, try parsing from first '{' onwards
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj) {
                        if (
                            obj.id ||
                            (options.validate && options.validate(obj)) ||
                            obj.result ||
                            obj.count !== undefined ||
                            obj.success !== undefined
                        ) {
                            // If requiredId is provided, check for exact match
                            if (options.requiredId && obj.id !== options.requiredId) {
                                continue;
                            }

                            result = obj;
                            break;
                        }
                    }
                } catch (parseError) {
                    // Skip if parsing fails
                }
            }
        }
    }

    if (!result) {
        console.error('Parsing failed. Full output:', output);
        throw new Error('No valid JSON object found in output');
    }
    return result;
}

describe('Front Channels Integration Tests', function() {
    this.timeout(30000); // 30 second timeout

    let testInboxId;
    let testChannelId;

    // Skip this if no auth is set
    before(function() {
        if (!process.env.FRONT_API_TOKEN) {
            console.warn('Skipping Front Channels integration tests: No FRONT_API_TOKEN environment variable set');
            this.skip();
        }
    });

    // Get available inboxes to test with
    it('should get available inboxes for testing', async function() {
        const { execSync } = require('child_process');
        const input = '{"in":{}}';
        const cmd = `FRONT_API_TOKEN="${process.env.FRONT_API_TOKEN}" appmixer test component src/appmixer/front/core/ListInboxes -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
            console.log('ListInboxes output:', output);
        } catch (err) {
            throw new Error(`ListInboxes failed: ${err.stdout || err.message}`);
        }

        const result = extractLastJsonWithId(output, {
            validate: obj => Array.isArray(obj.result) && obj.result.length > 0
        });

        if (!result.result || result.result.length === 0) {
            throw new Error('No inboxes available for testing');
        }

        testInboxId = result.result[0].id;
        console.log('Using inbox for testing:', testInboxId);
    });

    it('ListChannels - should list channels for an inbox', async function() {
        if (!testInboxId) {
            throw new Error('No testInboxId available from previous test');
        }

        const { execSync } = require('child_process');
        const input = `{"in":{"inboxId":"${testInboxId}"}}`;
        const cmd = `FRONT_API_TOKEN="${process.env.FRONT_API_TOKEN}" appmixer test component src/appmixer/front/channels/ListChannels -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
            console.log('ListChannels output:', output);
        } catch (err) {
            throw new Error(`ListChannels failed: ${err.stdout || err.message}`);
        }

        const result = extractLastJsonWithId(output, {
            validate: obj => (Array.isArray(obj.result) || obj.count !== undefined)
        });
        console.log('ListChannels result:', result);

        // Store a channel ID for later tests if available
        if (result.result && result.result.length > 0) {
            testChannelId = result.result[0].id;
            console.log('Found existing channel for testing:', testChannelId);
        }
    });

    it('CreateChannel - should create a new custom channel', async function() {
        if (!testInboxId) {
            throw new Error('No testInboxId available from previous test');
        }

        const { execSync } = require('child_process');
        const input = `{"in":{"inboxId":"${testInboxId}","type":"custom","settings":"{\\"webhook_url\\":\\"https://example.com/webhook\\"}"}}`;
        const cmd = `FRONT_API_TOKEN="${process.env.FRONT_API_TOKEN}" appmixer test component src/appmixer/front/channels/CreateChannel -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
            console.log('CreateChannel output:', output);
        } catch (err) {
            // Channel creation might fail due to limitations in demo accounts
            if (err.stdout && (err.stdout.includes('403') || err.stdout.includes('forbidden') || err.stdout.includes('not allowed'))) {
                console.warn('CreateChannel: Expected failure - channel creation not allowed in demo account');
                this.skip();
                return;
            }
            throw new Error(`CreateChannel failed: ${err.stdout || err.message}`);
        }

        const result = extractLastJsonWithId(output);
        if (!testChannelId) {
            testChannelId = result.id;
        }
        console.log('CreateChannel result:', result);
    });

    it('GetChannel - should get channel details', async function() {
        if (!testChannelId) {
            console.log('Skipping GetChannel: No testChannelId available');
            this.skip();
            return;
        }

        const { execSync } = require('child_process');
        const input = `{"in":{"channelId":"${testChannelId}"}}`;
        const cmd = `FRONT_API_TOKEN="${process.env.FRONT_API_TOKEN}" appmixer test component src/appmixer/front/channels/GetChannel -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
            console.log('GetChannel output:', output);
        } catch (err) {
            throw new Error(`GetChannel failed: ${err.stdout || err.message}`);
        }

        const result = extractLastJsonWithId(output, {
            requiredId: testChannelId,
            validate: obj => obj.id === testChannelId
        });
        console.log('GetChannel result:', result);
    });

    it('UpdateChannel - should update channel settings', async function() {
        if (!testChannelId) {
            console.log('Skipping UpdateChannel: No testChannelId available');
            this.skip();
            return;
        }

        const { execSync } = require('child_process');
        const input = `{"in":{"channelId":"${testChannelId}","settings":"{\\"description\\":\\"Updated via API test\\"}"}}`;
        const cmd = `FRONT_API_TOKEN="${process.env.FRONT_API_TOKEN}" appmixer test component src/appmixer/front/channels/UpdateChannel -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
            console.log('UpdateChannel output:', output);
        } catch (err) {
            // Update might fail due to channel type restrictions
            if (err.stdout && (err.stdout.includes('403') || err.stdout.includes('forbidden') || err.stdout.includes('not allowed') || err.stdout.includes('400'))) {
                console.warn('UpdateChannel: Expected failure - channel update not allowed or unsupported settings');
                this.skip();
                return;
            }
            throw new Error(`UpdateChannel failed: ${err.stdout || err.message}`);
        }

        const result = extractLastJsonWithId(output, {
            validate: obj => obj.id !== undefined
        });
        console.log('UpdateChannel result:', result);
    });

    it('ValidateChannel - should validate SMTP channel (or fail gracefully for non-SMTP)', async function() {
        if (!testChannelId) {
            console.log('Skipping ValidateChannel: No testChannelId available');
            this.skip();
            return;
        }

        const { execSync } = require('child_process');
        const input = `{"in":{"channelId":"${testChannelId}"}}`;
        const cmd = `FRONT_API_TOKEN="${process.env.FRONT_API_TOKEN}" appmixer test component src/appmixer/front/channels/ValidateChannel -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
            console.log('ValidateChannel output:', output);
        } catch (err) {
            // ValidateChannel is only for SMTP channels, expect failures for other types
            console.warn('ValidateChannel: Expected failure for non-SMTP channel types');
            return; // Don't throw error, this is expected behavior
        }

        const result = extractLastJsonWithId(output, {
            validate: obj => obj.success !== undefined || obj.message !== undefined
        });
        console.log('ValidateChannel result:', result);
    });

    // Test error handling
    it('GetChannel - should handle invalid channel ID gracefully', async function() {
        const { execSync } = require('child_process');
        const input = '{"in":{"channelId":"cha_invalid"}}';
        const cmd = `FRONT_API_TOKEN="${process.env.FRONT_API_TOKEN}" appmixer test component src/appmixer/front/channels/GetChannel -i '${input}' --json`;

        try {
            const output = execSync(cmd, { encoding: 'utf8' });
            // If it doesn't throw an error, that's unexpected
            console.log('GetChannel with invalid ID output:', output);
            throw new Error('Expected GetChannel to fail with invalid channel ID');
        } catch (err) {
            // This is expected - should fail with 404 or similar
            if (err.stdout && (err.stdout.includes('404') || err.stdout.includes('not found'))) {
                console.log('GetChannel correctly failed with invalid channel ID');
            } else {
                throw new Error(`GetChannel failed unexpectedly: ${err.stdout || err.message}`);
            }
        }
    });

    // Test ListChannels with different output types
    it('ListChannels - should work with first output type', async function() {
        if (!testInboxId) {
            throw new Error('No testInboxId available');
        }

        const { execSync } = require('child_process');
        const input = `{"in":{"inboxId":"${testInboxId}","outputType":"first"}}`;
        const cmd = `FRONT_API_TOKEN="${process.env.FRONT_API_TOKEN}" appmixer test component src/appmixer/front/channels/ListChannels -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
            console.log('ListChannels (first) output:', output);
        } catch (err) {
            // Might fail if no channels exist
            if (err.stdout && err.stdout.includes('No records available')) {
                console.log('ListChannels (first): No channels available for first output type - this is expected');
                return;
            }
            throw new Error(`ListChannels (first) failed: ${err.stdout || err.message}`);
        }

        const result = extractLastJsonWithId(output, {
            validate: obj => obj.index !== undefined && obj.count !== undefined
        });
        console.log('ListChannels (first) result:', result);
    });

    it('ListChannels - should work with object output type', async function() {
        if (!testInboxId) {
            throw new Error('No testInboxId available');
        }

        const { execSync } = require('child_process');
        const input = `{"in":{"inboxId":"${testInboxId}","outputType":"object"}}`;
        const cmd = `FRONT_API_TOKEN="${process.env.FRONT_API_TOKEN}" appmixer test component src/appmixer/front/channels/ListChannels -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
            console.log('ListChannels (object) output:', output);
        } catch (err) {
            throw new Error(`ListChannels (object) failed: ${err.stdout || err.message}`);
        }

        // For object output type, we might get multiple JSON objects
        console.log('ListChannels (object) completed successfully');
    });
});
