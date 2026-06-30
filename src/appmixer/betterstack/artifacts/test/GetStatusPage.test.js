'use strict';

const assert = require('assert');
const GetStatusPage = require('../../statuspages/GetStatusPage/GetStatusPage');

describe('GetStatusPage', () => {

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
                            company_name: 'Test Company',
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
        context.messages.in.content = {};

        try {
            await GetStatusPage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Status page ID is required'));
        }
    });

    it('should retrieve a status page by ID', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                data: {
                    data: {
                        id: '123456789',
                        attributes: {
                            company_name: 'Test Company',
                            company_url: 'https://test.com',
                            subdomain: 'test-status',
                            timezone: 'UTC',
                            aggregate_state: 'operational'
                        }
                    }
                }
            };
        };

        context.messages.in.content = {
            statusPageId: '123456789'
        };

        const result = await GetStatusPage.receive(context);

        assert.strictEqual(result.data.id, '123456789');
        assert.strictEqual(result.data.company_name, 'Test Company');
        assert.strictEqual(result.data.subdomain, 'test-status');
        assert.strictEqual(capturedOptions.method, 'GET');
        assert.strictEqual(capturedOptions.url, 'https://uptime.betterstack.com/api/v2/status-pages/123456789');
    });

    it('should include Authorization header', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                data: {
                    data: {
                        attributes: {
                            id: '123456789',
                            company_name: 'Test Company'
                        }
                    }
                }
            };
        };

        context.messages.in.content = {
            statusPageId: '123456789'
        };

        await GetStatusPage.receive(context);

        assert(capturedOptions.headers.Authorization.includes('Bearer'));
    });

    it('should return all status page attributes', async () => {
        context.httpRequest = async () => ({
            data: {
                data: {
                    id: '123456789',
                    attributes: {
                        company_name: 'Test Company',
                        company_url: 'https://test.com',
                        contact_url: 'https://contact.com',
                        logo_url: 'https://logo.com/logo.png',
                        timezone: 'UTC',
                        subdomain: 'test-status',
                        custom_domain: 'status.test.com',
                        custom_css: 'body { color: red; }',
                        design: 'v2',
                        theme: 'dark',
                        aggregate_state: 'operational',
                        created_at: '2020-08-10T07:34:38.848Z',
                        updated_at: '2020-12-08T14:12:31.680Z'
                    }
                }
            }
        });

        context.messages.in.content = {
            statusPageId: '123456789'
        };

        const result = await GetStatusPage.receive(context);

        assert.strictEqual(result.data.id, '123456789');
        assert.strictEqual(result.data.custom_domain, 'status.test.com');
        assert.strictEqual(result.data.design, 'v2');
        assert.strictEqual(result.data.aggregate_state, 'operational');
    });
});
