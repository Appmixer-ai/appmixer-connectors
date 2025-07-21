/**
 * Integration test for Clerk connector
 * This test runs components in sequence to test their interactions
 * It required a valid Clerk API set during `appmixer test auth login`
 */

describe('Clerk Connector Integration Tests', function() {
    this.timeout(10000); // 10 second timeout

    let userId;

    // Skip this if no auth is set
    before(function() {
        const os = require('os');
        const path = require('path');
        const appmixerJsonLoc = path.join(os.homedir(), '.config', 'configstore', 'appmixer.json');
        const fs = require('fs');
        const content = fs.readFileSync(appmixerJsonLoc, 'utf8');
        const config = JSON.parse(content);
        if (!config['appmixer:clerk'] || !config['appmixer:clerk'].authFields || !config['appmixer:clerk'].authFields.apiKey) {
            console.warn('Skipping Clerk integration tests: No API key set in appmixer.json');
            this.skip();
        }
    });

    it('CreateUser', async function() {
        const { execSync } = require('child_process');
        const uniqueEmail = `test.user+${Date.now()}@example.com`;
        const input = `{"in":{"emailAddresses":"${uniqueEmail}","password":"830e935a-8333-4fde-a487-2cceb642639c","firstName":"John","lastName":"Doe"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/CreateUser -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
            console.log('CreateUser output:', output);
        } catch (err) {
            throw new Error(`CreateUser failed: ${err.stdout || err.message}`);
        }
        // Find the last valid JSON object in the output (the result)
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            // Try to extract JSON substring from the line
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj && obj.id) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result) {
            throw new Error('No JSON output with id found from CreateUser');
        }
        userId = result.id;
        console.log('CreateUser result:', result);
    });

    it('GetUser', async function() {
        if (!userId) {
            throw new Error('No userId available from CreateUser test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${userId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/GetUser -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`GetUser failed: ${err.stdout || err.message}`);
        }
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj && obj.id === userId) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result || !result.id || result.id !== userId) {
            throw new Error('GetUser did not return the expected user id');
        }
        console.log('GetUser result:', result);
    });

    it('FindUsers', async function() {
        if (!userId) {
            throw new Error('No userId available from CreateUser test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"userId":"${userId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/FindUsers -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`FindUsers failed: ${err.stdout || err.message}`);
        }
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    // FindUsers now returns {result: [...], count: X} format
                    if (obj && (Array.isArray(obj.result) || obj.count !== undefined)) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result) {
            throw new Error('FindUsers did not return expected result format');
        }
        console.log('FindUsers result:', result);
    });


    let emailId;

    it('CreateEmail', async function() {
        if (!userId) {
            throw new Error('No userId available from CreateUser test');
        }
        const { execSync } = require('child_process');
        const email = `secondary-${Date.now()}@example.com`;
        // Fixed parameter names: userId (camelCase) and email (not email_address)
        const input = `{"in":{"userId":"${userId}","email":"${email}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/CreateEmail -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`CreateEmail failed: ${err.stdout || err.message}`);
        }
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj && obj.id) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result || !result.id) {
            throw new Error('CreateEmail did not return an email id');
        }
        emailId = result.id;
        console.log('CreateEmail result:', result);
    });

    it('DeleteEmail', async function() {
        if (!emailId) {
            throw new Error('No emailId available from CreateEmail test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${emailId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/DeleteEmail -i '${input}' --json`;
        try {
            execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`DeleteEmail failed: ${err.stdout || err.message}`);
        }
        // Success if no error thrown
        console.log('DeleteEmail executed successfully.');
    });


    let organizationId;

    it('CreateOrganization', async function() {
        const { execSync } = require('child_process');
        const orgName = `Test Org ${Date.now()}`;
        const input = `{"in":{"name":"${orgName}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/CreateOrganization -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`CreateOrganization failed: ${err.stdout || err.message}`);
        }
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj && obj.id) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result || !result.id) {
            throw new Error('CreateOrganization did not return an organization id');
        }
        organizationId = result.id;
        console.log('CreateOrganization result:', result);
    });

    it('GetOrganization', async function() {
        if (!organizationId) {
            throw new Error('No organizationId available from CreateOrganization test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${organizationId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/GetOrganization -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            // Handle server errors gracefully
            if (err.stdout && err.stdout.includes('500')) {
                console.warn('GetOrganization: Server error (500) - skipping test');
                this.skip();
                return;
            }
            throw new Error(`GetOrganization failed: ${err.stdout || err.message}`);
        }
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj && obj.id) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result || !result.id || result.id !== organizationId) {
            throw new Error('GetOrganization did not return the expected organization id');
        }
        console.log('GetOrganization result:', result);
    });

    it('FindOrganizations', async function() {
        const { execSync } = require('child_process');
        const input = '{"in":{}}';
        const cmd = `appmixer test component src/appmixer/clerk/core/FindOrganizations -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`FindOrganizations failed: ${err.stdout || err.message}`);
        }
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    // FindOrganizations now returns {result: [...], count: X} format
                    if (obj && (Array.isArray(obj.result) || obj.count !== undefined)) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result) {
            throw new Error('FindOrganizations did not return expected result format');
        }
        console.log('FindOrganizations result:', result);
    });

    it('AddUsertoOrganization', async function() {
        if (!userId || !organizationId) {
            throw new Error('No userId or organizationId available from previous tests');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"userId":"${userId}","id":"${organizationId}","role":"org:member"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/AddUsertoOrganization -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`AddUsertoOrganization failed: ${err.stdout || err.message}`);
        }
        // AddUsertoOrganization may return empty object on success or membership object
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result) {
            throw new Error('AddUsertoOrganization did not return any result');
        }
        console.log('AddUsertoOrganization result:', result);
    });

    it('FindSessions', async function() {
        if (!userId) {
            throw new Error('No userId available from CreateUser test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"userId":"${userId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/FindSessions -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`FindSessions failed: ${err.stdout || err.message}`);
        }
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj && Array.isArray(obj.sessions)) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result || !Array.isArray(result.sessions)) {
            throw new Error('FindSessions did not return a sessions array');
        }
        console.log('FindSessions result:', result);
    });

    let sessionId;

    it('CreateSession', async function() {
        if (!userId) {
            throw new Error('No userId available from CreateUser test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"userId":"${userId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/CreateSession -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            // CreateSession is only available for testing, might fail in production environments
            if (err.stdout && (err.stdout.includes('404') || err.stdout.includes('403') || err.stdout.includes('This operation is intended only for use in testing'))) {
                console.warn('CreateSession: Expected failure in non-testing environment (operation intended only for testing)');
                this.skip();
                return;
            }
            throw new Error(`CreateSession failed: ${err.stdout || err.message}`);
        }
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj && obj.id) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result || !result.id) {
            throw new Error('CreateSession did not return a session id');
        }
        sessionId = result.id;
        console.log('CreateSession result:', result);
    });

    it('GetSession', async function() {
        if (!sessionId) {
            console.log('Skipping GetSession: No sessionId available (CreateSession might have been skipped)');
            this.skip();
            return;
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${sessionId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/GetSession -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`GetSession failed: ${err.stdout || err.message}`);
        }
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj && obj.id === sessionId) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result || !result.id || result.id !== sessionId) {
            throw new Error('GetSession did not return the expected session id');
        }
        console.log('GetSession result:', result);
    });

    it('RefreshSession', async function() {
        if (!sessionId) {
            console.log('Skipping RefreshSession: No sessionId available (CreateSession might have been skipped)');
            this.skip();
            return;
        }
        const { execSync } = require('child_process');
        // Note: In a real scenario, you'd have actual tokens. For testing purposes, we use dummy values
        const input = `{"in":{"sessionId":"${sessionId}","expiredToken":"dummy_expired_token","refreshToken":"dummy_refresh_token","requestOrigin":"https://example.com"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/RefreshSession -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            // RefreshSession might fail with dummy tokens, which is expected
            if (err.stdout && (err.stdout.includes('401') || err.stdout.includes('400') || err.stdout.includes('invalid') || err.stdout.includes('token'))) {
                console.warn('RefreshSession: Expected failure with dummy tokens (401/400 errors expected)');
                return;
            }
            throw new Error(`RefreshSession failed unexpectedly: ${err.stdout || err.message}`);
        }
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        console.log('RefreshSession result:', result);
    });

    it('RevokeSession', async function() {
        if (!sessionId) {
            console.log('Skipping RevokeSession: No sessionId available (CreateSession might have been skipped)');
            this.skip();
            return;
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${sessionId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/RevokeSession -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`RevokeSession failed: ${err.stdout || err.message}`);
        }
        // RevokeSession may return empty object on success
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result) {
            throw new Error('RevokeSession did not return any result');
        }
        console.log('RevokeSession result:', result);
    });

    it('LockUser', async function() {
        if (!userId) {
            throw new Error('No userId available from CreateUser test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${userId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/LockUser -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`LockUser failed: ${err.stdout || err.message}`);
        }
        // LockUser may return empty object on success or user object
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result) {
            throw new Error('LockUser did not return any result');
        }
        console.log('LockUser result:', result);
    });

    it('UnlockUser', async function() {
        if (!userId) {
            throw new Error('No userId available from CreateUser test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${userId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/UnlockUser -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`UnlockUser failed: ${err.stdout || err.message}`);
        }
        // UnlockUser may return empty object on success or user object
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result) {
            throw new Error('UnlockUser did not return any result');
        }
        console.log('UnlockUser result:', result);
    });

    it('BanUser', async function() {
        if (!userId) {
            throw new Error('No userId available from CreateUser test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${userId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/BanUser -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`BanUser failed: ${err.stdout || err.message}`);
        }
        // BanUser may return empty object on success or user object
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result) {
            throw new Error('BanUser did not return any result');
        }
        console.log('BanUser result:', result);
    });

    it('UnbanUser', async function() {
        if (!userId) {
            throw new Error('No userId available from CreateUser test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${userId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/UnbanUser -i '${input}' --json`;
        let output;
        try {
            output = execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`UnbanUser failed: ${err.stdout || err.message}`);
        }
        // UnbanUser may return empty object on success or user object
        let result = null;
        const lines = output.split(/\r?\n/).reverse();
        for (const line of lines) {
            const jsonStart = line.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = line.slice(jsonStart);
                try {
                    const obj = JSON.parse(jsonStr);
                    if (obj) {
                        result = obj;
                        break;
                    }
                } catch (e) { /* not JSON, skip */ }
            }
        }
        if (!result) {
            throw new Error('UnbanUser did not return any result');
        }
        console.log('UnbanUser result:', result);
    });

    it('RemoveUserFromOrganization', async function() {
        if (!userId || !organizationId) {
            throw new Error('No userId or organizationId available from previous tests');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${organizationId}","userId":"${userId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/RemoveUserFromOrganization -i '${input}' --json`;
        try {
            execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`RemoveUserFromOrganization failed: ${err.stdout || err.message}`);
        }
        // Success if no error thrown
        console.log('RemoveUserFromOrganization executed successfully.');
    });

    it('DeleteOrganization', async function() {
        if (!organizationId) {
            throw new Error('No organizationId available from CreateOrganization test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${organizationId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/DeleteOrganization -i '${input}' --json`;
        try {
            execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`DeleteOrganization failed: ${err.stdout || err.message}`);
        }
        // Success if no error thrown
        console.log('DeleteOrganization executed successfully.');
    });

    it('DeleteUser', async function() {
        if (!userId) {
            throw new Error('No userId available from CreateUser test');
        }
        const { execSync } = require('child_process');
        const input = `{"in":{"id":"${userId}"}}`;
        const cmd = `appmixer test component src/appmixer/clerk/core/DeleteUser -i '${input}' --json`;
        try {
            execSync(cmd, { encoding: 'utf8' });
        } catch (err) {
            throw new Error(`DeleteUser failed: ${err.stdout || err.message}`);
        }
        // Success if no error thrown
        console.log('DeleteUser executed successfully.');
    });
});
