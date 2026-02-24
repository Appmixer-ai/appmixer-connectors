const assert = require('assert');

describe('DeleteMonitor', () => {
    let component;

    before(() => {
        component = require('../../uptime/DeleteMonitor/DeleteMonitor');
    });

    it('should delete monitor by ID', async () => {
        const context = {
            messages: { in: { content: { monitorId: 'm_1' } } },
            auth: { apiKey: 'token' },
            CancelError: Error,
            httpRequest: async (options) => {
                assert.strictEqual(options.method, 'DELETE');
                assert.strictEqual(options.url, 'https://uptime.betterstack.com/api/v2/monitors/m_1');
                return {};
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert.deepStrictEqual(data, {});
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
