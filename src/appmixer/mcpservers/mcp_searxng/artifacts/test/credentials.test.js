'use strict';

// Regression tests for GHSA-hjwh-xvfw-qrwj (mcp-searxng < 1.12.0: SearXNG Basic Auth credentials
// exposed through MCP logs). The connector no longer installs mcp-searxng; it runs the bundled
// server.js. These tests check that neither server.js nor the account name exposes the credentials.

const assert = require('assert');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const auth = require('../../auth.js').definition();

const CONNECTOR_DIR = path.join(__dirname, '..', '..');
const SERVER_SCRIPT = path.join(CONNECTOR_DIR, 'server.js');
const USERNAME = 'alice';
const PASSWORD = 'S3cr3t-pa55word';
const BASIC = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

function assertNoSecret(text, where) {

    assert.ok(!String(text).includes(PASSWORD), `${where} contains the password: ${text}`);
    assert.ok(!String(text).includes(BASIC), `${where} contains the Basic Auth header value: ${text}`);
}

describe('mcp_searxng credentials (GHSA-hjwh-xvfw-qrwj)', () => {

    describe('auth.accountNameFromProfileInfo', () => {

        it('drops credentials embedded in SEARXNG_URL', () => {

            const name = auth.accountNameFromProfileInfo({
                SEARXNG_URL: `https://${USERNAME}:${PASSWORD}@searx.example.com/searxng`
            });
            assertNoSecret(name, 'account name');
            assert.ok(!name.includes(USERNAME), name);
            assert.strictEqual(name, 'https://searx.example.com/searxng');
        });

        it('keeps a URL without credentials unchanged', () => {

            assert.strictEqual(
                auth.accountNameFromProfileInfo({ SEARXNG_URL: 'https://searx.perennialte.ch' }),
                'https://searx.perennialte.ch'
            );
        });
    });

    describe('server.js', function() {

        this.timeout(20000);

        let Client;
        let StdioClientTransport;
        let instance;
        let instanceUrl;

        before(function() {

            try {
                const sdkClient = require.resolve('@modelcontextprotocol/sdk/client/index.js', { paths: [CONNECTOR_DIR] });
                const sdkStdio = require.resolve('@modelcontextprotocol/sdk/client/stdio.js', { paths: [CONNECTOR_DIR] });
                require.resolve('node-html-markdown', { paths: [CONNECTOR_DIR] });
                Client = require(sdkClient).Client;
                StdioClientTransport = require(sdkStdio).StdioClientTransport;
            } catch (err) {
                // Runtime dependencies are installed in the connector directory (npm install there).
                this.skip();
            }
        });

        before((done) => {

            // A SearXNG instance that rejects the request and echoes the Authorization header back,
            // so a leak through the error path would show up in the tool result.
            instance = http.createServer((req, res) => {
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end(`unauthorized, got: ${req.headers.authorization || ''}`);
            });
            instance.listen(0, '127.0.0.1', () => {
                instanceUrl = `127.0.0.1:${instance.address().port}`;
                done();
            });
        });

        after((done) => {

            if (instance) {
                return instance.close(done);
            }
            done();
        });

        async function runServer(env) {

            const transport = new StdioClientTransport({
                command: process.execPath,
                args: [SERVER_SCRIPT],
                env: Object.assign({ PATH: process.env.PATH }, env),
                stderr: 'pipe'
            });
            let stderr = '';
            transport.stderr.on('data', chunk => {
                stderr += chunk.toString();
            });
            const notifications = [];
            const client = new Client({ name: 'searxng-credentials-test', version: '1.0.0' });
            client.fallbackNotificationHandler = async (notification) => {
                notifications.push(notification);
            };
            await client.connect(transport);
            try {
                const tools = await client.listTools();
                const search = await client.callTool({ name: 'searxng_web_search', arguments: { query: 'appmixer' } });
                const read = await client.callTool({
                    name: 'web_url_read',
                    arguments: { url: `http://${USERNAME}:${PASSWORD}@example.com/` }
                });
                // Let pending stderr output arrive.
                await new Promise(resolve => setTimeout(resolve, 200));
                return { tools, search, read, stderr, notifications };
            } finally {
                await client.close();
            }
        }

        function assertClean(run) {

            assert.strictEqual(run.search.isError, true);
            assert.ok(run.search.content[0].text.includes('SearXNG API error: 401'), run.search.content[0].text);
            assertNoSecret(JSON.stringify(run.tools), 'tools/list');
            assertNoSecret(JSON.stringify(run.search), 'searxng_web_search result');
            assertNoSecret(JSON.stringify(run.read), 'web_url_read result');
            assertNoSecret(run.stderr, 'stderr');
            assertNoSecret(JSON.stringify(run.notifications), 'MCP notifications');
            assert.deepStrictEqual(run.notifications.filter(n => n.method === 'notifications/message'), []);
        }

        it('credentials in SEARXNG_URL never reach the client, notifications or stderr', async () => {

            assertClean(await runServer({ SEARXNG_URL: `http://${USERNAME}:${PASSWORD}@${instanceUrl}` }));
        });

        it('AUTH_USERNAME / AUTH_PASSWORD never reach the client, notifications or stderr', async () => {

            assertClean(await runServer({
                SEARXNG_URL: `http://${instanceUrl}`,
                AUTH_USERNAME: USERNAME,
                AUTH_PASSWORD: PASSWORD
            }));
        });

        it('an invalid SEARXNG_URL is not echoed in the startup error', async () => {

            const child = spawn(process.execPath, [SERVER_SCRIPT], {
                env: { PATH: process.env.PATH, SEARXNG_URL: `http//${USERNAME}:${PASSWORD}@ not a url` }
            });
            let output = '';
            child.stdout.on('data', chunk => {
                output += chunk.toString();
            });
            child.stderr.on('data', chunk => {
                output += chunk.toString();
            });
            const code = await new Promise(resolve => child.on('close', resolve));
            assert.strictEqual(code, 1);
            assert.ok(output.includes('SEARXNG_URL environment variable must be a valid absolute URL'), output);
            assertNoSecret(output, 'startup output');
        });
    });
});
