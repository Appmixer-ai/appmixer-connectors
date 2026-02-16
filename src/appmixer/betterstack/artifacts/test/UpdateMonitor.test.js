const assert = require('assert');

describe('UpdateMonitor', () => {
    let component;

    before(() => {
        component = require('../../uptime/UpdateMonitor/UpdateMonitor');
    });

    it('should update monitor by ID', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        monitorId: 'm_1',
                        pronounceableName: 'Homepage Updated',
                        paused: true
                    }
                }
            },
            auth: { apiKey: 'token' },
            CancelError: Error,
            httpRequest: async (options) => {
                assert.strictEqual(options.method, 'PATCH');
                assert.strictEqual(options.url, 'https://uptime.betterstack.com/api/v2/monitors/m_1');
                assert.strictEqual(options.data.data.attributes.pronounceable_name, 'Homepage Updated');
                assert.strictEqual(options.data.data.attributes.paused, true);
                return {
                    data: {
                        data: {
                            id: 'm_1',
                            attributes: options.data.data.attributes
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

    it('should fail when monitor ID is missing', async () => {
        const context = {
            messages: { in: { content: {} } },
            CancelError: Error
        };

        await assert.rejects(() => component.receive(context), /Monitor ID is required!/);
    });
});
