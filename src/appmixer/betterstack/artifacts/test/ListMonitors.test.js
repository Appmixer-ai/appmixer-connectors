const assert = require('assert');

describe('ListMonitors', () => {
    let component;

    before(() => {
        component = require('../../uptime/ListMonitors/ListMonitors');
    });

    it('should list monitors', async () => {
        const context = {
            messages: { in: { content: {} } },
            auth: { apiKey: 'token' },
            httpRequest: async (options) => {
                assert.strictEqual(options.method, 'GET');
                assert.strictEqual(options.url, 'https://uptime.betterstack.com/api/v2/monitors');
                return {
                    data: {
                        data: [{
                            id: 'm_1',
                            attributes: { pronounceable_name: 'Homepage' }
                        }, {
                            id: 'm_2',
                            attributes: { pronounceable_name: 'API' }
                        }]
                    }
                };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert.strictEqual(data.count, 2);
                assert.strictEqual(data.monitors[0].id, 'm_1');
                assert.strictEqual(data.monitors[1].pronounceable_name, 'API');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });
});
