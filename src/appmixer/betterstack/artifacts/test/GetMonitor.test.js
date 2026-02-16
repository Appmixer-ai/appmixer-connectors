const assert = require('assert');

describe('GetMonitor', () => {
    let component;

    before(() => {
        component = require('../../uptime/GetMonitor/GetMonitor');
    });

    it('should get monitor by ID', async () => {
        const context = {
            messages: { in: { content: { monitorId: 'm_1' } } },
            auth: { apiKey: 'token' },
            CancelError: Error,
            httpRequest: async (options) => {
                assert.strictEqual(options.method, 'GET');
                assert.strictEqual(options.url, 'https://uptime.betterstack.com/api/v2/monitors/m_1');
                return {
                    data: {
                        data: {
                            id: 'm_1',
                            attributes: {
                                pronounceable_name: 'Homepage'
                            }
                        }
                    }
                };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert.strictEqual(data.id, 'm_1');
                assert.strictEqual(data.pronounceable_name, 'Homepage');
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
