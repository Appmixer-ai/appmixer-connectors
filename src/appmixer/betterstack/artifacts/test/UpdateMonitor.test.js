const assert = require('assert');

describe('UpdateMonitor', () => {
    let component;

    before(() => {
        component = require('../../uptime/UpdateMonitor/UpdateMonitor');
    });

    it('should update monitor by ID using flat body', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        monitorId: 'm_1',
                        monitorName: 'Homepage Updated',
                        paused: true
                    }
                }
            },
            auth: { apiKey: 'token' },
            CancelError: Error,
            httpRequest: async (options) => {
                assert.strictEqual(options.method, 'PATCH');
                assert.strictEqual(options.url, 'https://uptime.betterstack.com/api/v2/monitors/m_1');
                // Flat body - no data.data.attributes nesting
                assert.strictEqual(options.data.pronounceable_name, 'Homepage Updated');
                assert.strictEqual(options.data.paused, true);
                assert.strictEqual(options.data.data, undefined);
                return {
                    data: {
                        data: {
                            id: 'm_1',
                            attributes: {
                                pronounceable_name: 'Homepage Updated',
                                paused: true
                            }
                        }
                    }
                };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert.strictEqual(data.id, 'm_1');
                assert.strictEqual(data.pronounceable_name, 'Homepage Updated');
                assert.strictEqual(data.paused, true);
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should update monitor with optional notification fields', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        monitorId: 'm_2',
                        checkFrequency: 60,
                        email: true,
                        sms: false,
                        verifySSL: true
                    }
                }
            },
            auth: { apiKey: 'token' },
            CancelError: Error,
            httpRequest: async (options) => {
                assert.strictEqual(options.data.check_frequency, 60);
                assert.strictEqual(options.data.email, true);
                assert.strictEqual(options.data.sms, false);
                assert.strictEqual(options.data.verify_ssl, true);
                return {
                    data: {
                        data: {
                            id: 'm_2',
                            attributes: options.data
                        }
                    }
                };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should fail when monitor ID is missing', async () => {
        const context = {
            messages: { in: { content: {} } },
            CancelError: Error
        };

        await assert.rejects(() => component.receive(context), /Monitor ID is required!/);
    });
});
