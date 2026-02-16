const assert = require('assert');

describe('CreateMonitor', () => {
    let component;

    before(() => {
        component = require('../../uptime/CreateMonitor/CreateMonitor');
    });

    it('should create monitor with required fields', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        pronounceableName: 'Homepage',
                        url: 'https://example.com'
                    }
                }
            },
            auth: { apiKey: 'token' },
            CancelError: Error,
            httpRequest: async (options) => {
                assert.strictEqual(options.method, 'POST');
                assert.strictEqual(options.url, 'https://uptime.betterstack.com/api/v2/monitors');
                assert.strictEqual(options.data.data.attributes.pronounceable_name, 'Homepage');
                assert.strictEqual(options.data.data.attributes.url, 'https://example.com');
                assert.strictEqual(options.data.data.attributes.monitor_type, 'status');
                return {
                    data: {
                        data: {
                            id: '123',
                            attributes: options.data.data.attributes
                        }
                    }
                };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert.strictEqual(data.id, '123');
                assert.strictEqual(data.pronounceable_name, 'Homepage');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should fail when monitor name is missing', async () => {
        const context = {
            messages: { in: { content: { url: 'https://example.com' } } },
            CancelError: Error
        };

        await assert.rejects(() => component.receive(context), /Monitor name is required!/);
    });
});
