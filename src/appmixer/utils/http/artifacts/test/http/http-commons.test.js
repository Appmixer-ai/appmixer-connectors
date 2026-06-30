const sinon = require('sinon');
const assert = require('assert');
const https = require('https');

describe('http processResponse', () => {

    let axiosRequestStub;

    beforeEach(() => {
        // Stub axios from the http connector's node_modules
        const axios = require('../../../../http/node_modules/axios');
        axiosRequestStub = sinon.stub(axios, 'request').callsFake((options) => {
            return new Promise((resolve) => {
                resolve({
                    status: 200,
                    config: options,
                    headers: {
                        'content-type': 'application/json; charset=utf-8',
                        'x-custom-header': 'custom-value'
                    },
                    data: { key: 'value' }
                });
            });
        });
    });

    afterEach(() => {
        axiosRequestStub.restore();
    });

    it('should correctly parse and return response headers', async () => {

        const testUrl = 'https://foo.bar/';

        const request = require('../../../http-commons');
        const result = await request({}, 'get', {
            url: testUrl
        });

        assert.equal(result.statusCode, 200);
        assert.equal(result.request.uri.href, testUrl);
        assert.equal(result.request.method, 'get');
        assert.deepEqual(result.headers['x-custom-header'], 'custom-value');
        assert.deepEqual(result.headers['content-type'], {
            type: 'application/json',
            parameters: { charset: 'utf-8' }
        });
        assert.deepEqual(result.body, { key: 'value' });
    });
});

describe('http buildHttpsAgent', () => {

    before(async function() {
        this.timeout(10000);
        const { ensureCertsGenerated } = require('./https-test-server');
        await ensureCertsGenerated();
    });

    // Helper function to create mock context with file operations
    function createMockContext(fileContents = {}) {
        return {
            getFileReadStream: async (fileId) => {
                if (fileContents[fileId]) {
                    // Return an async iterable that yields the file content
                    const content = fileContents[fileId];
                    return (async function* () {
                        yield Buffer.from(content);
                    }());
                }
                throw new Error(`File not found: ${fileId}`);
            }
        };
    }

    it('should return null when no SSL options are provided', async () => {
        const httpCommons = require('../../../../http/http-commons');
        const context = createMockContext();

        const agent = await httpCommons.buildHttpsAgentFromFiles(context, null, null, null, false);
        assert.strictEqual(agent, null);
    });

    it('should create agent with rejectUnauthorized=false when ignoreSsl=true', async () => {
        const httpCommons = require('../../../../http/http-commons');
        const context = createMockContext();

        const agent = await httpCommons.buildHttpsAgentFromFiles(context, null, null, null, true);
        assert(agent instanceof https.Agent);
        assert.strictEqual(agent.options.rejectUnauthorized, false);
    });

    it('should create agent with CA certificate when provided', async () => {
        const httpCommons = require('../../../../http/http-commons');

        // Create a valid CA certificate for testing
        const validCaCert = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUXoydS8qKJZZYW5w9QfqDUw0wDQYJKoZIhvcNAQELBQAw
W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5
AA==
-----END CERTIFICATE-----`;

        const context = createMockContext({
            'ca-cert-id': validCaCert
        });

        const agent = await httpCommons.buildHttpsAgentFromFiles(context, 'ca-cert-id', null, null, false);
        assert(agent instanceof https.Agent);
        assert(agent.options.ca);
        assert(typeof agent.options.ca === 'string');
        assert(agent.options.ca.includes('BEGIN CERTIFICATE'));
    });

    it('should throw error for invalid PEM certificate format', async () => {
        const httpCommons = require('../../../../http/http-commons');

        const invalidCert = 'not-a-valid-pem-certificate';

        const context = createMockContext({
            'invalid-cert': invalidCert
        });

        try {
            await httpCommons.buildHttpsAgentFromFiles(context, 'invalid-cert', null, null, false);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('is not in valid PEM format'));
        }
    });

    it('should create agent with client certificate and key for mutual TLS', async () => {
        const httpCommons = require('../../../../http/http-commons');

        const validClientCert = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUXoydS8qKJZZYW5w9QfqDUw0wDQYJKoZIhvcNAQELBQAw
W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5
AA==
-----END CERTIFICATE-----`;

        const validClientKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAuVuQuVuQuVuQuVuQuVuQuVuQuVuQuVuQuVuQuVuQuVuQuVuQ
+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3
+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3+N3
-----END RSA PRIVATE KEY-----`;

        const context = createMockContext({
            'client-cert-id': validClientCert,
            'client-key-id': validClientKey
        });

        const agent = await httpCommons.buildHttpsAgentFromFiles(
            context, null, 'client-cert-id', 'client-key-id', false
        );

        assert(agent instanceof https.Agent);
        assert(agent.options.cert);
        assert(agent.options.key);
        assert(typeof agent.options.cert === 'string');
        assert(typeof agent.options.key === 'string');
        assert(agent.options.cert.includes('BEGIN CERTIFICATE'));
        assert(agent.options.key.includes('BEGIN RSA PRIVATE KEY'));
    });

    it('should combine multiple SSL options in a single agent', async () => {
        const httpCommons = require('../../../../http/http-commons');

        const validCaCert = `-----BEGIN CERTIFICATE-----
W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5W5C5
AA==
-----END CERTIFICATE-----`;

        const context = createMockContext({
            'ca-cert-id': validCaCert
        });

        const agent = await httpCommons.buildHttpsAgentFromFiles(
            context, 'ca-cert-id', null, null, true
        );

        assert(agent instanceof https.Agent);
        assert.strictEqual(agent.options.rejectUnauthorized, false);
        assert(agent.options.ca);
        assert(agent.options.ca.includes('BEGIN CERTIFICATE'));
    });
});
