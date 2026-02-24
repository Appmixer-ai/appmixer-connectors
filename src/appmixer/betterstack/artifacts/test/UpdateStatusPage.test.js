'use strict';

const assert = require('assert');
const UpdateStatusPage = require('../../statuspages/UpdateStatusPage/UpdateStatusPage');

describe('UpdateStatusPage', () => {

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
            httpRequest: async () => ({
                data: {
                    data: {
                        attributes: {
                            id: '123456789',
                            company_name: 'Updated Company',
                            company_url: 'https://test.com',
                            subdomain: 'test-status',
                            timezone: 'UTC'
                        }
                    }
                }
            }),
            sendJson: async (data, port) => ({ data, port }),
            CancelError: class extends Error {}
        };
    });

    it('should throw error when status page ID is missing', async () => {
        context.messages.in.content = {
            companyName: 'Updated Company'
        };

        try {
            await UpdateStatusPage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Status page ID is required'));
        }
    });

    it('should update a status page with single field', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                data: {
                    data: {
                        id: '123456789',
                        attributes: {
                            company_name: 'Updated Company',
                            company_url: 'https://test.com',
                            subdomain: 'test-status',
                            timezone: 'UTC'
                        }
                    }
                }
            };
        };

        context.messages.in.content = {
            statusPageId: '123456789',
            companyName: 'Updated Company'
        };

        const result = await UpdateStatusPage.receive(context);

        assert.strictEqual(result.data.company_name, 'Updated Company');
        assert.strictEqual(capturedOptions.method, 'PATCH');
        assert.strictEqual(capturedOptions.url, 'https://uptime.betterstack.com/api/v2/status-pages/123456789');
        assert.strictEqual(capturedOptions.data.company_name, 'Updated Company');
    });

    it('should update a status page with multiple fields', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                data: {
                    data: {
                        id: '123456789',
                        attributes: {
                            company_name: 'Updated Company',
                            timezone: 'America/New_York',
                            design: 'v2',
                            theme: 'dark'
                        }
                    }
                }
            };
        };

        context.messages.in.content = {
            statusPageId: '123456789',
            companyName: 'Updated Company',
            timezone: 'America/New_York',
            design: 'v2',
            theme: 'dark'
        };

        const result = await UpdateStatusPage.receive(context);

        assert.strictEqual(result.data.company_name, 'Updated Company');
        assert.strictEqual(result.data.timezone, 'America/New_York');
        assert.strictEqual(result.data.design, 'v2');
        assert.strictEqual(capturedOptions.data.company_name, 'Updated Company');
        assert.strictEqual(capturedOptions.data.timezone, 'America/New_York');
        assert.strictEqual(capturedOptions.data.design, 'v2');
    });

    it('should update status page with boolean fields', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                data: {
                    data: {
                        id: '123456789',
                        attributes: {
                            subscribable: true,
                            password_enabled: false
                        }
                    }
                }
            };
        };

        context.messages.in.content = {
            statusPageId: '123456789',
            subscribable: true,
            passwordEnabled: false
        };

        const result = await UpdateStatusPage.receive(context);

        assert.strictEqual(result.data.subscribable, true);
        assert.strictEqual(result.data.password_enabled, false);
        assert.strictEqual(capturedOptions.data.subscribable, true);
        assert.strictEqual(capturedOptions.data.password_enabled, false);
    });

    it('should include Authorization header', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                data: {
                    data: {
                        id: '123456789',
                        attributes: {
                            company_name: 'Updated Company'
                        }
                    }
                }
            };
        };

        context.messages.in.content = {
            statusPageId: '123456789',
            companyName: 'Updated Company'
        };

        await UpdateStatusPage.receive(context);

        assert(capturedOptions.headers.Authorization.includes('Bearer'));
        assert.strictEqual(capturedOptions.headers['Content-Type'], 'application/json');
    });
});
