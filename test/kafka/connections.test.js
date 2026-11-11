'use strict';
/* eslint-disable no-underscore-dangle */ // Module._load is the hook used to stub dependencies.

const assert = require('assert');
const Module = require('module');
const path = require('path');

// The connector's npm dependencies are not installed in the repository root,
// so replace them with stubs that record the configuration passed to kafkajs.
const stubs = {
    kafkajs: {
        Kafka: function(config) { this.config = config; },
        logLevel: { INFO: 4, DEBUG: 5 },
        CompressionTypes: { Snappy: 2 },
        CompressionCodecs: {}
    },
    'kafkajs-snappy': function() {},
    'regex-parser': (s) => new RegExp(s)
};

describe('kafka connections.initClient', () => {

    let connections;
    let originalLoad;

    before(() => {
        originalLoad = Module._load;
        Module._load = function(request, ...args) {
            if (Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
            return originalLoad.call(this, request, ...args);
        };
        const file = path.join(__dirname, '../../src/appmixer/kafka/connections.js');
        delete require.cache[require.resolve(file)];
        connections = require(file);
    });

    after(() => {
        Module._load = originalLoad;
    });

    const context = { config: {}, service: { stateUnset: async () => {} } };

    it('passes TLS CA, key, cert and passphrase to kafkajs as PEM strings', async () => {

        const auth = {
            clientId: 'test',
            brokers: 'broker1:9093, broker2:9093',
            tlsCA: '-----BEGIN CERTIFICATE-----\nCA\n-----END CERTIFICATE-----',
            tlsKey: '-----BEGIN PRIVATE KEY-----\nKEY\n-----END PRIVATE KEY-----',
            tlsCert: '-----BEGIN CERTIFICATE-----\nCERT\n-----END CERTIFICATE-----',
            tlsPassphrase: 'secret'
        };

        const client = await connections.initClient(context, auth, 'producer:flow:component:abc');

        assert.deepStrictEqual(client.config.brokers, ['broker1:9093', 'broker2:9093']);
        assert.deepStrictEqual(client.config.ssl, {
            ca: [auth.tlsCA],
            key: auth.tlsKey,
            cert: auth.tlsCert,
            passphrase: 'secret'
        });
    });

    it('keeps rejectUnauthorized next to the certificates', async () => {

        const auth = {
            clientId: 'test',
            brokers: 'broker1:9093',
            tlsCA: 'CA',
            sslRejectUnauthorized: 'false'
        };

        const client = await connections.initClient(context, auth);

        assert.deepStrictEqual(client.config.ssl, { rejectUnauthorized: false, ca: ['CA'] });
    });

    it('drops certificates when SASL is used', async () => {

        const auth = {
            clientId: 'test',
            brokers: 'broker1:9093',
            tlsCA: 'CA',
            tlsKey: 'KEY',
            tlsCert: 'CERT',
            saslMechanism: 'plain',
            saslUsername: 'user',
            saslPassword: 'pass'
        };

        const client = await connections.initClient(context, auth);

        assert.deepStrictEqual(client.config.ssl, {});
        assert.deepStrictEqual(client.config.sasl, { mechanism: 'plain', username: 'user', password: 'pass' });
    });

    it('uses plain ssl flag when no TLS options are set', async () => {

        const client = await connections.initClient(context, { clientId: 'test', brokers: 'b:9092', ssl: 'true' });

        assert.strictEqual(client.config.ssl, true);
    });
});
