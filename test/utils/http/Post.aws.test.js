'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const sinon = require('sinon');

/**
 * AWS API Gateway mTLS Integration Tests
 *
 * These tests validate SSL/mTLS options against a real AWS API Gateway endpoint.
 *
 * Prerequisites:
 * 1. AWS REST API with mTLS enabled at: https://mtls-test.appmixer.cloud/rest/test
 * 2. Client certificates in: test/utils/http/certs/aws/
 *    - ca.crt (CA certificate - truststore)
 *    - client.crt (client certificate)
 *    - client.key (client private key)
 *
 * Run: npm run test-unit -- test/utils/http/Post.aws.test.js
 */

const AWS_MTLS_REST_ENDPOINT = 'https://mtls-test.appmixer.cloud/rest/test';
const AWS_ALB_CA_TEST_ENDPOINT = 'https://mtls-alb-test.appmixer.cloud';
const CERTS_DIR = path.join(__dirname, 'certs', 'aws');

// Skip tests if certificates don't exist
const certsExist = fs.existsSync(path.join(CERTS_DIR, 'client.crt')) &&
    fs.existsSync(path.join(CERTS_DIR, 'client.key')) &&
    fs.existsSync(path.join(CERTS_DIR, 'ca.crt'));

describe.only('AWS API Gateway mTLS Integration Tests', function() {

    // These are integration tests - give them more time
    this.timeout(30000);

    before(function() {
        if (!certsExist) {
            console.log('⚠️  Skipping AWS mTLS tests - certificates not found in', CERTS_DIR);
            console.log('   Run the certificate generation script first.');
            this.skip();
        }
    });

    describe('POST /test endpoint', function() {

        it('should fail without client certificate (mTLS required)', async function() {
            const axios = require('axios');

            try {
                await axios.post(AWS_MTLS_REST_ENDPOINT, { test: 'data' }, {
                    timeout: 10000,
                    headers: { 'Content-Type': 'application/json' }
                });
                assert.fail('Request should have failed without client certificate');
            } catch (error) {
                // Expected: connection reset or SSL handshake error
                assert.ok(
                    error.code === 'ECONNRESET' ||
                    error.code === 'EPROTO' ||
                    error.code === 'ERR_SSL_TLSV1_ALERT_CERTIFICATE_REQUIRED' ||
                    error.message.includes('SSL') ||
                    error.message.includes('certificate'),
                    `Expected SSL/certificate error, got: ${error.code || error.message}`
                );
            }
        });

        it('should succeed with valid client certificate and include cert details in response', async function() {
            const axios = require('axios');
            const https = require('https');

            const httpsAgent = new https.Agent({
                cert: fs.readFileSync(path.join(CERTS_DIR, 'client.crt')),
                key: fs.readFileSync(path.join(CERTS_DIR, 'client.key')),
                rejectUnauthorized: true
            });

            const response = await axios.post(AWS_MTLS_REST_ENDPOINT, { test: 'data' }, {
                httpsAgent,
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            });

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.success, true);
            // REST API should forward client certificate to Lambda
            assert.strictEqual(response.data.clientCertPresent, true, 'Client cert should be present in Lambda response');
            assert.ok(response.data.clientCertSubject, 'Client cert subject should be included');
            assert.ok(response.data.clientCertIssuer, 'Client cert issuer should be included');
        });

        it('should work with HTTP component buildHttpsAgentFromFiles', async function() {
            // Simulate what the HTTP component does
            const { buildHttpsAgentFromFiles } = require('../../../src/appmixer/utils/http/http-commons');

            // Create mock context that reads files from our certs directory
            const mockContext = {
                getFileReadStream: async (fileId) => {
                    const filePath = path.join(CERTS_DIR, fileId);
                    return fs.createReadStream(filePath);
                }
            };

            // Build HTTPS agent using the component's method (same signature as used in http-commons.js)
            const httpsAgent = await buildHttpsAgentFromFiles(
                mockContext,
                null,           // caCertificateFileId
                'client.crt',   // clientCertificateFileId
                'client.key',   // clientKeyFileId
                false           // ignoreSsl
            );

            const axios = require('axios');
            const response = await axios.post(AWS_MTLS_REST_ENDPOINT, { test: 'data' }, {
                httpsAgent,
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            });

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.success, true);
        });

        it('should work when called through Post component receive method', async function() {
            const { createMockContext } = require('../../utils');
            const Post = require('../../../src/appmixer/utils/http/Post/Post');

            const context = createMockContext();

            // Override httpRequest to actually use axios for this test
            context.httpRequest = sinon.stub().callsFake(async (options) => {
                const axios = require('axios');
                console.log('axios options:', options);
                const response = await axios.request(options);
                return response;
            });

            // Setup getFileReadStream
            context.getFileReadStream = sinon.stub().callsFake(async (fileId) => {
                return fs.createReadStream(path.join(CERTS_DIR, fileId));
            });

            // Setup getFileInfo
            context.getFileInfo = sinon.stub().callsFake(async (fileId) => {
                const filePath = path.join(CERTS_DIR, fileId);
                const stats = fs.statSync(filePath);
                return {
                    filename: fileId,
                    contentType: 'application/octet-stream',
                    length: stats.size
                };
            });

            // Setup sendJson
            context.sendJson = sinon.stub().callsFake((data, port) => {
                assert.strictEqual(port, 'response');
                assert.strictEqual(data.statusCode, 200);
                return Promise.resolve();
            });

            // Create message with mTLS certificate files
            context.messages = {
                in: {
                    content: {
                        url: AWS_MTLS_REST_ENDPOINT,
                        headers: JSON.stringify({}),
                        bodyType: 'raw',
                        body: JSON.stringify({ test: 'data' }),
                        caCertificateFileId: null,
                        clientCertificateFileId: 'client.crt',
                        clientKeyFileId: 'client.key',
                        ignoreSsl: false
                    }
                }
            };

            // Call the component
            await Post.receive(context);

            // Verify sendJson was called
            assert.strictEqual(context.sendJson.calledOnce, true);
        });
    });

    describe('GET /test endpoint', function() {

        it('should succeed with valid client certificate', async function() {
            const axios = require('axios');
            const https = require('https');

            const httpsAgent = new https.Agent({
                cert: fs.readFileSync(path.join(CERTS_DIR, 'client.crt')),
                key: fs.readFileSync(path.join(CERTS_DIR, 'client.key')),
                rejectUnauthorized: true
            });

            const response = await axios.get(AWS_MTLS_REST_ENDPOINT, {
                httpsAgent,
                timeout: 10000
            });

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.success, true);
        });

        it('should work when called through Get component receive method', async function() {
            const { createMockContext } = require('../../utils');
            const Get = require('../../../src/appmixer/utils/http/Get/Get');

            const context = createMockContext();

            // Override httpRequest to actually use axios for this test
            context.httpRequest = sinon.stub().callsFake(async (options) => {
                const axios = require('axios');
                const response = await axios.request(options);
                return response;
            });

            // Setup getFileReadStream
            context.getFileReadStream = sinon.stub().callsFake(async (fileId) => {
                return fs.createReadStream(path.join(CERTS_DIR, fileId));
            });

            // Setup sendJson
            context.sendJson = sinon.stub().callsFake((data, port) => {
                assert.strictEqual(port, 'response');
                assert.strictEqual(data.statusCode, 200);
                return Promise.resolve();
            });

            // Create message with mTLS certificate files
            context.messages = {
                in: {
                    content: {
                        url: AWS_MTLS_REST_ENDPOINT,
                        headers: JSON.stringify({}),
                        caCertificateFileId: null,
                        clientCertificateFileId: 'client.crt',
                        clientKeyFileId: 'client.key',
                        ignoreSsl: false
                    }
                }
            };

            // Call the component
            await Get.receive(context);

            // Verify sendJson was called
            assert.strictEqual(context.sendJson.calledOnce, true);
        });
    });

    describe('CA Certificate Verification', function() {

        const https = require('https');
        const LOCAL_PORT = 3444;
        const LOCAL_URL = `https://localhost:${LOCAL_PORT}/test`;
        let server;

        // Check if server certs exist (created for CA testing)
        const serverCertsExist = fs.existsSync(path.join(CERTS_DIR, 'server.crt')) &&
            fs.existsSync(path.join(CERTS_DIR, 'server.key'));

        before(function(done) {
            if (!serverCertsExist) {
                console.log('⚠️  Skipping CA verification tests - server certs not found');
                console.log('   Run: cd test/utils/http/certs/aws && openssl genrsa -out server.key 2048 && ...');
                this.skip();
                return;
            }

            // Start local HTTPS server with CA-signed certificate
            const serverOptions = {
                key: fs.readFileSync(path.join(CERTS_DIR, 'server.key')),
                cert: fs.readFileSync(path.join(CERTS_DIR, 'server.crt'))
            };

            server = https.createServer(serverOptions, (req, res) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'CA verification working on local server!' }));
            });

            server.listen(LOCAL_PORT, done);
        });

        after(function(done) {
            if (server) {
                server.close(done);
            } else {
                done();
            }
        });

        it('should fail without CA cert when server uses custom CA-signed certificate', async function() {
            const axios = require('axios');

            try {
                await axios.get(LOCAL_URL, { timeout: 5000 });
                assert.fail('Request should have failed without CA certificate');
            } catch (error) {
                assert.ok(
                    error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
                    error.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
                    error.message.includes('certificate'),
                    `Expected certificate error, got: ${error.code || error.message}`
                );
            }
        });

        it('should succeed with our CA cert using buildHttpsAgentFromFiles', async function() {
            const { buildHttpsAgentFromFiles } = require('../../../src/appmixer/utils/http/http-commons');

            const mockContext = {
                getFileReadStream: async (fileId) => {
                    return fs.createReadStream(path.join(CERTS_DIR, fileId));
                }
            };

            // Build HTTPS agent with CA certificate only (no client certs needed for this test)
            const httpsAgent = await buildHttpsAgentFromFiles(
                mockContext,
                'ca.crt',   // CA certificate that signed the server cert
                null,       // No client cert
                null,       // No client key
                false       // Don't ignore SSL
            );

            const axios = require('axios');
            const response = await axios.get(LOCAL_URL, {
                httpsAgent,
                timeout: 5000
            });

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.success, true);
            assert.strictEqual(response.data.message, 'CA verification working on local server!');
        });

        it('should succeed with ignoreSsl=true (bypasses CA verification)', async function() {
            const { buildHttpsAgentFromFiles } = require('../../../src/appmixer/utils/http/http-commons');

            const mockContext = {
                getFileReadStream: async (fileId) => {
                    return fs.createReadStream(path.join(CERTS_DIR, fileId));
                }
            };

            // Build HTTPS agent with ignoreSsl=true (no CA needed)
            const httpsAgent = await buildHttpsAgentFromFiles(
                mockContext,
                null,   // No CA cert
                null,   // No client cert
                null,   // No client key
                true    // Ignore SSL validation
            );

            const axios = require('axios');
            const response = await axios.get(LOCAL_URL, {
                httpsAgent,
                timeout: 5000
            });

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.success, true);
        });

        it('should ignore CA cert when ignoreSsl=true (CA cert should be skipped)', async function() {
            // This test verifies that when both ignoreSsl=true AND caCertificateFileId are provided,
            // the CA certificate is ignored and SSL validation is bypassed
            const { buildHttpsAgentFromFiles } = require('../../../src/appmixer/utils/http/http-commons');

            const mockContext = {
                getFileReadStream: async (fileId) => {
                    return fs.createReadStream(path.join(CERTS_DIR, fileId));
                }
            };

            // Build HTTPS agent with ignoreSsl=true AND CA cert (CA should be ignored)
            const httpsAgent = await buildHttpsAgentFromFiles(
                mockContext,
                'ca.crt',  // CA cert provided but should be ignored
                null,   // No client cert
                null,   // No client key
                true    // Ignore SSL validation - this takes precedence
            );

            // Verify that rejectUnauthorized is false and ca is NOT set
            assert.strictEqual(httpsAgent.options.rejectUnauthorized, false);
            assert.strictEqual(httpsAgent.options.ca, undefined, 'CA should not be set when ignoreSsl=true');

            const axios = require('axios');
            const response = await axios.get(LOCAL_URL, {
                httpsAgent,
                timeout: 5000
            });

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.success, true);
        });

        it('should match curl --cacert behavior', async function() {
            // This test documents the equivalence:
            // curl --cacert ca.crt https://localhost:3444/test
            // is equivalent to our buildHttpsAgentFromFiles with caCertificateFileId

            const { buildHttpsAgentFromFiles, buildHttpsAgent } = require('../../../src/appmixer/utils/http/http-commons');

            const mockContext = {
                getFileReadStream: async (fileId) => {
                    return fs.createReadStream(path.join(CERTS_DIR, fileId));
                }
            };

            const httpsAgent = await buildHttpsAgentFromFiles(
                mockContext,
                'ca.crt',
                null,
                null,
                false
            );

            const axios = require('axios');
            const response = await axios(LOCAL_URL, {
                httpsAgent,
                timeout: 5000
            });

            assert.strictEqual(response.status, 200);

            const httpsAgent2 = await buildHttpsAgent(
                mockContext,
                {
                    caCertificateFileId: 'ca.crt',
                    clientCertificateFileId: null,
                    clientKeyFileId: null,
                    ignoreSsl: false
                }
            );

            const response2 = await axios.post(LOCAL_URL, null, {
                httpsAgent: httpsAgent2,
                timeout: 5000
            });

            assert.strictEqual(response2.status, 200);

            // Now the same for AWS_MTLS_REST_ENDPOINT
            const httpsAgentAws = await buildHttpsAgentFromFiles(
                mockContext,
                null,
                'client.crt',
                'client.key',
                false
            );

            const responseAws = await axios.post(AWS_MTLS_REST_ENDPOINT, { test: 'data' }, {
                httpsAgent: httpsAgentAws,
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            });

            assert.strictEqual(responseAws.status, 200);

            // Test AWS ALB with CA-signed certificate
            console.log('Testing AWS ALB endpoint with CA certificate...');
            const httpsAgentAwsAlb = await buildHttpsAgentFromFiles(
                mockContext,
                'ca.crt',  // Custom CA that signed the server cert
                null,      // No client cert needed (ALB doesn't require mTLS)
                null,
                false
            );

            const responseAwsAlb = await axios.post(AWS_ALB_CA_TEST_ENDPOINT, { test: 'aws-ca' }, {
                httpsAgent: httpsAgentAwsAlb,
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            });

            assert.strictEqual(responseAwsAlb.status, 200);
            assert.strictEqual(responseAwsAlb.data.success, true);
        });

        it('should fail without CA certificate for AWS ALB endpoint', async function() {
            // This test documents the equivalence:
            // curl https://mtls-alb-test.appmixer.cloud/ (fails)
            // vs
            // curl --cacert ca.crt https://mtls-alb-test.appmixer.cloud/ (succeeds)

            const axios = require('axios');

            // Without CA cert - should fail
            try {
                await axios.post(AWS_ALB_CA_TEST_ENDPOINT, { test: 'data' }, {
                    timeout: 10000
                });
                assert.fail('Should have thrown certificate error');
            } catch (error) {
                // Expected error about self-signed certificate
                assert.ok(error.message.includes('self-signed certificate') ||
                         error.message.includes('certificate') ||
                         error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
                `Expected certificate error, got: ${error.message}`);
            }
        });

        it('should succeed with CA certificate for AWS ALB endpoint', async function() {
            const { buildHttpsAgentFromFiles } = require('../../../src/appmixer/utils/http/http-commons');

            const mockContext = {
                getFileReadStream: async (fileId) => {
                    return fs.createReadStream(path.join(CERTS_DIR, fileId));
                }
            };

            // With CA cert - should succeed
            const httpsAgent = await buildHttpsAgentFromFiles(
                mockContext,
                'ca.crt',
                null,
                null,
                false
            );

            const axios = require('axios');
            const response = await axios.post(AWS_ALB_CA_TEST_ENDPOINT, { test: 'data' }, {
                httpsAgent,
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            });

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.success, true);
            assert.strictEqual(response.data.clientCertPresent, false); // No client cert provided
        });
    });
});
