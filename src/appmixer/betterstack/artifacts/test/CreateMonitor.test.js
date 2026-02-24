const assert = require('assert');

describe('CreateMonitor', () => {
    let component;

    before(() => {
        component = require('../../uptime/CreateMonitor/CreateMonitor');
    });

    it('should create monitor with required fields using flat body', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        monitorName: 'Homepage',
                        url: 'https://example.com'
                    }
                }
            },
            auth: { apiKey: 'token' },
            CancelError: Error,
            httpRequest: async (options) => {
                assert.strictEqual(options.method, 'POST');
                assert.strictEqual(options.url, 'https://uptime.betterstack.com/api/v2/monitors');
                // Flat body - no data.data.attributes nesting
                assert.strictEqual(options.data.pronounceable_name, 'Homepage');
                assert.strictEqual(options.data.url, 'https://example.com');
                assert.strictEqual(options.data.monitor_type, 'status');
                assert.strictEqual(options.data.data, undefined);
                return {
                    data: {
                        data: {
                            id: '123',
                            attributes: {
                                pronounceable_name: 'Homepage',
                                url: 'https://example.com',
                                monitor_type: 'status'
                            }
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

    it('should create monitor with optional fields', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        monitorName: 'API Health',
                        url: 'https://api.example.com',
                        monitorType: 'keyword',
                        checkFrequency: 60,
                        requiredKeyword: 'OK',
                        verifySSL: true,
                        email: true
                    }
                }
            },
            auth: { apiKey: 'token' },
            CancelError: Error,
            httpRequest: async (options) => {
                assert.strictEqual(options.data.monitor_type, 'keyword');
                assert.strictEqual(options.data.check_frequency, 60);
                assert.strictEqual(options.data.required_keyword, 'OK');
                assert.strictEqual(options.data.verify_ssl, true);
                assert.strictEqual(options.data.email, true);
                return {
                    data: {
                        data: {
                            id: '456',
                            attributes: options.data
                        }
                    }
                };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert.strictEqual(data.id, '456');
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

    it('should fail when URL is missing', async () => {
        const context = {
            messages: { in: { content: { monitorName: 'Homepage' } } },
            CancelError: Error
        };

        await assert.rejects(() => component.receive(context), /Monitor URL is required!/);
    });
});
