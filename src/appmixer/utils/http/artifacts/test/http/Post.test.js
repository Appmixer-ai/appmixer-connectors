'use strict';

const assert = require('assert');
const fs = require('fs');
const { getCertPaths, ensureCertsGenerated } = require('./https-test-server');

describe('HTTP POST Component with SSL/TLS Certificates', () => {

    before(async function() {
        this.timeout(10000);
        await ensureCertsGenerated();
    });

    function createMockContext(fileContents = {}) {
        const context = {
            messages: { in: { content: {} } },
            auth: {},
            getFileReadStream: async (fileId) => {
                if (fileContents[fileId]) {
                    return (async function* () {
                        yield Buffer.from(fileContents[fileId]);
                    }());
                }
                throw new Error(`File not found: ${fileId}`);
            },
            getFileInfo: async (fileId) => ({
                name: fileId,
                length: Buffer.byteLength(fileContents[fileId] || '')
            }),
            sendJson: async (data, port) => ({ data, port })
        };
        return context;
    }

    it('should create HTTPS agent with ignoreSsl=true', async function() {
        this.timeout(5000);
        const request = require('../../../../http/http-commons');
        const context = createMockContext();
        context.messages.in.content = {
            ignoreSsl: true
        };

        const httpsAgent = await request.buildHttpsAgentFromFiles(
            context,
            null,
            null,
            null,
            true
        );

        assert(httpsAgent);
        assert.strictEqual(httpsAgent.options.rejectUnauthorized, false);
    });

    it('should create HTTPS agent with CA certificate', async function() {
        this.timeout(5000);
        const request = require('../../../../http/http-commons');
        const { ca: caCertPath } = getCertPaths();
        const caCertContent = fs.readFileSync(caCertPath, 'utf8');
        const context = createMockContext({ 'ca-cert-id': caCertContent });

        const httpsAgent = await request.buildHttpsAgentFromFiles(
            context,
            'ca-cert-id',
            null,
            null,
            false
        );

        assert(httpsAgent);
        assert(httpsAgent.options.ca);
    });

    it('should create HTTPS agent with mutual TLS', async function() {
        this.timeout(5000);
        const request = require('../../../../http/http-commons');
        const { cert: certPath, key: keyPath } = getCertPaths();
        const certContent = fs.readFileSync(certPath, 'utf8');
        const keyContent = fs.readFileSync(keyPath, 'utf8');
        const context = createMockContext({
            'client-cert': certContent,
            'client-key': keyContent
        });

        const httpsAgent = await request.buildHttpsAgentFromFiles(
            context,
            null,
            'client-cert',
            'client-key',
            false
        );

        assert(httpsAgent);
        assert(httpsAgent.options.cert);
        assert(httpsAgent.options.key);
    });

    it('should return null without SSL options', async function() {
        this.timeout(5000);
        const request = require('../../../../http/http-commons');
        const context = createMockContext();

        const httpsAgent = await request.buildHttpsAgentFromFiles(
            context,
            null,
            null,
            null,
            false
        );

        assert.strictEqual(httpsAgent, null);
    });

    it('should combine CA certificate with ignoreSsl', async function() {
        this.timeout(5000);
        const request = require('../../../../http/http-commons');
        const { ca: caPath } = getCertPaths();
        const caContent = fs.readFileSync(caPath, 'utf8');
        const context = createMockContext({
            'ca': caContent
        });

        const httpsAgent = await request.buildHttpsAgentFromFiles(
            context,
            'ca',
            null,
            null,
            true
        );

        assert(httpsAgent);
        assert.strictEqual(httpsAgent.options.rejectUnauthorized, false);
        assert(httpsAgent.options.ca);
    });
});
