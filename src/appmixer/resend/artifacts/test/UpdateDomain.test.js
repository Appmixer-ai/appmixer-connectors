const path = require('path');
const assert = require('assert');

describe('UpdateDomain Component', function() {
    let UpdateDomain;
    let context;

    before(function() {
        UpdateDomain = require(path.join(__dirname, '../../core/UpdateDomain/UpdateDomain.js'));

        context = {
            auth: { apiKey: 'test-api-key' },
            messages: {
                in: {
                    content: {}
                }
            },
            sendJson: function(data, outputPort) {
                this.lastSent = { data, outputPort };
                return Promise.resolve();
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
    });

    it('should throw when id is missing', async function() {
        const ctx = { ...context, messages: { in: { content: {} } } };

        try {
            await UpdateDomain.receive(ctx);
            assert.fail('Should have thrown');
        } catch (err) {
            assert(err instanceof ctx.CancelError, 'Expected CancelError');
            assert(err.message.includes('Domain ID is required'), 'Message should mention Domain ID');
        }
    });

    it('should throw when id is empty string', async function() {
        const ctx = { ...context, messages: { in: { content: { id: '' } } } };

        try {
            await UpdateDomain.receive(ctx);
            assert.fail('Should have thrown');
        } catch (err) {
            assert(err instanceof ctx.CancelError, 'Expected CancelError');
            assert(err.message.includes('Domain ID is required'), 'Message should mention Domain ID');
        }
    });

    it('should call PATCH with correct url and data when id provided', async function() {
        const called = {};
        const ctx = {
            ...context,
            messages: { in: { content: { id: 'domain_123', open_tracking: true, tls: 'enforced' } } },
            httpRequest: async function(options) {
                called.method = options.method;
                called.url = options.url;
                called.headers = options.headers;
                called.data = options.data;
                return { data: {} };
            }
        };

        await UpdateDomain.receive(ctx);

        assert.strictEqual(called.method, 'PATCH');
        assert.strictEqual(called.url, 'https://api.resend.com/domains/domain_123');
        assert(called.headers && called.headers.Authorization);
        assert.deepStrictEqual(called.data, { open_tracking: true, tls: 'enforced' });
    });
});
