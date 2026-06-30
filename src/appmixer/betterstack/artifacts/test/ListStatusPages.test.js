'use strict';

const assert = require('assert');
const ListStatusPages = require('../../statuspages/ListStatusPages/ListStatusPages');

describe('ListStatusPages', () => {

    let context;

    beforeEach(() => {
        context = {
            auth: {
                apiKey: 'test-api-key'
            },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
            httpRequest: async () => ({
                data: {
                    data: [
                        {
                            attributes: {
                                id: '123456789',
                                company_name: 'Test Company 1',
                                company_url: 'https://test1.com',
                                subdomain: 'test1-status',
                                timezone: 'UTC'
                            }
                        }
                    ],
                    pagination: {
                        next: null
                    }
                }
            }),
            sendJson: async (data, port) => ({ data, port }),
            saveFileStream: async () => ({ fileId: 'file-123', length: 1024 }),
            log: async () => {},
            staticCache: {
                get: async () => null,
                set: async () => {}
            },
            lock: async () => ({ unlock: async () => {} })
        };
    });

    it('should list status pages with array output', async () => {
        let callCount = 0;
        let sentData = null;
        context.httpRequest = async () => {
            callCount++;
            return {
                data: {
                    data: [
                        {
                            attributes: {
                                id: '123456789',
                                company_name: 'Test Company',
                                company_url: 'https://test.com',
                                subdomain: 'test-status',
                                timezone: 'UTC'
                            }
                        }
                    ],
                    pagination: {
                        next: null
                    }
                }
            };
        };

        context.sendJson = async (data, port) => {
            sentData = data;
            return { data, port };
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await ListStatusPages.receive(context);

        assert(sentData.result);
        assert(Array.isArray(sentData.result));
        assert.strictEqual(sentData.result.length, 1);
        assert.strictEqual(sentData.result[0].company_name, 'Test Company');
        assert.strictEqual(sentData.count, 1);
        assert.strictEqual(callCount, 1);
    });

    it('should handle pagination', async () => {
        let callCount = 0;
        let sentData = null;
        context.httpRequest = async (options) => {
            callCount++;
            if (callCount === 1) {
                return {
                    data: {
                        data: [
                            {
                                attributes: {
                                    id: '111',
                                    company_name: 'Page 1 Company',
                                    company_url: 'https://page1.com',
                                    subdomain: 'page1-status',
                                    timezone: 'UTC'
                                }
                            }
                        ],
                        pagination: {
                            next: 'https://uptime.betterstack.com/api/v2/status-pages?page=2'
                        }
                    }
                };
            } else {
                return {
                    data: {
                        data: [
                            {
                                attributes: {
                                    id: '222',
                                    company_name: 'Page 2 Company',
                                    company_url: 'https://page2.com',
                                    subdomain: 'page2-status',
                                    timezone: 'UTC'
                                }
                            }
                        ],
                        pagination: {
                            next: null
                        }
                    }
                };
            }
        };

        context.sendJson = async (data, port) => {
            sentData = data;
            return { data, port };
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await ListStatusPages.receive(context);

        assert.strictEqual(sentData.result.length, 2);
        assert.strictEqual(sentData.result[0].company_name, 'Page 1 Company');
        assert.strictEqual(sentData.result[1].company_name, 'Page 2 Company');
        assert.strictEqual(callCount, 2);
    });

    it('should generate output port options with generateOutputPortOptions', async () => {
        context.properties = {
            generateOutputPortOptions: true
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        const result = await ListStatusPages.receive(context);

        assert(Array.isArray(result.data));
        assert(result.data.length > 0);
        assert(result.data[0].value);
        assert(result.data[0].label);
        // Should include status_pages array option for 'array' outputType
        const arrayOption = result.data.find(opt => opt.value === 'result');
        assert(arrayOption);
    });

    it('should support first output type', async () => {
        let sentData = null;
        context.httpRequest = async () => ({
            data: {
                data: [
                    {
                        attributes: {
                            id: '123',
                            company_name: 'First Company',
                            company_url: 'https://first.com',
                            subdomain: 'first-status',
                            timezone: 'UTC'
                        }
                    },
                    {
                        attributes: {
                            id: '456',
                            company_name: 'Second Company',
                            company_url: 'https://second.com',
                            subdomain: 'second-status',
                            timezone: 'UTC'
                        }
                    }
                ],
                pagination: {
                    next: null
                }
            }
        });

        context.sendJson = async (data, port) => {
            sentData = data;
            return { data, port };
        };

        context.messages.in.content = {
            outputType: 'first'
        };

        await ListStatusPages.receive(context);

        assert.strictEqual(sentData.company_name, 'First Company');
        assert.strictEqual(sentData.index, 0);
        assert.strictEqual(sentData.count, 2);
    });

    it('should include Authorization header', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                data: {
                    data: [],
                    pagination: { next: null }
                }
            };
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await ListStatusPages.receive(context);

        assert(capturedOptions.headers.Authorization.includes('Bearer'));
    });
});
