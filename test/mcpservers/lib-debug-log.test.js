'use strict';
/* eslint-disable no-underscore-dangle */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');

// Every stdio MCP connector's lib.js logs the StdioClientTransport params when DEBUG is on.
// The params env is the account's auth (API keys, tokens, passwords): it must never reach the flow log.

const MCP_DIR = path.join(__dirname, '../../src/appmixer/mcpservers');
const SECRET = 'super-secret-token-value-3001';

const stdioLibs = fs.readdirSync(MCP_DIR)
    .map(name => path.join(MCP_DIR, name, 'lib.js'))
    .filter(file => fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes('StdioClientTransport'));

// Fakes for the MCP SDK and pidusage, so lib.js can run without the connectors' node_modules.
const stubs = {
    '@modelcontextprotocol/sdk/client/index.js': {
        Client: class {
            async connect() {}
            async listTools() { return { tools: [] }; }
            async close() {}
        }
    },
    '@modelcontextprotocol/sdk/client/stdio.js': {
        StdioClientTransport: class {
            constructor(params) {
                this.params = params;
                this._process = { pid: process.pid };
            }
        }
    },
    pidusage: async () => ({ cpu: 0, memory: 0 })
};

describe('mcpservers lib.js DEBUG logging', function() {

    let originalLoad;

    before(function() {
        originalLoad = Module._load;
        Module._load = function(request, ...rest) {
            if (Object.prototype.hasOwnProperty.call(stubs, request)) {
                return stubs[request];
            }
            return originalLoad.call(this, request, ...rest);
        };
    });

    after(function() {
        Module._load = originalLoad;
    });

    it('finds the stdio MCP connectors', function() {
        assert(stdioLibs.length >= 20, `expected at least 20 stdio lib.js files, found ${stdioLibs.length}`);
    });

    stdioLibs.forEach(file => {
        const connector = path.basename(path.dirname(file));

        it(`${connector}: does not log the account credentials`, async function() {
            delete require.cache[require.resolve(file)];
            const lib = require(file);
            const logs = [];
            const context = {
                flowId: 'flow',
                componentId: 'component',
                config: { DEBUG: 'true' },
                log: async (entry) => { logs.push(entry); }
            };
            const env = { API_KEY: SECRET, AUTH_PASSWORD: SECRET };

            const result = await lib.mcpCall(context, env, 'listTools', []);

            assert.deepStrictEqual(result, { tools: [] });
            const serialized = JSON.stringify(logs);
            assert(!serialized.includes(SECRET), 'a secret from env was written to the log');

            const connecting = logs.find(entry => entry.step === 'connecting-mcp-client');
            assert(connecting, 'connecting-mcp-client step is logged');
            assert.deepStrictEqual(connecting.params.env, { API_KEY: '***', AUTH_PASSWORD: '***' });
            const connected = logs.find(entry => entry.step === 'connected-mcp-client');
            assert(connected, 'connected-mcp-client step is logged');
            assert.deepStrictEqual(connected.params.env, { API_KEY: '***', AUTH_PASSWORD: '***' });
            // The real env still goes to the MCP server process.
            assert.strictEqual(env.API_KEY, SECRET);
        });
    });
});
