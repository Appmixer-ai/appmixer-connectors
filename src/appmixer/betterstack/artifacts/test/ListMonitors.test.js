const assert = require('assert');

describe('ListMonitors', () => {
    let component;

    before(() => {
        component = require('../../uptime/ListMonitors/ListMonitors');
    });

    it('should list monitors and return array output', async () => {
        const context = {
            messages: { in: { content: { outputType: 'array' } } },
            auth: { apiKey: 'token' },
            properties: {},
            flowDescriptor: { [undefined]: { label: 'ListMonitors' } },
            componentId: undefined,
            config: {},
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
                assert.strictEqual(data.result[0].id, 'm_1');
                assert.strictEqual(data.result[1].pronounceable_name, 'API');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should paginate through all pages', async () => {
        let callCount = 0;
        const context = {
            messages: { in: { content: { outputType: 'array' } } },
            auth: { apiKey: 'token' },
            properties: {},
            flowDescriptor: { [undefined]: { label: 'ListMonitors' } },
            componentId: undefined,
            config: {},
            httpRequest: async (options) => {
                callCount++;
                if (callCount === 1) {
                    assert.strictEqual(options.url, 'https://uptime.betterstack.com/api/v2/monitors');
                    return {
                        data: {
                            data: [{ id: 'm_1', attributes: { pronounceable_name: 'Homepage' } }],
                            pagination: { next: 'https://uptime.betterstack.com/api/v2/monitors?page=2' }
                        }
                    };
                } else {
                    assert.strictEqual(options.url, 'https://uptime.betterstack.com/api/v2/monitors?page=2');
                    return {
                        data: {
                            data: [{ id: 'm_2', attributes: { pronounceable_name: 'API' } }]
                        }
                    };
                }
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert.strictEqual(data.count, 2);
                assert.strictEqual(callCount, 2);
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should return generateOutputPortOptions for object outputType', async () => {
        let sentOptions;
        const context = {
            messages: { in: { content: { outputType: 'object' } } },
            auth: { apiKey: 'token' },
            properties: { generateOutputPortOptions: true },
            sendJson: (data, port) => {
                sentOptions = data;
                assert.strictEqual(port, 'out');
                return Promise.resolve();
            }
        };

        await component.receive(context);
        assert.ok(Array.isArray(sentOptions));
        assert.ok(sentOptions.some(o => o.value === 'id'));
        assert.ok(sentOptions.some(o => o.value === 'pronounceable_name'));
    });
});
