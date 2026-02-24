'use strict';

const assert = require('assert');
const fs = require('fs');
const { Readable } = require('stream');
const { getCertPaths, ensureCertsGenerated, startHttpsTestServer } = require('./https-test-server');

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
                    // Return a proper readable stream instead of async generator
                    const content = fileContents[fileId];
                    return Readable.from([Buffer.from(content)]);
                }
                throw new Error(`File not found: ${fileId}`);
            },
            getFileInfo: async (fileId) => ({
                name: fileId,
                filename: fileId,
                contentType: 'application/octet-stream',
                length: Buffer.byteLength(fileContents[fileId] || '')
            }),
            sendJson: async (data, port) => ({ data, port }),
            httpRequest: require('../../../../http/node_modules/axios').request,
            CancelError: class CancelError extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
        return context;
    }

    describe('buildHttpsAgentFromFiles - Unit Tests', () => {

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

    describe('POST Component Integration Tests with HTTPS Server', () => {

        let serverObj;

        before(async function() {
            this.timeout(10000);
            // Start HTTPS test server on ephemeral port
            serverObj = await startHttpsTestServer({ port: 0 });
        });

        after(async () => {
            if (serverObj && serverObj.close) {
                await serverObj.close();
            }
        });

        it('should POST raw body with ignoreSsl=true', async function() {
            this.timeout(5000);
            const Post = require('../../../../http/Post/Post');
            const context = createMockContext();

            context.messages.in.content = {
                url: `${serverObj.url}/json`,
                body: JSON.stringify({ test: 'data' }),
                headers: JSON.stringify({ 'Content-Type': 'application/json' }),
                ignoreSsl: true
            };

            const result = await Post.receive(context);

            assert(result);
            assert.strictEqual(result.port, 'response');
            assert(result.data);
            assert.strictEqual(result.data.statusCode, 200);
        });

        it('should POST raw body with CA certificate', async function() {
            this.timeout(5000);
            const Post = require('../../../../http/Post/Post');
            const { ca: caCertPath } = getCertPaths();
            const caCertContent = fs.readFileSync(caCertPath, 'utf8');
            const context = createMockContext({ 'ca-cert-file': caCertContent });

            context.messages.in.content = {
                url: `${serverObj.url}/json`,
                body: JSON.stringify({ test: 'data' }),
                headers: JSON.stringify({ 'Content-Type': 'application/json' }),
                caCertificateFileId: 'ca-cert-file'
            };

            const result = await Post.receive(context);

            assert(result);
            assert.strictEqual(result.port, 'response');
            assert(result.data);
            assert.strictEqual(result.data.statusCode, 200);
        });

        it('should POST raw body with mutual TLS', async function() {
            this.timeout(5000);
            const Post = require('../../../../http/Post/Post');
            const { clientCert: clientCertPath, clientKey: clientKeyPath } = getCertPaths();
            const clientCertContent = fs.readFileSync(clientCertPath, 'utf8');
            const clientKeyContent = fs.readFileSync(clientKeyPath, 'utf8');
            const context = createMockContext({
                'client-cert-file': clientCertContent,
                'client-key-file': clientKeyContent
            });

            context.messages.in.content = {
                url: `${serverObj.url}/json`,
                body: JSON.stringify({ test: 'mutual-tls' }),
                headers: JSON.stringify({ 'Content-Type': 'application/json' }),
                clientCertificateFileId: 'client-cert-file',
                clientKeyFileId: 'client-key-file',
                ignoreSsl: true // Required since we're using self-signed certs
            };

            const result = await Post.receive(context);

            assert(result);
            assert.strictEqual(result.port, 'response');
            assert(result.data);
            assert.strictEqual(result.data.statusCode, 200);
        });

        it('should POST binary data with ignoreSsl=true', async function() {
            this.timeout(5000);
            const Post = require('../../../../http/Post/Post');
            const binaryData = Buffer.from('test binary data').toString();
            const context = createMockContext({ 'test-file': binaryData });

            context.messages.in.content = {
                url: `${serverObj.url}/upload`,
                bodyType: 'binary',
                fileId: 'test-file',
                ignoreSsl: true
            };

            const result = await Post.receive(context);

            assert(result);
            assert.strictEqual(result.port, 'response');
            assert(result.data);
            assert.strictEqual(result.data.statusCode, 200);
        });

        it('should POST binary data with CA certificate', async function() {
            this.timeout(5000);
            const Post = require('../../../../http/Post/Post');
            const binaryData = Buffer.from('test binary data').toString();
            const { ca: caCertPath } = getCertPaths();
            const caCertContent = fs.readFileSync(caCertPath, 'utf8');
            const context = createMockContext({
                'test-file': binaryData,
                'ca-cert-file': caCertContent
            });

            context.messages.in.content = {
                url: `${serverObj.url}/upload`,
                bodyType: 'binary',
                fileId: 'test-file',
                caCertificateFileId: 'ca-cert-file'
            };

            const result = await Post.receive(context);

            assert(result);
            assert.strictEqual(result.port, 'response');
            assert(result.data);
            assert.strictEqual(result.data.statusCode, 200);
        });

        it('should POST binary data with mutual TLS', async function() {
            this.timeout(5000);
            const Post = require('../../../../http/Post/Post');
            const binaryData = Buffer.from('test binary data').toString();
            const { clientCert: clientCertPath, clientKey: clientKeyPath } = getCertPaths();
            const clientCertContent = fs.readFileSync(clientCertPath, 'utf8');
            const clientKeyContent = fs.readFileSync(clientKeyPath, 'utf8');
            const context = createMockContext({
                'test-file': binaryData,
                'client-cert-file': clientCertContent,
                'client-key-file': clientKeyContent
            });

            context.messages.in.content = {
                url: `${serverObj.url}/upload`,
                bodyType: 'binary',
                fileId: 'test-file',
                clientCertificateFileId: 'client-cert-file',
                clientKeyFileId: 'client-key-file',
                ignoreSsl: true // Required since we're using self-signed certs
            };

            const result = await Post.receive(context);

            assert(result);
            assert.strictEqual(result.port, 'response');
            assert(result.data);
            assert.strictEqual(result.data.statusCode, 200);
        });

        it('should POST form-data with ignoreSsl=true', async function() {
            this.timeout(5000);
            const Post = require('../../../../http/Post/Post');
            const fileData = Buffer.from('test file content').toString();
            const context = createMockContext({ 'form-file': fileData });

            context.messages.in.content = {
                url: `${serverObj.url}/upload`,
                bodyType: 'form-data',
                bodyFormData: {
                    ADD: [
                        { name: 'field1', type: 'text', text: 'value1' },
                        { name: 'field2', type: 'number', number: 123 },
                        { name: 'file', type: 'filepicker', filepicker: 'form-file' }
                    ]
                },
                ignoreSsl: true
            };

            const result = await Post.receive(context);

            assert(result);
            assert.strictEqual(result.port, 'response');
            assert(result.data);
            assert.strictEqual(result.data.statusCode, 200);
        });

        it('should POST form-data with CA certificate', async function() {
            this.timeout(5000);
            const Post = require('../../../../http/Post/Post');
            const fileData = Buffer.from('test file content').toString();
            const { ca: caCertPath } = getCertPaths();
            const caCertContent = fs.readFileSync(caCertPath, 'utf8');
            const context = createMockContext({
                'form-file': fileData,
                'ca-cert-file': caCertContent
            });

            context.messages.in.content = {
                url: `${serverObj.url}/upload`,
                bodyType: 'form-data',
                bodyFormData: {
                    ADD: [
                        { name: 'field1', type: 'text', text: 'value1' },
                        { name: 'file', type: 'filepicker', filepicker: 'form-file' }
                    ]
                },
                caCertificateFileId: 'ca-cert-file'
            };

            const result = await Post.receive(context);

            assert(result);
            assert.strictEqual(result.port, 'response');
            assert(result.data);
            assert.strictEqual(result.data.statusCode, 200);
        });

        it('should POST form-data with mutual TLS', async function() {
            this.timeout(5000);
            const Post = require('../../../../http/Post/Post');
            const fileData = Buffer.from('test file content').toString();
            const { clientCert: clientCertPath, clientKey: clientKeyPath } = getCertPaths();
            const clientCertContent = fs.readFileSync(clientCertPath, 'utf8');
            const clientKeyContent = fs.readFileSync(clientKeyPath, 'utf8');
            const context = createMockContext({
                'form-file': fileData,
                'client-cert-file': clientCertContent,
                'client-key-file': clientKeyContent
            });

            context.messages.in.content = {
                url: `${serverObj.url}/upload`,
                bodyType: 'form-data',
                bodyFormData: {
                    ADD: [
                        { name: 'field1', type: 'text', text: 'value1' },
                        { name: 'file', type: 'filepicker', filepicker: 'form-file' }
                    ]
                },
                clientCertificateFileId: 'client-cert-file',
                clientKeyFileId: 'client-key-file',
                ignoreSsl: true // Required since we're using self-signed certs
            };

            const result = await Post.receive(context);

            assert(result);
            assert.strictEqual(result.port, 'response');
            assert(result.data);
            assert.strictEqual(result.data.statusCode, 200);
        });

        it('should POST with combined SSL options (CA cert + ignoreSsl)', async function() {
            this.timeout(5000);
            const Post = require('../../../../http/Post/Post');
            const { ca: caCertPath } = getCertPaths();
            const caCertContent = fs.readFileSync(caCertPath, 'utf8');
            const context = createMockContext({ 'ca-cert-file': caCertContent });

            context.messages.in.content = {
                url: `${serverObj.url}/json`,
                body: JSON.stringify({ test: 'combined' }),
                headers: JSON.stringify({ 'Content-Type': 'application/json' }),
                caCertificateFileId: 'ca-cert-file',
                ignoreSsl: true
            };

            const result = await Post.receive(context);

            assert(result);
            assert.strictEqual(result.port, 'response');
            assert(result.data);
            assert.strictEqual(result.data.statusCode, 200);
        });
    });
});
